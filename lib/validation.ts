import { z } from 'zod';

// We define enums as custom lists or strings if Prisma Client isn't generated yet.
// Since prisma client is generated in postinstall or after prisma generate,
// defining the string literals here avoids TypeScript issues during project initialization.

export const StatusEnum = z.enum(['OPEN', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'COMPLETED']);
export const ReasonEnum = z.enum(['DAMAGED', 'WRONG_ITEM', 'SIZE_ISSUE', 'NOT_AS_DESCRIBED', 'CHANGED_MIND']);
export const ResolutionEnum = z.enum(['REFUND', 'REPLACEMENT', 'STORE_CREDIT']);

export const GetRequestsSchema = z.object({
  search: z.string().optional(),
  status: StatusEnum.optional(),
  reason: ReasonEnum.optional(),
  sortBy: z.enum([
    'createdAt',
    'updatedAt',
    'customerName',
    'customerEmail',
    'orderNumber',
    'status',
    'reason',
    'refundAmount',
    'quantity',
    'reference'
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().default(10),
});

export const CreateRequestSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerEmail: z.string().email('Invalid email address'),
  customerPhone: z.string().optional().nullable(),
  orderNumber: z.string().min(1, 'Order number is required'),
  itemName: z.string().min(1, 'Item name is required'),
  itemSku: z.string().min(1, 'Item SKU is required'),
  quantity: z.number().int().positive('Quantity must be a positive integer'),
  reason: ReasonEnum,
});

export const UpdateRequestSchema = CreateRequestSchema.partial();

export const UpdateStatusSchema = z.object({
  status: StatusEnum,
  resolution: ResolutionEnum.optional().nullable(),
  refundAmount: z.union([z.number(), z.string()]).optional().nullable(),
});

export const CreateNoteSchema = z.object({
  content: z.string().trim().min(1, 'Note content must not be empty'),
});
