import React, { useState, useEffect } from 'react';
import { roastUserIdea } from '../services/geminiService';
import { FireIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';

const FirePit: React.FC = () => {
  // Generate random particles for the fire
  const particles = Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 2}s`,
    animationDuration: `${0.6 + Math.random() * 1.2}s`, // Faster, flicker-like
    size: `${4 + Math.random() * 20}px`, // Varied sizes, some very small/sharp
    // Add white and bright yellow for "hot" core look
    bgClass: Math.random() > 0.8 ? 'bg-white' : (Math.random() > 0.6 ? 'bg-yellow-200' : (Math.random() > 0.3 ? 'bg-orange-500' : 'bg-red-600'))
  }));

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-0 animate-fade-in" style={{ animationDelay: '1.0s' }}>
      {/* Glow Base - Deep red underglow */}
      <div className="absolute bottom-0 left-0 right-0 h-full bg-gradient-to-t from-red-600/40 via-orange-900/10 to-transparent mix-blend-screen"></div>
      
      {/* Particles - Sharper with mix-blend-plus-lighter for that 'blown out' fire look */}
      {particles.map(p => (
        <div
          key={p.id}
          className={`absolute bottom-0 rounded-full blur-[0.5px] opacity-0 animate-fire-rise mix-blend-plus-lighter ${p.bgClass}`}
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            animationDelay: p.animationDelay,
            animationDuration: p.animationDuration
          }}
        />
      ))}
    </div>
  );
};

const IdeaRoaster: React.FC = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFire, setShowFire] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (loading) {
      // Show fire almost immediately to catch the falling text
      timer = setTimeout(() => {
        setShowFire(true);
      }, 500);
    } else {
      setShowFire(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setAnalysis('');
    
    // The text burns and falls. We clear it from the UI after the animation completes visually,
    // but we keep the state momentarily to allow the animation to play out on the existing text.
    
    const result = await roastUserIdea(input);
    setAnalysis(result);
    setLoading(false);
    setInput(''); // Clear the input as it has been "incinerated"
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      
      {/* Main Container Card */}
      <div className="relative border border-gray-800 bg-[#080808] overflow-hidden shadow-2xl transition-all duration-500">
        
        {/* The "Red Gradient Thing" - Ambient Glow */}
        <div className="absolute -top-[150px] -left-[150px] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none bg-tower-accent/10"></div>
        
        {/* Secondary Glow (Bottom Right) */}
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-orange-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-8 md:p-12">
            
            <div className="text-center mb-10">
                <h2 className="text-4xl font-serif text-white mb-3 tracking-tight">The Incinerator</h2>
                <p className="text-gray-400 font-mono text-sm max-w-lg mx-auto leading-relaxed">
                    Submit your "billion dollar idea". We'll tell you why it's worth zero.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mb-8 relative group">
                <div className="relative overflow-hidden rounded-sm bg-black/40 border border-gray-800 focus-within:border-tower-accent focus-within:ring-1 focus-within:ring-tower-accent transition-all">
                    
                    {/* Fire Effect Container (Behind Text) */}
                    {showFire && <FirePit />}

                    {/* Textarea with Burning Animation */}
                    <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., Uber for walking dogs but the dogs walk you..."
                    disabled={loading}
                    className={`w-full h-48 bg-transparent p-6 font-mono outline-none transition-all resize-none rounded-sm placeholder:text-gray-700 text-lg leading-relaxed relative z-10
                        ${loading ? 'animate-text-burn' : 'text-gray-200'}
                    `}
                    />
                    
                    {/* Action Bar inside/below textarea */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-3 z-30">
                        <span className={`text-xs font-mono text-tower-accent transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0'}`}>
                            INCINERATING...
                        </span>
                        <button
                            type="submit"
                            disabled={loading || !input}
                            className={`flex items-center gap-2 px-6 py-2 font-mono text-sm uppercase tracking-wider transition-all border
                            ${loading 
                                ? 'bg-transparent border-transparent text-transparent cursor-not-allowed opacity-0' 
                                : 'bg-white border-white text-black hover:bg-tower-accent hover:border-tower-accent hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,62,62,0.4)] opacity-100'}
                            `}
                        >
                            {loading ? '' : 'Roast It'}
                            {!loading && <FireIcon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </form>

            {/* Analysis Output */}
             {analysis && (
                <div className="mt-8 animate-fade-in border-t border-gray-800 pt-8">
                    <h3 className="text-tower-accent font-bold font-mono uppercase text-sm mb-6 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-tower-accent rounded-full animate-pulse"></span>
                        Verdict
                    </h3>
                    <div className="prose prose-invert prose-lg max-w-none font-light text-gray-300">
                        <ReactMarkdown 
                            components={{
                                strong: ({node, ...props}) => <span className="text-tower-accent font-normal" {...props} />,
                                p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />
                            }}
                        >
                            {analysis}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default IdeaRoaster;