import React, { useEffect, useState } from 'react';
import { BadIdea } from '../types';
import { getDailyBadIdea } from '../services/supabaseService';
import { ExclamationTriangleIcon, ClockIcon, ArchiveBoxIcon } from '@heroicons/react/24/outline';

const STORAGE_KEY_PREFIX = 'ideascower_idea_';

interface DailyBadIdeaProps {
  targetDate: Date;
  isToday: boolean;
}

const DailyBadIdea: React.FC<DailyBadIdeaProps> = ({ targetDate, isToday }) => {
  const [idea, setIdea] = useState<BadIdea | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Countdown timer logic for Midnight UTC (Only runs if isToday)
  useEffect(() => {
    if (!isToday) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setUTCHours(24, 0, 0, 0);
      const diff = nextMidnight.getTime() - now.getTime();
      
      if (diff <= 0) return "00:00:00";
      
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [isToday]);

  useEffect(() => {
    const fetchAndCacheIdea = async () => {
      setLoading(true);
      setIdea(null);

      // Create a unique key for this specific date: YYYY-MM-DD
      const dateKey = targetDate.toISOString().split('T')[0];
      const storageKey = `${STORAGE_KEY_PREFIX}${dateKey}`;
      const storedData = localStorage.getItem(storageKey);

      // Check cache first
      if (storedData) {
        try {
          setIdea(JSON.parse(storedData));
          setLoading(false);
          return;
        } catch (e) {
          console.error("Failed to parse stored idea", e instanceof Error ? e.message : String(e));
        }
      }

      // Fetch from API
      try {
        const data = await getDailyBadIdea(targetDate);
        localStorage.setItem(storageKey, JSON.stringify(data));
        setIdea(data);
      } catch (error) {
        console.error("Failed to fetch daily idea", error instanceof Error ? error.message : String(error));
      } finally {
        setLoading(false);
      }
    };

    fetchAndCacheIdea();
  }, [targetDate]); // Refetch when date changes

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 border-4 border-t-transparent border-tower-accent rounded-full animate-spin mb-6"></div>
        <p className="font-mono text-lg tracking-widest text-tower-accent animate-pulse text-center">
           {isToday ? 'CALCULATING FAILURE VECTORS...' : 'RETRIEVING ARCHIVAL DATA...'}
        </p>
      </div>
    );
  }

  if (!idea) return null;

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className={`border relative overflow-hidden group shadow-2xl transition-colors duration-500
          ${isToday ? 'border-tower-gray bg-tower-dark' : 'border-gray-800 bg-[#080808]'}
      `}>
        
        {/* Decorative corner - Feathered edges */}
        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none
            ${isToday ? 'bg-tower-accent/20' : 'bg-gray-700/10'}
        `}></div>
        
        <div className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            
            {/* Status Badge - Removed flashing bg, nice subtle border now */}
            {isToday ? (
                <span className="inline-block px-3 py-1 text-xs font-mono font-bold text-tower-accent bg-tower-accent/5 border border-tower-accent/20 uppercase tracking-wider">
                  Today's Disaster
                </span>
            ) : (
                <span className="inline-block px-3 py-1 text-xs font-mono font-bold text-gray-400 bg-gray-900 border border-gray-700 uppercase tracking-wider flex items-center gap-2">
                  <ArchiveBoxIcon className="w-3 h-3" />
                  Archived Record
                </span>
            )}

            {/* Timer or Date Stamp */}
            <div className={`flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-1 rounded border
                ${isToday ? 'text-gray-500 bg-tower-black/50 border-tower-gray' : 'text-gray-600 border-gray-800 bg-transparent'}
            `}>
              {isToday ? (
                  <>
                    <ClockIcon className="w-4 h-4 text-tower-neon" />
                    Next Idea in <span className="text-white tabular-nums">{timeLeft}</span>
                  </>
              ) : (
                  <span className="text-gray-500">Record #{targetDate.toISOString().split('T')[0].replace(/-/g,'')}</span>
              )}
            </div>
          </div>

          <h1 className={`text-4xl md:text-6xl font-serif font-bold mb-8 tracking-tight
             ${isToday ? 'text-white' : 'text-gray-300'}
          `}>
            {idea.title}
          </h1>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className={`font-mono text-sm uppercase border-b pb-2 mb-4
                  ${isToday ? 'text-tower-neon border-tower-gray' : 'text-gray-500 border-gray-800'}
              `}>
                The Pitch
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed font-light">
                {idea.pitch}
              </p>
            </div>

            <div className="space-y-4 relative">
               <div className={`absolute -left-6 top-0 bottom-0 w-px hidden md:block
                   ${isToday ? 'bg-tower-gray' : 'bg-gray-800'}
               `}></div>
              <h3 className={`font-mono text-sm uppercase border-b pb-2 mb-4 flex items-center gap-2
                   ${isToday ? 'text-tower-accent border-tower-gray' : 'text-gray-500 border-gray-800'}
              `}>
                <ExclamationTriangleIcon className="w-4 h-4" />
                The Fatal Flaw
              </h3>
              <p className="text-gray-400 text-base leading-relaxed">
                {idea.fatalFlaw}
              </p>
            </div>
          </div>

          <div className={`mt-12 pt-8 border-t text-center
              ${isToday ? 'border-tower-gray' : 'border-gray-800'}
          `}>
            <p className={`font-mono italic text-xl
                ${isToday ? 'text-tower-accent' : 'text-gray-500'}
            `}>
              "{idea.verdict}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyBadIdea;