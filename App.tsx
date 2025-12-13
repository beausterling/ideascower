import React, { useState } from 'react';
import { AppSection } from './types';
import DailyBadIdea from './components/DailyBadIdea';
import IdeaRoaster from './components/IdeaRoaster';
import { FireIcon, NewspaperIcon } from '@heroicons/react/24/outline';

// Using the raw GitHub URL based on the permalink provided
const LOGO_URL = 'https://raw.githubusercontent.com/beausterling/ideascower/4c6e1e1e8cf5f4be09ace4a45deedd45ae7e83f0/lava-ball-final.png';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DAILY_DOOM);
  const [imgError, setImgError] = useState(false);

  return (
    <div className="min-h-screen bg-tower-black text-white selection:bg-tower-accent selection:text-white flex flex-col">
      
      {/* Navigation */}
      <nav className="border-b border-tower-gray sticky top-0 bg-tower-black/90 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo and Brand Name */}
            <div className="flex items-center gap-3 group"> {/* Reduced gap from 4 to 3 */}
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* Glow effect behind the sphere */}
                <div className="absolute inset-0 bg-orange-600/30 blur-lg rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-1000"></div>
                
                {!imgError ? (
                  /* User Provided Image */
                  <img 
                    src={LOGO_URL} 
                    alt="IdeasCower Core" 
                    onError={() => setImgError(true)}
                    className="w-full h-full rounded-full object-cover animate-spin relative z-10 shadow-2xl"
                    style={{ animationDuration: '120s' }}
                  />
                ) : (
                  /* Fallback SVG if image is deleted/missing */
                  <svg viewBox="0 0 100 100" className="w-full h-full relative z-10 animate-spin" style={{ animationDuration: '90s' }}>
                     <defs>
                        <radialGradient id="magmaCore" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fff700" />
                          <stop offset="100%" stopColor="#ff0000" />
                        </radialGradient>
                        <filter id="rockBump"><feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3"/></filter>
                     </defs>
                     <circle cx="50" cy="50" r="48" fill="url(#magmaCore)" />
                     <g fill="#1a1a1a" filter="url(#rockBump)" opacity="0.9">
                        <path d="M 35 35 L 65 35 L 75 55 L 50 75 L 25 55 Z" transform="scale(0.9) translate(5,5)" />
                        <path d="M 35 30 L 50 10 L 65 30 L 60 32 L 40 32 Z" />
                        <path d="M 70 32 L 90 20 L 95 50 L 78 55 L 68 38 Z" />
                        <path d="M 80 60 L 95 60 L 85 90 L 55 80 L 72 60 Z" />
                        <path d="M 45 80 L 50 95 L 20 90 L 22 60 L 45 72 Z" />
                        <path d="M 20 55 L 5 50 L 10 20 L 30 32 L 22 52 Z" />
                     </g>
                  </svg>
                )}
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-white group-hover:text-tower-accent transition-colors duration-300">ideascower.com</span>
            </div>
            
            {/* Responsive Navigation */}
            <div className="flex items-center gap-2 sm:gap-8">
              <button
                onClick={() => setActiveSection(AppSection.DAILY_DOOM)}
                title="Daily Doom"
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
                title="The Incinerator"
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
      <main className="flex-grow flex flex-col items-center py-12 md:py-20 relative">
        {/* Background Grid visual */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20" 
             style={{backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '30px 30px'}}>
        </div>

        <div className="z-10 w-full">
            {activeSection === AppSection.DAILY_DOOM ? (
                <div className="animate-fade-in-up">
                    <div className="text-center mb-12">
                         <h2 className="text-gray-500 font-mono text-xs uppercase tracking-[0.3em] mb-2">Issue #{new Date().getDay() + 342}</h2>
                         <p className="text-2xl font-serif italic text-gray-400">Why your next unicorn is actually a donkey.</p>
                    </div>
                    <DailyBadIdea />
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
            &copy; {new Date().getFullYear()} IdeasCower. Powered by Gemini 3 Pro (Preview). 
            <span className="block mt-1 text-tower-accent/50">"Don't build this."</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;