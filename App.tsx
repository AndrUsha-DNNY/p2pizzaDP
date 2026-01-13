
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.tsx';
import PizzaCard from './components/PizzaCard.tsx';
import Cart from './components/Cart.tsx';
import Auth from './components/Auth.tsx';
import AdminPanel from './components/AdminPanel.tsx';
import CookingTracker from './components/CookingTracker.tsx';
import Footer from './components/Footer.tsx';
import { Pizza, CartItem, Order, User, OrderStatus, SiteSpecial } from './types.ts';
import { 
  getStoredPizzas, savePizzas, getStoredUser, saveUser, 
  getStoredOrders, saveOrders, saveOrder, getStoredSpecial, 
  getTelegramConfig 
} from './store.ts';
import { 
  Clock, ShoppingBag, Info, Pizza as PizzaIcon, Package, Star, Heart, History
} from 'lucide-react';

interface FlyingPizza {
  id: string;
  image: string;
  startX: number;
  startY: number;
}

const App: React.FC = () => {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [flyingPizzas, setFlyingPizzas] = useState<FlyingPizza[]>([]);
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());

  useEffect(() => {
    setPizzas(getStoredPizzas());
    setUser(getStoredUser());
    setOrders(getStoredOrders());
    setSiteSpecial(getStoredSpecial());
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const orderId = params.get('oid');
    const newStatus = params.get('status') as OrderStatus;

    if (action === 'set_status' && orderId && newStatus) {
      const currentUser = getStoredUser();
      if (currentUser?.role === 'admin') {
        onUpdateOrderStatus(orderId, newStatus);
        setNotification(`Замовлення ${orderId}: ${newStatus}`);
        setTimeout(() => setNotification(null), 4000);
        window.history.replaceState({}, '', window.location.origin);
      } else {
        setIsAuthOpen(true);
      }
    }
  }, []);

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

  // Tracker will stay visible if order is preparing OR ready
  const activeTrackerOrder = useMemo(() => {
    return orders.find(o => o.status === 'preparing' || o.status === 'ready');
  }, [orders]);

  const sendTelegramNotification = async (order: Order) => {
    const { token, chatId } = getTelegramConfig();
    if (!token || !chatId) return;

    const itemsList = order.items.map(i => `• <b>${i.name}</b> x${i.quantity}`).join('\n');
    const typeStr = order.type === 'delivery' ? '🚀 Доставка' : '🥡 Самовивіз';
    const baseUrl = window.location.origin;
    
    let text = `🆕 <b>НОВЕ ЗАМОВЛЕННЯ ${order.id}</b>\n\n`;
    text += `${itemsList}\n\n`;
    text += `💰 <b>Сума:</b> ${order.total} грн\n`;
    text += `📍 <b>Тип:</b> ${typeStr}\n`;
    if (order.type === 'delivery') text += `🏠 <b>Адреса:</b> ${order.address}, ${order.houseNumber}\n`;
    text += `📞 <b>Тел:</b> ${order.phone}\n`;

    const reply_markup = {
      inline_keyboard: [
        [
          { text: '👨‍🍳 Готується', url: `${baseUrl}?action=set_status&oid=${order.id}&status=preparing` },
          { text: '✅ Готово', url: `${baseUrl}?action=set_status&oid=${order.id}&status=ready` }
        ],
        [
          { text: '🚚 Доставлено', url: `${baseUrl}?action=set_status&oid=${order.id}&status=delivered` },
          { text: '📦 Виконано', url: `${baseUrl}?action=set_status&oid=${order.id}&status=completed` }
        ]
      ]
    };

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', reply_markup })
      });
    } catch (e) { console.error(e); }
  };

  const onUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const allOrders = getStoredOrders();
    const updated = allOrders.map(o => {
      if (o.id === orderId) {
        const u = { ...o, status };
        if (status === 'preparing' && !o.preparingStartTime) u.preparingStartTime = Date.now();
        return u;
      }
      return o;
    });
    setOrders(updated);
    saveOrders(updated);
  };

  const handleAddToCart = (pizza: Pizza, rect: DOMRect) => {
    const id = Math.random().toString(36).substr(2, 9);
    setFlyingPizzas(prev => [...prev, { id, image: pizza.image || '', startX: rect.left, startY: rect.top }]);
    setTimeout(() => {
      setCartItems(prev => {
        const existing = prev.find(item => item.id === pizza.id);
        if (existing) return prev.map(item => item.id === pizza.id ? { ...item, quantity: item.quantity + 1 } : item);
        return [...prev, { ...pizza, quantity: 1 }];
      });
      setFlyingPizzas(prev => prev.filter(p => p.id !== id));
      setNotification(`${pizza.name} у кошику!`);
      setTimeout(() => setNotification(null), 2000);
    }, 800);
  };

  const handlePlaceOrder = (orderData: Partial<Order>) => {
    const newOrder: Order = {
      id: 'P2P-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      items: cartItems,
      total: orderData.total || 0,
      date: new Date().toLocaleString('uk-UA'),
      type: (orderData.type as any) || 'delivery',
      address: orderData.address,
      houseNumber: orderData.houseNumber,
      phone: orderData.phone,
      paymentMethod: (orderData.paymentMethod as any) || 'cash',
      status: 'pending',
    };
    saveOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    sendTelegramNotification(newOrder);
    setCartItems([]);
    setIsCartOpen(false);
    alert('Замовлення прийнято!');
    setCurrentView('history');
  };

  const filteredPizzas = useMemo(() => {
    if (currentView === 'box') return pizzas.filter(p => p.category === 'box');
    if (currentView === 'promotions') return pizzas.filter(p => p.isPromo);
    if (currentView === 'favorites') return pizzas.filter(p => user?.favorites.includes(p.id));
    return pizzas.filter(p => p.category === 'pizza');
  }, [currentView, pizzas, user]);

  return (
    <div className="min-h-screen pb-24 md:pb-0 relative bg-[#fffaf5] text-black">
      <Header user={user} onOpenAuth={() => setIsAuthOpen(true)} onNavigate={setCurrentView} cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />
      
      {currentView === 'home' && (
        <section className="relative h-[70vh] flex items-center justify-center overflow-hidden">
          <img src={siteSpecial.image} className="absolute inset-0 w-full h-full object-cover brightness-[0.4]" alt="Hero" />
          <div className="container mx-auto px-4 z-10 text-center text-white">
            <span className="bg-orange-500 px-6 py-2 rounded-full text-xs font-black uppercase mb-6 inline-block tracking-widest">{siteSpecial.badge}</span>
            <h1 className="text-5xl md:text-7xl font-black mb-6 tracking-tighter uppercase">{siteSpecial.title}</h1>
            <p className="text-xl max-w-2xl mx-auto mb-10 font-medium">{siteSpecial.description}</p>
            <button onClick={() => document.getElementById('menu')?.scrollIntoView({behavior:'smooth'})} className="bg-orange-500 hover:bg-white hover:text-orange-600 transition-all text-white px-10 py-5 rounded-full font-black uppercase shadow-2xl">Замовити</button>
          </div>
        </section>
      )}

      <main id="menu" className="container mx-auto px-4 py-16">
        {activeTrackerOrder && (
          <div className="max-w-xl mx-auto mb-16 text-center animate-in zoom-in duration-500">
            <div className="flex items-center gap-2 justify-center text-orange-600 font-black uppercase text-xs mb-4">
              <Info size={16} /> {activeTrackerOrder.status === 'ready' ? 'Замовлення готове!' : 'Ваша піца готується'} (№{activeTrackerOrder.id})
            </div>
            <CookingTracker startTime={activeTrackerOrder.preparingStartTime || Date.now()} isReadyOverride={activeTrackerOrder.status === 'ready'} />
          </div>
        )}

        <div className="mb-12"><h2 className="text-4xl font-black uppercase tracking-tighter">Наше меню</h2></div>
        
        {currentView === 'history' ? (
          <div className="max-w-3xl mx-auto space-y-4">
            {orders.length === 0 ? <p className="text-center text-gray-400 py-20 font-bold uppercase tracking-widest">Історія порожня</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-3xl border border-orange-100 flex justify-between items-center shadow-sm">
                  <div><p className="font-black text-xs uppercase text-gray-400">{o.id} • {o.date}</p><p className="text-xs font-bold mt-1">{o.items.map(i => i.name).join(', ')}</p></div>
                  <div className="text-right"><p className="font-black text-xl">{o.total} грн</p><p className="text-[10px] font-black uppercase text-orange-500 tracking-widest">{o.status}</p></div>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredPizzas.map(p => <PizzaCard key={p.id} pizza={p} onAddToCart={handleAddToCart} isFavorite={user?.favorites.includes(p.id) || false} onToggleFavorite={(id) => {
              if(!user) { setIsAuthOpen(true); return; }
              const updated = {...user, favorites: user.favorites.includes(id) ? user.favorites.filter(f=>f!==id) : [...user.favorites, id]};
              setUser(updated); saveUser(updated);
            }} />)}
          </div>
        )}
      </main>

      <Footer />
      
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cartItems} onUpdateQuantity={(id, d) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity+d)} : i))} onRemove={(id) => setCartItems(prev => prev.filter(i=>i.id!==id))} onPlaceOrder={handlePlaceOrder} />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} currentUser={user} onLogin={(u) => {setUser(u); saveUser(u);}} onLogout={() => {setUser(null); saveUser(null);}} />
      {currentView === 'admin' && user?.role === 'admin' && <AdminPanel pizzas={pizzas} onUpdatePizzas={(p) => {setPizzas(p); savePizzas(p);}} orders={orders} onUpdateOrderStatus={onUpdateOrderStatus} onClose={() => setCurrentView('home')} />}

      {notification && <div className="fixed bottom-12 right-6 z-[200] bg-black text-white px-8 py-4 rounded-full font-black text-xs uppercase border border-orange-500 shadow-2xl animate-in slide-in-from-right duration-300">{notification}</div>}
      
      {flyingPizzas.map(p => (
        <div key={p.id} className="fixed z-[300] w-24 h-24 pointer-events-none rounded-full shadow-2xl" style={{ left: p.startX, top: p.startY, animation: 'flyToCart 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
          <img src={p.image} className="w-full h-full object-cover rounded-full border-4 border-white" alt="Flying" />
        </div>
      ))}
      <style>{`
        @keyframes flyToCart { 
          0% { transform: scale(1) rotate(0deg); opacity: 1; }
          50% { transform: scale(1.5) rotate(180deg); opacity: 0.8; }
          100% { left: 90%; top: 5%; transform: scale(0.1) rotate(360deg); opacity: 0; } 
        }
      `}</style>
    </div>
  );
};

export default App;
