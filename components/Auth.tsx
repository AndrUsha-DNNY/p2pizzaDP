
import React, { useState } from 'react';
import { X, Mail, Lock, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { User } from '../types';
import { getAdminPassword, getRegisteredUsers, registerNewUser } from '../store';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validation: Password length 8 to 16
    if (password.length < 8 || password.length > 16) {
      setError('Пароль має бути від 8 до 16 символів');
      return;
    }

    const registeredUsers = getRegisteredUsers();

    if (isRegister) {
      // Check if account already exists
      const exists = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (exists) {
        setError('Такий акаунт вже є');
        return;
      }

      // Simulation: register user
      const newUser = {
        id: 'user-' + Date.now(),
        email: email.toLowerCase(),
        password: password, // In a real app, this would be hashed
        name: email.split('@')[0],
        role: 'user',
        favorites: [],
        history: [],
      };
      
      registerNewUser(newUser);
      setSuccess('Акаунт успішно створено! Тепер увійдіть.');
      setIsRegister(false);
      setPassword('');
    } else {
      // Admin login logic
      if (email.toLowerCase() === 'admin@p2pizza.com') {
        const storedAdminPass = getAdminPassword();
        if (password === storedAdminPass) {
          onLogin({
            id: 'admin-id',
            email,
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

      // Check if user exists in simulation DB
      const user = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        setError('Такого акаунту немає');
        return;
      }

      if (user.password !== password) {
        setError('Невірний пароль');
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
      <div className="relative w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 text-black">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors">
          <X size={24} />
        </button>

        {currentUser ? (
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserIcon size={40} />
            </div>
            <h2 className="text-2xl font-black mb-1 uppercase tracking-tight">{currentUser.name}</h2>
            <p className="text-gray-500 mb-6 font-medium">{currentUser.email}</p>
            <button 
              onClick={onLogout}
              className="w-full py-4 rounded-2xl bg-red-50 text-red-600 font-black uppercase text-sm hover:bg-red-100 transition-colors"
            >
              Вийти з акаунту
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-3xl font-black mb-2 uppercase tracking-tight leading-none">
              {isRegister ? 'Створити акаунт' : 'Увійти до P2P'}
            </h2>
            <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-8">
              {isRegister ? 'Приєднуйтесь до нашої піца-родини' : 'Ваша улюблена піца чекає'}
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-tight flex items-center gap-2 border border-red-100 animate-in shake-x duration-300">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {success && (
              <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-2xl text-xs font-black uppercase tracking-tight flex items-center gap-2 border border-green-100 animate-in zoom-in duration-300">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                <input 
                  type="email" 
                  required
                  placeholder="Електронна пошта" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={20} />
                <input 
                  type="password" 
                  required
                  placeholder="Пароль (8-16 символів)" 
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-orange-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={16}
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full py-5 bg-orange-500 text-white font-black uppercase tracking-widest text-sm rounded-[2rem] shadow-xl shadow-orange-100 hover:bg-black transition-all mb-4 active:scale-95"
            >
              {isRegister ? 'Зареєструватися' : 'Увійти'}
            </button>

            <p className="text-center text-[10px] font-black uppercase tracking-widest text-gray-400">
              {isRegister ? 'Вже маєте акаунт?' : 'Ще не маєте акаунту?'} {' '}
              <button 
                type="button"
                onClick={() => {
                   setIsRegister(!isRegister);
                   setError(null);
                   setSuccess(null);
                }}
                className="text-orange-500 hover:underline"
              >
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
