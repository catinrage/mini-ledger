import { prisma } from '$lib/prisma';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import { TransactionType } from '@prisma/client';

import type { Actions, PageServerLoad } from './$types';

const createTransactionSchema = z.object({
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
  date: z.date({
    message: 'تاریخ تراکنش باید از نوع تاریخ باشد',
  }),
});

export const load: PageServerLoad = async (event) => {
  const form = await superValidate(zod(createTransactionSchema), {
    defaults: {
      party: '',
      amount: 0,
      type: TransactionType.DEPOSIT,
      description: '',
      date: new Date(),
    },
  });
  const parties = await prisma.transaction.findMany({
    distinct: ['party'],
    select: { party: true },
    orderBy: { createdAt: 'desc' },
  });
  return { form, parties: parties.map((p) => p.party) };
};

export const actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(createTransactionSchema));
    if (!form.valid) return fail(400, { form });
    try {
      await prisma.transaction.create({
        data: form.data as any,
      });
      return {
        form,
      };
    } catch {
      return fail(500, {
        message: 'خطایی در ذخیره‌سازی رخ داد',
        form,
      });
    }
  },
} satisfies Actions;
