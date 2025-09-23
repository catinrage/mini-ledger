import { prisma } from '$lib/prisma';
import { redirect } from '@sveltejs/kit';
import superjson from 'superjson';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import { TransactionType, type Prisma } from '@prisma/client';

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
    }).transform((val) => parseInt(val.replaceAll(',', ''), 10))
    ,
  description: z
    .string({
      message: 'توضیحات باید از نوع رشته باشد',
    })
    .optional(),
  date: z.date({
    message: 'تاریخ تراکنش باید از نوع تاریخ باشد',
  }),
});

const TRANSACTION_PER_PAGE = 20;

export const load: PageServerLoad = async function ({ url }) {
  const page = Math.max(Number(url.searchParams.get('page')) || 1, 1);
  const id = url.searchParams.get('id');
  const party = url.searchParams.get('party');
  const minDate = Number(url.searchParams.get('minDate'));
  const maxDate = Number(url.searchParams.get('maxDate'));
  const minAmount = Number(url.searchParams.get('minAmount'));
  const maxAmount = Number(url.searchParams.get('maxAmount'));
  const type = url.searchParams.get('type') as TransactionType | undefined;
  const keywords = url.searchParams.get('keywords');

  const where: Prisma.TransactionWhereInput = {};

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
  const numberOfPages = Math.max(Math.ceil(numberOfTransactions / TRANSACTION_PER_PAGE), 1);

  if (page > numberOfPages) {
    let query = new URLSearchParams(url.searchParams.toString());
    query.delete('page');
    throw redirect(302, `?${query.toString()}`);
  }

  const parties = await prisma.transaction.findMany({
    distinct: ['party'],
    select: { party: true },
    orderBy: { createdAt: 'desc' },
  });

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      skip: (page - 1) * TRANSACTION_PER_PAGE,
      take: TRANSACTION_PER_PAGE,
      orderBy: {
        date: 'asc',
      },
      select: {
        id: true,
        date: true,
        amount: true,
        type: true,
        description: true,
        party: true,
        balance: true,
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
    }[];

    return {
      form,
      transactions: sanitizedTransactions,
      numberOfTransactions,
      totalNumberOfTransactions,
      currentPage: page,
      parties: parties.map((p) => p.party),
      TRANSACTION_PER_PAGE,
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
} satisfies Actions;
