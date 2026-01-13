
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.tsx';
import MobileNav from './components/MobileNav.tsx';
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
  getTelegramConfig, getSupabaseConfig, getSupabaseHeaders 
} from './store.ts';

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
  const [flyingPizzas, setFlyingPizzas] = useState<FlyingPizza[]>([]);
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  // Track the active order that is being cooked or ready
  const activeTrackerOrder = useMemo(() => {
    return orders.find(o => o.status === 'preparing' || o.status === 'ready');
  }, [orders]);

  const fetchCloudData = async () => {
    const { url } = getSupabaseConfig();
    if (!url) return;
    try {
      const headers = getSupabaseHeaders();
      const [pRes, oRes] = await Promise.all([
        fetch(`${url}/rest/v1/pizzas?select=*`, { headers }),
        fetch(`${url}/rest/v1/orders?select=*&order=created_at.desc`, { headers })
      ]);
      if (pRes.ok) {
        const cloudPizzas = await pRes.json();
        if (Array.isArray(cloudPizzas) && cloudPizzas.length > 0) {
          setPizzas(cloudPizzas);
          savePizzas(cloudPizzas);
        }
      }
      if (oRes.ok) {
        const cloudOrders = await oRes.json();
        if (Array.isArray(cloudOrders)) {
          setOrders(cloudOrders);
          saveOrders(cloudOrders);
        }
      }
    } catch (e) {
      console.error('Cloud sync error', e);
    }
  };

  useEffect(() => {
    setPizzas(getStoredPizzas());
    setUser(getStoredUser());
    setOrders(getStoredOrders());
    setSiteSpecial(getStoredSpecial());
    fetchCloudData();
  }, []);

  const sendTelegramNotification = async (order: Order) => {
    const { token, chatId } = getTelegramConfig();
    if (!token || !chatId) return;

    const itemsText = order.items.map(i => `• ${i.name} (x${i.quantity})`).join('\n');
    const paymentText = order.paymentMethod === 'cash' ? '💵 Готівка' : '💳 Карта при отриманні';
    const typeText = order.type === 'delivery' ? `🚀 Доставка: ${order.address}, буд. ${order.houseNumber}` : `🏪 Самовивіз: ${order.pickupTime}`;
    const commentText = order.notes ? `\n\n📝 КОМЕНТАР: ${order.notes}` : '';

    const message = `🔔 НОВЕ ЗАМОВЛЕННЯ ${order.id}\n` +
                    `----------------------\n` +
                    `🍕 ТОВАРИ:\n${itemsText}\n\n` +
                    `💰 РАЗОМ: ${order.total} грн\n` +
                    `💳 ОПЛАТА: ${paymentText}\n` +
                    `📍 ТИП: ${typeText}\n` +
                    `📞 ТЕЛ: ${order.phone}${commentText}\n\n` +
                    `⏰ Час: ${order.date}`;

    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: message })
      });
    } catch (e) {
      console.error('Telegram notification error', e);
    }
  };

  const onUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const updatedOrders = orders.map(o => {
      if (o.id === orderId) {
        const preparingStartTime = status === 'preparing' ? Date.now() : o.preparingStartTime;
        return { ...o, status, preparingStartTime };
      }
      return o;
    });
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    const { url } = getSupabaseConfig();
    if (url) {
      fetch(`${url}/rest/v1/orders?id=eq.${orderId}`, {
        method: 'PATCH',
        headers: getSupabaseHeaders(),
        body: JSON.stringify({ status })
      }).catch(err => console.error(err));
    }
  };

  const handleUpdatePizzas = (newPizzas: Pizza[]) => {
    setPizzas([...newPizzas]);
    savePizzas([...newPizzas]);
  };

  const handleAddToCart = (pizza: Pizza, rect: DOMRect) => {
    const id = Math.random().toString(36).substr(2, 9);
    setFlyingPizzas(prev => [...prev, { 
      id, 
      image: pizza.image || 'https://i.ibb.co/3ykCjFz/p2p-logo.png', 
      startX: rect.left, 
      startY: rect.top + window.scrollY 
    }]);

    setTimeout(() => {
      setCartItems(prev => {
        const existing = prev.find(item => item.id === pizza.id);
        if (existing) return prev.map(item => item.id === pizza.id ? { ...item, quantity: item.quantity + 1 } : item);
        return [...prev, { ...pizza, quantity: 1 }];
      });
      setFlyingPizzas(prev => prev.filter(p => p.id !== id));
    }, 1000);
  };

  const handlePlaceOrder = async (orderData: Partial<Order>) => {
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

    const { url } = getSupabaseConfig();
    if (url) {
      fetch(`${url}/rest/v1/orders`, {
        method: 'POST',
        headers: getSupabaseHeaders(),
        body: JSON.stringify({ ...newOrder, created_at: new Date().toISOString() })
      }).catch(err => console.error(err));
    }
    
    setCartItems([]);
    setIsCartOpen(false);
    setCurrentView('history');
  };

  const filteredPizzas = useMemo(() => {
    if (currentView === 'box') return pizzas.filter(p => p.category === 'box');
    if (currentView === 'promotions') return pizzas.filter(p => p.isPromo);
    if (currentView === 'favorites') return pizzas.filter(p => user?.favorites.includes(p.id));
    return pizzas.filter(p => p.category === 'pizza');
  }, [currentView, pizzas, user]);

  return (
    <div className="min-h-screen pb-32 md:pb-12 relative bg-[#fffaf5] text-black">
      <Header user={user} onOpenAuth={() => setIsAuthOpen(true)} onNavigate={setCurrentView} cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />
      
      {currentView === 'home' && (
        <>
          <section className="relative h-[60vh] md:h-[75vh] flex items-center justify-center overflow-hidden">
            <img src={siteSpecial.image} className="absolute inset-0 w-full h-full object-cover brightness-[0.4]" alt="Hero" />
            <div className="container mx-auto px-4 z-10 text-center text-white">
              <span className="bg-orange-500 px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase mb-6 inline-block tracking-widest">{siteSpecial.badge}</span>
              <h1 className="text-3xl md:text-7xl font-black mb-6 tracking-tighter uppercase leading-tight">{siteSpecial.title}</h1>
              <p className="text-base md:text-xl max-w-2xl mx-auto mb-10 font-medium opacity-90 px-4">{siteSpecial.description}</p>
              <button onClick={() => document.getElementById('menu')?.scrollIntoView({behavior:'smooth'})} className="bg-orange-500 hover:bg-white hover:text-orange-600 transition-all text-white px-8 md:px-12 py-4 md:py-5 rounded-full font-black uppercase shadow-2xl active:scale-95 text-xs md:text-sm">Замовити піцу</button>
            </div>
          </section>

          {activeTrackerOrder && (
            <div className="container mx-auto px-4 -mt-16 md:-mt-20 relative z-20 max-w-2xl">
               <CookingTracker 
                 startTime={activeTrackerOrder.preparingStartTime || Date.now()} 
                 isReadyOverride={activeTrackerOrder.status === 'ready'} 
               />
               <div className="mt-4 text-center">
                  <p className="text-[9px] font-black uppercase text-gray-400 bg-white/90 backdrop-blur-sm inline-block px-4 py-1.5 rounded-full border shadow-sm">Замовлення #{activeTrackerOrder.id} у роботі</p>
               </div>
            </div>
          )}
        </>
      )}

      <main id="menu" className="container mx-auto px-4 py-12 md:py-16">
        <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter">
            {currentView === 'box' ? 'BOX МЕНЮ' : currentView === 'promotions' ? 'АКЦІЙНІ ПРОПОЗИЦІЇ' : currentView === 'favorites' ? 'ВАШІ УЛЮБЛЕНІ' : currentView === 'history' ? 'ІСТОРІЯ ЗАМОВЛЕНЬ' : 'Наше меню'}
          </h2>
          <div className="h-1 flex-grow bg-orange-100/50 rounded-full hidden lg:block mx-8"></div>
        </div>
        
        {currentView === 'history' ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {orders.length === 0 ? <div className="text-center py-32"><p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">У вас ще немає замовлень</p></div> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-[2.5rem] border border-orange-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className="font-black text-[9px] uppercase tracking-tighter bg-black text-white px-3 py-1 rounded-lg">{o.id}</span>
                       <span className="text-[9px] text-gray-400 font-bold uppercase">{o.date}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-800">{o.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}</p>
                    <div className={`mt-2 text-[9px] font-black uppercase tracking-widest ${o.status === 'completed' ? 'text-green-500' : 'text-orange-500'}`}>Статус: {o.status === 'pending' ? 'Очікує' : o.status === 'preparing' ? 'Готується' : o.status === 'ready' ? 'Готово' : o.status === 'completed' ? 'Виконано' : 'Скасовано'}</div>
                  </div>
                  <div className="text-right w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 flex sm:flex-col items-center sm:items-end justify-between">
                    <span className="text-gray-400 text-[10px] font-black uppercase sm:hidden">Сума</span>
                    <p className="font-black text-2xl text-orange-600">{o.total} грн</p>
                  </div>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-10">
            {filteredPizzas.map(p => (
              <PizzaCard 
                key={p.id} 
                pizza={p} 
                onAddToCart={handleAddToCart} 
                isFavorite={user?.favorites.includes(p.id) || false} 
                onToggleFavorite={(id) => {
                  if(!user) { setIsAuthOpen(true); return; }
                  const updated = {...user, favorites: user.favorites.includes(id) ? user.favorites.filter(f=>f!==id) : [...user.favorites, id]};
                  setUser(updated); saveUser(updated);
                }} 
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
      
      {/* Mobile Navigation Bar */}
      <MobileNav currentView={currentView} onNavigate={setCurrentView} hasUser={!!user} />

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cartItems} onUpdateQuantity={(id, d) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity+d)} : i))} onRemove={(id) => setCartItems(prev => prev.filter(i=>i.id!==id))} onPlaceOrder={handlePlaceOrder} />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} currentUser={user} onLogin={(u) => {setUser(u); saveUser(u);}} onLogout={() => {setUser(null); saveUser(null);}} />
      {currentView === 'admin' && user?.role === 'admin' && <AdminPanel pizzas={pizzas} onUpdatePizzas={handleUpdatePizzas} orders={orders} onUpdateOrderStatus={onUpdateOrderStatus} onClose={() => setCurrentView('home')} />}

      {flyingPizzas.map(p => (
        <div key={p.id} className="fixed z-[300] pointer-events-none w-20 h-20 md:w-24 md:h-24 rounded-full shadow-2xl overflow-hidden border-4 border-white animate-pizza-fly" style={{ left: p.startX, top: p.startY }}>
          <img src={p.image} className="w-full h-full object-cover" alt="Fly" />
        </div>
      ))}

      <style>{`
        @keyframes pizzaFly {
          0% { transform: scale(1) translate(0, 0) rotate(0deg); opacity: 1; }
          20% { transform: scale(1.3) translate(80px, -180px) rotate(45deg); opacity: 1; }
          100% { 
            left: calc(100vw - 80px); 
            top: 40px; 
            transform: scale(0.1) translate(0, 0) rotate(720deg); 
            opacity: 0; 
          }
        }
        .animate-pizza-fly {
          animation: pizzaFly 1s cubic-bezier(0.19, 1, 0.22, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
