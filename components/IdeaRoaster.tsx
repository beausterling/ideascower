import React, { useState, useEffect, useCallback } from 'react';
import { roastUserIdea, checkRoastUsage, saveRoast, RoastError, RoastUsageInfo } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { AppSection } from '../types';
import { FireIcon, BookmarkIcon, GlobeAltIcon, LockClosedIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';

const PENDING_IDEA_KEY = 'ideascower_pending_idea';
const PENDING_REDIRECT_KEY = 'ideascower_pending_redirect';

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

// Helper to format time remaining
const formatTimeRemaining = (resetAt: string): string => {
  const now = new Date();
  const reset = new Date(resetAt);
  const diff = reset.getTime() - now.getTime();

  if (diff <= 0) return 'now';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const IdeaRoaster: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [lastIdea, setLastIdea] = useState(''); // Store the idea that was roasted
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFire, setShowFire] = useState(false);

  // Auth prompt state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Save state
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [makePublic, setMakePublic] = useState(false);

  // Rate limiting state
  const [usageInfo, setUsageInfo] = useState<RoastUsageInfo | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Fetch usage info when user logs in
  const fetchUsageInfo = useCallback(async () => {
    if (!user) {
      setUsageInfo(null);
      return;
    }
    try {
      const info = await checkRoastUsage();
      setUsageInfo(info);
      setRateLimitError(null);
    } catch (err) {
      console.error('Error fetching usage info:', err);
    }
  }, [user]);

  // Load pending idea from localStorage on mount
  useEffect(() => {
    const pendingIdea = localStorage.getItem(PENDING_IDEA_KEY);
    if (pendingIdea) {
      setInput(pendingIdea);
      // Only show auth prompt if user is not logged in
      if (!user) {
        setShowAuthPrompt(true);
      }
    }
  }, []); // Run once on mount

  // Hide auth prompt when user logs in and fetch usage info
  useEffect(() => {
    if (user) {
      setShowAuthPrompt(false);
      fetchUsageInfo();
    } else {
      setUsageInfo(null);
    }
  }, [user, fetchUsageInfo]);

  // Update countdown timer every minute
  useEffect(() => {
    if (!usageInfo?.resetAt || usageInfo.remaining > 0) {
      setTimeRemaining(null);
      return;
    }

    const updateTimer = () => {
      const formatted = formatTimeRemaining(usageInfo.resetAt!);
      setTimeRemaining(formatted);

      // If time has passed, refresh usage info
      if (formatted === 'now') {
        fetchUsageInfo();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [usageInfo, fetchUsageInfo]);

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

    // If user is not authenticated, save the idea and show auth prompt
    if (!user) {
      localStorage.setItem(PENDING_IDEA_KEY, input.trim());
      setShowAuthPrompt(true);
      return;
    }

    // Check if rate limited before even trying
    if (usageInfo && usageInfo.remaining <= 0) {
      setRateLimitError('You\'ve used all 3 roasts for today. Come back later!');
      return;
    }

    const ideaToRoast = input.trim();
    setLoading(true);
    setAnalysis('');
    setIsSaved(false);
    setMakePublic(false);
    setShowAuthPrompt(false);
    setRateLimitError(null);

    try {
      const result = await roastUserIdea(ideaToRoast);
      setAnalysis(result.roast);
      setLastIdea(ideaToRoast);

      // Update usage info from response
      setUsageInfo(prev => ({
        ...prev,
        remaining: result.remaining,
        resetAt: result.resetAt,
        limit: prev?.limit ?? 3,
      }));

      // Clear pending idea from localStorage AFTER successful roast
      localStorage.removeItem(PENDING_IDEA_KEY);
      setInput(''); // Clear the input as it has been "incinerated"
    } catch (err) {
      if (err instanceof RoastError) {
        if (err.code === 'RATE_LIMITED') {
          setRateLimitError('You\'ve used all 3 roasts for today. Come back later!');
          setUsageInfo({
            remaining: 0,
            resetAt: err.resetAt ?? null,
            limit: 3,
          });
        } else if (err.code === 'AUTH_REQUIRED' || err.code === 'AUTH_INVALID') {
          // Session may have expired
          setShowAuthPrompt(true);
        } else {
          setAnalysis('My roasting circuits are overheated. Try again later.');
        }
      } else {
        setAnalysis('My roasting circuits are overheated. Try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || !lastIdea || !analysis || isSaved) return;

    setSaving(true);
    try {
      // Use the dedicated save endpoint - doesn't count against rate limit
      const result = await saveRoast(lastIdea, analysis, makePublic);

      if (result?.savedId) {
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Error saving roast:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    // If user is now logged in, the useEffect will handle restoring the idea
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:p-6">

      {/* Main Container Card */}
      <div className="relative border border-gray-800 bg-[#080808] overflow-hidden shadow-2xl transition-all duration-500">

        {/* The "Red Gradient Thing" - Ambient Glow */}
        <div className="absolute -top-[150px] -left-[150px] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none bg-tower-accent/10"></div>

        {/* Secondary Glow (Bottom Right) */}
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-orange-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-5 sm:p-8 md:p-12">

            <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-3xl sm:text-4xl font-serif text-white mb-3 tracking-tight">The Incinerator</h2>
                <p className="text-gray-400 font-mono text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
                    Submit your "billion dollar idea". We'll tell you why it's worth zero.
                </p>

                {/* Usage indicator for authenticated users */}
                {user && usageInfo && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    {usageInfo.remaining > 0 ? (
                      <span className="text-gray-500 font-mono text-xs flex items-center gap-1.5">
                        <FireIcon className="w-3.5 h-3.5 text-tower-accent" />
                        {usageInfo.remaining} of 3 roasts remaining today
                      </span>
                    ) : (
                      <span className="text-orange-400 font-mono text-xs flex items-center gap-1.5">
                        <ClockIcon className="w-3.5 h-3.5" />
                        Next roast available in {timeRemaining || 'calculating...'}
                      </span>
                    )}
                  </div>
                )}
            </div>

            {/* Rate limit warning */}
            {rateLimitError && (
              <div className="mb-6 p-4 border border-orange-500/50 bg-orange-500/10 rounded-sm">
                <div className="flex items-center gap-3">
                  <ClockIcon className="w-6 h-6 text-orange-400 flex-shrink-0" />
                  <div>
                    <p className="text-orange-300 font-mono text-sm">{rateLimitError}</p>
                    {usageInfo?.resetAt && (
                      <p className="text-orange-400/70 font-mono text-xs mt-1">
                        Next roast available in {timeRemaining || formatTimeRemaining(usageInfo.resetAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mb-6 sm:mb-8 relative group">
                <div className="relative overflow-hidden rounded-sm bg-black/40 border border-gray-800 focus-within:border-tower-accent focus-within:ring-1 focus-within:ring-tower-accent transition-all">

                    {/* Fire Effect Container (Behind Text) */}
                    {showFire && <FirePit />}

                    {/* Textarea with Burning Animation */}
                    <textarea
                    value={input}
                    onChange={(e) => {
                      setInput(e.target.value);
                      // Hide auth prompt if user is typing a new idea
                      if (showAuthPrompt && !user) {
                        setShowAuthPrompt(false);
                      }
                    }}
                    placeholder="e.g., Uber for walking dogs but the dogs walk you..."
                    disabled={loading}
                    className={`w-full h-40 sm:h-48 bg-transparent p-4 sm:p-6 font-mono outline-none transition-all resize-none rounded-sm placeholder:text-gray-700 text-base sm:text-lg leading-relaxed relative z-10
                        ${loading ? 'animate-text-burn' : 'text-gray-200'}
                    `}
                    />

                    {/* Action Bar inside/below textarea */}
                    <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 flex items-center gap-2 sm:gap-3 z-30">
                        <span className={`text-xs font-mono text-tower-accent transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0'}`}>
                            INCINERATING...
                        </span>
                        <button
                            type="submit"
                            disabled={loading || !input || (!!user && usageInfo?.remaining === 0)}
                            className={`flex items-center gap-2 px-4 sm:px-6 py-2 font-mono text-xs sm:text-sm uppercase tracking-wider transition-all border
                            ${loading
                                ? 'bg-transparent border-transparent text-transparent cursor-not-allowed opacity-0'
                                : (!!user && usageInfo?.remaining === 0)
                                  ? 'bg-gray-700 border-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                                  : 'bg-white border-white text-black hover:bg-tower-accent hover:border-tower-accent hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_20px_rgba(255,62,62,0.4)] opacity-100'}
                            `}
                        >
                            {loading ? '' : (!!user && usageInfo?.remaining === 0) ? 'Limit Reached' : 'Roast It'}
                            {!loading && <FireIcon className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </form>

            {/* Auth Prompt - Shows when unauthenticated user tries to roast */}
            {showAuthPrompt && !user && (
              <div className="mb-8 animate-fade-in">
                <div className="border border-tower-accent/50 bg-tower-accent/5 p-6 sm:p-8 text-center rounded-sm">
                  <div className="mb-4">
                    <FireIcon className="w-12 h-12 mx-auto text-tower-accent animate-pulse" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-serif text-white mb-3">
                    Wow... I've got a lot to say about that one.
                  </h3>
                  <p className="text-gray-400 font-mono text-xs sm:text-sm mb-6 max-w-md mx-auto">
                    Sign in or create an account to see the full roast. Your idea is saved and ready to go.
                  </p>
                  <button
                    onClick={() => {
                      // Store redirect destination for OAuth flow
                      localStorage.setItem(PENDING_REDIRECT_KEY, AppSection.ROAST_LAB);
                      setShowAuthModal(true);
                    }}
                    className="w-full sm:w-auto bg-tower-accent text-white px-8 py-3 font-mono uppercase tracking-wider hover:bg-white hover:text-black transition"
                  >
                    Sign In to See Roast
                  </button>
                </div>
              </div>
            )}

            {/* Analysis Output */}
             {analysis && (
                <div className="mt-6 sm:mt-8 animate-fade-in border-t border-gray-800 pt-6 sm:pt-8">
                    <h3 className="text-tower-accent font-bold font-mono uppercase text-xs sm:text-sm mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 bg-tower-accent rounded-full animate-pulse"></span>
                        Verdict
                    </h3>
                    <div className="prose prose-invert prose-sm sm:prose-lg max-w-none font-light text-gray-300">
                        <ReactMarkdown
                            components={{
                                strong: ({node, ...props}) => <span className="text-tower-accent font-normal" {...props} />,
                                p: ({node, ...props}) => <p className="mb-3 sm:mb-4 leading-relaxed" {...props} />
                            }}
                        >
                            {analysis}
                        </ReactMarkdown>
                    </div>

                    {/* Save to History Option */}
                    {user && !isSaved && (
                      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800">
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                          {/* Public/Private Toggle */}
                          <button
                            type="button"
                            onClick={() => setMakePublic(!makePublic)}
                            className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-mono uppercase tracking-wider border transition-colors ${
                              makePublic
                                ? 'border-tower-neon/50 text-tower-neon bg-tower-neon/10'
                                : 'border-gray-700 text-gray-500 hover:text-gray-300 hover:border-gray-500'
                            }`}
                          >
                            {makePublic ? (
                              <>
                                <GlobeAltIcon className="w-4 h-4" />
                                Public
                              </>
                            ) : (
                              <>
                                <LockClosedIcon className="w-4 h-4" />
                                Private
                              </>
                            )}
                          </button>

                          {/* Save Button */}
                          <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-6 py-2 font-mono text-sm uppercase tracking-wider transition-all border border-tower-neon text-tower-neon hover:bg-tower-neon hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <BookmarkIcon className="w-4 h-4" />
                            {saving ? 'Saving...' : 'Save to History'}
                          </button>
                        </div>
                        <p className="mt-3 text-gray-600 font-mono text-xs">
                          {makePublic
                            ? 'This roast will be visible to others.'
                            : 'Only you will be able to see this roast.'}
                        </p>
                      </div>
                    )}

                    {/* Saved Confirmation */}
                    {isSaved && (
                      <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-800">
                        <div className="flex items-center gap-2 text-tower-neon font-mono text-sm">
                          <CheckIcon className="w-5 h-5" />
                          Saved to your profile!
                        </div>
                      </div>
                    )}
                </div>
            )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        mode="signin"
      />
    </div>
  );
};

export default IdeaRoaster;
