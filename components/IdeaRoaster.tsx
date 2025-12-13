import React, { useState } from 'react';
import { roastUserIdea } from '../services/geminiService';
import { FireIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';

const IdeaRoaster: React.FC = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setAnalysis('');
    
    // We keep the input in state to allow the animation to play on the text,
    // but we will clear it after the result comes back to complete the "burnt away" effect.
    
    const result = await roastUserIdea(input);
    setAnalysis(result);
    setLoading(false);
    setInput(''); // Clear the input as it has been "incinerated"
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      
      {/* Main Container Card */}
      <div className="relative border border-gray-800 bg-[#080808] overflow-hidden shadow-2xl transition-all duration-500">
        
        {/* The "Red Gradient Thing" - Ambient Glow 
            Static now, removed the scale animation on loading to keep focus on text.
        */}
        <div className="absolute -top-[150px] -left-[150px] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none bg-tower-accent/10"></div>
        
        {/* Secondary Glow (Bottom Right) */}
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-orange-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-8 md:p-12">
            
            {/* Header - Removed Icon */}
            <div className="text-center mb-10">
                <h2 className="text-4xl font-serif text-white mb-3 tracking-tight">The Incinerator</h2>
                <p className="text-gray-400 font-mono text-sm max-w-lg mx-auto leading-relaxed">
                    Submit your "billion dollar idea". We'll tell you why it's worth zero.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="mb-8 relative group">
                <div className="relative overflow-hidden rounded-sm">
                    
                    {/* Textarea with Burning Animation */}
                    <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="e.g., Uber for walking dogs but the dogs walk you..."
                    disabled={loading}
                    className={`w-full h-48 bg-black/40 backdrop-blur-sm border border-gray-800 p-6 font-mono focus:border-tower-accent focus:ring-1 focus:ring-tower-accent outline-none transition-all resize-none rounded-sm placeholder:text-gray-700 text-lg leading-relaxed relative z-10
                        ${loading ? 'animate-text-burn border-tower-accent/50' : 'text-gray-200'}
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