import type {
  Env, ConversationRecord, Message, Product, KnowledgeItem,
  BotSettings, AdminInstruction, ImageCatalog
} from './types';

const now = () => Math.floor(Date.now() / 1000);

// ─── Conversations ─────────────────────────────────────────────────────────

export async function getConversation(env: Env, psid: string): Promise<ConversationRecord | null> {
  const cached = await env.KV.get(`conv:${psid}`);
  if (cached) return JSON.parse(cached);

  const row = await env.DB.prepare(
    'SELECT * FROM conversations WHERE psid = ?'
  ).bind(psid).first<ConversationRecord>();

  if (!row) return null;
  const conv = { ...row, messages: JSON.parse(row.messages as unknown as string) };
  await env.KV.put(`conv:${psid}`, JSON.stringify(conv), { expirationTtl: 3600 });
  return conv;
}

export async function saveConversation(env: Env, psid: string, messages: Message[], customerName?: string): Promise<void> {
  const existing = await env.DB.prepare(
    'SELECT psid FROM conversations WHERE psid = ?'
  ).bind(psid).first();

  const msgStr = JSON.stringify(messages);
  const t = now();

  if (existing) {
    await env.DB.prepare(
      'UPDATE conversations SET messages = ?, customer_name = COALESCE(?, customer_name), updated_at = ? WHERE psid = ?'
    ).bind(msgStr, customerName || null, t, psid).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO conversations (psid, messages, customer_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(psid, msgStr, customerName || null, t, t).run();
  }

  const conv: ConversationRecord = { psid, messages, customer_name: customerName, created_at: t, updated_at: t };
  await env.KV.put(`conv:${psid}`, JSON.stringify(conv), { expirationTtl: 3600 });
}

// ─── Products ──────────────────────────────────────────────────────────────

export async function getProducts(env: Env, activeOnly = true): Promise<Product[]> {
  const cacheKey = activeOnly ? 'products:active' : 'products:all';
  const cached = await env.KV.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const query = activeOnly
    ? 'SELECT * FROM products WHERE active = 1 ORDER BY category, name'
    : 'SELECT * FROM products ORDER BY category, name';
  const { results } = await env.DB.prepare(query).all<Product>();
  await env.KV.put(cacheKey, JSON.stringify(results), { expirationTtl: 300 });
  return results;
}

export async function getProduct(env: Env, id: number): Promise<Product | null> {
  return env.DB.prepare('SELECT * FROM products WHERE id = ?').bind(id).first<Product>();
}

export async function createProduct(env: Env, data: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const t = now();
  await env.DB.prepare(
    'INSERT INTO products (name, description, price, category, image_key, specifications, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(data.name, data.description, data.price, data.category, data.image_key, data.specifications, data.active, t, t).run();
  await invalidateProductCache(env);
}

export async function updateProduct(env: Env, id: number, data: Partial<Product>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (k !== 'id' && k !== 'created_at') {
      fields.push(`${k} = ?`);
      values.push(v);
    }
  }
  fields.push('updated_at = ?');
  values.push(now());
  values.push(id);
  await env.DB.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  await invalidateProductCache(env);
}

export async function deleteProduct(env: Env, id: number): Promise<void> {
  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  await invalidateProductCache(env);
}

async function invalidateProductCache(env: Env): Promise<void> {
  await Promise.all([
    env.KV.delete('products:active'),
    env.KV.delete('products:all'),
    env.KV.delete('context:full'),
  ]);
}

// ─── Knowledge Base ────────────────────────────────────────────────────────

export async function getKnowledge(env: Env, activeOnly = true): Promise<KnowledgeItem[]> {
  const cacheKey = activeOnly ? 'knowledge:active' : 'knowledge:all';
  const cached = await env.KV.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const query = activeOnly
    ? 'SELECT * FROM knowledge_base WHERE active = 1 ORDER BY category, title'
    : 'SELECT * FROM knowledge_base ORDER BY category, title';
  const { results } = await env.DB.prepare(query).all<KnowledgeItem>();
  await env.KV.put(cacheKey, JSON.stringify(results), { expirationTtl: 300 });
  return results;
}

export async function createKnowledge(env: Env, data: Omit<KnowledgeItem, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
  const t = now();
  await env.DB.prepare(
    'INSERT INTO knowledge_base (title, content, category, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(data.title, data.content, data.category, data.active, t, t).run();
  await env.KV.delete('knowledge:active');
  await env.KV.delete('knowledge:all');
  await env.KV.delete('context:full');
}

export async function updateKnowledge(env: Env, id: number, data: Partial<KnowledgeItem>): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    if (k !== 'id' && k !== 'created_at') {
      fields.push(`${k} = ?`);
      values.push(v);
    }
  }
  fields.push('updated_at = ?');
  values.push(now());
  values.push(id);
  await env.DB.prepare(`UPDATE knowledge_base SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  await env.KV.delete('knowledge:active');
  await env.KV.delete('knowledge:all');
  await env.KV.delete('context:full');
}

export async function deleteKnowledge(env: Env, id: number): Promise<void> {
  await env.DB.prepare('DELETE FROM knowledge_base WHERE id = ?').bind(id).run();
  await env.KV.delete('knowledge:active');
  await env.KV.delete('knowledge:all');
  await env.KV.delete('context:full');
}

// ─── Bot Settings ──────────────────────────────────────────────────────────

export async function getBotSettings(env: Env): Promise<BotSettings> {
  const cached = await env.KV.get('settings');
  if (cached) return JSON.parse(cached);

  const { results } = await env.DB.prepare('SELECT key, value FROM bot_settings').all<{ key: string; value: string }>();
  const settings: BotSettings = {} as BotSettings;
  for (const row of results) settings[row.key] = row.value;
  await env.KV.put('settings', JSON.stringify(settings), { expirationTtl: 300 });
  return settings;
}

export async function updateBotSetting(env: Env, key: string, value: string): Promise<void> {
  await env.DB.prepare(
    'INSERT OR REPLACE INTO bot_settings (key, value, updated_at) VALUES (?, ?, ?)'
  ).bind(key, value, now()).run();
  await env.KV.delete('settings');
  await env.KV.delete('context:full');
}

// ─── Admin Instructions ────────────────────────────────────────────────────

export async function getInstructions(env: Env): Promise<AdminInstruction[]> {
  const cached = await env.KV.get('instructions');
  if (cached) return JSON.parse(cached);

  const { results } = await env.DB.prepare(
    'SELECT * FROM admin_instructions WHERE active = 1 ORDER BY priority DESC, created_at DESC'
  ).all<AdminInstruction>();
  await env.KV.put('instructions', JSON.stringify(results), { expirationTtl: 300 });
  return results;
}

export async function createInstruction(env: Env, instruction: string, priority: number): Promise<void> {
  await env.DB.prepare(
    'INSERT INTO admin_instructions (instruction, priority, active, created_at) VALUES (?, ?, 1, ?)'
  ).bind(instruction, priority, now()).run();
  await env.KV.delete('instructions');
  await env.KV.delete('context:full');
}

export async function updateInstruction(env: Env, id: number, data: { instruction?: string; priority?: number; active?: number }): Promise<void> {
  const fields: string[] = [];
  const values: unknown[] = [];
  for (const [k, v] of Object.entries(data)) {
    fields.push(`${k} = ?`);
    values.push(v);
  }
  values.push(id);
  await env.DB.prepare(`UPDATE admin_instructions SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
  await env.KV.delete('instructions');
  await env.KV.delete('context:full');
}

export async function deleteInstruction(env: Env, id: number): Promise<void> {
  await env.DB.prepare('DELETE FROM admin_instructions WHERE id = ?').bind(id).run();
  await env.KV.delete('instructions');
  await env.KV.delete('context:full');
}

// ─── Image Catalog ─────────────────────────────────────────────────────────

export async function getImageCatalog(env: Env): Promise<ImageCatalog[]> {
  const { results } = await env.DB.prepare(
    'SELECT * FROM image_catalog ORDER BY name'
  ).all<{ key: string; name: string; description: string; tags: string; product_id: number | null; created_at: number }>();
  return results.map(r => ({ ...r, tags: JSON.parse(r.tags) as string[], product_id: r.product_id ?? undefined }));
}

export async function saveImageCatalog(env: Env, data: Omit<ImageCatalog, 'created_at'>): Promise<void> {
  await env.DB.prepare(
    'INSERT OR REPLACE INTO image_catalog (key, name, description, tags, product_id, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(data.key, data.name, data.description, JSON.stringify(data.tags), data.product_id || null, now()).run();
}

export async function deleteImageCatalog(env: Env, key: string): Promise<void> {
  await env.DB.prepare('DELETE FROM image_catalog WHERE key = ?').bind(key).run();
}

// ─── Build AI Context ──────────────────────────────────────────────────────

export async function buildAIContext(env: Env): Promise<string> {
  const cached = await env.KV.get('context:full');
  if (cached) return cached;

  const [settings, products, knowledge, instructions, images] = await Promise.all([
    getBotSettings(env),
    getProducts(env, true),
    getKnowledge(env, true),
    getInstructions(env),
    getImageCatalog(env),
  ]);

  let ctx = `# ${settings.business_name}\n\n`;
  ctx += `## Thông tin cửa hàng\n`;
  if (settings.business_phone) ctx += `- Điện thoại: ${settings.business_phone}\n`;
  if (settings.business_address) ctx += `- Địa chỉ: ${settings.business_address}\n`;
  if (settings.business_hours) ctx += `- Giờ làm việc: ${settings.business_hours}\n`;
  ctx += '\n';

  if (products.length > 0) {
    ctx += `## Danh sách sản phẩm\n`;
    for (const p of products) {
      ctx += `### ${p.name}${p.category ? ` [${p.category}]` : ''}\n`;
      ctx += `- Giá: ${p.price}\n`;
      ctx += `- Mô tả: ${p.description}\n`;
      if (p.image_key) ctx += `- Ảnh sản phẩm: ${p.image_key}\n`;
      if (p.specifications && p.specifications !== '{}') {
        try {
          const specs = JSON.parse(p.specifications);
          if (Object.keys(specs).length > 0) {
            ctx += `- Thông số: ${Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join(', ')}\n`;
          }
        } catch {}
      }
      ctx += '\n';
    }
  }

  if (knowledge.length > 0) {
    ctx += `## Kiến thức & Chính sách\n`;
    for (const k of knowledge) {
      ctx += `### ${k.title}${k.category !== 'general' ? ` [${k.category}]` : ''}\n${k.content}\n\n`;
    }
  }

  if (images.length > 0) {
    ctx += `## Danh mục ảnh có sẵn để gửi cho khách\n`;
    ctx += `(Chỉ gửi ảnh khi khách hỏi về sản phẩm lần đầu, hỏi giá, hoặc yêu cầu xem ảnh)\n`;
    for (const img of images) {
      ctx += `- KEY: "${img.key}" | Tên: ${img.name} | Mô tả: ${img.description}${img.tags.length > 0 ? ` | Tags: ${img.tags.join(', ')}` : ''}\n`;
    }
    ctx += '\n';
  }

  if (instructions.length > 0) {
    ctx += `## Chỉ dẫn đặc biệt từ Admin\n`;
    for (const inst of instructions) {
      ctx += `- ${inst.instruction}\n`;
    }
    ctx += '\n';
  }

  await env.KV.put('context:full', ctx, { expirationTtl: 300 });
  return ctx;
}
