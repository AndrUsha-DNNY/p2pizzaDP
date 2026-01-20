
import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { getRegisteredUsers, registerNewUser, getStoredLogo, fetchSettings, DEFAULT_SETTINGS } from '../store';

interface AuthProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
  onLogout: () => void;
  currentUser: User | null;
}

const Auth: React.FC<AuthProps> = ({ isOpen, onClose, onLogin, onLogout, currentUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adminPass, setAdminPass] = useState(DEFAULT_SETTINGS.adminPassword);
  
  const logo = getStoredLogo();

  useEffect(() => {
    if (isOpen) {
      fetchSettings().then(s => {
        if (s?.adminPassword) setAdminPass(s.adminPassword);
      });
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const registeredUsers = getRegisteredUsers();

    if (isRegister) {
      if (password.length < 4) {
        setError('Пароль занадто короткий');
        return;
      }
      const exists = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setError('Такий акаунт вже є');
        return;
      }

      const newUser = {
        id: 'user-' + Date.now(),
        email: email.toLowerCase(),
        password: password,
        name: email.split('@')[0],
        role: 'user',
        favorites: [],
        history: [],
      };
      
      registerNewUser(newUser);
      setSuccess('Акаунт створено! Увійдіть.');
      setIsRegister(false);
      setPassword('');
    } else {
      // ADMIN LOGIN
      if (email.toLowerCase() === 'admin@p2pizza.com' || email.toLowerCase() === 'admin') {
        if (password === adminPass) {
          onLogin({
            id: 'admin-id',
            email: 'admin@p2pizza.com',
            name: 'Адміністратор',
            role: 'admin',
            favorites: [],
            history: [],
          });
          onClose();
        } else {
          setError('Невірний пароль адміністратора');
        }
        return;
      }

      const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user || user.password !== password) {
        setError('Невірна пошта або пароль');
        return;
      }

      onLogin(user);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-black text-center">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={24} />
        </button>

        {currentUser ? (
          <div className="py-6">
            <div className="w-24 h-24 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl overflow-hidden border-4 border-white">
              <img src={logo} className="w-full h-full object-cover" />
            </div>
            <h2 className="text-2xl font-black mb-1 uppercase tracking-tight">{currentUser.name}</h2>
            <p className="text-gray-400 mb-8 font-bold text-xs uppercase tracking-widest">{currentUser.email}</p>
            <button onClick={onLogout} className="w-full py-4 rounded-2xl bg-black text-white font-black uppercase text-sm hover:bg-orange-600 transition-all shadow-lg active:scale-95">Вийти</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="text-left">
            <div className="flex justify-center mb-8">
               <div className="w-20 h-20 bg-orange-500 rounded-2xl overflow-hidden shadow-lg">
                  <img src={logo} className="w-full h-full object-cover" />
               </div>
            </div>
            
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight text-center">
              {isRegister ? 'Реєстрація' : 'Увійти'}
            </h2>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-tight flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl text-[10px] font-black uppercase tracking-tight flex items-center gap-2 border border-green-100">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <div className="space-y-4 mb-8">
              <input type="text" required placeholder="Електронна пошта або 'admin'" className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" value={email} onChange={(e) => setEmail(e.target.value)} />
              <input type="password" required placeholder="Пароль" className="w-full px-4 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button type="submit" className="w-full py-5 bg-orange-500 text-white font-black uppercase tracking-widest text-sm rounded-[2rem] shadow-xl shadow-orange-100 hover:bg-black transition-all mb-4 active:scale-95">
              {isRegister ? 'Зареєструватися' : 'Увійти'}
            </button>

            <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              {isRegister ? 'Маєте акаунт?' : 'Немає акаунту?'} {' '}
              <button type="button" onClick={() => setIsRegister(!isRegister)} className="text-orange-500 hover:underline">
                {isRegister ? 'Увійти' : 'Реєстрація'}
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
