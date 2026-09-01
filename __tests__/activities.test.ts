import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { createActivity, formatStatusChangeDescription, formatResolutionDescription } from '../lib/activities';
import { validateStatusTransition } from '../lib/business-rules/status';
import { validateApproval } from '../lib/business-rules/approval';
import { validateRemoval } from '../lib/business-rules/removal';
import { AppError } from '../lib/errors';
import { Status, Reason, Resolution } from '@prisma/client';

describe('Activity / Audit Timeline Tests', () => {
  beforeEach(async () => {
    // Clear test database to isolate test cases
    await prisma.activity.deleteMany({});
    await prisma.note.deleteMany({});
    await prisma.returnRequest.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. Creating a request creates REQUEST_CREATED activity
  it('1. Creating a request creates REQUEST_CREATED activity', async () => {
    const created = await prisma.$transaction(async (tx) => {
      const req = await tx.returnRequest.create({
        data: {
          reference: 'RET-2026-00001',
          customerName: 'Alice Smith',
          customerEmail: 'alice@example.com',
          orderNumber: 'ORD-1001',
          itemName: 'Running Shoes',
          itemSku: 'SHOE-001',
          quantity: 1,
          reason: 'DAMAGED',
          status: 'OPEN',
        },
      });

      await createActivity(tx, {
        requestId: req.id,
        type: 'REQUEST_CREATED',
        description: 'Request created',
        metadata: {
          reference: req.reference,
          orderNumber: req.orderNumber,
          itemSku: req.itemSku,
        },
      });

      return tx.returnRequest.findUnique({
        where: { id: req.id },
        include: { activities: true },
      });
    });

    expect(created?.activities).toHaveLength(1);
    expect(created?.activities[0].type).toBe('REQUEST_CREATED');
    expect(created?.activities[0].description).toBe('Request created');
  });

  // 2. Valid status transition creates STATUS_CHANGED activity
  it('2. Valid status transition creates STATUS_CHANGED activity', async () => {
    const req = await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00002',
        customerName: 'Bob Jones',
        customerEmail: 'bob@example.com',
        orderNumber: 'ORD-1002',
        itemName: 'T-Shirt',
        itemSku: 'TSHIRT-001',
        quantity: 2,
        reason: 'SIZE_ISSUE',
        status: 'OPEN',
      },
    });

    await prisma.$transaction(async (tx) => {
      validateStatusTransition(req.status, 'IN_REVIEW');

      await tx.returnRequest.update({
        where: { id: req.id },
        data: { status: 'IN_REVIEW' },
      });

      await createActivity(tx, {
        requestId: req.id,
        type: 'STATUS_CHANGED',
        description: formatStatusChangeDescription('OPEN', 'IN_REVIEW'),
        metadata: { from: 'OPEN', to: 'IN_REVIEW' },
      });
    });

    const activities = await prisma.activity.findMany({
      where: { requestId: req.id },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('STATUS_CHANGED');
    expect(activities[0].description).toBe('Status changed from Open to In Review');
  });

  // 3. Invalid status transition throws and creates no activity
  it('3. Invalid status transition creates no activity', async () => {
    const req = await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00003',
        customerName: 'Charlie Brown',
        customerEmail: 'charlie@example.com',
        orderNumber: 'ORD-1003',
        itemName: 'Hat',
        itemSku: 'HAT-001',
        quantity: 1,
        reason: 'WRONG_ITEM',
        status: 'OPEN',
      },
    });

    // Attempting invalid transition OPEN -> COMPLETED inside transaction
    await expect(
      prisma.$transaction(async (tx) => {
        validateStatusTransition(req.status, 'COMPLETED'); // Throws AppError

        await tx.returnRequest.update({
          where: { id: req.id },
          data: { status: 'COMPLETED' },
        });

        await createActivity(tx, {
          requestId: req.id,
          type: 'STATUS_CHANGED',
          description: formatStatusChangeDescription('OPEN', 'COMPLETED'),
        });
      })
    ).rejects.toThrowError(expect.objectContaining({ code: 'INVALID_STATUS_TRANSITION' }));

    const activities = await prisma.activity.findMany({
      where: { requestId: req.id },
    });

    expect(activities).toHaveLength(0);
  });

  // 4. Adding a note creates NOTE_ADDED activity
  it('4. Adding a note creates NOTE_ADDED activity', async () => {
    const req = await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00004',
        customerName: 'Diana Prince',
        customerEmail: 'diana@example.com',
        orderNumber: 'ORD-1004',
        itemName: 'Smart Watch',
        itemSku: 'WATCH-001',
        quantity: 1,
        reason: 'NOT_AS_DESCRIBED',
        status: 'IN_REVIEW',
      },
    });

    const note = await prisma.$transaction(async (tx) => {
      const createdNote = await tx.note.create({
        data: {
          requestId: req.id,
          content: 'Customer uploaded photo evidence of defect.',
        },
      });

      await createActivity(tx, {
        requestId: req.id,
        type: 'NOTE_ADDED',
        description: 'Note added',
        metadata: { noteId: createdNote.id },
      });

      return createdNote;
    });

    const activities = await prisma.activity.findMany({
      where: { requestId: req.id },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('NOTE_ADDED');
    expect((activities[0].metadata as any)?.noteId).toBe(note.id);
  });

  // 5. Updating an editable request creates REQUEST_UPDATED activity
  it('5. Updating an editable request creates REQUEST_UPDATED activity', async () => {
    const req = await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00005',
        customerName: 'Evan Wright',
        customerEmail: 'evan@example.com',
        orderNumber: 'ORD-1005',
        itemName: 'Backpack',
        itemSku: 'BAG-001',
        quantity: 1,
        reason: 'CHANGED_MIND',
        status: 'OPEN',
      },
    });

    await prisma.$transaction(async (tx) => {
      const changedFields = ['quantity', 'reason'];

      await tx.returnRequest.update({
        where: { id: req.id },
        data: { quantity: 2, reason: 'DAMAGED' },
      });

      await createActivity(tx, {
        requestId: req.id,
        type: 'REQUEST_UPDATED',
        description: 'Request details updated',
        metadata: { fields: changedFields },
      });
    });

    const activities = await prisma.activity.findMany({
      where: { requestId: req.id },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('REQUEST_UPDATED');
    expect((activities[0].metadata as any)?.fields).toEqual(['quantity', 'reason']);
  });

  // 6. Approving with resolution creates RESOLUTION_SET and STATUS_CHANGED
  it('6. Approving with resolution creates RESOLUTION_SET and STATUS_CHANGED activities', async () => {
    const req = await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00006',
        customerName: 'Fiona Gallagher',
        customerEmail: 'fiona@example.com',
        orderNumber: 'ORD-1006',
        itemName: 'Wireless Earbuds',
        itemSku: 'AUDIO-001',
        quantity: 1,
        reason: 'DAMAGED',
        status: 'IN_REVIEW',
      },
    });

    await prisma.$transaction(async (tx) => {
      const { resolution, refundAmount } = validateApproval('APPROVED', 'REFUND', 49.99);

      await createActivity(tx, {
        requestId: req.id,
        type: 'RESOLUTION_SET',
        description: formatResolutionDescription(resolution!, refundAmount),
        metadata: { resolution, refundAmount: Number(refundAmount) },
      });

      await createActivity(tx, {
        requestId: req.id,
        type: 'STATUS_CHANGED',
        description: formatStatusChangeDescription('IN_REVIEW', 'APPROVED'),
        metadata: { from: 'IN_REVIEW', to: 'APPROVED' },
      });

      await tx.returnRequest.update({
        where: { id: req.id },
        data: {
          status: 'APPROVED',
          resolution,
          refundAmount,
        },
      });
    });

    const activities = await prisma.activity.findMany({
      where: { requestId: req.id },
      orderBy: { createdAt: 'asc' },
    });

    expect(activities).toHaveLength(2);
    expect(activities[0].type).toBe('RESOLUTION_SET');
    expect(activities[0].description).toContain('Refund for $49.99');
    expect(activities[1].type).toBe('STATUS_CHANGED');
    expect(activities[1].description).toBe('Status changed from In Review to Approved');
  });

  // 7. Removing an eligible request creates REQUEST_REMOVED activity
  it('7. Removing an eligible request creates REQUEST_REMOVED activity', async () => {
    const req = await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00007',
        customerName: 'George Costanza',
        customerEmail: 'george@example.com',
        orderNumber: 'ORD-1007',
        itemName: 'Wallet',
        itemSku: 'WAL-001',
        quantity: 1,
        reason: 'CHANGED_MIND',
        status: 'REJECTED',
      },
    });

    await prisma.$transaction(async (tx) => {
      validateRemoval(req.status);

      const updated = await tx.returnRequest.update({
        where: { id: req.id },
        data: { removedAt: new Date() },
      });

      await createActivity(tx, {
        requestId: req.id,
        type: 'REQUEST_REMOVED',
        description: 'Request removed from desk',
        metadata: { status: req.status, removedAt: updated.removedAt?.toISOString() },
      });
    });

    const activities = await prisma.activity.findMany({
      where: { requestId: req.id },
    });

    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe('REQUEST_REMOVED');
    expect(activities[0].description).toBe('Request removed from desk');
  });

  // 8. Failed operations do not create activities (transaction atomicity)
  it('8. Failed operations do not create activities due to atomic rollback', async () => {
    const req = await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00008',
        customerName: 'Hannah Abbott',
        customerEmail: 'hannah@example.com',
        orderNumber: 'ORD-1008',
        itemName: 'Herbology Book',
        itemSku: 'BOOK-001',
        quantity: 1,
        reason: 'WRONG_ITEM',
        status: 'IN_REVIEW',
      },
    });

    await expect(
      prisma.$transaction(async (tx) => {
        await createActivity(tx, {
          requestId: req.id,
          type: 'STATUS_CHANGED',
          description: 'Status changed',
        });

        // Deliberately trigger an error inside the transaction
        throw new Error('Simulated database constraint failure');
      })
    ).rejects.toThrow('Simulated database constraint failure');

    const activities = await prisma.activity.findMany({
      where: { requestId: req.id },
    });

    expect(activities).toHaveLength(0);
  });

  // 9. Activities are returned chronologically (oldest to newest)
  it('9. Activities are returned chronologically', async () => {
    const req = await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00009',
        customerName: 'Ian Malcolm',
        customerEmail: 'ian@example.com',
        orderNumber: 'ORD-1009',
        itemName: 'Amber Fossil',
        itemSku: 'FOS-001',
        quantity: 1,
        reason: 'DAMAGED',
        status: 'OPEN',
      },
    });

    const t0 = new Date(Date.now() - 3600000 * 3);
    const t1 = new Date(Date.now() - 3600000 * 2);
    const t2 = new Date(Date.now() - 3600000 * 1);

    await prisma.activity.create({
      data: {
        requestId: req.id,
        type: 'REQUEST_CREATED',
        description: 'Request created',
        createdAt: t0,
      },
    });

    await prisma.activity.create({
      data: {
        requestId: req.id,
        type: 'STATUS_CHANGED',
        description: 'Status changed from Open to In Review',
        createdAt: t1,
      },
    });

    await prisma.activity.create({
      data: {
        requestId: req.id,
        type: 'NOTE_ADDED',
        description: 'Note added',
        createdAt: t2,
      },
    });

    const fetched = await prisma.returnRequest.findUnique({
      where: { id: req.id },
      include: {
        activities: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    expect(fetched?.activities).toHaveLength(3);
    expect(fetched?.activities[0].type).toBe('REQUEST_CREATED');
    expect(fetched?.activities[1].type).toBe('STATUS_CHANGED');
    expect(fetched?.activities[2].type).toBe('NOTE_ADDED');
  });
});
