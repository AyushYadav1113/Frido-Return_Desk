import { PrismaClient } from '@prisma/client';

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>;

export async function generateReference(tx: TransactionClient): Promise<string> {
  // Use queryRawUnsafe or queryRaw to fetch from the PostgreSQL sequence
  const result = await tx.$queryRawUnsafe<{ nextval: string }[]>(
    `SELECT nextval('return_request_ref_seq')::text as nextval;`
  );
  
  const seqNumber = result[0]?.nextval || '1';
  // Pad with leading zeros to match 5 digits (e.g. 00001)
  const paddedSeq = seqNumber.padStart(5, '0');
  
  // Use current year
  const year = new Date().getFullYear();
  
  return `RET-${year}-${paddedSeq}`;
}
