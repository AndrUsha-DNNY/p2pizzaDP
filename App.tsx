
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
  Clock, CheckCircle2, ShoppingCart, Info, ShoppingBag, MapPin, 
  Phone, Pizza as PizzaIcon, Package, Star, Heart, History, 
  XCircle, Zap, ShieldCheck, Smile, Utensils 
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

  // Handling deep links from Telegram for status updates
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const action = params.get('action');
    const orderId = params.get('oid');
    const newStatus = params.get('status') as OrderStatus;

    if (action === 'set_status' && orderId && newStatus) {
      // Check if user is logged in as admin
      const currentUser = getStoredUser();
      if (currentUser?.role === 'admin') {
        onUpdateOrderStatus(orderId, newStatus);
        setNotification(`Замовлення ${orderId} змінено на ${newStatus}`);
        setTimeout(() => setNotification(null), 3000);
        // Clear URL parameters
        window.history.replaceState({}, '', window.location.origin);
      } else {
        setNotification("Увійдіть як адмін для зміни статусу");
        setIsAuthOpen(true);
      }
    }
  }, [user, orders]);

  useEffect(() => {
    if (currentView === 'home' || currentView === 'admin') {
      setSiteSpecial(getStoredSpecial());
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentView]);

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

  const activePreparingOrder = useMemo(() => {
    return orders.find(o => o.status === 'preparing');
  }, [orders]);

  const sendTelegramNotification = async (order: Order) => {
    const { token, chatId } = getTelegramConfig();
    if (!token || !chatId) return;

    const itemsList = order.items.map(i => `• <b>${i.name}</b> x${i.quantity}`).join('\n');
    const typeStr = order.type === 'delivery' ? '🚀 Доставка' : '🥡 Самовивіз';
    
    let text = `🆕 <b>ЗАМОВЛЕННЯ ${order.id}</b>\n\n`;
    text += `${itemsList}\n\n`;
    text += `💰 <b>Сума:</b> ${order.total} грн\n`;
    text += `📍 <b>Тип:</b> ${typeStr}\n`;
    
    if (order.type === 'delivery') {
      text += `🏠 <b>Адреса:</b> ${order.address}, ${order.houseNumber}\n`;
    }
    if (order.phone) text += `📞 <b>Тел:</b> ${order.phone}\n`;

    // Inline buttons that link back to the site with action parameters
    const baseUrl = window.location.origin;
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
        body: JSON.stringify({
          chat_id: chatId,
          text: text,
          parse_mode: 'HTML',
          reply_markup: reply_markup
        })
      });
    } catch (e) {
      console.error('Telegram notification failed', e);
    }
  };

  const handleAddToCart = (pizza: Pizza, rect: DOMRect) => {
    const id = Math.random().toString(36).substr(2, 9);
    setFlyingPizzas(prev => [...prev, { 
      id, 
      image: pizza.image || 'https://i.ibb.co/3ykCjFz/p2p-logo.png', 
      startX: rect.left, 
      startY: rect.top 
    }]);

    setTimeout(() => {
      setCartItems(prev => {
        const existing = prev.find(item => item.id === pizza.id);
        if (existing) {
          return prev.map(item => item.id === pizza.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { ...pizza, quantity: 1 }];
      });
      setFlyingPizzas(prev => prev.filter(p => p.id !== id));
      setNotification(`${pizza.name} додано до кошика!`);
      setTimeout(() => setNotification(null), 2000);
    }, 700);
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handleRemoveFromCart = (id: string) => {
    setCartItems(prev => prev.filter(item => item.id !== id));
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
      pickupTime: orderData.pickupTime,
      paymentMethod: (orderData.paymentMethod as any) || 'cash',
      status: 'pending',
      notes: orderData.notes
    };
    
    saveOrder(newOrder);
    setOrders(prev => [newOrder, ...prev]);
    sendTelegramNotification(newOrder);
    
    setCartItems([]);
    setIsCartOpen(false);
    
    alert('Дякуємо! Ваше замовлення прийнято.');
    setCurrentView('history');
  };

  const onUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updatedOrders = getStoredOrders().map(o => {
        if (o.id === orderId) {
            const updated = { ...o, status };
            if (status === 'preparing' && !o.preparingStartTime) {
                updated.preparingStartTime = Date.now();
            }
            return updated;
        }
        return o;
    });
    setOrders(updatedOrders);
    saveOrders(updatedOrders);
  };

  const handleCancelOrder = (orderId: string) => {
    if (confirm('Скасувати замовлення?')) {
      onUpdateOrderStatus(orderId, 'cancelled');
      setNotification("Замовлення скасовано");
      setTimeout(() => setNotification(null), 2000);
    }
  };

  const handleToggleFavorite = (id: string) => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    const updatedUser = { ...user };
    if (updatedUser.favorites.includes(id)) {
      updatedUser.favorites = updatedUser.favorites.filter(favId => favId !== id);
    } else {
      updatedUser.favorites.push(id);
    }
    setUser(updatedUser);
    saveUser(updatedUser);
  };

  const filteredPizzas = useMemo(() => {
    switch (currentView) {
      case 'promotions': return pizzas.filter(p => p.isPromo);
      case 'new': return pizzas.filter(p => p.isNew);
      case 'favorites': return pizzas.filter(p => user?.favorites.includes(p.id));
      case 'box': return pizzas.filter(p => p.category === 'box');
      default: return pizzas.filter(p => p.category === 'pizza');
    }
  }, [currentView, pizzas, user]);

  const navItems = [
    { id: 'home', label: 'Піца', icon: PizzaIcon },
    { id: 'box', label: 'BOX', icon: Package },
    { id: 'promotions', label: 'Акції', icon: Star },
    { id: 'favorites', label: 'Любиме', icon: Heart },
    { id: 'history', label: 'Історія', icon: History, requireAuth: true },
  ];

  const showMobileNav = !isCartOpen && !isAuthOpen && currentView !== 'admin';

  return (
    <div className="min-h-screen pb-24 md:pb-0 relative bg-[#fffaf5] text-black selection:bg-orange-100 selection:text-orange-900">
      <Header 
        user={user} 
        onOpenAuth={() => setIsAuthOpen(true)}
        onNavigate={setCurrentView}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {currentView === 'home' && (
        <div className="animate-in fade-in duration-700">
          <section className="relative h-[80vh] min-h-[500px] flex items-center justify-center overflow-hidden">
             <img src={siteSpecial.image} className="absolute inset-0 w-full h-full object-cover brightness-[0.4] scale-105 animate-pulse-slow" alt="P2Pizza Hero" />
             <div className="container mx-auto px-4 z-10 text-center text-white">
                <span className="inline-block bg-orange-500 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-6 animate-bounce">
                  {siteSpecial.badge}
                </span>
                <h1 className="text-5xl md:text-8xl font-black mb-6 tracking-tighter leading-none drop-shadow-2xl">
                  {siteSpecial.title}
                </h1>
                <p className="text-xl md:text-2xl font-medium text-gray-200 max-w-2xl mx-auto mb-10 drop-shadow">
                  {siteSpecial.description}
                </p>
                <div className="flex flex-wrap justify-center gap-6">
                   <button 
                    onClick={() => {
                        const el = document.getElementById('menu-start');
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-orange-500 hover:bg-white hover:text-orange-600 text-white px-10 py-5 rounded-full font-black uppercase tracking-widest transition-all shadow-2xl active:scale-95"
                   >
                     Замовити зараз
                   </button>
                </div>
             </div>
          </section>
        </div>
      )}

      <main id="menu-start" className="container mx-auto px-4 py-16 min-h-[60vh]">
        {activePreparingOrder && (
          <div className="max-w-xl mx-auto mb-16">
            <div className="flex items-center gap-2 mb-4 justify-center text-orange-600 font-black uppercase text-xs tracking-widest animate-pulse">
                <Info size={16} /> Поточне замовлення {activePreparingOrder.id} - Готується
            </div>
            <CookingTracker startTime={activePreparingOrder.preparingStartTime!} />
          </div>
        )}

        <div className="mb-12">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter flex items-center gap-6">
            {currentView === 'home' && 'Наше Меню'}
            {currentView === 'box' && 'BOX-меню та закуски'}
            {currentView === 'promotions' && 'Акційні пропозиції'}
            {currentView === 'new' && 'Останні новинки'}
            {currentView === 'favorites' && 'Ваше улюблене'}
            {currentView === 'history' && 'Історія замовлень'}
            <div className="h-2 flex-grow bg-orange-100 rounded-full hidden md:block" />
          </h2>
        </div>

        {currentView === 'history' ? (
          <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom duration-500">
            {orders.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-orange-50">
                <ShoppingBag className="w-20 h-20 mx-auto text-gray-100 mb-6" />
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Ви ще нічого не замовляли</p>
                <button onClick={() => setCurrentView('home')} className="mt-6 text-orange-500 font-black uppercase text-xs hover:underline">Перейти до меню</button>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-orange-50 flex flex-col md:flex-row gap-8 items-center transition-all hover:shadow-md">
                  <div className="flex-grow w-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-lg uppercase tracking-widest">{order.id}</span>
                        <span className="text-gray-400 text-[10px] font-bold uppercase">{order.date}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-6">
                      {order.items.map(item => (
                        <span key={item.id} className="bg-[#fffaf5] border border-orange-100 text-orange-600 px-3 py-2 rounded-xl text-xs font-black uppercase">
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-6">
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-gray-500"><Clock size={16} className="text-orange-500" /> {order.type === 'delivery' ? 'Доставка' : 'Самовивіз'}</div>
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${order.status === 'completed' || order.status === 'delivered' ? 'text-green-600' : order.status === 'cancelled' ? 'text-red-500' : 'text-orange-600'}`}>
                        {order.status === 'pending' ? 'Очікує' : order.status === 'preparing' ? 'Готується' : order.status === 'ready' ? 'Готово' : order.status === 'delivered' ? 'Доставлено' : order.status === 'cancelled' ? 'Скасовано' : 'Виконано'}
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-right min-w-[160px] border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8 flex flex-col items-center md:items-end">
                    <p className="text-3xl font-black text-black mb-6">{order.total} <span className="text-sm font-bold text-orange-500">грн</span></p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 md:gap-12 animate-in fade-in duration-500">
            {filteredPizzas.map(pizza => (
              <PizzaCard key={pizza.id} pizza={pizza} onAddToCart={handleAddToCart} isFavorite={user?.favorites.includes(pizza.id) || false} onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
        )}
      </main>

      <Footer />

      {showMobileNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-xl border-t border-orange-100 flex items-center justify-around px-2 py-4 md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.1)] pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            if (item.requireAuth && !user) return null;
            return (
              <button key={item.id} onClick={() => setCurrentView(item.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 ${isActive ? 'text-orange-500 scale-110' : 'text-gray-400'}`}>
                <Icon size={24} className={isActive ? 'fill-orange-50' : ''} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
              </button>
            );
          })}
          <button onClick={() => setIsCartOpen(true)} className={`flex flex-col items-center gap-1 transition-all duration-300 relative ${cartCount > 0 ? 'text-black' : 'text-gray-400'}`}>
            <ShoppingCart size={24} />
            {cartCount > 0 && <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">{cartCount}</span>}
          </button>
        </nav>
      )}

      {flyingPizzas.map(p => (
        <div key={p.id} className="fixed z-[200] w-24 h-24 rounded-full shadow-2xl pointer-events-none" style={{ left: p.startX, top: p.startY, animation: 'flyToCart 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards' }}>
          <img src={p.image} className="w-full h-full object-cover rounded-full border-4 border-white shadow-xl" alt="Flying Pizza" />
        </div>
      ))}

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cartItems} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemoveFromCart} onPlaceOrder={handlePlaceOrder} />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} currentUser={user} onLogin={(u) => { setUser(u); saveUser(u); }} onLogout={() => { setUser(null); saveUser(null); }} />
      {currentView === 'admin' && user?.role === 'admin' && <AdminPanel pizzas={pizzas} onUpdatePizzas={(newPizzas) => { setPizzas(newPizzas); savePizzas(newPizzas); }} orders={orders} onUpdateOrderStatus={onUpdateOrderStatus} onClose={() => setCurrentView('home')} />}

      {notification && (
        <div className="fixed bottom-32 md:bottom-12 right-6 z-[110] bg-black text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl animate-in slide-in-from-right duration-300 border border-orange-500">
          {notification}
        </div>
      )}
    </div>
  );
};

export default App;
