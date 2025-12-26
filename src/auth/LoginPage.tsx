import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Smartphone, Eye, EyeOff } from 'lucide-react'; // Eye icons add kiye
import toast, { Toaster } from 'react-hot-toast';
import { loginUser } from '../api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Password dikhane ke liye state
  const navigate = useNavigate();

  // --- 1. BACK BUTTON PROTECTION ---
  // Agar user pehle se logged in hai, toh usay login page mat dikhao
  useEffect(() => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    if (isLoggedIn) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await loginUser({ email, password });
      if (response.status === 200) {
        localStorage.setItem("isLoggedIn", "true");
        toast.success("Login Successful!");
        
        // replace: true history stack se login page ko nikaal deta hai
        navigate("/dashboard", { replace: true });
      }
    } catch {
      toast.error("Invalid Email or Password!");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans">
      <Toaster position="top-center" />
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="text-center mb-10">
          <div className="bg-teal-500 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Smartphone className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 tracking-tight">MobileHub Admin</h1>
          <p className="text-gray-500 mt-2 text-sm">Enter credentials to access shop database</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                type="email" 
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm" 
                placeholder="admin@example.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2 uppercase ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
              <input 
                type={showPassword ? "text" : "password"} // Type toggle hoga
                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-teal-500 outline-none transition-all text-sm" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              {/* --- 2. SHOW/HIDE PASSWORD TOGGLE --- */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-4 rounded-2xl transition shadow-lg shadow-teal-100 active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;