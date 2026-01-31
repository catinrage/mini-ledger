import { prisma } from '$lib/prisma';
import type { Actions, RequestEvent } from '@sveltejs/kit';
import { fail, redirect } from '@sveltejs/kit';
import { randomUUID } from 'crypto';
import { message, superValidate } from 'sveltekit-superforms';
import { zod } from 'sveltekit-superforms/adapters';
import { z } from 'zod';

const verifyPasskeySchema = z.object({
  passkey: z
    .string({
      message: 'رمز عبور باید از نوع رشته باشد',
    })
    .min(1, {
      message: 'رمز عبور نباید خالی باشد',
    }),
});

const setSessionCookie = (event: RequestEvent, token: string) => {
  event.cookies.set('session_token', token, {
    path: '/',
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
};

export const load = async (event) => {
  // If already logged in, redirect to home
  // verification happens in hooks.server.ts, but we can double check or just let the user be
  // actually hooks will handle redirection to login if not authenticated.
  // if we are here, we might be unauthenticated OR already authenticated but visiting /login.
  // The hook should redirect to / if already authenticated ideally, or we do it here.
  // Let's keep it simple for now and just show the form.

  const form = await superValidate(zod(verifyPasskeySchema), {
    defaults: {
      passkey: '',
    },
  });

  return {
    form,
  };
};

export const actions: Actions = {
  verify: async (event) => {
    const form = await superValidate(event, zod(verifyPasskeySchema));

    if (!form.valid) {
      return fail(400, { form });
    }

    try {
      // Get or create settings
      let settings = await prisma.settings.findFirst();
      if (!settings) {
        settings = await prisma.settings.create({
          data: { baselineBalance: 0, passkey: '1234' },
        });
      }

      // Check passkey
      if (settings.passkey !== form.data.passkey) {
        return message(form, 'رمز عبور وارد شده صحیح نیست', {
          status: 401,
        });
      }

      // Generate session token
      const sessionToken = randomUUID();

      // Store session token in DB
      await prisma.settings.update({
        where: { id: settings.id },
        data: { sessionToken },
      });

      // Set session cookie
      setSessionCookie(event, sessionToken);

      throw redirect(302, '/');
    } catch (error) {
      if ((error as any)?.status === 302) {
        throw error;
      }
      console.error('Authentication error:', error);
      return message(form, 'خطای سرویس', {
        status: 500,
      });
    }
  },

  logout: async (event) => {
    event.cookies.delete('session_token', {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });
    // Also clear session token from DB? Optional, but good practice to invalidate it.
    // However, since we only support one session, clearing it might affect other devices if we supported multiple.
    // But here we enforce single session. So let's clear it from DB to be safe/clean.
    const settings = await prisma.settings.findFirst();
    if (settings) {
      await prisma.settings.update({
        where: { id: settings.id },
        data: { sessionToken: null },
      });
      console.log('hi');
    }
    throw redirect(302, '/login');
  },
} satisfies Actions;
