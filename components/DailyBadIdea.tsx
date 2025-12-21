import React, { useEffect, useState } from 'react';
import { BadIdea } from '../types';
import { getDailyIdea } from '../services/supabaseService';
import { ExclamationTriangleIcon, ClockIcon, ArchiveBoxIcon, FireIcon } from '@heroicons/react/24/outline';

const STORAGE_KEY_PREFIX = 'ideascower_idea_';

interface DailyBadIdeaProps {
  targetDate: Date;
  isToday: boolean;
}

const DailyBadIdea: React.FC<DailyBadIdeaProps> = ({ targetDate, isToday }) => {
  const [idea, setIdea] = useState<BadIdea | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');

  // Countdown timer logic for Midnight UTC (Only runs if isToday)
  useEffect(() => {
    if (!isToday) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const nextMidnight = new Date(now);
      nextMidnight.setUTCDate(nextMidnight.getUTCDate() + 1);
      nextMidnight.setUTCHours(0, 0, 0, 0);
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

  // Auto-refresh when countdown hits midnight
  useEffect(() => {
    if (timeLeft === "00:00:00" && isToday) {
      // Prevent multiple reloads on the same day
      const lastReloadDate = localStorage.getItem('last_midnight_reload');
      const currentDate = new Date().toISOString().split('T')[0];

      if (lastReloadDate !== currentDate) {
        // Mark that we've reloaded for this date
        localStorage.setItem('last_midnight_reload', currentDate);

        // Clear localStorage cache for new day
        const dateKey = new Date().toISOString().split('T')[0];
        const storageKey = `${STORAGE_KEY_PREFIX}${dateKey}`;
        localStorage.removeItem(storageKey);

        // Trigger refetch by updating the idea state
        // The parent component will handle updating targetDate
        window.location.reload();
      }
    }
  }, [timeLeft, isToday]);

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
        const data = await getDailyIdea(targetDate);
        // Map snake_case response to camelCase for component
        const idea: BadIdea = {
          title: data.title,
          pitch: data.pitch,
          fatalFlaw: data.fatal_flaw,
          verdict: data.verdict
        };
        localStorage.setItem(storageKey, JSON.stringify(idea));
        setIdea(idea);
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
      <div className="border border-tower-gray bg-tower-dark relative overflow-hidden group shadow-2xl transition-all duration-500">
        
        {/* Decorative corner - Always visible now, creating a consistent vibe */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl pointer-events-none bg-tower-accent/20"></div>
        
        {/* Subtle grid texture overlay for that premium feel */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        <div className="p-8 md:p-12 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            
            {/* Status Badge */}
            {isToday ? (
                <span className="inline-block px-3 py-1 text-xs font-mono font-bold text-tower-accent bg-tower-accent/5 border border-tower-accent/20 uppercase tracking-wider shadow-[0_0_10px_rgba(255,62,62,0.1)]">
                  Today's Disaster
                </span>
            ) : (
                <span className="inline-block px-3 py-1 text-xs font-mono font-bold text-tower-neon bg-tower-neon/5 border border-tower-neon/20 uppercase tracking-wider flex items-center gap-2 shadow-[0_0_10px_rgba(0,255,65,0.1)]">
                  <ArchiveBoxIcon className="w-3 h-3" />
                  Archived Record
                </span>
            )}

            {/* Timer or Date Stamp */}
            <div className={`flex items-center gap-2 text-xs font-mono uppercase tracking-widest px-3 py-1 rounded border border-tower-gray bg-tower-black/50 text-gray-400`}>
              {isToday ? (
                  <>
                    <ClockIcon className="w-4 h-4 text-tower-neon" />
                    Next Idea in <span className="text-white tabular-nums">{timeLeft}</span>
                  </>
              ) : (
                  <>
                    <FireIcon className="w-4 h-4 text-tower-accent-dim" />
                    <span>Failed on {targetDate.toLocaleDateString()}</span>
                  </>
              )}
            </div>
          </div>

          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-8 tracking-tight text-white drop-shadow-sm">
            {idea.title}
          </h1>

          <div className="grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="font-mono text-sm uppercase border-b border-tower-gray pb-2 mb-4 text-tower-neon">
                The Pitch
              </h3>
              <p className="text-gray-300 text-lg leading-relaxed font-light">
                {idea.pitch}
              </p>
            </div>

            <div className="space-y-4 relative">
               <div className="absolute -left-6 top-0 bottom-0 w-px hidden md:block bg-tower-gray"></div>
              <h3 className="font-mono text-sm uppercase border-b border-tower-gray pb-2 mb-4 flex items-center gap-2 text-tower-accent">
                <ExclamationTriangleIcon className="w-4 h-4" />
                The Fatal Flaw
              </h3>
              <p className="text-gray-300 text-base leading-relaxed">
                {idea.fatalFlaw}
              </p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-tower-gray text-center">
            <p className="font-mono italic text-xl text-tower-accent">
              "{idea.verdict}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyBadIdea;