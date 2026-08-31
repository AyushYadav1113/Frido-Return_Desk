-- Create Sequence
CREATE SEQUENCE IF NOT EXISTS "return_request_ref_seq" START WITH 1;

-- Create Partial Unique Index
CREATE UNIQUE INDEX IF NOT EXISTS "return_request_order_sku_live_idx" 
ON "ReturnRequest" ("orderNumber", "itemSku") 
WHERE "status" NOT IN ('REJECTED', 'COMPLETED') AND "removedAt" IS NULL;