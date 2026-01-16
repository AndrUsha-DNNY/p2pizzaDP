
import { Pizza, Order, User, SiteSpecial } from './types';
import { INITIAL_PIZZAS } from './constants';

export const DEFAULT_LOGO = 'https://i.ibb.co/3ykCjFz/p2p-logo.png';

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Fetch error: ${url}`, err);
    return null;
  }
};

// --- SETTINGS (SYNCED VIA MONGODB) ---
export const fetchSettings = async () => {
  return await safeFetch('/api/settings');
};

export const saveSettingsToDB = async (settings: any) => {
  return await safeFetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
};

// --- TELEGRAM NOTIFICATIONS ---
export const sendTelegramNotification = async (order: Order) => {
  const settings = await fetchSettings();
  const token = settings?.tgToken;
  const chatId = settings?.tgChatId;
  
  if (!token || !chatId) return;

  const items = order.items.map(i => `• ${i.name} (x${i.quantity})`).join('\n');
  const payEmoji = order.paymentMethod === 'cash' ? '💵' : '💳';
  const payText = order.paymentMethod === 'cash' ? 'Готівка' : 'Картою';
  const typeEmoji = order.type === 'delivery' ? '🚚' : '🥡';
  const typeText = order.type === 'delivery' ? 'Доставка' : 'Самовивіз';
  
  const addressLine = order.type === 'delivery' 
    ? `📍 <b>ТИП:</b> ${typeEmoji} ${typeText}\n🏠 <b>АДРЕСА:</b> ${order.address}, буд. ${order.houseNumber}`
    : `📍 <b>ТИП:</b> ${typeEmoji} ${typeText}\n🕒 <b>ЧАС:</b> ${order.pickupTime}`;

  const text = `🔔 <b>НОВЕ ЗАМОВЛЕННЯ ${order.id}</b>\n` +
               `------------------------------\n` +
               `🍕 <b>ТОВАРИ:</b>\n${items}\n\n` +
               `💰 <b>РАЗОМ: ${order.total} грн</b>\n` +
               `💳 <b>ОПЛАТА:</b> ${payEmoji} ${payText}\n` +
               `${addressLine}\n` +
               `📞 <b>ТЕЛ:</b> <code>${order.phone}</code>\n` +
               `📝 <b>КОМЕНТАР:</b> ${order.notes || 'немає'}\n` +
               `------------------------------\n` +
               `⏰ <b>Час: ${order.date}</b>`;

  const reply_markup = {
    inline_keyboard: [
      [{ text: "🔥 Готується", callback_data: `status_prep_${order.id}` }, { text: "✅ Готово", callback_data: `status_ready_${order.id}` }],
      [{ text: "🏁 Виконано", callback_data: `status_comp_${order.id}` }, { text: "❌ Скасувати", callback_data: `status_canc_${order.id}` }]
    ]
  };

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        chat_id: chatId, 
        text, 
        parse_mode: 'HTML', 
        reply_markup 
      })
    });
  } catch (e) { console.error('TG error', e); }
};

// --- MENU & ORDERS ---
export const fetchPizzas = async (): Promise<Pizza[]> => {
  const data = await safeFetch('/api/pizzas');
  return data && data.length > 0 ? data : INITIAL_PIZZAS;
};

export const savePizzasToDB = async (pizzas: Pizza[]) => {
  return await safeFetch('/api/pizzas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pizzas })
  });
};

export const fetchOrders = async (): Promise<Order[]> => {
  const data = await safeFetch('/api/orders');
  return data || [];
};

export const saveOrderToDB = async (order: Order) => {
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  return res.ok;
};

export const updateOrderStatusInDB = async (id: string, status: string) => {
  await safeFetch('/api/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status })
  });
};

// --- AUTH HELPERS ---
export const getStoredUser = () => {
  const data = localStorage.getItem('p2pizza_user');
  return data ? JSON.parse(data) : null;
};
export const saveUser = (user: any) => user ? localStorage.setItem('p2pizza_user', JSON.stringify(user)) : localStorage.removeItem('p2pizza_user');
export const getAdminPassword = () => 'admin123';
export const getRegisteredUsers = () => JSON.parse(localStorage.getItem('p2pizza_reg_users') || '[]');
export const registerNewUser = (user: any) => {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem('p2pizza_reg_users', JSON.stringify(users));
};

// Legacy fallbacks and setters for local state
// Fix: implementing missing local storage helpers required by legacy components like components/AdminPanel.tsx
export const getStoredLogo = () => localStorage.getItem('p2pizza_logo') || DEFAULT_LOGO;
export const saveLogo = (logo: string) => localStorage.setItem('p2pizza_logo', logo);

export const getStoredShopPhone = () => localStorage.getItem('p2pizza_shop_phone') || '+380 00 000 00 00';
export const saveShopPhone = (phone: string) => localStorage.setItem('p2pizza_shop_phone', phone);

export const getTelegramConfig = () => {
  try {
    const data = localStorage.getItem('p2pizza_tg_config');
    return data ? JSON.parse(data) : { token: '', chatId: '' };
  } catch (e) {
    return { token: '', chatId: '' };
  }
};
export const saveTelegramConfig = (token: string, chatId: string) => {
  localStorage.setItem('p2pizza_tg_config', JSON.stringify({ token, chatId }));
};

export const setupWebhook = async () => {
  const settings = await fetchSettings();
  // Fix: Use token from settings or fallback to legacy config if needed
  const token = settings?.tgToken || getTelegramConfig().token;
  if (!token) return;
  const url = `${window.location.origin}/api/webhook?token=${token}`;
  await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${url}`);
};
