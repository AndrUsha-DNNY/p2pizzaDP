
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.tsx';
import MobileNav from './components/MobileNav.tsx';
import PizzaCard from './components/PizzaCard.tsx';
import Cart from './components/Cart.tsx';
import Auth from './components/Auth.tsx';
import AdminPanel from './AdminPanel.tsx';
import CookingTracker from './components/CookingTracker.tsx';
import Footer from './components/Footer.tsx';
import { Pizza, CartItem, Order, User, OrderStatus, SiteSpecial } from './types.ts';
import { 
  fetchPizzas, savePizzasToDB, getStoredUser, saveUser, 
  fetchOrders, saveOrderToDB, updateOrderStatusInDB, 
  getStoredSpecial, sendTelegramNotification
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
  const [isLoading, setIsLoading] = useState(true);
  const [flyingPizzas, setFlyingPizzas] = useState<FlyingPizza[]>([]);
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const activeTrackerOrder = useMemo(() => {
    return orders.find(o => o.status === 'Готується' || o.status === 'Готово');
  }, [orders]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // fetchPizzas and fetchOrders now have internal try-catches and return defaults on fail
        const [dbPizzas, dbOrders] = await Promise.all([fetchPizzas(), fetchOrders()]);
        setPizzas(dbPizzas);
        setOrders(dbOrders);
        setUser(getStoredUser());
      } catch (error) {
        console.error("Initial load failed", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();

    const handleStorage = () => setSiteSpecial(getStoredSpecial());
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
        const exist = prev.find(i => i.id === pizza.id);
        if (exist) return prev.map(i => i.id === pizza.id ? { ...i, quantity: i.quantity + 1 } : i);
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
      type: orderData.type || 'delivery',
      address: orderData.address,
      houseNumber: orderData.houseNumber,
      phone: orderData.phone,
      paymentMethod: orderData.paymentMethod || 'cash',
      status: 'Нове',
      notes: orderData.notes
    };

    await saveOrderToDB(newOrder);
    setOrders([newOrder, ...orders]);
    await sendTelegramNotification(newOrder);

    setCartItems([]);
    setIsCartOpen(false);
    setCurrentView('history');
  };

  const handleUpdatePizzas = async (newPizzas: Pizza[]) => {
    setPizzas([...newPizzas]);
    await savePizzasToDB(newPizzas);
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    await updateOrderStatusInDB(id, status);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const filteredPizzas = useMemo(() => {
    if (currentView === 'box') return pizzas.filter(p => p.category === 'box');
    if (currentView === 'promotions') return pizzas.filter(p => p.isPromo);
    if (currentView === 'favorites') return pizzas.filter(p => user?.favorites.includes(p.id));
    return pizzas.filter(p => p.category === 'pizza');
  }, [currentView, pizzas, user]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="font-black uppercase text-xs tracking-widest text-orange-500 animate-pulse">З'єднуємо з базою...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 md:pb-12 relative bg-[#fffaf5] text-black">
      <Header user={user} onOpenAuth={() => setIsAuthOpen(true)} onNavigate={setCurrentView} cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />
      
      {currentView === 'home' && (
        <>
          <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
            <img src={siteSpecial.image} className="absolute inset-0 w-full h-full object-cover brightness-50" alt="Hero" />
            <div className="relative z-10 text-center text-white px-4">
              <h1 className="text-4xl md:text-7xl font-black uppercase mb-4 tracking-tighter animate-in slide-in-from-bottom duration-700">{siteSpecial.title}</h1>
              <p className="text-lg opacity-90 max-w-xl mx-auto mb-8 font-medium">{siteSpecial.description}</p>
              <button onClick={() => document.getElementById('menu')?.scrollIntoView({behavior:'smooth'})} className="bg-orange-500 text-white px-10 py-4 rounded-full font-black uppercase shadow-xl hover:bg-white hover:text-orange-500 transition-all active:scale-95">Замовити зараз</button>
            </div>
          </section>

          {activeTrackerOrder && (
            <div className="container mx-auto px-4 -mt-16 relative z-20 max-w-2xl">
              <CookingTracker 
                startTime={activeTrackerOrder.preparingStartTime || Date.now()} 
                isReadyOverride={activeTrackerOrder.status === 'Готово'} 
              />
            </div>
          )}
        </>
      )}

      <main id="menu" className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-black uppercase mb-10 tracking-tighter">
          {currentView === 'history' ? 'Ваша історія' : 'Наше Меню'}
        </h2>
        
        {currentView === 'history' ? (
          <div className="space-y-4 max-w-2xl mx-auto">
            {orders.length === 0 ? <p className="text-center text-gray-400 py-20 font-bold uppercase text-[10px]">Замовлень ще не було</p> : 
              orders.map(o => (
                <div key={o.id} className="bg-white p-6 rounded-3xl border border-orange-50 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-black text-[9px] text-gray-400 mb-1 uppercase">{o.id} • {o.date}</p>
                    <p className="font-bold text-sm">{o.items.map(i => i.name).join(', ')}</p>
                    <p className={`text-[10px] font-black uppercase mt-1 ${o.status === 'Скасовано' ? 'text-red-500' : 'text-orange-500'}`}>{o.status}</p>
                  </div>
                  <p className="font-black text-xl">{o.total} грн</p>
                </div>
              ))
            }
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredPizzas.length > 0 ? (
              filteredPizzas.map(p => (
                <PizzaCard 
                  key={p.id} 
                  pizza={p} 
                  onAddToCart={handleAddToCart} 
                  isFavorite={user?.favorites.includes(p.id) || false} 
                  onToggleFavorite={(id) => {
                    if (!user) { setIsAuthOpen(true); return; }
                    const updated = { ...user, favorites: user.favorites.includes(id) ? user.favorites.filter(f => f !== id) : [...user.favorites, id] };
                    setUser(updated); saveUser(updated);
                  }} 
                />
              ))
            ) : (
              <p className="col-span-full text-center py-20 text-gray-400 font-bold uppercase text-xs">Тут поки порожньо...</p>
            )}
          </div>
        )}
      </main>

      <Footer />
      <MobileNav currentView={currentView} onNavigate={setCurrentView} hasUser={!!user} />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cartItems} onUpdateQuantity={(id, d) => setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(1, i.quantity + d) } : i))} onRemove={(id) => setCartItems(prev => prev.filter(i => i.id !== id))} onPlaceOrder={handlePlaceOrder} />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} currentUser={user} onLogin={(u) => {setUser(u); saveUser(u);}} onLogout={() => {setUser(null); saveUser(null);}} />
      {currentView === 'admin' && user?.role === 'admin' && <AdminPanel pizzas={pizzas} onUpdatePizzas={handleUpdatePizzas} orders={orders} onUpdateOrderStatus={handleUpdateStatus} onClose={() => setCurrentView('home')} />}

      {flyingPizzas.map(p => (
        <div key={p.id} className="fixed z-[300] pointer-events-none w-16 h-16 md:w-24 md:h-24 rounded-full shadow-2xl overflow-hidden border-4 border-white animate-pizza-fly" style={{ left: p.startX, top: p.startY }}>
          <img src={p.image} className="w-full h-full object-cover" alt="Fly" />
        </div>
      ))}
    </div>
  );
};

export default App;
