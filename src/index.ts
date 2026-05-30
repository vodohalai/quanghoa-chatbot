import type { Env } from './types';
import { handleVerification, handleWebhook } from './messenger';
import { handleAdmin } from './admin';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // ── Facebook Messenger Webhook ────────────────────────────────────────
    if (path === '/webhook') {
      if (request.method === 'GET') {
        return handleVerification(request, env);
      }
      if (request.method === 'POST') {
        // Process webhook in background so we return 200 immediately
        const response = new Response('EVENT_RECEIVED', { status: 200 });
        ctx.waitUntil(handleWebhook(request, env));
        return response;
      }
      return new Response('Method Not Allowed', { status: 405 });
    }

    // ── Serve R2 images publicly ──────────────────────────────────────────
    if (path.startsWith('/images/')) {
      const key = decodeURIComponent(path.slice('/images/'.length));
      if (!key) return new Response('Not Found', { status: 404 });

      const obj = await env.R2.get(key);
      if (!obj) return new Response('Image Not Found', { status: 404 });

      const headers = new Headers();
      headers.set('Content-Type', obj.httpMetadata?.contentType || 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=86400');
      headers.set('Access-Control-Allow-Origin', '*');

      return new Response(obj.body, { headers });
    }

    // ── Admin Panel ───────────────────────────────────────────────────────
    if (path === '/admin' || path === '/admin/' || path.startsWith('/admin/')) {
      return handleAdmin(request, env, path);
    }

    // ── Root redirect ─────────────────────────────────────────────────────
    if (path === '/' || path === '') {
      return Response.redirect(new URL('/admin', request.url).toString(), 302);
    }

    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
