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

const updateTransactionSchema = z
  .object({
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
    amount: z.preprocess(
      (val) => {
        if (typeof val === 'string') {
          const cleaned = val.replaceAll(',', '').trim();
          return cleaned === '' ? undefined : Number(cleaned);
        }
        return val;
      },
      z
        .number({
          message: 'مقدار تراکنش باید از نوع عدد باشد',
        })
        .int({
          message: 'مقدار تراکنش باید از نوع عدد صحیح باشد',
        }),
    ),
    description: z
      .string({
        message: 'توضیحات باید از نوع رشته باشد',
      })
      .optional(),
    // Due date fields
    date: z
      .union([z.date(), z.string().length(0)])
      .optional()
      .transform((val) => (val === '' || !val ? undefined : val instanceof Date ? val : new Date(val))),
    relativeDueDateTransactionId: z
      .string()
      .optional()
      .transform((val) => (val === '' ? undefined : val)),
    relativeDueDateOffsetDays: z.coerce.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    const hasFixedDate = data.date instanceof Date;
    const hasRelative = Boolean(data.relativeDueDateTransactionId);

    if (!hasFixedDate && !hasRelative) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['date'],
        message: 'وارد کردن سررسید اجباری است (ثابت یا نسبی).',
      });
    }

    if (hasRelative && data.relativeDueDateOffsetDays === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['relativeDueDateOffsetDays'],
        message: 'در حالت سررسید نسبی، تعداد روز فاصله الزامی است.',
      });
    }
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
    // TODO: Date filtering will need to be done post-query on dueDateResolved
    // if (minDate) {
    //   where.date = {
    //     gte: new Date(minDate),
    //   };
    // }
    // if (maxDate) {
    //   where.date = {
    //     ...(where.date as any),
    //     lte: new Date(maxDate),
    //   };
    // }
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
          createdAt: 'asc',
        },
      ],
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        party: true,
        balance: true,
        includeInBalance: true,
        date: true,
        relativeDueDateTransactionId: true,
        relativeDueDateOffsetDays: true,
        dueDateResolved: true,
      },
    });
    const form = await superValidate(zod(deleteTransactionSchema));
    const transactionAwaited = await Promise.all(
      transactions.map(async (t) => ({
        ...t,
        balance: await t.balance,
        dueDateResolved: await t.dueDateResolved,
      })),
    );
    transactionAwaited.sort((a, b) => {
      const aTime = a.dueDateResolved?.getTime();
      const bTime = b.dueDateResolved?.getTime();
      if (aTime === undefined && bTime === undefined) return 0;
      if (aTime === undefined) return 1;
      if (bTime === undefined) return -1;
      return aTime - bTime;
    });
    const sanitizedTransactions = superjson.parse(superjson.stringify(transactionAwaited)) as {
      id: string;
      amount: number;
      type: TransactionType;
      description: string;
      party: string;
      balance: number;
      includeInBalance: boolean;
      date?: Date | null;
      relativeDueDateTransactionId?: string | null;
      relativeDueDateOffsetDays?: number | null;
      dueDateResolved?: Date | null;
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

    // Get all transactions for the selector (only non-applied ones)
    const allTransactionsForSelector = await prisma.transaction.findMany({
      where: {
        applied: false,
      },
      select: {
        id: true,
        party: true,
        amount: true,
        type: true,
        dueDateResolved: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Await the computed field
    const allTransactionsAwaited = await Promise.all(
      allTransactionsForSelector.map(async (t) => ({
        ...t,
        dueDateResolved: await t.dueDateResolved,
      })),
    );

    return {
      form,
      transactions: sanitizedTransactions,
      numberOfTransactions,
      totalNumberOfTransactions,
      parties: parties.map((p) => p.party),
      baselineBalance: settings.baselineBalance,
      currentTotalBalance,
      allTransactions: superjson.parse(
        superjson.stringify(allTransactionsAwaited),
      ) as typeof allTransactionsAwaited,
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
      // Capture dependent transactions before deleting so we can preserve their resolved due dates.
      const dependents = await prisma.transaction.findMany({
        where: { relativeDueDateTransactionId: form.data.id },
        select: {
          id: true,
          dueDateResolved: true,
        },
      });

      const dependentUpdates = await Promise.all(
        dependents.map(async (txn) => ({
          id: txn.id,
          resolvedDate: await txn.dueDateResolved,
        })),
      );

      const operations = dependentUpdates.map(({ id, resolvedDate }) =>
        prisma.transaction.update({
          where: { id },
          data: {
            date: resolvedDate ?? null,
            relativeDueDateTransactionId: null,
            relativeDueDateOffsetDays: null,
          },
        }),
      );

      operations.push(
        prisma.transaction.delete({
          where: {
            id: form.data.id,
          },
        }),
      );

      await prisma.$transaction(operations);
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

    // Validate no circular dependency if using relative due date
    if (form.data.relativeDueDateTransactionId) {
      const referencedTransaction = await prisma.transaction.findUnique({
        where: { id: form.data.relativeDueDateTransactionId },
      });

      if (!referencedTransaction) {
        return {
          status: 400,
          form,
        };
      }

      // Check for cycles - the referenced transaction should not depend on this one
      let currentId: string | null = form.data.relativeDueDateTransactionId;
      const visited = new Set<string>([form.data.id]);

      while (currentId) {
        if (visited.has(currentId)) {
          return {
            status: 400,
            form,
          };
        }
        visited.add(currentId);

        const txn = await prisma.transaction.findUnique({
          where: { id: currentId },
          select: { relativeDueDateTransactionId: true },
        });

        if (!txn) break;
        currentId = txn.relativeDueDateTransactionId;
      }
    }

    try {
      const result = await prisma.transaction.update({
        where: {
          id: form.data.id,
        },
        data: {
          party: form.data.party,
          type: form.data.type,
          amount: form.data.amount,
          description: form.data.description || '',
          date: form.data.date,
          relativeDueDateTransactionId: form.data.relativeDueDateTransactionId,
          relativeDueDateOffsetDays: form.data.relativeDueDateOffsetDays,
        },
      });
      return message(form, 'تراکنش با موفقیت به‌روزرسانی شد');
    } catch (error) {
      console.error('Error updating transaction:', error);
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
