
import { Pizza, Order, User, SiteSpecial } from './types';
import { INITIAL_PIZZAS } from './constants';

const STORAGE_KEYS = {
  PIZZAS: 'p2pizza_pizzas',
  USER: 'p2pizza_user',
  ORDERS: 'p2pizza_orders',
  ADMIN_PASSWORD: 'p2pizza_admin_password',
  SITE_LOGO: 'p2pizza_site_logo',
  SITE_SPECIAL: 'p2pizza_site_special',
  SHOP_PHONE: 'p2pizza_shop_phone',
  TG_TOKEN: 'p2pizza_tg_token',
  TG_CHAT_ID: 'p2pizza_tg_chat_id',
  SUPABASE_URL: 'p2pizza_sb_url',
  SUPABASE_KEY: 'p2pizza_sb_key',
};

export const DEFAULT_LOGO = 'https://i.ibb.co/3ykCjFz/p2p-logo.png';

export const getSupabaseConfig = () => ({
  url: localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '',
  key: localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || '',
});

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url);
  localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key);
};

export const getSupabaseHeaders = () => {
  const { key } = getSupabaseConfig();
  return {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
};

export const getTelegramConfig = () => ({
  token: localStorage.getItem(STORAGE_KEYS.TG_TOKEN) || '',
  chatId: localStorage.getItem(STORAGE_KEYS.TG_CHAT_ID) || '',
});

export const saveTelegramConfig = (token: string, chatId: string) => {
  localStorage.setItem(STORAGE_KEYS.TG_TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.TG_CHAT_ID, chatId);
};

export const sendTelegramNotification = async (order: Order) => {
  const { token, chatId } = getTelegramConfig();
  if (!token || !chatId) return;

  const items = order.items.map(i => `• ${i.name} (x${i.quantity})`).join('\n');
  const typeLabel = order.type === 'delivery' ? '🚚 Доставка' : '🏢 Самовивіз';
  const paymentLabel = order.paymentMethod === 'cash' ? '💵 Готівка' : '💳 Карта при отриманні';
  
  // Виправлено: беремо телефон прямо з об'єкта замовлення
  const text = `
🔔 <b>НОВЕ ЗАМОВЛЕННЯ ${order.id}</b>
---------------------------
🍕 <b>ТОВАРИ:</b>
${items}

💰 <b>РАЗОМ: ${order.total} грн</b>
💳 <b>ОПЛАТА:</b> ${paymentLabel}
📍 <b>ТИП:</b> ${typeLabel} ${order.pickupTime ? `на ${order.pickupTime}` : ''}
📞 <b>ТЕЛ:</b> <code>${order.phone || 'Не вказано'}</code>
${order.address ? `🏠 <b>АДРЕСА:</b> ${order.address}, буд. ${order.houseNumber}` : ''}

📝 <b>КОМЕНТАР:</b> ${order.notes || 'відсутній'}
---------------------------
⏰ <b>Час:</b> ${new Date().toLocaleString('uk-UA')}
  `;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch (e) {
    console.error('Telegram error:', e);
  }
};

export const getStoredPizzas = (): Pizza[] => {
  const data = localStorage.getItem(STORAGE_KEYS.PIZZAS);
  return data ? JSON.parse(data) : INITIAL_PIZZAS;
};

export const savePizzas = (pizzas: Pizza[]) => {
  localStorage.setItem(STORAGE_KEYS.PIZZAS, JSON.stringify(pizzas));
};

export const getStoredUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.USER);
  return data ? JSON.parse(data) : null;
};

export const saveUser = (user: User | null) => {
  if (user) localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  else localStorage.removeItem(STORAGE_KEYS.USER);
};

export const getStoredOrders = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return data ? JSON.parse(data) : [];
};

export const saveOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const getStoredSpecial = (): SiteSpecial => {
  const data = localStorage.getItem(STORAGE_KEYS.SITE_SPECIAL);
  return data ? JSON.parse(data) : {
    title: 'СВІЖА. ГАРЯЧА. ТВОЯ.',
    description: 'Замовляй найкращу піцу в місті!',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=2000',
    badge: 'P2PIZZA SPECIAL'
  };
};

export const saveSpecial = (special: SiteSpecial) => {
  localStorage.setItem(STORAGE_KEYS.SITE_SPECIAL, JSON.stringify(special));
};

export const getStoredShopPhone = (): string => {
  return localStorage.getItem(STORAGE_KEYS.SHOP_PHONE) || '+380 63 700 69 69';
};

export const saveShopPhone = (phone: string) => {
  localStorage.setItem(STORAGE_KEYS.SHOP_PHONE, phone);
};

export const getStoredLogo = (): string => {
  return localStorage.getItem(STORAGE_KEYS.SITE_LOGO) || DEFAULT_LOGO;
};

export const saveLogo = (logo: string) => {
  localStorage.setItem(STORAGE_KEYS.SITE_LOGO, logo);
};

export const getAdminPassword = (): string => {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin123';
};

export const getRegisteredUsers = (): any[] => {
  const data = localStorage.getItem('p2pizza_reg_users');
  return data ? JSON.parse(data) : [];
};

export const registerNewUser = (user: any) => {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem('p2pizza_reg_users', JSON.stringify(users));
};
