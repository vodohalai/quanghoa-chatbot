import type { Env } from './types';
import { renderAdminPanel } from './admin-ui';
import {
  getProducts, createProduct, updateProduct, deleteProduct,
  getKnowledge, createKnowledge, updateKnowledge, deleteKnowledge,
  getBotSettings, updateBotSetting,
  getInstructions, createInstruction, updateInstruction, deleteInstruction,
  getImageCatalog, saveImageCatalog, deleteImageCatalog,
} from './db';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

// ─── Auth ──────────────────────────────────────────────────────────────────

function makeToken(env: Env): string {
  return btoa(`${env.ADMIN_SECRET_KEY}:valid`);
}

function checkAuth(request: Request, env: Env): boolean {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.replace('Bearer ', '');
  return token === makeToken(env);
}

// ─── Router ────────────────────────────────────────────────────────────────

export async function handleAdmin(request: Request, env: Env, path: string): Promise<Response> {
  // Serve admin UI
  if (path === '' || path === '/' || path === '/admin' || path === '/admin/') {
    return new Response(renderAdminPanel(), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // API routes
  if (path.startsWith('/admin/api')) {
    return handleAdminAPI(request, env, path.slice('/admin/api'.length));
  }

  return new Response('Not Found', { status: 404 });
}

async function handleAdminAPI(request: Request, env: Env, path: string): Promise<Response> {
  const method = request.method;

  // Login - no auth required
  if (path === '/login' && method === 'POST') {
    const body = await request.json() as { password: string };
    if (body.password === env.ADMIN_PASSWORD) {
      return json({ token: makeToken(env) });
    }
    return json({ error: 'Invalid password' }, 401);
  }

  // All other routes require auth
  if (!checkAuth(request, env)) {
    return json({ error: 'Unauthorized' }, 401);
  }

  // Stats
  if (path === '/stats' && method === 'GET') {
    const [products, knowledge, instructions, images, settings] = await Promise.all([
      getProducts(env, false),
      getKnowledge(env, false),
      getInstructions(env),
      getImageCatalog(env),
      getBotSettings(env),
    ]);
    const convCount = await env.DB.prepare('SELECT COUNT(*) as c FROM conversations').first<{ c: number }>();
    return json({
      products: products.length,
      knowledge: knowledge.length,
      instructions: instructions.length,
      images: images.length,
      conversations: convCount?.c || 0,
      business_name: settings.business_name,
    });
  }

  // Settings
  if (path === '/settings') {
    if (method === 'GET') {
      return json(await getBotSettings(env));
    }
    if (method === 'PUT') {
      const updates = await request.json() as Record<string, string>;
      await Promise.all(Object.entries(updates).map(([k, v]) => updateBotSetting(env, k, v)));
      return json({ ok: true });
    }
  }

  // Worker URL
  if (path === '/worker-url' && method === 'PUT') {
    const { url } = await request.json() as { url: string };
    await env.KV.put('worker_url', url);
    return json({ ok: true });
  }

  // Products
  if (path === '/products') {
    if (method === 'GET') return json(await getProducts(env, false));
    if (method === 'POST') {
      const data = await request.json() as Parameters<typeof createProduct>[1];
      await createProduct(env, data);
      return json({ ok: true });
    }
  }

  const productMatch = path.match(/^\/products\/(\d+)$/);
  if (productMatch) {
    const id = parseInt(productMatch[1]);
    if (method === 'PUT') {
      const data = await request.json() as Parameters<typeof updateProduct>[2];
      await updateProduct(env, id, data);
      return json({ ok: true });
    }
    if (method === 'DELETE') {
      await deleteProduct(env, id);
      return json({ ok: true });
    }
  }

  // Knowledge
  if (path === '/knowledge') {
    if (method === 'GET') return json(await getKnowledge(env, false));
    if (method === 'POST') {
      const data = await request.json() as Parameters<typeof createKnowledge>[1];
      await createKnowledge(env, data);
      return json({ ok: true });
    }
  }

  const knowledgeMatch = path.match(/^\/knowledge\/(\d+)$/);
  if (knowledgeMatch) {
    const id = parseInt(knowledgeMatch[1]);
    if (method === 'PUT') {
      const data = await request.json() as Parameters<typeof updateKnowledge>[2];
      await updateKnowledge(env, id, data);
      return json({ ok: true });
    }
    if (method === 'DELETE') {
      await deleteKnowledge(env, id);
      return json({ ok: true });
    }
  }

  // Instructions
  if (path === '/instructions') {
    if (method === 'GET') return json(await getInstructions(env));
    if (method === 'POST') {
      const { instruction, priority } = await request.json() as { instruction: string; priority: number };
      await createInstruction(env, instruction, priority);
      return json({ ok: true });
    }
  }

  const instructionMatch = path.match(/^\/instructions\/(\d+)$/);
  if (instructionMatch) {
    const id = parseInt(instructionMatch[1]);
    if (method === 'PUT') {
      const data = await request.json() as Parameters<typeof updateInstruction>[2];
      await updateInstruction(env, id, data);
      return json({ ok: true });
    }
    if (method === 'DELETE') {
      await deleteInstruction(env, id);
      return json({ ok: true });
    }
  }

  // Images
  if (path === '/images') {
    if (method === 'GET') {
      const images = await getImageCatalog(env);
      return json({ images });
    }
    if (method === 'POST') {
      // Handle multipart upload
      const formData = await request.formData();
      const file = formData.get('file') as unknown as File;
      const name = formData.get('name') as string;
      const description = formData.get('description') as string || '';
      const tagsStr = formData.get('tags') as string || '';
      const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

      if (!file || !name) return json({ error: 'Missing file or name' }, 400);

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const key = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}.${ext}`;

      await env.R2.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: file.type },
        customMetadata: { originalName: file.name, description, tags: tagsStr },
      });

      await saveImageCatalog(env, { key, name, description, tags });
      return json({ ok: true, key });
    }
  }

  const imageMatch = path.match(/^\/images\/(.+)$/);
  if (imageMatch) {
    const key = decodeURIComponent(imageMatch[1]);
    if (method === 'DELETE') {
      await env.R2.delete(key);
      await deleteImageCatalog(env, key);
      return json({ ok: true });
    }
  }

  // Conversations
  if (path === '/conversations' && method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT psid, customer_name, messages, updated_at FROM conversations ORDER BY updated_at DESC LIMIT 100'
    ).all<{ psid: string; customer_name: string; messages: string; updated_at: number }>();
    const convs = results.map(r => ({
      ...r,
      messages: JSON.parse(r.messages || '[]'),
    }));
    return json(convs);
  }

  return json({ error: 'Not Found' }, 404);
}
