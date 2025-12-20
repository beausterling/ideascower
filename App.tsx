import React, { useState, useEffect } from 'react';
import { AppSection } from './types';
import DailyBadIdea from './components/DailyBadIdea';
import IdeaRoaster from './components/IdeaRoaster';
import { FireIcon, NewspaperIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

// Using the raw GitHub URL based on the permalink provided
const LOGO_URL = 'https://raw.githubusercontent.com/beausterling/ideascower/8763f31e91a4c1d4055de90724619d92268ff4ca/lava-ball-final.png';

// CRITICAL: This date marks "Day 1" (Issue #1). 
// Set this to the Midnight UTC of the actual launch day.
const LAUNCH_DATE = new Date('2025-12-13T00:00:00Z').getTime(); 

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DAILY_DOOM);
  const [imgError, setImgError] = useState(false);
  
  // State to track which date we are currently viewing
  const [viewingDate, setViewingDate] = useState<Date>(new Date());
  const [dateInfo, setDateInfo] = useState({ dateString: '', issueNumber: 1, isToday: true });

  useEffect(() => {
    // 1. Format the date string for display
    const formattedDate = viewingDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });

    // 2. Calculate Issue Number based on 24-hour periods since launch (UTC aligned)
    const msPerDay = 24 * 60 * 60 * 1000;
    const diff = viewingDate.getTime() - LAUNCH_DATE;
    
    // Ensure Issue #1 is the minimum. 
    const issueNum = Math.max(1, Math.floor(diff / msPerDay) + 1);

    // 3. Check if we are viewing "Today"
    const today = new Date();
    const isToday = viewingDate.toDateString() === today.toDateString();

    setDateInfo({
        dateString: formattedDate,
        issueNumber: issueNum,
        isToday: isToday
    });
  }, [viewingDate]);

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(viewingDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
      // Don't allow going before launch date (optional, but good for cleanliness)
      if (newDate.getTime() < LAUNCH_DATE) return; 
    } else {
      newDate.setDate(newDate.getDate() + 1);
      // Don't allow going into the future
      if (newDate > new Date()) return;
    }
    setViewingDate(newDate);
  };

  return (
    <div className="min-h-screen bg-tower-black text-white selection:bg-tower-accent selection:text-white flex flex-col">
      
      {/* Navigation */}
      <nav className="border-b border-tower-gray sticky top-0 bg-tower-black/90 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo and Brand Name */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => {
                setViewingDate(new Date()); // Reset to today on logo click
                setActiveSection(AppSection.DAILY_DOOM);
            }}>
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* Glow effect behind the sphere */}
                <div className="absolute inset-0 bg-orange-600/30 blur-lg rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                {!imgError ? (
                  <img 
                    src={LOGO_URL} 
                    alt="IdeasCower Core" 
                    onError={() => setImgError(true)}
                    className="w-full h-full rounded-full object-cover animate-spin relative z-10 shadow-2xl"
                    style={{ animationDuration: '120s' }}
                  />
                ) : (
                  <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 animate-spin" style={{ animationDuration: '90s' }}>
                     <defs>
                        <radialGradient id="magmaCore" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fff700" />
                          <stop offset="100%" stopColor="#ff0000" />
                        </radialGradient>
                     </defs>
                     <circle cx="50" cy="50" r="48" fill="url(#magmaCore)" />
                  </svg>
                )}
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-white group-hover:text-tower-accent transition-colors duration-300">ideascower.com</span>
            </div>
            
            {/* Section Toggles */}
            <div className="flex items-center gap-2 sm:gap-8">
              <button
                onClick={() => setActiveSection(AppSection.DAILY_DOOM)}
                className={`font-mono text-sm uppercase tracking-widest py-2 px-3 sm:px-0 sm:py-1 border-b-2 transition-all flex items-center justify-center
                  ${activeSection === AppSection.DAILY_DOOM 
                    ? 'border-tower-accent text-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                <span className="hidden sm:inline">Daily Doom</span>
                <NewspaperIcon className="w-6 h-6 sm:hidden" />
              </button>
              
              <button
                onClick={() => setActiveSection(AppSection.ROAST_LAB)}
                className={`font-mono text-sm uppercase tracking-widest py-2 px-3 sm:px-0 sm:py-1 border-b-2 transition-all flex items-center justify-center
                  ${activeSection === AppSection.ROAST_LAB 
                    ? 'border-tower-neon text-white' 
                    : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                <span className="hidden sm:inline">The Incinerator</span>
                <FireIcon className="w-6 h-6 sm:hidden" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center py-12 md:py-20 relative w-full">
        {/* Background Grid visual */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
             style={{backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '30px 30px'}}>
        </div>

        <div className="z-10 w-full">
            {activeSection === AppSection.DAILY_DOOM ? (
                <div className="animate-fade-in-up w-full flex flex-col items-center">
                    
                    {/* Header with Date Navigation */}
                    <div className="text-center mb-8 relative w-full max-w-4xl px-4">
                         
                         {/* Navigation Controls */}
                         <div className="flex items-center justify-center gap-6 mb-4">
                            <button 
                                onClick={() => navigateDate('prev')}
                                className="p-2 text-gray-600 hover:text-white transition-colors disabled:opacity-0"
                                disabled={viewingDate.getTime() < LAUNCH_DATE + 86400000} // Disable if before Issue #1
                            >
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>

                            {/* Reverted UI: Cleaner gray aesthetic */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center gap-3 text-gray-400 mb-2">
                                    <CalendarDaysIcon className="w-5 h-5" />
                                    <span className="font-serif text-lg tracking-wide">{dateInfo.dateString}</span>
                                </div>
                                <h2 className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">
                                    ISSUE #{dateInfo.issueNumber}
                                </h2>
                            </div>

                            <button 
                                onClick={() => navigateDate('next')}
                                className="p-2 text-gray-600 hover:text-white transition-colors disabled:opacity-0"
                                disabled={dateInfo.isToday}
                            >
                                <ChevronRightIcon className="w-6 h-6" />
                            </button>
                         </div>
                    </div>
                    
                    {/* Content */}
                    <DailyBadIdea targetDate={viewingDate} isToday={dateInfo.isToday} />
                </div>
            ) : (
                <div className="animate-fade-in-up">
                    <IdeaRoaster />
                </div>
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-tower-gray py-8 mt-auto bg-tower-dark">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-gray-600 font-mono text-xs">
            &copy; {new Date().getFullYear()} IdeasCower.com ~ Where Ideas Tremble.
            <span className="block mt-1 text-tower-accent/50">"Don't build this."</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;