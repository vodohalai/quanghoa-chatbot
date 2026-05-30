-- Lịch sử hội thoại từng khách hàng
CREATE TABLE IF NOT EXISTS conversations (
  psid TEXT PRIMARY KEY,
  messages TEXT NOT NULL DEFAULT '[]',
  customer_name TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Danh mục sản phẩm
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT NOT NULL,
  category TEXT DEFAULT '',
  image_key TEXT DEFAULT '',
  specifications TEXT DEFAULT '{}',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Kiến thức chung (FAQ, chính sách, hướng dẫn...)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Cài đặt bot
CREATE TABLE IF NOT EXISTS bot_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Chỉ dẫn bổ sung từ Admin
CREATE TABLE IF NOT EXISTS admin_instructions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  instruction TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Danh mục ảnh trong R2
CREATE TABLE IF NOT EXISTS image_catalog (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  product_id INTEGER,
  created_at INTEGER NOT NULL
);

-- Dữ liệu mặc định
INSERT OR IGNORE INTO bot_settings (key, value, updated_at) VALUES
  ('bot_name', 'Trợ lý bán hàng', unixepoch()),
  ('greeting', 'Xin chào! Tôi là trợ lý tư vấn bán hàng. Tôi có thể giúp bạn tìm hiểu về sản phẩm và dịch vụ của chúng tôi. Bạn cần tư vấn gì ạ?', unixepoch()),
  ('system_prompt', 'Bạn là trợ lý tư vấn bán hàng thông minh, nhiệt tình và chuyên nghiệp. Hãy trả lời bằng tiếng Việt tự nhiên, thân thiện. Tư vấn dựa trên thông tin sản phẩm và kiến thức được cung cấp. Không bịa đặt thông tin. Chỉ đề xuất gửi ảnh khi khách hỏi về sản phẩm lần đầu, hỏi về giá, hoặc khách yêu cầu xem ảnh - không tự động gửi ảnh liên tục.', unixepoch()),
  ('max_history', '20', unixepoch()),
  ('business_name', 'Cửa hàng của chúng tôi', unixepoch()),
  ('business_phone', '', unixepoch()),
  ('business_address', '', unixepoch()),
  ('business_hours', 'Thứ 2 - Thứ 7: 8:00 - 20:00', unixepoch());
