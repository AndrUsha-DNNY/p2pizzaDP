
export type Category = 'pizza' | 'drinks' | 'promotions' | 'new' | 'box';

export interface Pizza {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: Category;
  isNew?: boolean;
  isPromo?: boolean;
}

export interface CartItem extends Pizza {
  quantity: number;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  date: string;
  preparingStartTime?: number; // timestamp when admin set status to 'preparing'
  type: 'delivery' | 'pickup';
  address?: string;
  houseNumber?: string;
  phone?: string;
  pickupTime?: string;
  paymentMethod: 'cash' | 'card_on_receipt';
  status: OrderStatus;
  notes?: string;
}

export interface SiteSpecial {
  title: string;
  description: string;
  image: string;
  badge: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  favorites: string[]; // ids of pizzas
  history: Order[];
}
