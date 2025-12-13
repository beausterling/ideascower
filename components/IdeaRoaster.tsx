import React, { useState } from 'react';
import { roastUserIdea } from '../services/geminiService';
import { FireIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

const IdeaRoaster: React.FC = () => {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    setAnalysis('');
    
    const result = await roastUserIdea(input);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-serif text-white mb-2">The Incinerator</h2>
        <p className="text-gray-400 font-mono text-sm">Submit your "billion dollar idea". We'll tell you why it's worth zero.</p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8 relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g., Uber for walking dogs but the dogs walk you..."
          className="w-full h-40 bg-tower-dark border border-tower-gray text-gray-200 p-4 font-mono focus:border-tower-accent focus:ring-1 focus:ring-tower-accent outline-none transition-all resize-none rounded-sm"
        />
        <div className="absolute bottom-4 right-4">
           <button
            type="submit"
            disabled={loading || !input}
            className={`flex items-center gap-2 px-6 py-2 font-mono text-sm uppercase tracking-wider transition-all
              ${loading 
                ? 'bg-tower-gray text-gray-500 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-tower-accent hover:text-white'
              }`}
          >
            {loading ? 'Incinerating...' : 'Roast It'}
            {!loading && <FireIcon className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {loading && (
        <div className="border border-dashed border-tower-gray p-8 text-center animate-pulse">
           <p className="text-tower-neon font-mono">Running deep simulation...</p>
           <p className="text-xs text-gray-600 mt-1">Consulting Gemini 3 Pro</p>
        </div>
      )}

      {analysis && (
        <div className="bg-tower-dark border-l-4 border-tower-accent p-8 shadow-2xl animate-fade-in">
          <h3 className="text-tower-accent font-bold font-mono uppercase mb-4 text-xl">Verdict</h3>
          <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-white max-w-none font-light">
             <p className="whitespace-pre-wrap leading-relaxed">
               {analysis}
             </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default IdeaRoaster;