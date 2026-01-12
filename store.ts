
import { Pizza, CartItem, Order, User, SiteSpecial } from './types';
import { INITIAL_PIZZAS } from './constants';

const STORAGE_KEYS = {
  PIZZAS: 'p2pizza_pizzas',
  USER: 'p2pizza_user',
  ORDERS: 'p2pizza_orders',
  ADMIN_PASSWORD: 'p2pizza_admin_password',
  SITE_LOGO: 'p2pizza_site_logo',
  SITE_SPECIAL: 'p2pizza_site_special',
  SHOP_PHONE: 'p2pizza_shop_phone',
  REGISTERED_USERS: 'p2pizza_registered_users', // New key for simulated DB
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

// Simulated Database helper for users
export const getRegisteredUsers = (): any[] => {
  const data = localStorage.getItem(STORAGE_KEYS.REGISTERED_USERS);
  return data ? JSON.parse(data) : [];
};

export const registerNewUser = (user: any) => {
  const users = getRegisteredUsers();
  users.push(user);
  localStorage.setItem(STORAGE_KEYS.REGISTERED_USERS, JSON.stringify(users));
};

export const getStoredOrders = (): Order[] => {
  const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
  return data ? JSON.parse(data) : [];
};

export const saveOrders = (orders: Order[]) => {
  localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
};

export const saveOrder = (order: Order) => {
  const orders = getStoredOrders();
  saveOrders([order, ...orders]);
};

export const getAdminPassword = (): string => {
  return localStorage.getItem(STORAGE_KEYS.ADMIN_PASSWORD) || 'admin123';
};

export const saveAdminPassword = (password: string) => {
  localStorage.setItem(STORAGE_KEYS.ADMIN_PASSWORD, password);
};

export const getStoredLogo = (): string => {
  return localStorage.getItem(STORAGE_KEYS.SITE_LOGO) || 'https://i.ibb.co/3ykCjFz/p2p-logo.png';
};

export const saveLogo = (logoBase64: string) => {
  localStorage.setItem(STORAGE_KEYS.SITE_LOGO, logoBase64);
};

export const getStoredShopPhone = (): string => {
  return localStorage.getItem(STORAGE_KEYS.SHOP_PHONE) || '+380 63 700 69 69';
};

export const saveShopPhone = (phone: string) => {
  localStorage.setItem(STORAGE_KEYS.SHOP_PHONE, phone);
};

export const getStoredSpecial = (): SiteSpecial => {
  const data = localStorage.getItem(STORAGE_KEYS.SITE_SPECIAL);
  return data ? JSON.parse(data) : {
    title: 'СВІЖА. ГАРЯЧА. ТВОЯ.',
    description: 'Замовляй найкращу піцу в місті з доставкою або забирай сам за 8 хвилин!',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=2000',
    badge: 'P2PIZZA SPECIAL'
  };
};

export const saveSpecial = (special: SiteSpecial) => {
  localStorage.setItem(STORAGE_KEYS.SITE_SPECIAL, JSON.stringify(special));
};
