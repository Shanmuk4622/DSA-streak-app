import React, { useState } from 'react';
import { supabase } from '../services/supabase';

const AuthComponent: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email for a confirmation link!');
      }
    } catch (error: any) {
      console.error("Authentication error:", error);
      setError(error.error_description || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-8 space-y-8 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-2xl border border-gray-700">
      <div>
        <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
          {isLogin ? 'Welcome Back!' : 'Create an Account'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Start tracking your DSA journey today
        </p>
      </div>
      <form className="mt-8 space-y-6" onSubmit={handleAuth}>
        <div className="rounded-md shadow-sm -space-y-px">
          <div>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900/70 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm rounded-t-md"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-700 bg-gray-900/70 text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm rounded-b-md"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>

        {error && <p className="text-red-400 text-sm text-center">{error}</p>}
        {message && <p className="text-emerald-400 text-sm text-center">{message}</p>}

        <div>
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 focus:ring-offset-gray-800 disabled:bg-teal-800 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-dashed rounded-full animate-spin"></span>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </div>
      </form>
      <div className="text-sm text-center">
        <button
          onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setMessage(null);
          }}
          className="font-medium text-teal-400 hover:text-teal-300 transition-colors"
        >
          {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
        </button>
      </div>
    </div>
  );
};

export default AuthComponent;