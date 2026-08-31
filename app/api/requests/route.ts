import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleAppError, AppError } from '@/lib/errors';
import { GetRequestsSchema, CreateRequestSchema } from '@/lib/validation';
import { generateReference } from '@/lib/reference';
import { checkDuplicateRequest } from '@/lib/business-rules/duplicate';
import { Prisma, Status, Reason } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    
    // Extract query parameters as record
    const params: Record<string, string> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    
    const query = GetRequestsSchema.parse(params);
    
    const where: Prisma.ReturnRequestWhereInput = {
      removedAt: null,
    };
    
    if (query.status) {
      where.status = query.status as Status;
    }
    
    if (query.reason) {
      where.reason = query.reason as Reason;
    }
    
    if (query.search) {
      const searchLower = query.search.trim();
      where.OR = [
        { customerName: { contains: searchLower, mode: 'insensitive' } },
        { customerEmail: { contains: searchLower, mode: 'insensitive' } },
        { customerPhone: { contains: searchLower, mode: 'insensitive' } },
        { orderNumber: { contains: searchLower, mode: 'insensitive' } },
        { reference: { contains: searchLower, mode: 'insensitive' } },
      ];
    }
    
    const total = await prisma.returnRequest.count({ where });
    const totalPages = Math.ceil(total / query.pageSize);
    
    const data = await prisma.returnRequest.findMany({
      where,
      orderBy: {
        [query.sortBy]: query.sortOrder,
      },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: {
        notes: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });
    
    return NextResponse.json({
      data,
      pagination: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages,
      },
    });
  } catch (error) {
    return handleAppError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = CreateRequestSchema.parse(body);
    
    const createdRequest = await prisma.$transaction(async (tx) => {
      // Check for live duplicates
      await checkDuplicateRequest(tx, validatedData.orderNumber, validatedData.itemSku);
      
      // Generate reference number
      const reference = await generateReference(tx);
      
      // Create request
      return tx.returnRequest.create({
        data: {
          ...validatedData,
          reference,
          status: 'OPEN',
        },
      });
    });
    
    return NextResponse.json(createdRequest, { status: 201 });
  } catch (error) {
    // Handle DB level constraint exceptions gracefully (e.g. race conditions)
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
