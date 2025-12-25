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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

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

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Note: This redirects to Google, so we won't reach onClose()
      // The auth state change listener will handle the session after redirect
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
      setGoogleLoading(false);
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
            ? 'Sign in to get your ideas ROASTED.'
            : 'Sign up to get your ideas ROASTED.'}
        </p>

        {/* Google Sign In Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 py-3 px-4 font-medium hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </button>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-tower-gray"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-tower-dark text-gray-500 font-mono">or</span>
          </div>
        </div>

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
