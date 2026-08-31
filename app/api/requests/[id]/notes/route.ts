import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleAppError, AppError } from '@/lib/errors';
import { CreateNoteSchema } from '@/lib/validation';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const validatedData = CreateNoteSchema.parse(body);

    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: params.id },
    });

    if (!returnRequest || returnRequest.removedAt !== null) {
      throw new AppError('NOT_FOUND', 'Return request not found.', 404);
    }

    const createdNote = await prisma.note.create({
      data: {
        requestId: params.id,
        content: validatedData.content,
      },
    });

    return NextResponse.json(createdNote, { status: 201 });
  } catch (error) {
    return handleAppError(error);
  }
}
