-- Copy date to dueDate for all transactions that don't have a dueDate
UPDATE "Transaction" 
SET "dueDate" = "date" 
WHERE "dueDate" IS NULL;
