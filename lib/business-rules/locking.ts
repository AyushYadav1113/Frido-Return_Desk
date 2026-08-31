import { Status, ReturnRequest } from '@prisma/client';
import { AppError } from '../errors';

const LOCKED_FIELDS: Array<keyof ReturnRequest> = [
  'customerName',
  'customerEmail',
  'customerPhone',
  'orderNumber',
  'itemName',
  'itemSku',
  'quantity',
  'reason',
];

const DECIDED_STATUSES: Status[] = ['APPROVED', 'REJECTED', 'COMPLETED'];

export function validateLocking(
  current: ReturnRequest,
  updates: Record<string, any>
): void {
  if (!DECIDED_STATUSES.includes(current.status)) {
    return;
  }

  for (const field of LOCKED_FIELDS) {
    if (field in updates) {
      const existingVal = current[field];
      const newVal = updates[field];

      // For decimal comparison or phone null/undefined checks, compare string representations or simple equality
      if (existingVal !== newVal) {
        // If one is null and another is undefined, they might be equivalent, but if they are different primitive values, it is an edit.
        if (existingVal === null && newVal === undefined) continue;
        if (existingVal === undefined && newVal === null) continue;
        
        throw new AppError(
          'REQUEST_LOCKED',
          'Customer and item details cannot be changed after the request is decided.',
          409
        );
      }
    }
  }
}
