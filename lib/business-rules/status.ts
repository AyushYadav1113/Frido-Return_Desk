import { Status } from '@prisma/client';
import { AppError } from '../errors';

const VALID_TRANSITIONS: Record<Status, Status[]> = {
  OPEN: ['IN_REVIEW'],
  IN_REVIEW: ['APPROVED', 'REJECTED'],
  APPROVED: ['COMPLETED'],
  REJECTED: [],
  COMPLETED: [],
};

const STATUS_NAMES: Record<Status, string> = {
  OPEN: 'Open',
  IN_REVIEW: 'In Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
};

export function validateStatusTransition(current: Status, target: Status): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed.includes(target)) {
    let message = '';
    if (current === 'OPEN') {
      message = 'A request in Open status can only move to In Review.';
    } else if (current === 'IN_REVIEW') {
      message = 'A request in In Review status can only move to Approved or Rejected.';
    } else if (current === 'APPROVED') {
      message = 'A request in Approved status can only move to Completed.';
    } else {
      message = `Cannot transition from final status ${STATUS_NAMES[current]}.`;
    }
    throw new AppError('INVALID_STATUS_TRANSITION', message, 409);
  }
}
