import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleAppError, AppError } from '@/lib/errors';
import { CreateNoteSchema } from '@/lib/validation';
import { createActivity } from '@/lib/activities';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = CreateNoteSchema.parse(body);

    const createdNote = await prisma.$transaction(async (tx) => {
      const returnRequest = await tx.returnRequest.findUnique({
        where: { id: params.id },
      });

      if (!returnRequest || returnRequest.removedAt !== null) {
        throw new AppError('NOT_FOUND', 'Return request not found.', 404);
      }

      const note = await tx.note.create({
        data: {
          requestId: params.id,
          content: validatedData.content,
        },
      });

      await createActivity(tx, {
        requestId: params.id,
        type: 'NOTE_ADDED',
        description: 'Note added',
        metadata: {
          noteId: note.id,
        },
      });

      return note;
    });

    return NextResponse.json(createdNote, { status: 201 });
  } catch (error) {
    return handleAppError(error);
  }
}

