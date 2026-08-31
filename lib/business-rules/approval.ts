import { Status, Resolution, Prisma } from '@prisma/client';
import { AppError } from '../errors';

export function validateApproval(
  targetStatus: Status,
  resolution: Resolution | null | undefined,
  refundAmount: Prisma.Decimal | number | string | null | undefined
): { resolution: Resolution | null; refundAmount: Prisma.Decimal | null } {
  if (targetStatus !== 'APPROVED') {
    // Return them as is if not transitioning to APPROVED
    return {
      resolution: resolution || null,
      refundAmount: refundAmount ? new Prisma.Decimal(refundAmount) : null,
    };
  }

  if (!resolution) {
    throw new AppError('RESOLUTION_REQUIRED', 'A resolution is required when approving a return request.', 400);
  }

  if (resolution === 'REFUND') {
    if (refundAmount === null || refundAmount === undefined) {
      throw new AppError('INVALID_REFUND_AMOUNT', 'Refund amount is required when resolution is REFUND.', 400);
    }
    try {
      const decAmount = new Prisma.Decimal(refundAmount);
      if (decAmount.lessThanOrEqualTo(0)) {
        throw new AppError('INVALID_REFUND_AMOUNT', 'Refund amount must be greater than zero.', 400);
      }
      return {
        resolution,
        refundAmount: decAmount,
      };
    } catch (e) {
      if (e instanceof AppError) throw e;
      throw new AppError('INVALID_REFUND_AMOUNT', 'Invalid refund amount format.', 400);
    }
  } else {
    // REPLACEMENT or STORE_CREDIT
    if (refundAmount !== null && refundAmount !== undefined) {
      throw new AppError('INVALID_REFUND_AMOUNT', 'Refund amount must be null for REPLACEMENT or STORE_CREDIT.', 400);
    }
    return {
      resolution,
      refundAmount: null,
    };
  }
}
