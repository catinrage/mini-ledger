import { prisma } from '$lib/prisma';
import superjson from 'superjson';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import { type Prisma, TransactionType } from '@prisma/client';

import type { Actions, PageServerLoad } from './$types';

const deleteTransactionSchema = z.object({
  id: z.string({
    message: 'این مقدار باید از نوع رشته باشد',
  }),
});

const updateTransactionSchema = z.object({
  id: z.string({
    message: 'این مقدار باید از نوع رشته باشد',
  }),
  party: z
    .string({
      message: 'نام شخص باید از نوع رشته باشد',
    })
    .min(1, {
      message: 'نام شخص نباید خالی باشد',
    }),
  type: z.nativeEnum(TransactionType, {
    message: 'نوع تراکنش باید یکی از مقادیر معتبر باشد',
  }),
  amount: z
    .string({
      message: 'مقدار تراکنش باید از نوع عدد باشد',
    })
    .transform((val) => parseInt(val.replaceAll(',', ''), 10)),
  description: z
    .string({
      message: 'توضیحات باید از نوع رشته باشد',
    })
    .optional(),
  date: z.date({
    message: 'تاریخ تراکنش باید از نوع تاریخ باشد',
  }),
});

const applyTransactionSchema = z.object({
  id: z.string({
    message: 'این مقدار باید از نوع رشته باشد',
  }),
});

const toggleIncludeInBalanceSchema = z.object({
  id: z.string({
    message: 'این مقدار باید از نوع رشته باشد',
  }),
  includeInBalance: z.boolean({
    message: 'این مقدار باید از نوع boolean باشد',
  }),
});

export const load: PageServerLoad = async function ({ url }) {
  const id = url.searchParams.get('id');
  const party = url.searchParams.get('party');
  const minDate = Number(url.searchParams.get('minDate'));
  const maxDate = Number(url.searchParams.get('maxDate'));
  const minAmount = Number(url.searchParams.get('minAmount'));
  const maxAmount = Number(url.searchParams.get('maxAmount'));
  const type = url.searchParams.get('type') as TransactionType | undefined;
  const keywords = url.searchParams.get('keywords');

  const where: Prisma.TransactionWhereInput = {
    applied: false, // Only show non-applied transactions
  };

  if (id) {
    where.id = id;
  } else {
    if (party) {
      where.party = {
        contains: party,
      };
    }
    if (minDate) {
      where.date = {
        gte: new Date(minDate),
      };
    }
    if (maxDate) {
      where.date = {
        ...(where.date as any),
        lte: new Date(maxDate),
      };
    }
    if (minAmount) {
      where.amount = {
        gte: minAmount,
      };
    }
    if (maxAmount) {
      where.amount = {
        ...(where.amount as any),
        lte: maxAmount,
      };
    }
    if (type) {
      where.type = type;
    }
    if (keywords) {
      where.description = {
        contains: keywords,
      };
    }
  }

  const totalNumberOfTransactions = await prisma.transaction.count();
  const numberOfTransactions = await prisma.transaction.count({
    where,
  });

  const parties = await prisma.transaction.findMany({
    distinct: ['party'],
    select: { party: true },
    orderBy: { createdAt: 'desc' },
  });

  // Get baseline balance from settings
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: { baselineBalance: 0 },
    });
  }

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [
        {
          date: 'asc',
        },
        {
          createdAt: 'asc',
        },
      ],
      select: {
        id: true,
        date: true,
        amount: true,
        type: true,
        description: true,
        party: true,
        balance: true,
        includeInBalance: true,
      },
    });
    const form = await superValidate(zod(deleteTransactionSchema));
    const transactionAwaited = await Promise.all(
      transactions.map(async (t) => ({
        ...t,
        balance: await t.balance,
      })),
    );
    const sanitizedTransactions = superjson.parse(superjson.stringify(transactionAwaited)) as {
      id: string;
      date: Date;
      amount: number;
      type: TransactionType;
      description: string;
      party: string;
      balance: number;
      includeInBalance: boolean;
    }[];

    // Calculate current total balance (baseline + all non-applied transactions that are included in balance)
    const allNonAppliedTransactions = await prisma.transaction.findMany({
      where: { applied: false, includeInBalance: true },
      select: {
        amount: true,
        type: true,
      },
    });
    const currentTotalBalance = allNonAppliedTransactions.reduce(
      (acc, transaction) => acc + transaction.amount * (transaction.type === 'DEPOSIT' ? 1 : -1),
      settings.baselineBalance,
    );

    return {
      form,
      transactions: sanitizedTransactions,
      numberOfTransactions,
      totalNumberOfTransactions,
      parties: parties.map((p) => p.party),
      baselineBalance: settings.baselineBalance,
      currentTotalBalance,
    };
  } catch (error) {
    console.error(error);
  }
};

