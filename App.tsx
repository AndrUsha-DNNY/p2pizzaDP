
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
  getStoredOrders, saveOrders, getStoredSpecial, 
  getSupabaseConfig, getSupabaseHeaders, sendTelegramNotification
} from './store.ts';

const App: React.FC = () => {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [flyingPizzas, setFlyingPizzas] = useState<any[]>([]);
  const [siteSpecial] = useState<SiteSpecial>(getStoredSpecial());

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  // Завантаження даних з хмари (Supabase)
  const syncWithCloud = async () => {
    const { url } = getSupabaseConfig();
    if (!url) return;

    try {
      const headers = getSupabaseHeaders();
      // 1. Тягнемо піци
      const pRes = await fetch(`${url}/rest/v1/pizzas?select=*`, { headers });
      if (pRes.ok) {
        const cloudPizzas = await pRes.json();
        if (cloudPizzas.length > 0) {
          setPizzas(cloudPizzas);
          savePizzas(cloudPizzas);
        }
      }
      // 2. Тягнемо замовлення (для адміна)
      const oRes = await fetch(`${url}/rest/v1/orders?select=*&order=created_at.desc`, { headers });
      if (oRes.ok) {
        const cloudOrders = await oRes.json();
        setOrders(cloudOrders);
        saveOrders(cloudOrders);
      }
    } catch (e) {
      console.error("Cloud sync error:", e);
    }
  };

  useEffect(() => {
    // Спочатку завантажуємо локальні (для швидкості)
    setPizzas(getStoredPizzas());
    setUser(getStoredUser());
    setOrders(getStoredOrders());
    
    // Потім синхронізуємо з базою
    syncWithCloud();
    
    // Перевіряємо базу кожну хвилину
    const timer = setInterval(syncWithCloud, 60000);
    return () => clearInterval(timer);
  }, []);

  const handlePlaceOrder = async (orderData: Partial<Order>) => {
    const newOrder: Order = {
      id: 'P2P-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      items: cartItems,
      total: orderData.total || 0,
      date: new Date().toLocaleString('uk-UA'),
      type: orderData.type || 'delivery',
      address: orderData.address,
      houseNumber: orderData.houseNumber,
      phone: orderData.phone,
      paymentMethod: orderData.paymentMethod || 'cash',
      status: 'pending',
      notes: orderData.notes
    };

    // 1. Зберігаємо локально
    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    // 2. Відправляємо в базу Supabase (щоб побачити на інших пристроях)
    const { url } = getSupabaseConfig();
    if (url) {
      fetch(`${url}/rest/v1/orders`, {
        method: 'POST',
        headers: getSupabaseHeaders(),
        body: JSON.stringify({ ...newOrder, created_at: new Date().toISOString() })
      });
    }

    // 3. ПОВІДОМЛЕННЯ В TELEGRAM (Саме тут відбувається магія)
    await sendTelegramNotification(newOrder);

    setCartItems([]);
    setIsCartOpen(false);
    setCurrentView('history');
    alert('Замовлення прийнято! Очікуйте на повідомлення.');
  };

  const handleUpdatePizzas = async (newPizzas: Pizza[]) => {
    setPizzas(newPizzas);
    savePizzas(newPizzas);
    
    const { url } = getSupabaseConfig();
    if (url) {
      await fetch(`${url}/rest/v1/pizzas`, {
        method: 'POST',
        headers: { ...getSupabaseHeaders(), 'Prefer': 'resolution=merge-duplicates' },
        body: JSON.stringify(newPizzas)
      });
    }
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    const updated = orders.map(o => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    saveOrders(updated);

    const { url } = getSupabaseConfig();
    if (url) {
      await fetch(`${url}/rest/v1/orders?id=eq.${id}`, {
        method: 'PATCH',
        headers: getSupabaseHeaders(),
        body: JSON.stringify({ status })
      });
    }
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
        <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
          <img src={siteSpecial.image} className="absolute inset-0 w-full h-full object-cover brightness-50" alt="Hero" />
          <div className="relative z-10 text-center text-white px-4">
            <h1 className="text-4xl md:text-7xl font-black uppercase mb-4 tracking-tighter">{siteSpecial.title}</h1>
            <p className="text-lg opacity-90 max-w-xl mx-auto mb-8">{siteSpecial.description}</p>
            <button onClick={() => document.getElementById('menu')?.scrollIntoView({behavior:'smooth'})} className="bg-orange-500 text-white px-10 py-4 rounded-full font-black uppercase shadow-xl hover:bg-white hover:text-orange-500 transition-all">Замовити зараз</button>
          </div>
        </section>
      )}

      <main id="menu" className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-black uppercase mb-10 tracking-tighter">
          {currentView === 'history' ? 'Історія замовлень' : 'Наше Меню'}
        </h2>
        
        {currentView === 'history' ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {orders.length === 0 ? <p className="text-center text-gray-400 py-20 font-bold">Замовлень ще не було</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-3xl border border-orange-50 shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-black text-xs text-gray-400 mb-1">{o.id} • {o.date}</p>
                    <p className="font-bold">{o.items.map(i => i.name).join(', ')}</p>
                    <p className="text-[10px] font-black uppercase mt-1 text-orange-500">{o.status}</p>
                  </div>
                  <p className="font-black text-xl">{o.total} грн</p>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredPizzas.map(p => (
              <PizzaCard 
                key={p.id} 
                pizza={p} 
                onAddToCart={(pizza, rect) => {
                  setCartItems(prev => {
                    const exist = prev.find(i => i.id === pizza.id);
                    if (exist) return prev.map(i => i.id === pizza.id ? { ...i, quantity: i.quantity + 1 } : i);
                    return [...prev, { ...pizza, quantity: 1 }];
                  });
                }} 
                isFavorite={user?.favorites.includes(p.id) || false} 
                onToggleFavorite={(id) => {
                  if (!user) { setIsAuthOpen(true); return; }
                  const updated = { ...user, favorites: user.favorites.includes(id) ? user.favorites.filter(f => f !== id) : [...user.favorites, id] };
                  setUser(updated); saveUser(updated);
                }} 
              />
            ))}
          </div>
        )}
      </main>

      <Footer />
      <MobileNav currentView={currentView} onNavigate={setCurrentView} hasUser={!!user} />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cartItems} onUpdateQuantity={(id, d) => setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i))} onRemove={(id) => setCartItems(prev => prev.filter(i => i.id !== id))} onPlaceOrder={handlePlaceOrder} />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} currentUser={user} onLogin={(u) => {setUser(u); saveUser(u);}} onLogout={() => {setUser(null); saveUser(null);}} />
      {currentView === 'admin' && user?.role === 'admin' && <AdminPanel pizzas={pizzas} onUpdatePizzas={handleUpdatePizzas} orders={orders} onUpdateOrderStatus={handleUpdateStatus} onClose={() => setCurrentView('home')} />}
    </div>
  );
};

export default App;
