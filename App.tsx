import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AppSection } from './types';
import DailyBadIdea from './components/DailyBadIdea';
import IdeaRoaster from './components/IdeaRoaster';
import CalendarModal from './components/CalendarModal';
import ProtectedRoute from './components/ProtectedRoute';
import Profile from './components/Profile';
import { getAvailableIdeaDates, getCurrentIssueNumber } from './services/supabaseService';
import { FireIcon, NewspaperIcon, CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, ArchiveBoxIcon, Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline';

// Using the raw GitHub URL based on the permalink provided
const LOGO_URL = 'https://raw.githubusercontent.com/beausterling/ideascower/4c6e1e1e8cf5f4be09ace4a45deedd45ae7e83f0/lava-ball-final.png';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DAILY_DOOM);
  const [imgError, setImgError] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Issue-based state (issue_number is source of truth)
  const [currentIssue, setCurrentIssue] = useState<number>(1); // The latest issue available
  const [viewingIssue, setViewingIssue] = useState<number>(1); // The issue being viewed
  const [displayDate, setDisplayDate] = useState<string>(''); // Date string from the loaded idea

  // Calendar modal state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Fetch current issue number on mount
  useEffect(() => {
    const fetchCurrentIssue = async () => {
      const issueNum = await getCurrentIssueNumber();
      setCurrentIssue(issueNum);
      setViewingIssue(issueNum);
    };
    fetchCurrentIssue();
  }, []);

  // Fetch available dates on mount
  useEffect(() => {
    const fetchDates = async () => {
      const dates = await getAvailableIdeaDates();
      setAvailableDates(dates);
    };
    fetchDates();
  }, []);

  // Close mobile menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isMobileMenuOpen]);

  const isToday = viewingIssue === currentIssue;

  const navigateIssue = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (viewingIssue <= 1) return;
      setViewingIssue(viewingIssue - 1);
    } else {
      if (viewingIssue >= currentIssue) return;
      setViewingIssue(viewingIssue + 1);
    }
  };

  const goToCurrentIssue = () => {
    setViewingIssue(currentIssue);
  };

  // Callback when DailyBadIdea loads the date from DB
  const handleDateLoaded = useCallback((dateStr: string) => {
    // Convert UTC date string to local display format
    const date = new Date(dateStr + 'T00:00:00Z');
    const formatted = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    setDisplayDate(formatted);
  }, []);

  const handleDateSelect = (date: Date) => {
    // Find the issue number for this date from availableDates
    const dateStr = date.toISOString().split('T')[0];
    const dateIndex = availableDates.indexOf(dateStr);
    if (dateIndex !== -1) {
      // Dates are sorted descending, so index 0 is the latest
      setViewingIssue(currentIssue - dateIndex);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleSectionChange = (section: AppSection) => {
    setActiveSection(section);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-tower-black text-white selection:bg-tower-accent selection:text-white flex flex-col">
      
      {/* Navigation */}
      <nav className="border-b border-tower-gray sticky top-0 bg-tower-black/90 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo and Brand Name */}
            <button
              className="flex items-center gap-3 group cursor-pointer bg-transparent border-none"
              onClick={() => {
                goToCurrentIssue();
                setActiveSection(AppSection.DAILY_DOOM);
              }}
            >
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
            </button>

            {/* Section Toggles - Desktop Only */}
            <div className="hidden sm:flex items-center gap-8">
              <button
                onClick={() => setActiveSection(AppSection.DAILY_DOOM)}
                className={`font-mono text-sm uppercase tracking-widest py-1 border-b-2 transition-all
                  ${activeSection === AppSection.DAILY_DOOM
                    ? 'border-tower-accent text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                Daily Doom
              </button>

              <button
                onClick={() => setActiveSection(AppSection.ROAST_LAB)}
                className={`font-mono text-sm uppercase tracking-widest py-1 border-b-2 transition-all
                  ${activeSection === AppSection.ROAST_LAB
                    ? 'border-tower-neon text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                The Incinerator
              </button>

              <button
                onClick={() => setActiveSection(AppSection.PROFILE)}
                className={`font-mono text-sm uppercase tracking-widest py-1 border-b-2 transition-all
                  ${activeSection === AppSection.PROFILE
                    ? 'border-tower-accent text-white'
                    : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                Profile
              </button>
            </div>

            {/* Mobile Hamburger Menu - Top Right */}
            <div className="relative sm:hidden" ref={dropdownRef}>
              <button
                onClick={toggleMobileMenu}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-expanded={isMobileMenuOpen}
                aria-haspopup="true"
                aria-label="Open menu"
              >
                {isMobileMenuOpen ? (
                  <XMarkIcon className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="w-6 h-6" aria-hidden="true" />
                )}
              </button>

              {/* Mobile Dropdown Menu */}
              {isMobileMenuOpen && (
                <div
                  className="absolute top-full right-0 mt-2 w-64 bg-tower-dark border border-tower-gray shadow-2xl z-50 animate-slide-up"
                  role="menu"
                  aria-orientation="vertical"
                >
                  <div className="p-2">
                    {/* Profile - First Option */}
                    <button
                      onClick={() => handleSectionChange(AppSection.PROFILE)}
                      className={`w-full flex items-center gap-3 px-4 py-3 font-mono text-sm uppercase tracking-wider transition-all border-b border-tower-gray/50 mb-1
                        ${activeSection === AppSection.PROFILE
                          ? 'bg-tower-accent/10 text-tower-accent border-l-2 border-l-tower-accent'
                          : 'text-gray-400 hover:text-white hover:bg-tower-gray/30'}`}
                      role="menuitem"
                    >
                      <UserCircleIcon className="w-5 h-5" aria-hidden="true" />
                      <span>Profile</span>
                    </button>

                    <button
                      onClick={() => handleSectionChange(AppSection.DAILY_DOOM)}
                      className={`w-full flex items-center gap-3 px-4 py-3 font-mono text-sm uppercase tracking-wider transition-all
                        ${activeSection === AppSection.DAILY_DOOM
                          ? 'bg-tower-accent/10 text-tower-accent border-l-2 border-tower-accent'
                          : 'text-gray-400 hover:text-white hover:bg-tower-gray/30'}`}
                      role="menuitem"
                    >
                      <NewspaperIcon className="w-5 h-5" aria-hidden="true" />
                      <span>Daily Doom</span>
                    </button>

                    <button
                      onClick={() => handleSectionChange(AppSection.ROAST_LAB)}
                      className={`w-full flex items-center gap-3 px-4 py-3 font-mono text-sm uppercase tracking-wider transition-all
                        ${activeSection === AppSection.ROAST_LAB
                          ? 'bg-tower-neon/10 text-tower-neon border-l-2 border-tower-neon'
                          : 'text-gray-400 hover:text-white hover:bg-tower-gray/30'}`}
                      role="menuitem"
                    >
                      <FireIcon className="w-5 h-5" aria-hidden="true" />
                      <span>The Incinerator</span>
                    </button>
                  </div>
                </div>
              )}
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

                    {/* Header with Issue Navigation */}
                    <div className="text-center mb-8 relative w-full max-w-4xl px-4">

                         {/* Navigation Controls */}
                         <div className="flex items-center justify-center gap-6 mb-4">
                            <button
                                onClick={() => navigateIssue('prev')}
                                className="p-2 text-gray-600 hover:text-white transition-colors disabled:opacity-0"
                                disabled={viewingIssue <= 1}
                            >
                                <ChevronLeftIcon className="w-6 h-6" />
                            </button>

                            {/* Date and Issue display */}
                            <div className="flex flex-col items-center">
                                <div className="flex items-center justify-center gap-3 text-gray-400 mb-2">
                                    <CalendarDaysIcon className="w-5 h-5" />
                                    <span className="font-serif text-lg tracking-wide">{displayDate || 'Loading...'}</span>
                                </div>

                                {/* Issue Number with History and Current buttons */}
                                <div className="flex items-center gap-2 sm:gap-4">
                                    {/* History Button */}
                                    <button
                                        onClick={() => setIsCalendarOpen(true)}
                                        className="group flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs font-mono uppercase tracking-wider
                                                   text-gray-600 hover:text-tower-accent border border-gray-800 hover:border-tower-accent
                                                   transition-all duration-200"
                                    >
                                        <ArchiveBoxIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">History</span>
                                    </button>

                                    {/* Issue Number */}
                                    <h2 className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em]">
                                        ISSUE #{viewingIssue}
                                    </h2>

                                    {/* Current Button */}
                                    <button
                                        onClick={goToCurrentIssue}
                                        disabled={isToday}
                                        className="group flex items-center gap-1.5 px-2 sm:px-3 py-1 text-xs font-mono uppercase tracking-wider
                                                   text-gray-600 hover:text-tower-accent border border-gray-800 hover:border-tower-accent
                                                   transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:hover:border-gray-800"
                                    >
                                        <ClockIcon className="w-3 h-3 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Current</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => navigateIssue('next')}
                                className="p-2 text-gray-600 hover:text-white transition-colors disabled:opacity-0"
                                disabled={isToday}
                            >
                                <ChevronRightIcon className="w-6 h-6" />
                            </button>
                         </div>
                    </div>

                    {/* Content */}
                    <DailyBadIdea issueNumber={viewingIssue} isToday={isToday} onDateLoaded={handleDateLoaded} />
                </div>
            ) : activeSection === AppSection.ROAST_LAB ? (
                <div className="animate-fade-in-up">
                    <IdeaRoaster />
                </div>
            ) : (
                <div className="animate-fade-in-up">
                    <ProtectedRoute feature="Profile">
                        <Profile />
                    </ProtectedRoute>
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

      {/* Calendar Modal */}
      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onSelectDate={handleDateSelect}
        availableDates={availableDates}
        currentDate={displayDate ? new Date(displayDate) : new Date()}
        launchDate={new Date('2025-12-13T00:00:00Z')}
      />
    </div>
  );
};

export default App;