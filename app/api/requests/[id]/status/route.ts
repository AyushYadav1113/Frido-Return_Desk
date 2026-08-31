import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleAppError, AppError } from '@/lib/errors';
import { UpdateStatusSchema } from '@/lib/validation';
import { validateStatusTransition } from '@/lib/business-rules/status';
import { validateApproval } from '@/lib/business-rules/approval';
import { Status, Resolution } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = UpdateStatusSchema.parse(body);

    const updatedRequest = await prisma.$transaction(async (tx) => {
      // 1. Fetch current request inside transaction
      const current = await tx.returnRequest.findUnique({
        where: { id: params.id },
      });

      if (!current || current.removedAt !== null) {
        throw new AppError('NOT_FOUND', 'Return request not found.', 404);
      }

      // 2. Validate status flow rules
      validateStatusTransition(current.status, validatedData.status as Status);

      // 3. Enforce approval / resolution rules
      const { resolution, refundAmount } = validateApproval(
        validatedData.status as Status,
        validatedData.resolution as Resolution | null,
        validatedData.refundAmount
      );

      // 4. Update the request status, resolution, and refundAmount
      return tx.returnRequest.update({
        where: { id: params.id },
        data: {
          status: validatedData.status as Status,
          resolution,
          refundAmount,
        },
        include: {
          notes: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    return handleAppError(error);
  }
}
