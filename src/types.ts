export interface Env {
  AI: Ai;
  DB: D1Database;
  KV: KVNamespace;
  R2: R2Bucket;
  FB_VERIFY_TOKEN: string;
  FB_PAGE_ACCESS_TOKEN: string;
  ADMIN_PASSWORD: string;
  ADMIN_SECRET_KEY: string;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ConversationRecord {
  psid: string;
  messages: Message[];
  customer_name?: string;
  note?: string;
  created_at: number;
  updated_at: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: string;
  category: string;
  image_key: string;
  specifications: string;
  active: number;
  created_at: number;
  updated_at: number;
}

export interface KnowledgeItem {
  id: number;
  title: string;
  content: string;
  category: string;
  active: number;
  created_at: number;
  updated_at: number;
}

export interface BotSettings {
  bot_name: string;
  greeting: string;
  system_prompt: string;
  max_history: string;
  business_name: string;
  business_phone: string;
  business_address: string;
  business_hours: string;
  [key: string]: string;
}

export interface AdminInstruction {
  id: number;
  instruction: string;
  priority: number;
  active: number;
  created_at: number;
}

export interface ImageCatalog {
  key: string;
  name: string;
  description: string;
  tags: string[];
  product_id?: number;
  created_at: number;
}

export interface AIResponse {
  message: string;
  send_image_key: string | null;
  image_reason: string | null;
}

// Facebook Messenger types
export interface MessengerEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: Array<{
      type: string;
      payload: {
        url?: string;
        sticker_id?: number;
      };
    }>;
  };
  postback?: {
    payload: string;
    title: string;
  };
  read?: { watermark: number };
  delivery?: { watermark: number };
}

export interface MessengerWebhook {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging: MessengerEvent[];
  }>;
}
