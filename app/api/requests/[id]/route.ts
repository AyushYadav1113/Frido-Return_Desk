import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleAppError, AppError } from '@/lib/errors';
import { UpdateRequestSchema } from '@/lib/validation';
import { validateLocking } from '@/lib/business-rules/locking';
import { validateRemoval } from '@/lib/business-rules/removal';
import { checkDuplicateRequest } from '@/lib/business-rules/duplicate';
import { createActivity } from '@/lib/activities';
import { Prisma } from '@prisma/client';

// Helper to fetch request and return 404 if not found or soft-deleted
async function getActiveRequest(id: string) {
  const request = await prisma.returnRequest.findUnique({
    where: { id },
    include: {
      notes: {
        orderBy: {
          createdAt: 'asc',
        },
      },
      activities: {
        orderBy: {
          createdAt: 'asc',
        },
      },
    },
  });

  if (!request || request.removedAt !== null) {
    throw new AppError('NOT_FOUND', 'Return request not found.', 404);
  }

  return request;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const returnRequest = await getActiveRequest(params.id);
    return NextResponse.json(returnRequest);
  } catch (error) {
    return handleAppError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = UpdateRequestSchema.parse(body);

    const updatedRequest = await prisma.$transaction(async (tx) => {
      // 1. Fetch current request inside transaction
      const current = await tx.returnRequest.findUnique({
        where: { id: params.id },
      });

      if (!current || current.removedAt !== null) {
        throw new AppError('NOT_FOUND', 'Return request not found.', 404);
      }

      // 2. Validate locking rules
      validateLocking(current, validatedData);

      // 3. If updating orderNumber or itemSku, perform live duplicate check
      const orderNumber = validatedData.orderNumber ?? current.orderNumber;
      const itemSku = validatedData.itemSku ?? current.itemSku;
      
      const isLive = !['REJECTED', 'COMPLETED'].includes(current.status);
      
      if (
        isLive &&
        (validatedData.orderNumber !== undefined || validatedData.itemSku !== undefined)
      ) {
        await checkDuplicateRequest(tx, orderNumber, itemSku, current.id);
      }

      // 4. Determine changed fields for activity logging
      const changedFields: string[] = [];
      const editableKeys = [
        'customerName',
        'customerEmail',
        'customerPhone',
        'orderNumber',
        'itemName',
        'itemSku',
        'quantity',
        'reason',
      ] as const;

      for (const key of editableKeys) {
        if (key in validatedData && validatedData[key] !== undefined && validatedData[key] !== current[key]) {
          changedFields.push(key);
        }
      }

      if (changedFields.length > 0) {
        await createActivity(tx, {
          requestId: params.id,
          type: 'REQUEST_UPDATED',
          description: 'Request details updated',
          metadata: {
            fields: changedFields,
          },
        });
      }

      // 5. Perform update
      return tx.returnRequest.update({
        where: { id: params.id },
        data: validatedData,
        include: {
          notes: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          activities: {
            orderBy: {
              createdAt: 'asc',
            },
          },
        },
      });
    });

    return NextResponse.json(updatedRequest);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        const target = (error.meta?.target as string[]) || [];
        const targetStr = JSON.stringify(target).toLowerCase();
        if (
          targetStr.includes('ordernumber') || 
          targetStr.includes('itemsku') || 
          targetStr.includes('live_idx') ||
          targetStr.includes('return_request_order_sku_live_idx')
        ) {
          return handleAppError(
            new AppError(
              'DUPLICATE_LIVE_REQUEST',
              'A live return request already exists for this order and item.',
              409
            )
          );
        }
      }
    }
    return handleAppError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const returnRequest = await tx.returnRequest.findUnique({
        where: { id: params.id },
      });

      if (!returnRequest || returnRequest.removedAt !== null) {
        throw new AppError('NOT_FOUND', 'Return request not found.', 404);
      }

      // Validate removal rules
      validateRemoval(returnRequest.status);

      // Soft delete request
      const res = await tx.returnRequest.update({
        where: { id: params.id },
        data: {
          removedAt: new Date(),
        },
      });

      // Record removal activity
      await createActivity(tx, {
        requestId: params.id,
        type: 'REQUEST_REMOVED',
        description: 'Request removed from desk',
        metadata: {
          status: returnRequest.status,
          removedAt: res.removedAt?.toISOString(),
        },
      });

      return res;
    });

    return NextResponse.json({
      message: 'Return request removed successfully.',
      id: updated.id,
      removedAt: updated.removedAt,
    });
  } catch (error) {
    return handleAppError(error);
  }
}

