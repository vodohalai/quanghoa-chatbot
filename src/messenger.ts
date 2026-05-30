import type { Env, MessengerWebhook, MessengerEvent, Message } from './types';
import { getConversation, saveConversation, getBotSettings } from './db';
import { generateResponse } from './ai';

const GRAPH_API = 'https://graph.facebook.com/v19.0';

// ─── Send API ──────────────────────────────────────────────────────────────

async function sendText(env: Env, recipientId: string, text: string): Promise<void> {
  const chunks = splitMessage(text, 2000);
  for (const chunk of chunks) {
    await callSendAPI(env, recipientId, { text: chunk });
  }
}

async function sendImage(env: Env, recipientId: string, imageUrl: string): Promise<void> {
  await callSendAPI(env, recipientId, {
    attachment: {
      type: 'image',
      payload: { url: imageUrl, is_reusable: true },
    },
  });
}

async function sendTypingOn(env: Env, recipientId: string): Promise<void> {
  await callSendAPI(env, recipientId, null, 'typing_on');
}

async function callSendAPI(
  env: Env,
  recipientId: string,
  message: unknown,
  senderAction?: string
): Promise<void> {
  const body: Record<string, unknown> = { recipient: { id: recipientId } };
  if (message) body.message = message;
  if (senderAction) body.sender_action = senderAction;

  const resp = await fetch(`${GRAPH_API}/me/messages?access_token=${env.FB_PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error('Send API error:', err);
  }
}

function splitMessage(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > maxLen) {
    const idx = remaining.lastIndexOf('\n', maxLen) || remaining.lastIndexOf(' ', maxLen) || maxLen;
    parts.push(remaining.slice(0, idx));
    remaining = remaining.slice(idx).trim();
  }
  if (remaining) parts.push(remaining);
  return parts;
}

// ─── Verify Webhook ────────────────────────────────────────────────────────

export function handleVerification(request: Request, env: Env): Response {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === env.FB_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Forbidden', { status: 403 });
}

// ─── Handle Incoming Messages ──────────────────────────────────────────────

export async function handleWebhook(request: Request, env: Env): Promise<void> {
  let body: MessengerWebhook;
  try {
    body = await request.json() as MessengerWebhook;
  } catch {
    return;
  }

  if (body.object !== 'page') return;

  const events: Array<{ psid: string; event: MessengerEvent }> = [];
  for (const entry of body.entry) {
    for (const event of entry.messaging) {
      if (event.read || event.delivery) continue;
      events.push({ psid: event.sender.id, event });
    }
  }

  await processEvents(env, events);
}

async function processEvents(env: Env, events: Array<{ psid: string; event: MessengerEvent }>): Promise<void> {
  for (const { psid, event } of events) {
    try {
      await handleEvent(env, psid, event);
    } catch (err) {
      console.error(`Error processing event for ${psid}:`, err);
    }
  }
}

async function handleEvent(env: Env, psid: string, event: MessengerEvent): Promise<void> {
  // Handle postback (Get Started button, quick replies, etc.)
  if (event.postback) {
    if (event.postback.payload === 'GET_STARTED') {
      const settings = await getBotSettings(env);
      await sendText(env, psid, settings.greeting);
    }
    return;
  }

  if (!event.message) return;

  const msg = event.message;
  let userText = msg.text || '';
  let imageUrl: string | undefined;

  // Check for image attachment
  if (msg.attachments) {
    for (const att of msg.attachments) {
      if (att.type === 'image' && att.payload.url) {
        imageUrl = att.payload.url;
        break;
      }
      if (att.type === 'sticker') {
        // Ignore stickers
        return;
      }
    }
  }

  // Skip if no text and no image
  if (!userText && !imageUrl) return;

  await sendTypingOn(env, psid);

  // Get conversation history
  const conv = await getConversation(env, psid);
  const history: Message[] = conv?.messages || [];

  // Generate AI response
  const aiResp = await generateResponse(env, psid, userText, history, imageUrl);

  // Update history
  const updatedHistory: Message[] = [
    ...history,
    { role: 'user', content: userText || (imageUrl ? '[Ảnh]' : '') },
    { role: 'assistant', content: aiResp.message },
  ];

  // Trim history to last 40 messages
  const trimmed = updatedHistory.slice(-40);
  await saveConversation(env, psid, trimmed);

  // Send image first if needed
  if (aiResp.send_image_key) {
    try {
      const imageServingUrl = await getImageUrl(env, aiResp.send_image_key);
      if (imageServingUrl) {
        await sendImage(env, psid, imageServingUrl);
      }
    } catch (err) {
      console.error('Error sending image:', err);
    }
  }

  // Send text response
  await sendText(env, psid, aiResp.message);
}

async function getImageUrl(env: Env, imageKey: string): Promise<string | null> {
  const [obj, workerUrl] = await Promise.all([
    env.R2.head(imageKey),
    env.KV.get('worker_url'),
  ]);
  if (!obj || !workerUrl) return null;
  return `${workerUrl}/images/${encodeURIComponent(imageKey)}`;
}