export const actions = {
  deleteTransaction: async (event) => {
    const form = await superValidate(event, zod(deleteTransactionSchema));
    if (!form.valid) {
      return {
        status: 400,
        form,
      };
    }
    try {
      await prisma.transaction.delete({
        where: {
          id: form.data.id,
        },
      });
      return message(form, 'تراکنش با موفقیت حذف شد');
    } catch (error) {
      return {
        status: 500,
        form,
      };
    }
  },

  updateTransaction: async (event) => {
    const form = await superValidate(event, zod(updateTransactionSchema));

    if (!form.valid) {
      return {
        status: 400,
        form,
      };
    }
    try {
      await prisma.transaction.update({
        where: {
          id: form.data.id,
        },
        data: {
          party: form.data.party,
          type: form.data.type,
          amount: form.data.amount,
          description: form.data.description || '',
          date: form.data.date,
        },
      });
      return message(form, 'تراکنش با موفقیت به‌روزرسانی شد');
    } catch (error) {
      return {
        status: 500,
        form,
      };
    }
  },

  applyTransaction: async (event) => {
    const form = await superValidate(event, zod(applyTransactionSchema));
    if (!form.valid) {
      return {
        status: 400,
        form,
      };
    }

    try {
      // Get the transaction to apply
      const transaction = await prisma.transaction.findUnique({
        where: { id: form.data.id },
      });

      if (!transaction) {
        return {
          status: 404,
          form,
        };
      }

      // Get current settings
      let settings = await prisma.settings.findFirst();
      if (!settings) {
        settings = await prisma.settings.create({
          data: { baselineBalance: 0 },
        });
      }

      // Calculate the new baseline balance
      const amountChange = transaction.amount * (transaction.type === 'DEPOSIT' ? 1 : -1);
      const newBaselineBalance = settings.baselineBalance + amountChange;

      console.log({ newBaselineBalance });

      // Update settings with new baseline balance and mark transaction as applied
      await Promise.all([
        prisma.settings.update({
          where: { id: settings.id },
          data: { baselineBalance: newBaselineBalance },
        }),
        prisma.transaction.update({
          where: { id: form.data.id },
          data: { applied: true },
        }),
      ]);

      return message(form, 'تراکنش با موفقیت به موجودی پایه اعمال شد');
    } catch (error) {
      console.error('Error applying transaction:', error);
      return {
        status: 500,
        form,
      };
    }
  },

  toggleIncludeInBalance: async (event) => {
    const form = await superValidate(event, zod(toggleIncludeInBalanceSchema));
    if (!form.valid) {
      return {
        status: 400,
        form,
      };
    }

    try {
      await prisma.transaction.update({
        where: { id: form.data.id },
        data: { includeInBalance: form.data.includeInBalance },
      });

      return message(form, 'وضعیت تراکنش با موفقیت تغییر یافت');
    } catch (error) {
      console.error('Error toggling includeInBalance:', error);
      return {
        status: 500,
        form,
      };
    }
  },
} satisfies Actions;
