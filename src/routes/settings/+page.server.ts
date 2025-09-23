import { prisma } from '$lib/prisma';
import { fail, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

import type { Actions, PageServerLoad } from './$types';

const updateSettingsSchema = z.object({
  baselineBalance: z
    .string()
    .transform((val) => Number(val.replaceAll(/,/g, '')))
    .pipe(
      z
        .number({
          message: 'موجودی پایه باید از نوع عدد باشد',
        })
        .int({
          message: 'موجودی پایه باید از نوع عدد صحیح باشد',
        })
    ),
});

export const load: PageServerLoad = async () => {
  // Get or create settings
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: { baselineBalance: 0 }
    });
  }

  const form = await superValidate(
    { baselineBalance: settings.baselineBalance.toString() },
    zod(updateSettingsSchema)
  );

  return {
    form,
    settings,
  };
};

export const actions = {
  updateSettings: async (event) => {
    const form = await superValidate(event, zod(updateSettingsSchema));
    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      // Get existing settings or create new ones
      let settings = await prisma.settings.findFirst();
      
      if (settings) {
        await prisma.settings.update({
          where: { id: settings.id },
          data: { baselineBalance: form.data.baselineBalance },
        });
      } else {
        await prisma.settings.create({
          data: { baselineBalance: form.data.baselineBalance },
        });
      }

      return { form };
    } catch (error) {
      console.error('Error updating settings:', error);
      return fail(500, { form });
    }
  },
} satisfies Actions;