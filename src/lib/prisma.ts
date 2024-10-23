import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient().$extends({
  result: {
    transaction: {
      balance: {
        needs: {
          date: true,
        },
        async compute(data) {
          // get list of all transaction before this transaction including this transaction
          const priorTransactions = await prisma.transaction.findMany({
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
          // calculate and return balance
          return priorTransactions.reduce(
            (acc, transaction) => acc + transaction.amount * (transaction.type === 'DEPOSIT' ? 1 : -1),
            0,
          );
        },
      },
    },
  },
});
