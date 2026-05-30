export function renderAdminPanel(): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Admin Panel - Chatbot Bán Hàng</title>
<style>
  :root {
    --primary: #1877f2;
    --primary-dark: #1464d9;
    --danger: #dc3545;
    --success: #28a745;
    --bg: #f0f2f5;
    --card: #ffffff;
    --border: #e0e0e0;
    --text: #1c1e21;
    --muted: #65676b;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: var(--bg); color: var(--text); }

  .sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 240px; background: #fff; border-right: 1px solid var(--border); padding: 0; z-index: 100; }
  .sidebar-brand { padding: 20px; background: var(--primary); color: #fff; }
  .sidebar-brand h1 { font-size: 18px; font-weight: 700; }
  .sidebar-brand p { font-size: 12px; opacity: 0.8; margin-top: 2px; }
  .sidebar nav a { display: flex; align-items: center; gap: 10px; padding: 12px 20px; color: var(--text); text-decoration: none; font-size: 14px; border-left: 3px solid transparent; transition: all 0.2s; }
  .sidebar nav a:hover, .sidebar nav a.active { background: #f0f2f5; border-left-color: var(--primary); color: var(--primary); }
  .sidebar nav a .icon { font-size: 18px; width: 24px; text-align: center; }

  .main { margin-left: 240px; padding: 24px; min-height: 100vh; }
  .page { display: none; }
  .page.active { display: block; }

  .card { background: var(--card); border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .card h2 { font-size: 18px; margin-bottom: 16px; color: var(--text); }

  .btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 8px; border: none; cursor: pointer; font-size: 14px; font-weight: 500; transition: all 0.2s; }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-primary:hover { background: var(--primary-dark); }
  .btn-danger { background: var(--danger); color: #fff; }
  .btn-danger:hover { opacity: 0.9; }
  .btn-secondary { background: #e4e6eb; color: var(--text); }
  .btn-secondary:hover { background: #d8dadf; }
  .btn-success { background: var(--success); color: #fff; }
  .btn-sm { padding: 4px 10px; font-size: 12px; }

  .form-group { margin-bottom: 16px; }
  .form-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 6px; color: var(--muted); }
  .form-group input, .form-group textarea, .form-group select {
    width: 100%; padding: 10px 12px; border: 1px solid var(--border); border-radius: 8px;
    font-size: 14px; font-family: inherit; transition: border-color 0.2s;
  }
  .form-group input:focus, .form-group textarea:focus, .form-group select:focus {
    outline: none; border-color: var(--primary);
  }
  .form-group textarea { resize: vertical; min-height: 80px; }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th { background: var(--bg); padding: 10px 12px; text-align: left; font-weight: 600; color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  td { padding: 12px; border-bottom: 1px solid var(--border); vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: #f8f9fa; }

  .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .badge-success { background: #d4edda; color: #155724; }
  .badge-danger { background: #f8d7da; color: #721c24; }

  .flex { display: flex; }
  .gap-2 { gap: 8px; }
  .justify-between { justify-content: space-between; }
  .items-center { align-items: center; }
  .mb-4 { margin-bottom: 16px; }

  .modal { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 200; align-items: center; justify-content: center; }
  .modal.open { display: flex; }
  .modal-box { background: #fff; border-radius: 12px; padding: 24px; width: 90%; max-width: 600px; max-height: 90vh; overflow-y: auto; }
  .modal-box h3 { font-size: 18px; margin-bottom: 20px; }
  .modal-footer { display: flex; gap: 8px; justify-content: flex-end; margin-top: 20px; }

  .toast { position: fixed; bottom: 24px; right: 24px; background: #333; color: #fff; padding: 12px 20px; border-radius: 8px; font-size: 14px; z-index: 300; transform: translateY(100px); transition: transform 0.3s; }
  .toast.show { transform: translateY(0); }
  .toast.success { background: var(--success); }
  .toast.error { background: var(--danger); }

  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 24px; }
  .stat-card { background: var(--card); border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .stat-card .number { font-size: 32px; font-weight: 700; color: var(--primary); }
  .stat-card .label { font-size: 13px; color: var(--muted); margin-top: 4px; }

  .img-preview { width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: var(--bg); }
  .upload-zone { border: 2px dashed var(--border); border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.2s; }
  .upload-zone:hover { border-color: var(--primary); background: #f0f5ff; }
  .upload-zone.drag-over { border-color: var(--primary); background: #f0f5ff; }

  #login-page { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: var(--bg); }
  .login-card { background: #fff; border-radius: 16px; padding: 40px; width: 100%; max-width: 400px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); text-align: center; }
  .login-card h1 { font-size: 24px; margin-bottom: 8px; color: var(--primary); }
  .login-card p { color: var(--muted); margin-bottom: 24px; font-size: 14px; }

  #app { display: none; }

  @media (max-width: 768px) {
    .sidebar { width: 100%; height: auto; position: relative; }
    .sidebar nav { display: flex; overflow-x: auto; }
    .sidebar nav a { white-space: nowrap; flex-direction: column; gap: 4px; padding: 8px 12px; font-size: 11px; }
    .main { margin-left: 0; padding: 16px; }
  }
</style>
</head>
<body>

<!-- Login Page -->
<div id="login-page">
  <div class="login-card">
    <div style="font-size:48px;margin-bottom:12px">🤖</div>
    <h1>Admin Panel</h1>
    <p>Chatbot Tư Vấn Bán Hàng</p>
    <div class="form-group">
      <input type="password" id="login-password" placeholder="Nhập mật khẩu admin..." style="text-align:center">
    </div>
    <button class="btn btn-primary" style="width:100%;justify-content:center" onclick="doLogin()">Đăng nhập</button>
    <p id="login-error" style="color:var(--danger);font-size:13px;margin-top:12px;display:none">Mật khẩu không đúng!</p>
  </div>
</div>

<!-- Main App -->
<div id="app">
  <div class="sidebar">
    <div class="sidebar-brand">
      <h1>🤖 Chatbot Admin</h1>
      <p id="business-name-display">Đang tải...</p>
    </div>
    <nav>
      <a href="#" class="active" onclick="showPage('dashboard')" data-page="dashboard"><span class="icon">📊</span> Tổng quan</a>
      <a href="#" onclick="showPage('settings')" data-page="settings"><span class="icon">⚙️</span> Cài đặt Bot</a>
      <a href="#" onclick="showPage('products')" data-page="products"><span class="icon">📦</span> Sản phẩm</a>
      <a href="#" onclick="showPage('knowledge')" data-page="knowledge"><span class="icon">📚</span> Kiến thức</a>
      <a href="#" onclick="showPage('instructions')" data-page="instructions"><span class="icon">📋</span> Chỉ dẫn</a>
      <a href="#" onclick="showPage('images')" data-page="images"><span class="icon">🖼️</span> Hình ảnh</a>
      <a href="#" onclick="showPage('conversations')" data-page="conversations"><span class="icon">💬</span> Hội thoại</a>
      <a href="#" onclick="showPage('setup')" data-page="setup"><span class="icon">🔧</span> Cấu hình</a>
    </nav>
  </div>

  <div class="main">
    <!-- Dashboard -->
    <div id="page-dashboard" class="page active">
      <h2 style="margin-bottom:20px">📊 Tổng quan</h2>
      <div class="stats-grid" id="stats-grid">
        <div class="stat-card"><div class="number" id="stat-products">-</div><div class="label">Sản phẩm</div></div>
        <div class="stat-card"><div class="number" id="stat-knowledge">-</div><div class="label">Kiến thức</div></div>
        <div class="stat-card"><div class="number" id="stat-conversations">-</div><div class="label">Khách hàng</div></div>
        <div class="stat-card"><div class="number" id="stat-images">-</div><div class="label">Hình ảnh</div></div>
      </div>
      <div class="card">
        <h2>🚀 Hướng dẫn nhanh</h2>
        <div style="font-size:14px;line-height:1.8;color:var(--muted)">
          <p>1. <strong>Cài đặt Bot</strong>: Cấu hình tên, lời chào, hướng dẫn hệ thống</p>
          <p>2. <strong>Sản phẩm</strong>: Thêm danh sách sản phẩm với giá và mô tả</p>
          <p>3. <strong>Kiến thức</strong>: Thêm FAQ, chính sách, thông tin cửa hàng</p>
          <p>4. <strong>Chỉ dẫn</strong>: Hướng dẫn đặc biệt cho chatbot (khuyến mãi, ưu tiên...)</p>
          <p>5. <strong>Hình ảnh</strong>: Upload ảnh sản phẩm/bảng giá để chatbot gửi cho khách</p>
          <p>6. <strong>Cấu hình</strong>: Kết nối Facebook Messenger và đặt Worker URL</p>
        </div>
      </div>
    </div>

    <!-- Settings -->
    <div id="page-settings" class="page">
      <h2 style="margin-bottom:20px">⚙️ Cài đặt Bot</h2>
      <div class="card">
        <div id="settings-form"></div>
        <button class="btn btn-primary" onclick="saveSettings()">💾 Lưu cài đặt</button>
      </div>
    </div>

    <!-- Products -->
    <div id="page-products" class="page">
      <div class="flex justify-between items-center mb-4">
        <h2>📦 Sản phẩm</h2>
        <button class="btn btn-primary" onclick="openProductModal()">+ Thêm sản phẩm</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table id="products-table">
            <thead><tr><th>Tên</th><th>Danh mục</th><th>Giá</th><th>Ảnh</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody id="products-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Knowledge -->
    <div id="page-knowledge" class="page">
      <div class="flex justify-between items-center mb-4">
        <h2>📚 Kiến thức & Chính sách</h2>
        <button class="btn btn-primary" onclick="openKnowledgeModal()">+ Thêm kiến thức</button>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Tiêu đề</th><th>Danh mục</th><th>Nội dung</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody id="knowledge-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Instructions -->
    <div id="page-instructions" class="page">
      <div class="flex justify-between items-center mb-4">
        <h2>📋 Chỉ dẫn đặc biệt</h2>
        <button class="btn btn-primary" onclick="openInstructionModal()">+ Thêm chỉ dẫn</button>
      </div>
      <div class="card" style="margin-bottom:12px">
        <p style="font-size:13px;color:var(--muted)">💡 Chỉ dẫn là hướng dẫn bổ sung cho chatbot: khuyến mãi hiện tại, ưu tiên sản phẩm, cách xử lý tình huống đặc biệt... Độ ưu tiên cao hơn sẽ được đặt trước.</p>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Chỉ dẫn</th><th>Ưu tiên</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
            <tbody id="instructions-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Images -->
    <div id="page-images" class="page">
      <div class="flex justify-between items-center mb-4">
        <h2>🖼️ Hình ảnh</h2>
      </div>
      <div class="card">
        <div class="upload-zone" id="upload-zone" onclick="document.getElementById('file-input').click()">
          <div style="font-size:40px;margin-bottom:8px">📸</div>
          <p style="font-weight:600">Click hoặc kéo thả ảnh vào đây</p>
          <p style="font-size:13px;color:var(--muted);margin-top:4px">Hỗ trợ JPG, PNG, WEBP (tối đa 10MB)</p>
          <input type="file" id="file-input" accept="image/*" style="display:none" multiple onchange="handleFileUpload(this.files)">
        </div>
      </div>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>Ảnh</th><th>Key (tên file)</th><th>Tên</th><th>Mô tả</th><th>Tags</th><th>Thao tác</th></tr></thead>
            <tbody id="images-tbody"></tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Conversations -->
    <div id="page-conversations" class="page">
      <h2 style="margin-bottom:20px">💬 Hội thoại</h2>
      <div class="card">
        <div class="table-wrap">
          <table>
            <thead><tr><th>ID Khách</th><th>Tên</th><th>Tin nhắn gần nhất</th><th>Thời gian</th><th>Thao tác</th></tr></thead>
            <tbody id="conversations-tbody"></tbody>
          </table>
        </div>
      </div>
      <div id="conversation-detail" style="display:none" class="card">
        <div class="flex justify-between items-center mb-4">
          <h3 id="conv-title">Hội thoại</h3>
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('conversation-detail').style.display='none'">✕ Đóng</button>
        </div>
        <div id="conv-messages" style="max-height:500px;overflow-y:auto;display:flex;flex-direction:column;gap:8px"></div>
      </div>
    </div>

    <!-- Setup -->
    <div id="page-setup" class="page">
      <h2 style="margin-bottom:20px">🔧 Cấu hình hệ thống</h2>
      <div class="card">
        <h3 style="margin-bottom:16px">Worker URL</h3>
        <p style="font-size:13px;color:var(--muted);margin-bottom:12px">URL của Worker để phục vụ ảnh cho Facebook. Ví dụ: https://quanghoa-chatbot.youraccount.workers.dev</p>
        <div class="form-group">
          <label>Worker URL</label>
          <input type="url" id="worker-url-input" placeholder="https://...workers.dev">
        </div>
        <button class="btn btn-primary" onclick="saveWorkerUrl()">💾 Lưu Worker URL</button>
      </div>
      <div class="card">
        <h3 style="margin-bottom:16px">📱 Kết nối Facebook Messenger</h3>
        <div style="font-size:14px;line-height:2;background:var(--bg);padding:16px;border-radius:8px">
          <p><strong>1. Tạo Facebook App</strong> tại developers.facebook.com</p>
          <p><strong>2. Thêm sản phẩm Messenger</strong> và kết nối với Fanpage của bạn</p>
          <p><strong>3. Cấu hình Webhook:</strong></p>
          <p style="margin-left:16px">• Callback URL: <code id="webhook-url" style="background:#fff;padding:2px 6px;border-radius:4px"></code></p>
          <p style="margin-left:16px">• Verify Token: Giá trị <code>FB_VERIFY_TOKEN</code> trong wrangler.toml</p>
          <p style="margin-left:16px">• Subscribe: <code>messages, messaging_postbacks</code></p>
          <p><strong>4. Lấy Page Access Token</strong> và chạy:</p>
          <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;font-size:12px;margin-top:4px">wrangler secret put FB_PAGE_ACCESS_TOKEN
wrangler secret put ADMIN_PASSWORD
wrangler secret put ADMIN_SECRET_KEY</pre>
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:16px">🗄️ Khởi tạo Database</h3>
        <p style="font-size:13px;color:var(--muted);margin-bottom:12px">Chạy lệnh sau để khởi tạo database lần đầu:</p>
        <pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:8px;font-size:12px">npm run db:init:remote</pre>
      </div>
    </div>
  </div>
</div>

<!-- Modals -->
<div id="modal-product" class="modal">
  <div class="modal-box">
    <h3 id="product-modal-title">Thêm sản phẩm</h3>
    <input type="hidden" id="product-id">
    <div class="form-group"><label>Tên sản phẩm *</label><input type="text" id="product-name" placeholder="Ví dụ: Áo thun nam basic"></div>
    <div class="form-group"><label>Danh mục</label><input type="text" id="product-category" placeholder="Ví dụ: Áo, Quần, Phụ kiện..."></div>
    <div class="form-group"><label>Giá *</label><input type="text" id="product-price" placeholder="Ví dụ: 199.000đ hoặc 150.000đ - 299.000đ"></div>
    <div class="form-group"><label>Mô tả *</label><textarea id="product-description" placeholder="Mô tả chi tiết sản phẩm..."></textarea></div>
    <div class="form-group"><label>Key ảnh (từ danh mục ảnh)</label><input type="text" id="product-image-key" placeholder="Ví dụ: ao-thun-nam.jpg"></div>
    <div class="form-group"><label>Thông số (JSON)</label><textarea id="product-specs" placeholder='{"Chất liệu":"Cotton","Màu sắc":"Đen, Trắng"}'></textarea></div>
    <div class="form-group">
      <label>Trạng thái</label>
      <select id="product-active">
        <option value="1">Đang bán</option>
        <option value="0">Ngừng bán</option>
      </select>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modal-product')">Hủy</button>
      <button class="btn btn-primary" onclick="saveProduct()">💾 Lưu</button>
    </div>
  </div>
</div>

<div id="modal-knowledge" class="modal">
  <div class="modal-box">
    <h3 id="knowledge-modal-title">Thêm kiến thức</h3>
    <input type="hidden" id="knowledge-id">
    <div class="form-group"><label>Tiêu đề *</label><input type="text" id="knowledge-title" placeholder="Ví dụ: Chính sách đổi trả"></div>
    <div class="form-group"><label>Danh mục</label><input type="text" id="knowledge-category" placeholder="general, policy, shipping, payment..."></div>
    <div class="form-group"><label>Nội dung *</label><textarea id="knowledge-content" style="min-height:150px" placeholder="Nhập nội dung kiến thức..."></textarea></div>
    <div class="form-group">
      <label>Trạng thái</label>
      <select id="knowledge-active">
        <option value="1">Hoạt động</option>
        <option value="0">Tắt</option>
      </select>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modal-knowledge')">Hủy</button>
      <button class="btn btn-primary" onclick="saveKnowledge()">💾 Lưu</button>
    </div>
  </div>
</div>

<div id="modal-instruction" class="modal">
  <div class="modal-box">
    <h3 id="instruction-modal-title">Thêm chỉ dẫn</h3>
    <input type="hidden" id="instruction-id">
    <div class="form-group"><label>Nội dung chỉ dẫn *</label><textarea id="instruction-text" style="min-height:120px" placeholder="Ví dụ: Hiện đang có chương trình giảm 20% cho tất cả sản phẩm đến hết ngày 30/12..."></textarea></div>
    <div class="form-group"><label>Độ ưu tiên (0-10, cao hơn = quan trọng hơn)</label><input type="number" id="instruction-priority" value="0" min="0" max="10"></div>
    <div class="form-group">
      <label>Trạng thái</label>
      <select id="instruction-active">
        <option value="1">Đang áp dụng</option>
        <option value="0">Tắt</option>
      </select>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary" onclick="closeModal('modal-instruction')">Hủy</button>
      <button class="btn btn-primary" onclick="saveInstruction()">💾 Lưu</button>
    </div>
  </div>
</div>

<div id="toast" class="toast"></div>

<script>
let TOKEN = '';

// ─── Auth ────────────────────────────────────────────────────────────────

async function doLogin() {
  const pw = document.getElementById('login-password').value;
  try {
    const res = await fetch('/admin/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw })
    });
    const data = await res.json();
    if (data.token) {
      TOKEN = data.token;
      document.getElementById('login-page').style.display = 'none';
      document.getElementById('app').style.display = 'block';
      init();
    } else {
      document.getElementById('login-error').style.display = 'block';
    }
  } catch {
    showToast('Lỗi kết nối!', 'error');
  }
}

document.getElementById('login-password').addEventListener('keydown', e => {
  if (e.key === 'Enter') doLogin();
});

// ─── API ─────────────────────────────────────────────────────────────────

async function api(path, options = {}) {
  const res = await fetch('/admin/api' + path, {
    ...options,
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json', ...(options.headers || {}) }
  });
  if (res.status === 401) { TOKEN = ''; location.reload(); }
  return res.json();
}

// ─── Navigation ───────────────────────────────────────────────────────────

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sidebar nav a').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.querySelector('[data-page="' + name + '"]').classList.add('active');
  loadPage(name);
}

// ─── Init ─────────────────────────────────────────────────────────────────

async function init() {
  loadDashboard();
  loadSettings();
  const workerUrl = window.location.origin;
  document.getElementById('webhook-url').textContent = workerUrl + '/webhook';
  const wuInput = document.getElementById('worker-url-input');
  if (wuInput) wuInput.value = workerUrl;
}

async function loadPage(name) {
  if (name === 'products') loadProducts();
  else if (name === 'knowledge') loadKnowledge();
  else if (name === 'instructions') loadInstructions();
  else if (name === 'images') loadImages();
  else if (name === 'conversations') loadConversations();
  else if (name === 'settings') loadSettings();
  else if (name === 'dashboard') loadDashboard();
}

// ─── Dashboard ────────────────────────────────────────────────────────────

async function loadDashboard() {
  const data = await api('/stats');
  if (data.error) return;
  document.getElementById('stat-products').textContent = data.products || 0;
  document.getElementById('stat-knowledge').textContent = data.knowledge || 0;
  document.getElementById('stat-conversations').textContent = data.conversations || 0;
  document.getElementById('stat-images').textContent = data.images || 0;
  if (data.business_name) document.getElementById('business-name-display').textContent = data.business_name;
}

// ─── Settings ────────────────────────────────────────────────────────────

const SETTINGS_FIELDS = [
  { key: 'business_name', label: 'Tên doanh nghiệp', type: 'text' },
  { key: 'business_phone', label: 'Số điện thoại', type: 'text' },
  { key: 'business_address', label: 'Địa chỉ', type: 'text' },
  { key: 'business_hours', label: 'Giờ làm việc', type: 'text' },
  { key: 'bot_name', label: 'Tên chatbot', type: 'text' },
  { key: 'greeting', label: 'Tin nhắn chào hỏi', type: 'textarea' },
  { key: 'system_prompt', label: 'Hướng dẫn hệ thống (System Prompt)', type: 'textarea', rows: 6 },
  { key: 'max_history', label: 'Số tin nhắn lịch sử tối đa', type: 'number' },
];

let settingsData = {};

async function loadSettings() {
  const data = await api('/settings');
  settingsData = data;
  const form = document.getElementById('settings-form');
  if (!form) return;
  form.innerHTML = SETTINGS_FIELDS.map(f => \`
    <div class="form-group">
      <label>\${f.label}</label>
      \${f.type === 'textarea'
        ? \`<textarea id="setting-\${f.key}" rows="\${f.rows || 3}">\${data[f.key] || ''}</textarea>\`
        : \`<input type="\${f.type || 'text'}" id="setting-\${f.key}" value="\${escHtml(data[f.key] || '')}">\`
      }
    </div>
  \`).join('');
  if (data.business_name) document.getElementById('business-name-display').textContent = data.business_name;
}

async function saveSettings() {
  const updates = {};
  for (const f of SETTINGS_FIELDS) {
    const el = document.getElementById('setting-' + f.key);
    if (el) updates[f.key] = el.value;
  }
  const res = await api('/settings', { method: 'PUT', body: JSON.stringify(updates) });
  if (res.ok) showToast('Đã lưu cài đặt!', 'success');
  else showToast('Lỗi lưu cài đặt!', 'error');
}

// ─── Products ─────────────────────────────────────────────────────────────

let products = [];
async function loadProducts() {
  products = await api('/products');
  const tbody = document.getElementById('products-tbody');
  tbody.innerHTML = products.map(p => \`
    <tr>
      <td><strong>\${escHtml(p.name)}</strong></td>
      <td>\${escHtml(p.category || '-')}</td>
      <td>\${escHtml(p.price)}</td>
      <td>\${p.image_key ? \`<code style="font-size:11px">\${escHtml(p.image_key)}</code>\` : '-'}</td>
      <td><span class="badge badge-\${p.active ? 'success' : 'danger'}">\${p.active ? 'Đang bán' : 'Ngừng bán'}</span></td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="editProduct(\${p.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct(\${p.id})">🗑️</button>
        </div>
      </td>
    </tr>
  \`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Chưa có sản phẩm nào</td></tr>';
}

function openProductModal(id) {
  document.getElementById('product-id').value = '';
  document.getElementById('product-name').value = '';
  document.getElementById('product-category').value = '';
  document.getElementById('product-price').value = '';
  document.getElementById('product-description').value = '';
  document.getElementById('product-image-key').value = '';
  document.getElementById('product-specs').value = '';
  document.getElementById('product-active').value = '1';
  document.getElementById('product-modal-title').textContent = 'Thêm sản phẩm';
  document.getElementById('modal-product').classList.add('open');
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  document.getElementById('product-id').value = p.id;
  document.getElementById('product-name').value = p.name;
  document.getElementById('product-category').value = p.category || '';
  document.getElementById('product-price').value = p.price;
  document.getElementById('product-description').value = p.description;
  document.getElementById('product-image-key').value = p.image_key || '';
  document.getElementById('product-specs').value = p.specifications || '{}';
  document.getElementById('product-active').value = String(p.active);
  document.getElementById('product-modal-title').textContent = 'Sửa sản phẩm';
  document.getElementById('modal-product').classList.add('open');
}

async function saveProduct() {
  const id = document.getElementById('product-id').value;
  const data = {
    name: document.getElementById('product-name').value,
    category: document.getElementById('product-category').value,
    price: document.getElementById('product-price').value,
    description: document.getElementById('product-description').value,
    image_key: document.getElementById('product-image-key').value,
    specifications: document.getElementById('product-specs').value || '{}',
    active: parseInt(document.getElementById('product-active').value),
  };
  if (!data.name || !data.price || !data.description) { showToast('Vui lòng điền đủ thông tin!', 'error'); return; }
  const res = id
    ? await api('/products/' + id, { method: 'PUT', body: JSON.stringify(data) })
    : await api('/products', { method: 'POST', body: JSON.stringify(data) });
  if (res.ok) { closeModal('modal-product'); loadProducts(); showToast('Đã lưu sản phẩm!', 'success'); }
  else showToast('Lỗi: ' + (res.error || 'Unknown'), 'error');
}

async function deleteProduct(id) {
  if (!confirm('Xóa sản phẩm này?')) return;
  const res = await api('/products/' + id, { method: 'DELETE' });
  if (res.ok) { loadProducts(); showToast('Đã xóa!', 'success'); }
}

// ─── Knowledge ────────────────────────────────────────────────────────────

let knowledgeList = [];
async function loadKnowledge() {
  knowledgeList = await api('/knowledge');
  const tbody = document.getElementById('knowledge-tbody');
  tbody.innerHTML = knowledgeList.map(k => \`
    <tr>
      <td><strong>\${escHtml(k.title)}</strong></td>
      <td>\${escHtml(k.category || 'general')}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\${escHtml(k.content.slice(0, 80))}...</td>
      <td><span class="badge badge-\${k.active ? 'success' : 'danger'}">\${k.active ? 'Hoạt động' : 'Tắt'}</span></td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="editKnowledge(\${k.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteKnowledge(\${k.id})">🗑️</button>
        </div>
      </td>
    </tr>
  \`).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Chưa có kiến thức nào</td></tr>';
}

function openKnowledgeModal() {
  document.getElementById('knowledge-id').value = '';
  document.getElementById('knowledge-title').value = '';
  document.getElementById('knowledge-category').value = 'general';
  document.getElementById('knowledge-content').value = '';
  document.getElementById('knowledge-active').value = '1';
  document.getElementById('knowledge-modal-title').textContent = 'Thêm kiến thức';
  document.getElementById('modal-knowledge').classList.add('open');
}

function editKnowledge(id) {
  const k = knowledgeList.find(x => x.id === id);
  if (!k) return;
  document.getElementById('knowledge-id').value = k.id;
  document.getElementById('knowledge-title').value = k.title;
  document.getElementById('knowledge-category').value = k.category || 'general';
  document.getElementById('knowledge-content').value = k.content;
  document.getElementById('knowledge-active').value = String(k.active);
  document.getElementById('knowledge-modal-title').textContent = 'Sửa kiến thức';
  document.getElementById('modal-knowledge').classList.add('open');
}

async function saveKnowledge() {
  const id = document.getElementById('knowledge-id').value;
  const data = {
    title: document.getElementById('knowledge-title').value,
    category: document.getElementById('knowledge-category').value || 'general',
    content: document.getElementById('knowledge-content').value,
    active: parseInt(document.getElementById('knowledge-active').value),
  };
  if (!data.title || !data.content) { showToast('Vui lòng điền đủ thông tin!', 'error'); return; }
  const res = id
    ? await api('/knowledge/' + id, { method: 'PUT', body: JSON.stringify(data) })
    : await api('/knowledge', { method: 'POST', body: JSON.stringify(data) });
  if (res.ok) { closeModal('modal-knowledge'); loadKnowledge(); showToast('Đã lưu!', 'success'); }
  else showToast('Lỗi: ' + (res.error || 'Unknown'), 'error');
}

async function deleteKnowledge(id) {
  if (!confirm('Xóa kiến thức này?')) return;
  const res = await api('/knowledge/' + id, { method: 'DELETE' });
  if (res.ok) { loadKnowledge(); showToast('Đã xóa!', 'success'); }
}

// ─── Instructions ─────────────────────────────────────────────────────────

let instructions = [];
async function loadInstructions() {
  instructions = await api('/instructions');
  const tbody = document.getElementById('instructions-tbody');
  tbody.innerHTML = instructions.map(i => \`
    <tr>
      <td>\${escHtml(i.instruction)}</td>
      <td>\${i.priority}</td>
      <td><span class="badge badge-\${i.active ? 'success' : 'danger'}">\${i.active ? 'Đang áp dụng' : 'Tắt'}</span></td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm" onclick="editInstruction(\${i.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="deleteInstruction(\${i.id})">🗑️</button>
        </div>
      </td>
    </tr>
  \`).join('') || '<tr><td colspan="4" style="text-align:center;color:var(--muted)">Chưa có chỉ dẫn nào</td></tr>';
}

function openInstructionModal() {
  document.getElementById('instruction-id').value = '';
  document.getElementById('instruction-text').value = '';
  document.getElementById('instruction-priority').value = '0';
  document.getElementById('instruction-active').value = '1';
  document.getElementById('instruction-modal-title').textContent = 'Thêm chỉ dẫn';
  document.getElementById('modal-instruction').classList.add('open');
}

function editInstruction(id) {
  const inst = instructions.find(x => x.id === id);
  if (!inst) return;
  document.getElementById('instruction-id').value = inst.id;
  document.getElementById('instruction-text').value = inst.instruction;
  document.getElementById('instruction-priority').value = inst.priority;
  document.getElementById('instruction-active').value = String(inst.active);
  document.getElementById('instruction-modal-title').textContent = 'Sửa chỉ dẫn';
  document.getElementById('modal-instruction').classList.add('open');
}

async function saveInstruction() {
  const id = document.getElementById('instruction-id').value;
  const data = {
    instruction: document.getElementById('instruction-text').value,
    priority: parseInt(document.getElementById('instruction-priority').value) || 0,
    active: parseInt(document.getElementById('instruction-active').value),
  };
  if (!data.instruction) { showToast('Vui lòng nhập nội dung chỉ dẫn!', 'error'); return; }
  const res = id
    ? await api('/instructions/' + id, { method: 'PUT', body: JSON.stringify(data) })
    : await api('/instructions', { method: 'POST', body: JSON.stringify(data) });
  if (res.ok) { closeModal('modal-instruction'); loadInstructions(); showToast('Đã lưu!', 'success'); }
  else showToast('Lỗi: ' + (res.error || 'Unknown'), 'error');
}

async function deleteInstruction(id) {
  if (!confirm('Xóa chỉ dẫn này?')) return;
  const res = await api('/instructions/' + id, { method: 'DELETE' });
  if (res.ok) { loadInstructions(); showToast('Đã xóa!', 'success'); }
}

// ─── Images ───────────────────────────────────────────────────────────────

async function loadImages() {
  const data = await api('/images');
  const tbody = document.getElementById('images-tbody');
  tbody.innerHTML = (data.images || []).map(img => \`
    <tr>
      <td><img src="/images/\${encodeURIComponent(img.key)}" class="img-preview" onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" viewBox=\\"0 0 100 100\\"><text y=\\".9em\\" font-size=\\"90\\">🖼️</text></svg>'"></td>
      <td><code style="font-size:11px">\${escHtml(img.key)}</code><br><button class="btn btn-secondary btn-sm" style="margin-top:4px" onclick="copyKey('\${img.key}')">📋 Copy key</button></td>
      <td>\${escHtml(img.name || '')}</td>
      <td style="max-width:200px">\${escHtml(img.description || '')}</td>
      <td>\${(img.tags || []).map(t => \`<span class="badge badge-success" style="margin:2px">\${escHtml(t)}</span>\`).join('')}</td>
      <td>
        <div class="flex gap-2">
          <button class="btn btn-danger btn-sm" onclick="deleteImage('\${img.key}')">🗑️</button>
        </div>
      </td>
    </tr>
  \`).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Chưa có ảnh nào</td></tr>';
}

async function handleFileUpload(files) {
  for (const file of files) {
    const name = prompt(\`Tên mô tả cho ảnh "\${file.name}" (để chatbot nhận biết):\`, file.name.replace(/\\.[^.]+$/, ''));
    if (!name) continue;
    const desc = prompt('Mô tả chi tiết ảnh này:', '');
    const tags = prompt('Tags (phân cách bằng dấu phẩy):', '') || '';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', desc || '');
    formData.append('tags', tags);

    try {
      const res = await fetch('/admin/api/images', {
        method: 'POST',
        headers: { 'Authorization': 'Bearer ' + TOKEN },
        body: formData
      });
      const data = await res.json();
      if (data.ok) showToast('Upload thành công: ' + data.key, 'success');
      else showToast('Lỗi upload: ' + (data.error || ''), 'error');
    } catch (e) {
      showToast('Lỗi upload!', 'error');
    }
  }
  loadImages();
}

async function deleteImage(key) {
  if (!confirm('Xóa ảnh này?')) return;
  const res = await api('/images/' + encodeURIComponent(key), { method: 'DELETE' });
  if (res.ok) { loadImages(); showToast('Đã xóa!', 'success'); }
}

function copyKey(key) {
  navigator.clipboard.writeText(key).then(() => showToast('Đã copy key!', 'success'));
}

// ─── Conversations ────────────────────────────────────────────────────────

let convList = [];
async function loadConversations() {
  convList = await api('/conversations');
  const tbody = document.getElementById('conversations-tbody');
  tbody.innerHTML = convList.map(c => {
    const lastMsg = c.messages?.[c.messages.length - 1];
    return \`<tr>
      <td><code style="font-size:11px">\${escHtml(c.psid)}</code></td>
      <td>\${escHtml(c.customer_name || '-')}</td>
      <td style="max-width:300px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">\${escHtml(lastMsg?.content?.slice(0, 60) || '-')}</td>
      <td>\${new Date(c.updated_at * 1000).toLocaleString('vi-VN')}</td>
      <td><button class="btn btn-secondary btn-sm" onclick="viewConversation('\${c.psid}')">👁️ Xem</button></td>
    </tr>\`;
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Chưa có hội thoại nào</td></tr>';
}

function viewConversation(psid) {
  const conv = convList.find(c => c.psid === psid);
  if (!conv) return;
  document.getElementById('conv-title').textContent = \`Hội thoại: \${conv.customer_name || psid}\`;
  const msgs = document.getElementById('conv-messages');
  msgs.innerHTML = conv.messages.map(m => \`
    <div style="max-width:80%;padding:10px 14px;border-radius:16px;font-size:14px;line-height:1.5;
      \${m.role === 'user' ? 'align-self:flex-start;background:#e4e6eb;' : 'align-self:flex-end;background:var(--primary);color:#fff;'}">
      <div style="font-size:11px;opacity:0.7;margin-bottom:4px">\${m.role === 'user' ? '👤 Khách' : '🤖 Bot'}</div>
      \${escHtml(m.content)}
    </div>
  \`).join('');
  document.getElementById('conversation-detail').style.display = 'block';
  msgs.scrollTop = msgs.scrollHeight;
}

// ─── Setup ────────────────────────────────────────────────────────────────

async function saveWorkerUrl() {
  const url = document.getElementById('worker-url-input').value.trim().replace(/\\/$/, '');
  const res = await api('/worker-url', { method: 'PUT', body: JSON.stringify({ url }) });
  if (res.ok) showToast('Đã lưu Worker URL!', 'success');
  else showToast('Lỗi!', 'error');
}

// ─── Helpers ──────────────────────────────────────────────────────────────

function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function escHtml(s) { return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function showToast(msg, type = '') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.classList.remove('show'), 3000);
}

// Drag and drop
const zone = document.getElementById('upload-zone');
if (zone) {
  zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.classList.remove('drag-over');
    handleFileUpload(e.dataTransfer.files);
  });
}
</script>
</body>
</html>`;
}
