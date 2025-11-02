import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  result: {
    transaction: {
      balance: {
        needs: {
          id: true,
        },
        async compute(data) {
          // Get baseline balance from settings
          let settings = await basePrisma.settings.findFirst();
          if (!settings) {
            // Create default settings if none exist
            settings = await basePrisma.settings.create({
              data: { baselineBalance: 0 },
            });
          }

          // Get the resolved due date for this transaction
          const transaction = await basePrisma.transaction.findUnique({
            where: { id: data.id },
            select: {
              id: true,
              date: true,
              relativeDueDateTransactionId: true,
              relativeDueDateOffsetDays: true,
            },
          });

          if (!transaction) return settings.baselineBalance;

          type TransactionForDueDate = {
            id: string;
            date: Date | null;
            relativeDueDateTransactionId: string | null;
            relativeDueDateOffsetDays: number | null;
          };

          // Calculate effective due date for any transaction, starting with a fresh visited set
          async function calculateDueDate(
            txn: TransactionForDueDate,
            visited = new Set<string>(),
          ): Promise<Date | null> {
            if (visited.has(txn.id)) return null;
            visited.add(txn.id);

            if (txn.date && !txn.relativeDueDateTransactionId) {
              return txn.date;
            }

            if (txn.relativeDueDateTransactionId && txn.relativeDueDateOffsetDays !== null) {
              const ref = await basePrisma.transaction.findUnique({
                where: { id: txn.relativeDueDateTransactionId },
                select: {
                  id: true,
                  date: true,
                  relativeDueDateTransactionId: true,
                  relativeDueDateOffsetDays: true,
                },
              });
              if (!ref) return null;

              const refDate = await calculateDueDate(ref, visited);
              if (!refDate) return null;

              const result = new Date(refDate);
              result.setDate(result.getDate() + txn.relativeDueDateOffsetDays);
              return result;
            }

            return null;
          }

          const effectiveDueDate = await calculateDueDate(transaction);
          if (!effectiveDueDate) return settings.baselineBalance;

          // get list of all non-applied transactions before this transaction including this transaction
          const priorTransactions = await basePrisma.transaction.findMany({
            where: {
              applied: false,
              includeInBalance: true,
            },
            select: {
              id: true,
              amount: true,
              type: true,
              date: true,
              relativeDueDateTransactionId: true,
              relativeDueDateOffsetDays: true,
            },
          });

          let balance = settings.baselineBalance;
          for (const txn of priorTransactions) {
            const txnDueDate = await calculateDueDate(txn);
            if (txnDueDate && txnDueDate <= effectiveDueDate) {
              balance += txn.amount * (txn.type === 'DEPOSIT' ? 1 : -1);
            }
          }

          return balance;
        },
      },
      dueDateResolved: {
        needs: {
          id: true,
          date: true,
          relativeDueDateTransactionId: true,
          relativeDueDateOffsetDays: true,
        },
        async compute(data) {
          // Prevent infinite loops
          const visited = new Set<string>();

          async function calculateRecursive(transactionData: {
            id: string;
            date: Date | null;
            relativeDueDateTransactionId: string | null;
            relativeDueDateOffsetDays: number | null;
          }): Promise<Date | null> {
            // Check for cycles
            if (visited.has(transactionData.id)) {
              console.error('Circular dependency detected in due date chain');
              return null;
            }
            visited.add(transactionData.id);

            // If it has a fixed due date and no relative reference, return it
            if (transactionData.date && !transactionData.relativeDueDateTransactionId) {
              return transactionData.date;
            }

            // If it has a relative due date reference
            if (
              transactionData.relativeDueDateTransactionId &&
              transactionData.relativeDueDateOffsetDays !== null
            ) {
              // Fetch the referenced transaction
              const referencedTransaction = await basePrisma.transaction.findUnique({
                where: { id: transactionData.relativeDueDateTransactionId },
                select: {
                  id: true,
                  date: true,
                  relativeDueDateTransactionId: true,
                  relativeDueDateOffsetDays: true,
                },
              });

              if (!referencedTransaction) {
                // Referenced transaction was deleted
                return null;
              }

              // Recursively calculate the referenced transaction's due date
              const referencedDueDate = await calculateRecursive(referencedTransaction);

              if (!referencedDueDate) {
                // Referenced transaction has no due date
                return null;
              }

              // Calculate the effective due date with offset
              const effectiveDate = new Date(referencedDueDate);
              effectiveDate.setDate(effectiveDate.getDate() + transactionData.relativeDueDateOffsetDays);
              return effectiveDate;
            }

            // No due date information
            return null;
          }

          return calculateRecursive(data);
        },
      },
    },
  },
});
