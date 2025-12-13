import React, { useEffect, useState } from 'react';
import { BadIdea } from '../types';
import { getDailyBadIdea } from '../services/geminiService';
import { ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const DailyBadIdea: React.FC = () => {
  const [idea, setIdea] = useState<BadIdea | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchIdea = async () => {
    setLoading(true);
    const data = await getDailyBadIdea();
    setIdea(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchIdea();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-tower-accent animate-pulse">
        <div className="w-16 h-16 border-4 border-t-transparent border-tower-accent rounded-full animate-spin mb-4"></div>
        <p className="font-mono text-lg tracking-widest">CALCULATING FAILURE VECTORS...</p>
        <p className="text-xs text-gray-500 mt-2 font-mono">Thinking Model Active (Budget: 32k tokens)</p>
      </div>
    );
  }

  if (!idea) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="border border-tower-gray bg-tower-dark relative overflow-hidden group">
        
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-tower-accent/20 to-transparent"></div>
        
        <div className="p-8 md:p-12">
          <div className="flex justify-between items-start mb-6">
            <span className="inline-block px-3 py-1 text-xs font-mono font-bold text-tower-black bg-tower-accent uppercase tracking-wider">
              Today's Disaster
            </span>
            <button 
              onClick={fetchIdea}
              className="text-gray-500 hover:text-white transition-colors"
              title="Load another bad idea"
            >
              <ArrowPathIcon className="w-6 h-6" />
            </button>
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-8 tracking-tight">
            {idea.title}
          </h1>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-tower-neon font-mono text-sm uppercase border-b border-tower-gray pb-2 mb-4">
                The Pitch
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed font-light">
                {idea.pitch}
              </p>
            </div>

            <div className="space-y-4 relative">
               <div className="absolute -left-6 top-0 bottom-0 w-px bg-tower-gray hidden md:block"></div>
              <h3 className="text-tower-accent font-mono text-sm uppercase border-b border-tower-gray pb-2 mb-4 flex items-center gap-2">
                <ExclamationTriangleIcon className="w-4 h-4" />
                The Fatal Flaw
              </h3>
              <p className="text-gray-400 text-base leading-relaxed">
                {idea.fatalFlaw}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-tower-gray text-center">
            <p className="font-mono text-tower-accent italic text-xl">
              "{idea.verdict}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyBadIdea;