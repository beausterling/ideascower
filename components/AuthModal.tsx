import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, mode: initialMode }) => {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signIn, signUp } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signin') {
        await signIn(email, password);
        onClose();
      } else {
        await signUp(email, password);
        setSignupSuccess(true);
        // Don't close modal yet - show confirmation message
        return;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-tower-dark border border-tower-gray max-w-md w-full mx-4 p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <h2 className="text-3xl font-serif text-white mb-2">
          {mode === 'signin' ? 'Welcome Back' : 'Join IdeasCower'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {mode === 'signin'
            ? 'Sign in to roast ideas and chat with The Liquidator'
            : 'Create an account to access premium failure analysis'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-tower-black border border-tower-gray text-white px-4 py-3 focus:border-tower-accent outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-mono text-gray-400 mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-tower-black border border-tower-gray text-white px-4 py-3 focus:border-tower-accent outline-none transition"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900 text-red-400 px-4 py-2 text-sm">
              {error}
            </div>
          )}

          {signupSuccess && (
            <div className="bg-tower-neon/10 border border-tower-neon text-tower-neon px-4 py-3 text-sm">
              <p className="font-mono mb-2">✓ Account created successfully!</p>
              <p>Check your email to confirm your account, then return here to sign in.</p>
            </div>
          )}

          {!signupSuccess ? (
            <button
            type="submit"
            disabled={loading}
            className="w-full bg-tower-accent text-white py-3 font-mono uppercase tracking-wider hover:bg-white hover:text-black transition disabled:opacity-50"
          >
            {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSignupSuccess(false);
                setMode('signin');
                setEmail('');
                setPassword('');
                setLoading(false);
              }}
              className="w-full bg-tower-neon text-black py-3 font-mono uppercase tracking-wider hover:bg-white transition"
            >
              Continue to Sign In
            </button>
          )}
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
