import { PrismaClient, ActivityType, Status, Resolution, Prisma } from '@prisma/client';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export interface CreateActivityInput {
  requestId: string;
  type: ActivityType;
  description: string;
  metadata?: Prisma.InputJsonValue;
}

const STATUS_DISPLAY: Record<Status, string> = {
  OPEN: 'Open',
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

const RESOLUTION_DISPLAY: Record<Resolution, string> = {
  REFUND: 'Refund',
  REPLACEMENT: 'Replacement',
  STORE_CREDIT: 'Store Credit',
};

export function getStatusDisplayName(status: Status): string {
  return STATUS_DISPLAY[status] || status;
}

export function getResolutionDisplayName(resolution: Resolution): string {
  return RESOLUTION_DISPLAY[resolution] || resolution;
}

export function formatStatusChangeDescription(from: Status, to: Status): string {
  return `Status changed from ${getStatusDisplayName(from)} to ${getStatusDisplayName(to)}`;
}

export function formatResolutionDescription(
  resolution: Resolution,
  refundAmount?: number | string | Prisma.Decimal | null
): string {
  if (resolution === 'REFUND' && refundAmount !== undefined && refundAmount !== null) {
    const formattedAmount = Number(refundAmount).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
    });
    return `Resolution set to Refund for ${formattedAmount}`;
  }
  return `Resolution set to ${getResolutionDisplayName(resolution)}`;
}

/**
 * Creates an immutable activity record inside an existing Prisma transaction.
 */
export async function createActivity(
  tx: TransactionClient,
  input: CreateActivityInput
) {
  return tx.activity.create({
    data: {
      requestId: input.requestId,
      type: input.type,
      description: input.description,
      metadata: input.metadata ?? Prisma.JsonNull,
    },
  });
}
