
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
  fetchOrders, saveOrderToDB, updateOrderStatusInDB, fetchSettings, sendTelegramNotification
} from './store.ts';

const App: React.FC = () => {
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [currentView, setCurrentView] = useState('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);

  const activeTrackerOrder = useMemo(() => {
    return orders.find(o => o.status === 'Готується' || o.status === 'Готово');
  }, [orders]);

  const refreshAll = async () => {
    const [p, o, s] = await Promise.all([fetchPizzas(), fetchOrders(), fetchSettings()]);
    if (p) setPizzas(p);
    if (o) setOrders(o);
    if (s) setSiteSettings(s);
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await refreshAll();
      setUser(getStoredUser());
      setIsLoading(false);
    };
    init();
    const interval = setInterval(refreshAll, 15000); // Синхронізація кожні 15 сек
    return () => clearInterval(interval);
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
      status: 'Нове',
      notes: orderData.notes
    };

    setOrders(prev => [newOrder, ...prev]);
    const success = await saveOrderToDB(newOrder);
    if (success) await sendTelegramNotification(newOrder);

    setCartItems([]);
    setIsCartOpen(false);
    setCurrentView('history');
    setTimeout(refreshAll, 1000);
  };

  const handleUpdatePizzas = async (newPizzas: Pizza[]) => {
    setPizzas(newPizzas);
    await savePizzasToDB(newPizzas);
  };

  const handleUpdateStatus = async (id: string, status: OrderStatus) => {
    await updateOrderStatusInDB(id, status);
    refreshAll();
  };

  if (isLoading || !siteSettings) {
    return (
      <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="font-black uppercase tracking-widest text-xs">Завантаження P2PIZZA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32 md:pb-12 bg-[#fffaf5] text-black">
      <Header 
        user={user} 
        onOpenAuth={() => setIsAuthOpen(true)} 
        onNavigate={setCurrentView} 
        cartCount={cartCount} 
        onOpenCart={() => setIsCartOpen(true)}
        siteSettings={siteSettings}
      />
      
      {currentView === 'home' && (
        <>
          <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
            <img src={siteSettings.special.image} className="absolute inset-0 w-full h-full object-cover brightness-50" alt="Hero" />
            <div className="relative z-10 text-center text-white px-4">
              <h1 className="text-4xl md:text-7xl font-black uppercase mb-4 tracking-tighter">{siteSettings.special.title}</h1>
              <p className="text-lg opacity-90 max-w-xl mx-auto mb-8 font-medium">{siteSettings.special.description}</p>
              <button onClick={() => document.getElementById('menu')?.scrollIntoView({behavior:'smooth'})} className="bg-orange-500 text-white px-10 py-4 rounded-full font-black uppercase shadow-xl hover:bg-white hover:text-orange-500 transition-all active:scale-95">Меню</button>
            </div>
          </section>
          {activeTrackerOrder && (
            <div className="container mx-auto px-4 -mt-16 relative z-20 max-w-2xl">
              <CookingTracker startTime={activeTrackerOrder.preparingStartTime || Date.now()} isReadyOverride={activeTrackerOrder.status === 'Готово'} />
            </div>
          )}
        </>
      )}

      <main id="menu" className="container mx-auto px-4 py-12">
        <h2 className="text-3xl font-black uppercase mb-10 tracking-tighter">
          {currentView === 'history' ? 'Історія' : currentView === 'favorites' ? 'Обране' : 'Наше Меню'}
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {(currentView === 'history' ? orders : pizzas.filter(p => {
            if (currentView === 'favorites') return user?.favorites.includes(p.id);
            if (currentView === 'box') return p.category === 'box';
            if (currentView === 'promotions') return p.isPromo;
            return p.category === 'pizza';
          })).map(item => (
            currentView === 'history' ? (
              <div key={(item as Order).id} className="bg-white p-6 rounded-3xl border border-orange-50 shadow-sm">
                <p className="font-black text-[9px] text-gray-400 uppercase">{(item as Order).id} • {(item as Order).date}</p>
                <p className="font-bold text-sm">{(item as Order).items.map(i => i.name).join(', ')}</p>
                <p className="text-[10px] font-black uppercase mt-1 text-orange-500">{(item as Order).status}</p>
              </div>
            ) : (
              <PizzaCard 
                key={(item as Pizza).id} 
                pizza={item as Pizza} 
                onAddToCart={(p, r) => setCartItems(prev => {
                  const exist = prev.find(i => i.id === p.id);
                  return exist ? prev.map(i => i.id === p.id ? {...i, quantity: i.quantity + 1} : i) : [...prev, {...p, quantity: 1}];
                })} 
                isFavorite={user?.favorites.includes((item as Pizza).id) || false} 
                onToggleFavorite={(id) => {
                  if (!user) return setIsAuthOpen(true);
                  const updated = {...user, favorites: user.favorites.includes(id) ? user.favorites.filter(f => f !== id) : [...user.favorites, id]};
                  setUser(updated); saveUser(updated);
                }} 
              />
            )
          ))}
        </div>
      </main>

      <Footer siteSettings={siteSettings} />
      <MobileNav currentView={currentView} onNavigate={setCurrentView} hasUser={!!user} />
      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cartItems} onUpdateQuantity={(id, d) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(1, i.quantity + d)} : i))} onRemove={(id) => setCartItems(prev => prev.filter(i => i.id !== id))} onPlaceOrder={handlePlaceOrder} />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} currentUser={user} onLogin={(u) => {setUser(u); saveUser(u);}} onLogout={() => {setUser(null); saveUser(null);}} />
      {currentView === 'admin' && user?.role === 'admin' && <AdminPanel pizzas={pizzas} onUpdatePizzas={handleUpdatePizzas} orders={orders} onUpdateOrderStatus={handleUpdateStatus} onClose={() => setCurrentView('home')} siteSettings={siteSettings} onUpdateSettings={setSiteSettings} />}
    </div>
  );
};

export default App;
