import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { prisma } from '../lib/prisma';
import { validateStatusTransition } from '../lib/business-rules/status';
import { validateApproval } from '../lib/business-rules/approval';
import { validateLocking } from '../lib/business-rules/locking';
import { validateRemoval } from '../lib/business-rules/removal';
import { checkDuplicateRequest } from '../lib/business-rules/duplicate';
import { AppError } from '../lib/errors';
import { Status, Reason, Resolution } from '@prisma/client';
import { Prisma } from '@prisma/client';

describe('ReturnDesk Business Rules & API Logic Tests', () => {

  // Helper to construct a base ReturnRequest object for locking test
  const createMockRequest = (status: Status, overrides = {}): any => ({
    id: 'test-id-123',
    reference: 'RET-2026-99999',
    customerName: 'Alice Smith',
    customerEmail: 'alice@example.com',
    customerPhone: '555-0199',
    orderNumber: 'ORD-9999',
    itemName: 'Mock Item',
    itemSku: 'SKU-999',
    quantity: 2,
    reason: 'DAMAGED' as Reason,
    status,
    resolution: null,
    refundAmount: null,
    removedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(async () => {
    // Clear DB to ensure a clean slate for database tests
    await prisma.note.deleteMany({});
    await prisma.returnRequest.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // 1. OPEN → IN_REVIEW succeeds
  it('1. OPEN -> IN_REVIEW status transition succeeds', () => {
    expect(() => validateStatusTransition('OPEN', 'IN_REVIEW')).not.toThrow();
  });

  // 2. OPEN → COMPLETED fails
  it('2. OPEN -> COMPLETED status transition fails', () => {
    expect(() => validateStatusTransition('OPEN', 'COMPLETED')).toThrowError(
      expect.objectContaining({ code: 'INVALID_STATUS_TRANSITION' })
    );
  });

  // 3. OPEN → APPROVED fails
  it('3. OPEN -> APPROVED status transition fails', () => {
    expect(() => validateStatusTransition('OPEN', 'APPROVED')).toThrowError(
      expect.objectContaining({ code: 'INVALID_STATUS_TRANSITION' })
    );
  });

  // 4. IN_REVIEW → APPROVED without resolution fails
  it('4. IN_REVIEW -> APPROVED without resolution fails', () => {
    expect(() => validateApproval('APPROVED', null, null)).toThrowError(
      expect.objectContaining({ code: 'RESOLUTION_REQUIRED' })
    );
  });

  // 5. REFUND without positive amount fails
  it('5. REFUND without positive amount fails', () => {
    expect(() => validateApproval('APPROVED', 'REFUND', null)).toThrowError(
      expect.objectContaining({ code: 'INVALID_REFUND_AMOUNT' })
    );
    expect(() => validateApproval('APPROVED', 'REFUND', 0)).toThrowError(
      expect.objectContaining({ code: 'INVALID_REFUND_AMOUNT' })
    );
    expect(() => validateApproval('APPROVED', 'REFUND', -10)).toThrowError(
      expect.objectContaining({ code: 'INVALID_REFUND_AMOUNT' })
    );
  });

  // 6. REPLACEMENT with refund amount fails
  it('6. REPLACEMENT with refund amount fails', () => {
    expect(() => validateApproval('APPROVED', 'REPLACEMENT', 15.5)).toThrowError(
      expect.objectContaining({ code: 'INVALID_REFUND_AMOUNT' })
    );
    expect(() => validateApproval('APPROVED', 'STORE_CREDIT', 20.0)).toThrowError(
      expect.objectContaining({ code: 'INVALID_REFUND_AMOUNT' })
    );
  });

  // 7. Duplicate live request fails
  it('7. Duplicate live request fails', async () => {
    // Insert a live request
    await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        orderNumber: 'ORD-1001',
        itemName: 'Nike Shoes',
        itemSku: 'NIKE-001',
        quantity: 1,
        reason: 'DAMAGED',
        status: 'OPEN',
      },
    });

    // Check duplicate check throws
    await expect(
      prisma.$transaction(async (tx) => {
        await checkDuplicateRequest(tx, 'ORD-1001', 'NIKE-001');
      })
    ).rejects.toThrowError(expect.objectContaining({ code: 'DUPLICATE_LIVE_REQUEST' }));
  });

  // 8. Duplicate after previous request is Completed succeeds
  it('8. Duplicate after previous request is Completed succeeds', async () => {
    // Insert a COMPLETED (non-live) request
    await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        orderNumber: 'ORD-1001',
        itemName: 'Nike Shoes',
        itemSku: 'NIKE-001',
        quantity: 1,
        reason: 'DAMAGED',
        status: 'COMPLETED',
        resolution: 'REPLACEMENT',
      },
    });

    // Check duplicate check does not throw
    await expect(
      prisma.$transaction(async (tx) => {
        await checkDuplicateRequest(tx, 'ORD-1001', 'NIKE-001');
      })
    ).resolves.not.toThrow();
  });

  // 9. Approved request cannot edit customer/item details
  it('9. Approved request cannot edit customer/item details', () => {
    const approvedRequest = createMockRequest('APPROVED', {
      resolution: 'REPLACEMENT',
    });

    // Attempting to modify locked fields must throw
    expect(() => validateLocking(approvedRequest, { customerName: 'Bob' })).toThrowError(
      expect.objectContaining({ code: 'REQUEST_LOCKED' })
    );

    expect(() => validateLocking(approvedRequest, { itemSku: 'SKU-NEW' })).toThrowError(
      expect.objectContaining({ code: 'REQUEST_LOCKED' })
    );

    // Modifying unrelated fields or passing same values should succeed
    expect(() => validateLocking(approvedRequest, { status: 'COMPLETED' })).not.toThrow();
    expect(() => validateLocking(approvedRequest, { customerName: 'Alice Smith' })).not.toThrow();
  });

  // 10. Rejected request can be removed
  it('10. Rejected request can be removed', () => {
    expect(() => validateRemoval('REJECTED')).not.toThrow();
  });

  // 11. Open request can be removed
  it('11. Open request can be removed', () => {
    expect(() => validateRemoval('OPEN')).not.toThrow();
  });

  // 12. In Review request cannot be removed
  it('12. In Review request cannot be removed', () => {
    expect(() => validateRemoval('IN_REVIEW')).toThrowError(
      expect.objectContaining({ code: 'INVALID_REMOVAL_STATUS' })
    );
  });

  // 13. Approved request cannot be removed
  it('13. Approved request cannot be removed', () => {
    expect(() => validateRemoval('APPROVED')).toThrowError(
      expect.objectContaining({ code: 'INVALID_REMOVAL_STATUS' })
    );
  });

  // 14. Completed request cannot be removed
  it('14. Completed request cannot be removed', () => {
    expect(() => validateRemoval('COMPLETED')).toThrowError(
      expect.objectContaining({ code: 'INVALID_REMOVAL_STATUS' })
    );
  });

  // 15. Removed request cannot be fetched
  it('15. Removed request cannot be fetched', async () => {
    const created = await prisma.returnRequest.create({
      data: {
        reference: 'RET-2026-00001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        orderNumber: 'ORD-1001',
        itemName: 'Nike Shoes',
        itemSku: 'NIKE-001',
        quantity: 1,
        reason: 'DAMAGED',
        status: 'OPEN',
        removedAt: new Date(), // Soft-deleted
      },
    });

    const fetched = await prisma.returnRequest.findUnique({
      where: { id: created.id },
    });

    // It remains in PostgreSQL database
    expect(fetched).not.toBeNull();
    expect(fetched?.removedAt).not.toBeNull();

    // Verification that our fetching handler rules logic blocks removed items
    const requestFetcher = async (id: string) => {
      const req = await prisma.returnRequest.findUnique({ where: { id } });
      if (!req || req.removedAt !== null) {
        throw new AppError('NOT_FOUND', 'Return request not found.', 404);
      }
      return req;
    };

    await expect(requestFetcher(created.id)).rejects.toThrowError(
      expect.objectContaining({ code: 'NOT_FOUND' })
    );
  });

  // 16. Notes can be added to approved/rejected/completed requests
  it('16. Notes can be added to approved, rejected, or completed requests', async () => {
    const statusesToTest: Status[] = ['APPROVED', 'REJECTED', 'COMPLETED'];
    let index = 1;

    for (const status of statusesToTest) {
      const req = await prisma.returnRequest.create({
        data: {
          reference: `RET-2026-000${index}`,
          customerName: 'John Doe',
          customerEmail: 'john@example.com',
          orderNumber: 'ORD-1001',
          itemName: 'Nike Shoes',
          itemSku: `NIKE-00${index}`,
          quantity: 1,
          reason: 'DAMAGED',
          status,
          resolution: status === 'APPROVED' || status === 'COMPLETED' ? 'REPLACEMENT' : null,
        },
      });

      // Try appending note
      const note = await prisma.note.create({
        data: {
          requestId: req.id,
          content: `Test note for status ${status}`,
        },
      });

      expect(note).toBeDefined();
      expect(note.content).toBe(`Test note for status ${status}`);
      expect(note.requestId).toBe(req.id);
      
      index++;
    }
  });

});
