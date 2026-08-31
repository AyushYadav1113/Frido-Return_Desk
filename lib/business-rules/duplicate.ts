import { PrismaClient, Prisma } from '@prisma/client';
import { AppError } from '../errors';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function checkDuplicateRequest(
  tx: TransactionClient,
  orderNumber: string,
  itemSku: string,
  excludeId?: string
): Promise<void> {
  const existing = await tx.returnRequest.findFirst({
    where: {
      orderNumber,
      itemSku,
      status: {
        notIn: ['REJECTED', 'COMPLETED'],
      },
      removedAt: null,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
  });

  if (existing) {
    throw new AppError(
      'DUPLICATE_LIVE_REQUEST',
      'A live return request already exists for this order and item.',
      409
    );
  }
}
