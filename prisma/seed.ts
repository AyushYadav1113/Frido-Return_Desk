import { PrismaClient, Status, Reason, Resolution, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');

  await prisma.activity.deleteMany({});
  await prisma.note.deleteMany({});
  await prisma.returnRequest.deleteMany({});

  // Reset the sequence to start at 1
  try {
    await prisma.$executeRawUnsafe(`ALTER SEQUENCE return_request_ref_seq RESTART WITH 1;`);
  } catch (err) {
    console.log('Sequence does not exist yet. It will be created by migrations/index setup.');
  }

  const statuses: Status[] = [
    'OPEN',
    'IN_REVIEW',
    'APPROVED',
    'REJECTED',
    'COMPLETED',
  ];

  const reasons: Reason[] = [
    'DAMAGED',
    'WRONG_ITEM',
    'SIZE_ISSUE',
    'NOT_AS_DESCRIBED',
    'CHANGED_MIND',
  ];

  const resolutions: Resolution[] = [
    'REFUND',
    'REPLACEMENT',
    'STORE_CREDIT',
  ];

  const customerNames = [
    'Alice Smith',
    'Bob Jones',
    'Charlie Brown',
    'Diana Prince',
    'Evan Wright',
    'Fiona Gallagher',
    'George Costanza',
    'Hannah Abbott',
    'Ian Malcolm',
    'Julia Roberts',
    'Kevin Bacon',
    'Laura Croft',
    'Michael Scott',
    'Nina Williams',
    'Oscar Martinez',
    'Pam Beesly',
    'Quentin Tarantino',
    'Rachel Green',
    'Steve Rogers',
    'Tony Stark',
    'Ursula Buffay',
    'Victor Frankenstein',
    'Wendy Darling',
    'Xavier Charles',
    'Ygritte Wild',
    'Zach Miller',
    'Arthur Dent',
    'Ford Prefect',
    'Trillian Astra',
    'Tricia McMillan',
  ];

  console.log('Seeding 30 requests with activity timelines...');

  for (let i = 0; i < 30; i++) {
    const status = statuses[Math.floor(i / 6)];
    const reason = reasons[i % reasons.length];

    let resolution: Resolution | null = null;
    let refundAmount: number | null = null;

    if (status === 'APPROVED' || status === 'COMPLETED') {
      resolution = resolutions[i % resolutions.length];

      if (resolution === 'REFUND') {
        refundAmount = 25.50 + i * 2;
      }
    }

    const year = 2026;
    const refNum = (i + 1).toString().padStart(5, '0');
    const reference = `RET-${year}-${refNum}`;

    const baseTime = Date.now() - 3600000 * 24 * (30 - i);
    const createdAt = new Date(baseTime);

    const notesData: { content: string; createdAt: Date }[] = [];
    const activitiesData: {
      type: ActivityType;
      description: string;
      metadata?: any;
      createdAt: Date;
    }[] = [];

    // 1. Initial Request Created Activity
    activitiesData.push({
      type: 'REQUEST_CREATED',
      description: 'Request created',
      metadata: {
        reference,
        orderNumber: `ORD-${1000 + i}`,
        itemSku: `SKU-${100 + i}`,
      },
      createdAt,
    });

    // 2. Status change to IN_REVIEW for non-OPEN requests
    if (status !== 'OPEN') {
      activitiesData.push({
        type: 'STATUS_CHANGED',
        description: 'Status changed from Open to In Review',
        metadata: {
          from: 'OPEN',
          to: 'IN_REVIEW',
        },
        createdAt: new Date(baseTime + 3600000), // +1 hour
      });
    }

    // 3. Notes and NOTE_ADDED activity
    if (i % 2 === 0) {
      const noteTime = new Date(baseTime + 3600000 * 2);
      notesData.push({
        content: `Initial return request created by customer for ${reason
          .toLowerCase()
          .replace('_', ' ')}.`,
        createdAt: noteTime,
      });

      activitiesData.push({
        type: 'NOTE_ADDED',
        description: 'Note added',
        createdAt: noteTime,
      });
    }

    if (i % 3 === 0) {
      const noteTime = new Date(baseTime + 3600000 * 3);
      notesData.push({
        content: `Support team followed up: waiting on confirmation.`,
        createdAt: noteTime,
      });

      activitiesData.push({
        type: 'NOTE_ADDED',
        description: 'Note added',
        createdAt: noteTime,
      });
    }

    // 4. Decision transitions (APPROVED, REJECTED, COMPLETED)
    if (status === 'APPROVED' || status === 'COMPLETED') {
      const resDesc =
        resolution === 'REFUND' && refundAmount
          ? `Resolution set to Refund for $${refundAmount.toFixed(2)}`
          : `Resolution set to ${resolution === 'REPLACEMENT' ? 'Replacement' : 'Store Credit'}`;

      activitiesData.push({
        type: 'RESOLUTION_SET',
        description: resDesc,
        metadata: {
          resolution,
          ...(resolution === 'REFUND' && refundAmount ? { refundAmount } : {}),
        },
        createdAt: new Date(baseTime + 3600000 * 4),
      });

      activitiesData.push({
        type: 'STATUS_CHANGED',
        description: 'Status changed from In Review to Approved',
        metadata: {
          from: 'IN_REVIEW',
          to: 'APPROVED',
        },
        createdAt: new Date(baseTime + 3600000 * 4 + 60000), // +4h 1m
      });
    }

    if (status === 'REJECTED') {
      activitiesData.push({
        type: 'STATUS_CHANGED',
        description: 'Status changed from In Review to Rejected',
        metadata: {
          from: 'IN_REVIEW',
          to: 'REJECTED',
        },
        createdAt: new Date(baseTime + 3600000 * 4),
      });
    }

    if (status === 'COMPLETED') {
      activitiesData.push({
        type: 'STATUS_CHANGED',
        description: 'Status changed from Approved to Completed',
        metadata: {
          from: 'APPROVED',
          to: 'COMPLETED',
        },
        createdAt: new Date(baseTime + 3600000 * 5),
      });
    }

    await prisma.returnRequest.create({
      data: {
        reference,
        customerName: customerNames[i],
        customerEmail: `${customerNames[i]
          .toLowerCase()
          .replace(' ', '.')}@example.com`,
        customerPhone: `555-01${(10 + i).toString()}`,
        orderNumber: `ORD-${1000 + i}`,
        itemName: `Product item ${i + 1}`,
        itemSku: `SKU-${100 + i}`,
        quantity: (i % 3) + 1,
        reason,
        status,
        resolution,
        refundAmount,
        createdAt,
        notes: {
          create: notesData,
        },
        activities: {
          create: activitiesData,
        },
      },
    });
  }

  // Set the sequence to 31 so new requests generated begin from 31
  try {
    await prisma.$executeRawUnsafe(`SELECT setval('return_request_ref_seq', 30);`);
  } catch (err) {
    console.error('Failed to set sequence val:', err);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
