import { Status } from '@prisma/client';
import { AppError } from '../errors';

export function validateRemoval(status: Status): void {
  if (status !== 'OPEN' && status !== 'REJECTED') {
    throw new AppError(
      'INVALID_REMOVAL_STATUS',
      'Only requests in Open or Rejected status can be removed.',
      409
    );
  }
}
