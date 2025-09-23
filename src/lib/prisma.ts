import { PrismaClient } from '@prisma/client';

const basePrisma = new PrismaClient();

export const prisma = basePrisma.$extends({
  result: {
    transaction: {
      balance: {
        needs: {
          date: true,
        },
        async compute(data) {
          // Get baseline balance from settings
          let settings = await basePrisma.settings.findFirst();
          if (!settings) {
            // Create default settings if none exist
            settings = await basePrisma.settings.create({
              data: { baselineBalance: 0 }
            });
          }
          
          // get list of all transaction before this transaction including this transaction
          const priorTransactions = await basePrisma.transaction.findMany({
            where: {
              date: {
                lte: data.date,
              },
            },
            select: {
              amount: true,
              type: true,
            },
          });
          // calculate and return balance starting from baseline
          return priorTransactions.reduce(
            (acc, transaction) => acc + transaction.amount * (transaction.type === 'DEPOSIT' ? 1 : -1),
            settings.baselineBalance,
          );
        },
      },
    },
  },
});
