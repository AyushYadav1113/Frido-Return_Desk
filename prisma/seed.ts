import { PrismaClient, Status, Reason, Resolution } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');

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

  console.log('Seeding 30 requests...');

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

    const request = await prisma.returnRequest.create({
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
      },
    });

    if (i % 2 === 0) {
      await prisma.note.create({
        data: {
          requestId: request.id,
          content: `Initial return request created by customer for ${reason
            .toLowerCase()
            .replace('_', ' ')}.`,
          createdAt: new Date(Date.now() - 3600000 * 2),
        },
      });
    }

    if (i % 3 === 0) {
      await prisma.note.create({
        data: {
          requestId: request.id,
          content: `Support team followed up: waiting on confirmation.`,
          createdAt: new Date(Date.now() - 3600000),
        },
      });
    }
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
