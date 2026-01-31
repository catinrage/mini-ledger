import { prisma } from '$lib/prisma';
import { fail, message, superValidate } from 'sveltekit-superforms';
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
        }),
    ),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'رمز عبور فعلی را وارد کنید'),
    newPassword: z.string().min(4, 'رمز عبور جدید باید حداقل ۴ کاراکتر باشد'),
    confirmPassword: z.string().min(1, 'تکرار رمز عبور جدید را وارد کنید'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'رمز عبور جدید با تکرار آن مطابقت ندارد',
    path: ['confirmPassword'],
  });

export const load: PageServerLoad = async () => {
  // Get or create settings
  let settings = await prisma.settings.findFirst();
  if (!settings) {
    settings = await prisma.settings.create({
      data: { baselineBalance: 0 },
    });
  }

  const form = await superValidate(
    { baselineBalance: settings.baselineBalance?.toString() || '0' },
    zod(updateSettingsSchema),
    { id: 'settingsForm' },
  );

  const passwordForm = await superValidate(zod(updatePasswordSchema), { id: 'passwordForm' });

  return {
    form,
    passwordForm,
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

  updatePassword: async (event) => {
    const form = await superValidate(event, zod(updatePasswordSchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      const settings = await prisma.settings.findFirst();

      if (!settings) {
        return fail(404, { form, message: 'تنظیمات یافت نشد' });
      }

      if (settings.passkey !== form.data.currentPassword) {
        return message(form, 'رمز عبور فعلی اشتباه است', {
          status: 400,
        });
      }

      await prisma.settings.update({
        where: { id: settings.id },
        data: { passkey: form.data.newPassword },
      });

      return { form, success: true };
    } catch (error) {
      console.error('Error updating password:', error);
      return fail(500, { form, message: 'خطای سیستمی' });
    }
  },
} satisfies Actions;
