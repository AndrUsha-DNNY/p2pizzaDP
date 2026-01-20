
import { Pizza, Order, User, SiteSpecial } from './types';
import { INITIAL_PIZZAS } from './constants';

export const DEFAULT_LOGO = 'https://i.ibb.co/3ykCjFz/p2p-logo.png';

export const DEFAULT_SETTINGS = {
  logo: DEFAULT_LOGO,
  phone: '+380 00 000 00 00',
  adminPassword: 'admin', // Початковий пароль
  tgToken: '8214069041:AAHHuSD_XQjcaf47pQmfIzCWkug9eQCPc9c',
  tgChatId: '920963284',
  special: {
    title: 'СВІЖА. ГАРЯЧА. ТВОЯ.',
    description: 'Замовляй найкращу піцу в місті!',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=2000'
  }
};

const localCache = {
  get: (key: string) => {
    const data = localStorage.getItem(`p2p_v2_${key}`);
    return data ? JSON.parse(data) : null;
  },
  set: (key: string, data: any) => {
    localStorage.setItem(`p2p_v2_${key}`, JSON.stringify(data));
  }
};

const apiRequest = async (url: string, options?: RequestInit) => {
  try {
    const res = await fetch(url, options);
    if (res.status === 404) return { error: '404', data: null };
    if (!res.ok) return { error: 'server_error', data: null };
    return { error: null, data: await res.json() };
  } catch (err) {
    return { error: 'network_error', data: null };
  }
};

// --- SETTINGS ---
export const fetchSettings = async () => {
  const { error, data } = await apiRequest('/api/settings');
  if (data && !error) {
    localCache.set('settings', data);
    return data;
  }
  return localCache.get('settings') || DEFAULT_SETTINGS;
};

export const saveSettingsToDB = async (settings: any) => {
  localCache.set('settings', settings);
  const { error } = await apiRequest('/api/settings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return !error;
};

// --- MENU & ORDERS ---
export const fetchPizzas = async (): Promise<Pizza[]> => {
  const { error, data } = await apiRequest('/api/pizzas');
  if (data && Array.isArray(data) && data.length > 0) {
    localCache.set('pizzas', data);
    return data;
  }
  return localCache.get('pizzas') || INITIAL_PIZZAS;
};

export const savePizzasToDB = async (pizzas: Pizza[]) => {
  localCache.set('pizzas', pizzas);
  const { error } = await apiRequest('/api/pizzas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pizzas })
  });
  return !error;
};

export const fetchOrders = async (): Promise<Order[]> => {
  const { error, data } = await apiRequest('/api/orders');
  if (data && Array.isArray(data)) {
    localCache.set('orders', data);
    return data;
  }
  return localCache.get('orders') || [];
};

export const saveOrderToDB = async (order: Order) => {
  const current = localCache.get('orders') || [];
  localCache.set('orders', [order, ...current]);
  
  const { error } = await apiRequest('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(order)
  });
  return !error;
};

export const updateOrderStatusInDB = async (id: string, status: string) => {
  const current = localCache.get('orders') || [];
  const updated = current.map((o: any) => o.id === id ? { ...o, status } : o);
  localCache.set('orders', updated);

  const { error } = await apiRequest('/api/orders', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status })
  });
  return !error;
};

// --- TELEGRAM ---
export const sendTelegramNotification = async (order: Order) => {
  const settings = await fetchSettings();
  const token = settings?.tgToken || DEFAULT_SETTINGS.tgToken;
  const chatId = settings?.tgChatId || DEFAULT_SETTINGS.tgChatId;
  
  if (!token || !chatId) return;

  const items = order.items.map(i => `• <b>${i.name}</b> x${i.quantity}`).join('\n');
  const text = `🍕 <b>НОВЕ ЗАМОВЛЕННЯ ${order.id}</b>\n\n${items}\n\n💰 Сума: <b>${order.total} грн</b>\n📞 Тел: <code>${order.phone}</code>\n📍 ${order.type === 'delivery' ? `Доставка: ${order.address}, ${order.houseNumber}` : 'Самовивіз'}\n📝 Коментар: ${order.notes || 'відсутній'}`;
  
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' })
    });
  } catch (e) {}
};

// --- AUTH ---
export const getStoredUser = () => {
  const data = localStorage.getItem('p2pizza_user');
  return data ? JSON.parse(data) : null;
};
export const saveUser = (user: any) => user ? localStorage.setItem('p2pizza_user', JSON.stringify(user)) : localStorage.removeItem('p2pizza_user');

export const getRegisteredUsers = () => JSON.parse(localStorage.getItem('p2pizza_reg_users') || '[]');
export const registerNewUser = (user: any) => {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem('p2pizza_reg_users', JSON.stringify(users));
};

export const setupWebhook = async () => {
  const s = await fetchSettings();
  const token = s?.tgToken || DEFAULT_SETTINGS.tgToken;
  if (!token) return false;
  try {
    const url = `${window.location.origin}/api/webhook?token=${token}`;
    const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook?url=${url}`);
    return res.ok;
  } catch (e) { return false; }
};

export const getStoredLogo = () => localCache.get('settings')?.logo || DEFAULT_LOGO;
export const getStoredShopPhone = () => localCache.get('settings')?.phone || '+380 00 000 00 00';
