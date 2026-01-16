
import { Pizza, Order, User, SiteSpecial } from './types';
import { INITIAL_PIZZAS } from './constants';

export const DEFAULT_LOGO = 'https://i.ibb.co/3ykCjFz/p2p-logo.png';

export const DEFAULT_SETTINGS = {
  logo: DEFAULT_LOGO,
  phone: '+380 00 000 00 00',
  special: {
    title: 'СВІЖА. ГАРЯЧА. ТВОЯ.',
    description: 'Замовляй найкращу піцу в місті!',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=2000'
  }
};

// Допоміжні функції для роботи з LocalStorage як резервною копією
const localStore = {
  get: (key: string) => {
    try {
      const data = localStorage.getItem(`p2p_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (e) { return null; }
  },
  set: (key: string, val: any) => {
    try {
      localStorage.setItem(`p2p_${key}`, JSON.stringify(val));
    } catch (e) {}
  }
};

const safeFetch = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.warn(`API Not Found or Error (${res.status}): ${url}. Using local fallback.`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`Network error for ${url}. Using local fallback.`);
    return null;
  }
};

// --- SETTINGS ---
export const fetchSettings = async () => {
  const data = await safeFetch('/api/settings');
  if (data) {
    localStore.set('settings', data);
    return data;
  }
  return localStore.get('settings') || DEFAULT_SETTINGS;
};

export const saveSettingsToDB = async (settings: any) => {
  localStore.set('settings', settings); // Завжди зберігаємо локально першим
  const result = await safeFetch('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return true; // Повертаємо true, бо локально ми вже зберегли
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
  if (data && data.length > 0) {
    localStore.set('pizzas', data);
    return data;
  }
  return localStore.get('pizzas') || INITIAL_PIZZAS;
};

export const savePizzasToDB = async (pizzas: Pizza[]) => {
  localStore.set('pizzas', pizzas);
  await safeFetch('/api/pizzas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pizzas })
  });
  return true;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const data = await safeFetch('/api/orders');
  if (data) {
    localStore.set('orders', data);
    return data;
  }
  return localStore.get('orders') || [];
};

export const saveOrderToDB = async (order: Order) => {
  const orders = localStore.get('orders') || [];
  localStore.set('orders', [order, ...orders]);
  
  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  return true;
};

export const updateOrderStatusInDB = async (id: string, status: string) => {
  const orders = localStore.get('orders') || [];
  const updated = orders.map((o: Order) => o.id === id ? { ...o, status } : o);
  localStore.set('orders', updated);

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

// Legacy storage (keeping compatibility)
export const getStoredLogo = () => localStore.get('settings')?.logo || DEFAULT_LOGO;
export const saveLogo = (logo: string) => {
  const s = localStore.get('settings') || DEFAULT_SETTINGS;
  localStore.set('settings', { ...s, logo });
};
export const getStoredShopPhone = () => localStore.get('settings')?.phone || '+380 00 000 00 00';
export const saveShopPhone = (phone: string) => {
  const s = localStore.get('settings') || DEFAULT_SETTINGS;
  localStore.set('settings', { ...s, phone });
};

export const getTelegramConfig = () => {
  const s = localStore.get('settings') || {};
  return { token: s.tgToken || '', chatId: s.tgChatId || '' };
};
export const saveTelegramConfig = (token: string, chatId: string) => {
  const s = localStore.get('settings') || DEFAULT_SETTINGS;
  localStore.set('settings', { ...s, tgToken: token, tgChatId: chatId });
};

export const setupWebhook = async () => {
  const settings = await fetchSettings();
  const token = settings?.tgToken;
  if (!token) return false;
  try {
    const url = `${window.location.origin}/api/webhook?token=${token}`;
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${url}`);
    return res.ok;
  } catch (e) {
    return false;
  }
};
