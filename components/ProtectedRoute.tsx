import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { LockClosedIcon } from '@heroicons/react/24/outline';

interface ProtectedRouteProps {
  children: React.ReactNode;
  feature: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, feature }) => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-t-transparent border-tower-accent rounded-full animate-spin mb-6"></div>
        <p className="font-mono text-lg text-tower-accent">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="w-full max-w-4xl mx-auto p-6">
          <div className="border border-tower-gray bg-tower-dark p-12 text-center">
            <LockClosedIcon className="w-16 h-16 mx-auto mb-4 text-tower-accent" />
            <h2 className="text-3xl font-serif text-white mb-4">{feature} Requires Authentication</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Sign in to access {feature.toLowerCase()} and save your data.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-tower-accent text-white px-8 py-3 font-mono uppercase tracking-wider hover:bg-white hover:text-black transition"
            >
              Sign In / Sign Up
            </button>
          </div>
        </div>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode="signin"
        />
      </>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
