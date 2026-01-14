
import { Pizza, Order, User, SiteSpecial } from './types';
import { INITIAL_PIZZAS } from './constants';

const STORAGE_KEYS = {
  USER: 'p2pizza_user',
  SITE_LOGO: 'p2pizza_site_logo',
  SITE_SPECIAL: 'p2pizza_site_special',
  SHOP_PHONE: 'p2pizza_shop_phone',
  TG_TOKEN: 'p2pizza_tg_token',
  TG_CHAT_ID: 'p2pizza_tg_chat_id',
};

export const DEFAULT_LOGO = 'https://i.ibb.co/3ykCjFz/p2p-logo.png';

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error(`Fetch error for ${url}:`, err);
    return null;
  }
};

export const getTelegramConfig = () => ({
  token: localStorage.getItem(STORAGE_KEYS.TG_TOKEN) || '',
  chatId: localStorage.getItem(STORAGE_KEYS.TG_CHAT_ID) || '',
});

export const saveTelegramConfig = (token: string, chatId: string) => {
  localStorage.setItem(STORAGE_KEYS.TG_TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.TG_CHAT_ID, chatId);
};

export const setupWebhook = async () => {
  const { token } = getTelegramConfig();
  if (!token) return alert('Спочатку введіть Token!');
  const webhookUrl = `${window.location.origin}/api/webhook?token=${token}`;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${webhookUrl}`);
    const data = await res.json();
    alert(data.ok ? 'Webhook активний!' : 'Помилка API');
  } catch (e) { alert('Помилка з’єднання'); }
};

export const sendTelegramNotification = async (order: Order) => {
  const { token, chatId } = getTelegramConfig();
  if (!token || !chatId) return;

  const items = order.items.map(i => `• ${i.name} (x${i.quantity})`).join('\n');
  const payEmoji = order.paymentMethod === 'cash' ? '💵' : '💳';
  const payText = order.paymentMethod === 'cash' ? 'Готівка' : 'Картою при отриманні';
  const typeEmoji = order.type === 'delivery' ? '🚚' : '🥡';
  const typeText = order.type === 'delivery' ? 'Доставка' : 'Самовивіз';
  
  const addressLine = order.type === 'delivery' 
    ? `📍 <b>ТИП:</b> ${typeEmoji} ${typeText}\n🏠 <b>АДРЕСА:</b> ${order.address}, буд. ${order.houseNumber}`
    : `📍 <b>ТИП:</b> ${typeEmoji} ${typeText}\n🕒 <b>ЧАС:</b> ${order.pickupTime}`;

  const text = `🔔 <b>НОВЕ ЗАМОВЛЕННЯ ${order.id}</b>\n` +
               `------------------------------\n` +
               `🍕 <b>ТОВАРИ:</b>\n${items}\n\n` +
               `💰 <b>РАЗОМ: ${order.total} грн</b>\n` +
               `${payEmoji} <b>ОПЛАТА:</b> ${payEmoji} ${payText}\n` +
               `${addressLine}\n` +
               `📞 <b>ТЕЛ:</b> <code>${order.phone}</code>\n` +
               `📝 <b>КОМЕНТАР:</b> ${order.notes || 'немає'}\n` +
               `------------------------------\n` +
               `⏰ <b>Час: ${order.date}</b>`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch (e) { console.error('TG notify error', e); }
};

export const fetchPizzas = async (): Promise<Pizza[]> => {
  const data = await safeFetch('/api/pizzas');
  return data && data.length > 0 ? data : INITIAL_PIZZAS;
};

export const savePizzasToDB = async (pizzas: Pizza[]) => {
  const result = await safeFetch('/api/pizzas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pizzas })
  });
  return !!result;
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

export const getStoredLogo = () => localStorage.getItem(STORAGE_KEYS.SITE_LOGO) || DEFAULT_LOGO;
export const saveLogo = (logo: string) => localStorage.setItem(STORAGE_KEYS.SITE_LOGO, logo);
export const getStoredShopPhone = () => localStorage.getItem(STORAGE_KEYS.SHOP_PHONE) || '+380 00 000 00 00';
export const saveShopPhone = (phone: string) => localStorage.setItem(STORAGE_KEYS.SHOP_PHONE, phone);
export const getStoredSpecial = (): SiteSpecial => {
  const data = localStorage.getItem(STORAGE_KEYS.SITE_SPECIAL);
  return data ? JSON.parse(data) : {
    title: 'СВІЖА. ГАРЯЧА. ТВОЯ.',
    description: 'Замовляй найкращу піцу в місті!',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=2000',
    badge: 'P2PIZZA SPECIAL'
  };
};
export const saveSpecial = (special: SiteSpecial) => localStorage.setItem(STORAGE_KEYS.SITE_SPECIAL, JSON.stringify(special));
export const getStoredUser = () => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};
export const saveUser = (user: any) => user ? localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user)) : localStorage.removeItem(STORAGE_KEYS.USER);
export const getAdminPassword = () => 'admin123';
export const getRegisteredUsers = () => JSON.parse(localStorage.getItem('p2pizza_reg_users') || '[]');
export const registerNewUser = (user: any) => {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem('p2pizza_reg_users', JSON.stringify(users));
};
