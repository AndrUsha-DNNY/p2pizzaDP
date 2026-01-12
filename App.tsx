
import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import PizzaCard from './components/PizzaCard';
import Cart from './components/Cart';
import Auth from './components/Auth';
import AdminPanel from './components/AdminPanel';
import CookingTracker from './components/CookingTracker';
import Footer from './components/Footer';
import { Pizza, CartItem, Order, User, OrderStatus, SiteSpecial } from './types';
import { getStoredPizzas, savePizzas, getStoredUser, saveUser, getStoredOrders, saveOrders, saveOrder, getStoredSpecial } from './store';
import { Clock, CheckCircle2, ShoppingCart, Info, ShoppingBag, MapPin, Phone, Pizza as PizzaIcon, Package, Star, Heart, History, XCircle } from 'lucide-react';

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
  const [isBumping, setIsBumping] = useState(false);
  const [flyingPizzas, setFlyingPizzas] = useState<FlyingPizza[]>([]);
  
  const [siteSpecial, setSiteSpecial] = useState<SiteSpecial>(getStoredSpecial());

  useEffect(() => {
    setPizzas(getStoredPizzas());
    setUser(getStoredUser());
    setOrders(getStoredOrders());
    setSiteSpecial(getStoredSpecial());
  }, []);

  useEffect(() => {
    if (currentView === 'home' || currentView === 'admin') {
      setSiteSpecial(getStoredSpecial());
    }
  }, [currentView]);

  const cartCount = useMemo(() => cartItems.reduce((acc, item) => acc + item.quantity, 0), [cartItems]);

  useEffect(() => {
    if (cartCount === 0) return;
    setIsBumping(true);
    const timer = setTimeout(() => setIsBumping(false), 300);
    return () => clearTimeout(timer);
  }, [cartCount]);

  const activePreparingOrder = useMemo(() => {
    return orders.find(o => o.status === 'preparing');
  }, [orders]);

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
      setNotification(`${pizza.name} додано!`);
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
    setCartItems([]);
    setIsCartOpen(false);
    
    alert('Ваше замовлення прийнято! Слідкуйте за статусом в історії.');
    setCurrentView('history');
  };

  const onUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    const updatedOrders = orders.map(o => {
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
    if (confirm('Ви впевнені, що хочете скасувати замовлення?')) {
      const updatedOrders = orders.map(o => o.id === orderId ? { ...o, status: 'cancelled' as OrderStatus } : o);
      setOrders(updatedOrders);
      saveOrders(updatedOrders);
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
    <div className="min-h-screen pb-24 md:pb-0 relative bg-[#fffaf5]">
      <Header 
        user={user} 
        onOpenAuth={() => setIsAuthOpen(true)}
        onNavigate={setCurrentView}
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main className="container mx-auto px-4 py-8 min-h-[60vh]">
        {activePreparingOrder && (
          <div className="max-w-xl mx-auto mb-16">
            <div className="flex items-center gap-2 mb-4 justify-center text-orange-600 font-black uppercase text-xs tracking-widest">
                <Info size={16} /> Поточне замовлення {activePreparingOrder.id}
            </div>
            <CookingTracker startTime={activePreparingOrder.preparingStartTime!} />
          </div>
        )}

        {currentView === 'home' && (
          <section className="mb-12 relative rounded-[3rem] overflow-hidden h-[300px] md:h-[500px] shadow-2xl border-4 border-white">
            <img src={siteSpecial.image} className="w-full h-full object-cover brightness-[0.45] transition-all duration-700" alt="Promo" />
            <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 text-white">
              <span className="bg-orange-500 w-fit px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 animate-bounce">
                {siteSpecial.badge}
              </span>
              <h1 className="text-4xl md:text-7xl font-black mb-4 leading-none tracking-tighter max-w-3xl drop-shadow-lg">
                {siteSpecial.title}
              </h1>
              <p className="text-lg md:text-2xl text-gray-200 max-w-xl mb-8 font-medium drop-shadow">
                {siteSpecial.description}
              </p>
              <div className="flex flex-wrap gap-4">
                  <button onClick={() => setCurrentView('promotions')} className="bg-orange-500 text-white w-fit px-10 py-4 rounded-[2rem] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-orange-500/20 active:scale-95">Дивитись акції</button>
              </div>
            </div>
          </section>
        )}

        <div className="mb-10">
          <h2 className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4 text-black">
            {currentView === 'home' && 'Наше меню піци'}
            {currentView === 'box' && 'BOX-меню та закуски'}
            {currentView === 'promotions' && 'Гарячі акції'}
            {currentView === 'new' && 'Останні новинки'}
            {currentView === 'favorites' && 'Твоє улюблене'}
            {currentView === 'history' && 'Твої замовлення'}
            <div className="h-1.5 flex-grow bg-orange-100 rounded-full hidden md:block" />
          </h2>
        </div>

        {currentView === 'history' ? (
          <div className="max-w-4xl mx-auto space-y-6">
            {orders.length === 0 ? (
              <div className="text-center py-32 bg-white rounded-[3rem] shadow-sm border border-gray-100">
                <ShoppingBag className="w-20 h-20 mx-auto text-gray-100 mb-6" />
                <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Історія замовлень порожня</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-orange-50 flex flex-col md:flex-row gap-8 items-center text-black">
                  <div className="flex-grow w-full">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black bg-black text-white px-3 py-1 rounded-lg uppercase tracking-widest">{order.id}</span>
                        <span className="text-gray-400 text-xs font-bold">{order.date}</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest ${order.paymentMethod === 'card_on_receipt' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-700'}`}>
                        {order.paymentMethod === 'card_on_receipt' ? 'Картою' : 'Готівка'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {order.items.map(item => (
                        <span key={item.id} className="bg-orange-50 text-orange-600 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight">
                          {item.name} x{item.quantity}
                        </span>
                      ))}
                    </div>

                    {order.type === 'delivery' && (
                      <div className="bg-gray-50 p-4 rounded-2xl mb-4 space-y-1">
                         <div className="flex items-center gap-2 text-xs font-black uppercase text-black">
                            <MapPin size={14} className="text-orange-500" /> {order.address}, {order.houseNumber}
                         </div>
                         <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                            <Phone size={12} className="text-orange-500" /> {order.phone}
                         </div>
                      </div>
                    )}

                    {order.notes && (
                      <div className="bg-orange-50/50 p-4 rounded-2xl mb-4 border border-orange-100">
                         <div className="text-[10px] font-black uppercase text-orange-600 mb-1">Коментар до замовлення:</div>
                         <div className="text-xs font-medium text-black italic">"{order.notes}"</div>
                      </div>
                    )}

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-xs font-black uppercase text-gray-500"><Clock size={16} className="text-orange-500" /> {order.type === 'delivery' ? 'Доставка' : 'Самовивіз'}</div>
                      <div className={`flex items-center gap-2 text-xs font-black uppercase ${order.status === 'completed' || order.status === 'delivered' ? 'text-green-600' : order.status === 'cancelled' ? 'text-red-500' : 'text-orange-600'}`}>
                        {order.status === 'completed' || order.status === 'delivered' ? <CheckCircle2 size={16} /> : order.status === 'cancelled' ? <XCircle size={16} /> : <div className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin" />}
                        {order.status === 'pending' ? 'Очікує' : order.status === 'preparing' ? 'Готується' : order.status === 'ready' ? 'Готово' : order.status === 'delivered' ? 'Доставлено' : order.status === 'cancelled' ? 'Скасовано' : 'Виконано'}
                      </div>
                    </div>
                  </div>
                  <div className="text-center md:text-right min-w-[150px] border-t md:border-t-0 md:border-l pt-6 md:pt-0 md:pl-8 flex flex-col items-center md:items-end">
                    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Разом</p>
                    <p className="text-3xl font-black text-black mb-4">{order.total} <span className="text-sm font-bold text-orange-500">грн</span></p>
                    
                    {order.status === 'pending' && (
                      <button 
                        onClick={() => handleCancelOrder(order.id)}
                        className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-all border border-red-100"
                      >
                        <XCircle size={14} /> Скасувати
                      </button>
                    )}
                    
                    {(order.status === 'completed' || order.status === 'delivered' || order.status === 'cancelled') && (
                      <button className="text-orange-500 text-[10px] font-black uppercase tracking-widest hover:text-black transition-colors">Повторити</button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {filteredPizzas.map(pizza => (
              <PizzaCard key={pizza.id} pizza={pizza} onAddToCart={handleAddToCart} isFavorite={user?.favorites.includes(pizza.id) || false} onToggleFavorite={handleToggleFavorite} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      {showMobileNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-t border-orange-100 flex items-center justify-around px-2 py-3 md:hidden shadow-[0_-10px_30px_rgba(0,0,0,0.05)] animate-in slide-in-from-bottom duration-300 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            if (item.requireAuth && !user) return null;

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${isActive ? 'text-orange-500 scale-110' : 'text-gray-400'}`}
              >
                <Icon size={22} className={isActive ? 'fill-orange-50' : ''} />
                <span className="text-[10px] font-black uppercase tracking-tight">{item.label}</span>
                {isActive && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-1 h-1 bg-orange-500 rounded-full" />
                )}
              </button>
            );
          })}
          {/* Special mobile cart button integration */}
          <button 
            onClick={() => setIsCartOpen(true)}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 relative ${cartCount > 0 ? 'text-black' : 'text-gray-400'}`}
          >
            <ShoppingCart size={22} />
            <span className="text-[10px] font-black uppercase tracking-tight">Кошик</span>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-orange-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {cartCount}
              </span>
            )}
          </button>
        </nav>
      )}

      {/* Flying Pizza Animation Elements */}
      {flyingPizzas.map(p => (
        <div 
          key={p.id}
          className="fixed z-[200] w-32 h-32 rounded-full shadow-2xl pointer-events-none"
          style={{
            left: p.startX,
            top: p.startY,
            animation: 'flyToCart 0.7s cubic-bezier(0.42, 0, 0.58, 1) forwards',
          }}
        >
          <img src={p.image} className="w-full h-full object-cover rounded-full border-4 border-white" alt="Flying Pizza" />
        </div>
      ))}

      <style>{`
        @keyframes flyToCart {
          0% { 
            transform: scale(1) rotate(0deg); 
            opacity: 1; 
          }
          40% {
            transform: scale(0.6) rotate(180deg);
            opacity: 1;
          }
          100% { 
            left: calc(100vw - 180px); 
            top: 20px; 
            transform: scale(0.1) rotate(720deg); 
            opacity: 0; 
          }
        }
        @media (max-width: 1024px) {
          @keyframes flyToCart {
            0% { transform: scale(1) rotate(0deg); opacity: 1; }
            100% { 
              left: calc(100vw - 120px); 
              top: calc(100vh - 120px); 
              transform: scale(0.1) rotate(720deg); 
              opacity: 0; 
            }
          }
        }
      `}</style>

      <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} items={cartItems} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemoveFromCart} onPlaceOrder={handlePlaceOrder} />
      <Auth isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} currentUser={user} onLogin={(u) => { setUser(u); saveUser(u); }} onLogout={() => { setUser(null); saveUser(null); }} />
      {currentView === 'admin' && user?.role === 'admin' && <AdminPanel pizzas={pizzas} onUpdatePizzas={(newPizzas) => { setPizzas(newPizzas); savePizzas(newPizzas); }} orders={orders} onUpdateOrderStatus={onUpdateOrderStatus} onClose={() => setCurrentView('home')} />}

      {notification && (
        <div className="fixed bottom-36 right-8 z-[110] bg-black text-white px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-right duration-300 border border-orange-500">
          {notification}
        </div>
      )}
    </div>
  );
};

export default App;
