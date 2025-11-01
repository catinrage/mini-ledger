import { prisma } from '$lib/prisma';
import superjson from 'superjson';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import { TransactionType } from '@prisma/client';

import type { Actions, PageServerLoad } from './$types';

const createTransactionSchema = z
  .object({
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
      .number({
        message: 'مقدار تراکنش باید از نوع عدد باشد',
      })
      .min(1, {
        message: 'مقدار تراکنش نباید کمتر از 1 باشد',
      })
      .int({
        message: 'مقدار تراکنش باید از نوع عدد صحیح باشد',
      }),
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
    relativeDueDateOffsetDays: z.coerce.number().positive().int().optional(),
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

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(zod(createTransactionSchema), {
    defaults: {
      party: '',
      amount: 0,
      type: TransactionType.DEPOSIT,
      description: '',
      date: new Date(),
      relativeDueDateTransactionId: undefined,
      relativeDueDateOffsetDays: undefined,
    },
  });
  const parties = await prisma.transaction.findMany({
    distinct: ['party'],
    select: { party: true },
    orderBy: { createdAt: 'desc' },
  });
  // Get all transactions for the selector (only non-applied ones with dates)
  const transactions = await prisma.transaction.findMany({
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
  const transactionsAwaited = await Promise.all(
    transactions.map(async (t) => ({
      ...t,
      dueDateResolved: await t.dueDateResolved,
    })),
  );

  return {
    form,
    parties: parties.map((p) => p.party),
    transactions: superjson.parse(superjson.stringify(transactionsAwaited)) as typeof transactionsAwaited,
  };
};

export const actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(createTransactionSchema));

    if (!form.valid) return fail(400, { form });

    // Validate no circular dependency if using relative due date
    if (form.data.relativeDueDateTransactionId) {
      // For new transactions, we just need to check that the referenced transaction exists
      // and doesn't reference back (which will be checked at the database level)
      const referencedTransaction = await prisma.transaction.findUnique({
        where: { id: form.data.relativeDueDateTransactionId },
      });

      if (!referencedTransaction) {
        return fail(400, {
          message: 'تراکنش مرجع یافت نشد',
          form,
        });
      }
    }

    try {
      await prisma.transaction.create({
        data: {
          party: form.data.party,
          type: form.data.type,
          amount: form.data.amount,
          description: form.data.description,
          date: form.data.date,
          relativeDueDateTransactionId: form.data.relativeDueDateTransactionId,
          relativeDueDateOffsetDays: form.data.relativeDueDateOffsetDays,
        },
      });
      return {
        form,
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return fail(500, {
        message: 'خطایی در ذخیره‌سازی رخ داد',
        form,
      });
    }
  },
} satisfies Actions;
