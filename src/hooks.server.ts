import { prisma } from '$lib/prisma';
import { type Handle, redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  const sessionToken = event.cookies.get('session_token');

  // STRATEGY: Everything is protected EXCEPT /login and public assets.

  const publicPaths = ['/login', '/_app', '/favicon.ico', '/manifest.json'];

  // Check if the current path is public
  const isPublic = publicPaths.some((path) => event.url.pathname.startsWith(path));

  if (!isPublic) {
    if (!sessionToken) {
      throw redirect(303, '/login');
    }

    // Validate token with DB
    const settings = await prisma.settings.findFirst();

    if (!settings || settings.sessionToken !== sessionToken) {
      // Invalid or expired token
      event.cookies.delete('session_token', { path: '/' });
      throw redirect(303, '/login');
    }
  } else {
    // If visiting login while authenticated, redirect to home
    if (sessionToken && event.url.pathname === '/login' && event.request.method === 'GET') {
      const settings = await prisma.settings.findFirst();
      if (settings && settings.sessionToken === sessionToken) {
        throw redirect(303, '/');
      }
    }
  }

  const response = await resolve(event);
  return response;
};
