import React, { useState } from 'react';
import { AppSection } from './types';
import DailyBadIdea from './components/DailyBadIdea';
import IdeaRoaster from './components/IdeaRoaster';
import ChatBot from './components/ChatBot';

const App: React.FC = () => {
  const [activeSection, setActiveSection] = useState<AppSection>(AppSection.DAILY_DOOM);

  return (
    <div className="min-h-screen bg-tower-black text-white selection:bg-tower-accent selection:text-white flex flex-col">
      
      {/* Navigation */}
      <nav className="border-b border-tower-gray sticky top-0 bg-tower-black/90 backdrop-blur-md z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo and Brand Name */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border-2 border-tower-gray overflow-hidden">
                 {/* Circular logo container with sharp internal contrast */}
                 <div className="w-6 h-6 bg-black rotate-45 transform translate-y-1"></div>
              </div>
              <span className="font-serif font-bold text-2xl tracking-tight text-white">ideascower.com</span>
            </div>
            
            <div className="flex space-x-8">
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

      {/* Chat Widget */}
      <ChatBot />
    </div>
  );
};

export default App;