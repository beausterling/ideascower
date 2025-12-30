import React, { useState, useEffect, useCallback, useRef } from 'react';
import { sendDevilsAdvocateMessage, checkDevilsAdvocateUsage, DevilsAdvocateError, DevilsAdvocateUsageInfo } from '../services/supabaseService';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { AppSection, ChatMessage } from '../types';
import { ChatBubbleLeftRightIcon, PaperAirplaneIcon, ClockIcon } from '@heroicons/react/24/solid';
import ReactMarkdown from 'react-markdown';

const PENDING_MESSAGE_KEY = 'ideascower_pending_devils_advocate_message';
const PENDING_REDIRECT_KEY = 'ideascower_pending_redirect';

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

const DevilsAdvocate: React.FC = () => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth prompt state
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Rate limiting state
  const [usageInfo, setUsageInfo] = useState<DevilsAdvocateUsageInfo | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch usage info when user logs in
  const fetchUsageInfo = useCallback(async () => {
    if (!user) {
      setUsageInfo(null);
      return;
    }
    try {
      const info = await checkDevilsAdvocateUsage();
      setUsageInfo(info);
      setRateLimitError(null);
    } catch (err) {
      console.error('Error fetching usage info:', err);
    }
  }, [user]);

  // Load pending message from localStorage on mount
  useEffect(() => {
    const pendingMessage = localStorage.getItem(PENDING_MESSAGE_KEY);
    if (pendingMessage) {
      setInput(pendingMessage);
      // Only show auth prompt if user is not logged in
      if (!user) {
        setShowAuthPrompt(true);
      }
    }
  }, []); // Run once on mount

  // Hide auth prompt when user logs in, fetch usage, and auto-send pending message
  useEffect(() => {
    if (user) {
      setShowAuthPrompt(false);

      // Initialize usage info and handle pending message sequentially
      const initializeAndSendPending = async () => {
        // Wait for usage info to load before attempting to send
        await fetchUsageInfo();

        // Check for pending message and auto-send it
        const pendingMessage = localStorage.getItem(PENDING_MESSAGE_KEY);
        if (pendingMessage) {
          setInput(pendingMessage);
          localStorage.removeItem(PENDING_MESSAGE_KEY);
          handleSendMessage(pendingMessage);
        }
      };

      initializeAndSendPending();
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

  const handleSendMessage = async (messageText?: string) => {
    const textToSend = messageText || input.trim();
    if (!textToSend) return;

    // If user is not authenticated, save the message and show auth prompt
    if (!user) {
      localStorage.setItem(PENDING_MESSAGE_KEY, textToSend);
      setShowAuthPrompt(true);
      return;
    }

    // Check if rate limited before even trying
    if (usageInfo && usageInfo.remaining <= 0) {
      setRateLimitError('You\'ve used all 5 messages for today. Come back later!');
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setRateLimitError(null);
    setShowAuthPrompt(false);

    // Build history for the API (convert ChatMessage to Gemini format)
    const history = messages.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    try {
      // Add a placeholder for the assistant response
      setMessages(prev => [...prev, { role: 'model', text: '', isThinking: true }]);

      const streamResult = await sendDevilsAdvocateMessage(history, textToSend);
      let fullResponse = '';

      for await (const chunk of streamResult) {
        if (chunk.text) {
          fullResponse += chunk.text;
          // Update the last message with the accumulated response
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'model', text: fullResponse, isThinking: false };
            return updated;
          });
        }
        if (chunk.usageInfo) {
          // Update usage info from stream
          setUsageInfo(prev => ({
            ...prev,
            remaining: chunk.usageInfo.remaining,
            resetAt: chunk.usageInfo.resetAt,
            limit: prev?.limit ?? 5,
          }));
        }
      }

      // Ensure the final message is set
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'model', text: fullResponse || 'I apologize, but I couldn\'t generate a response. Please try again.', isThinking: false };
        return updated;
      });

    } catch (err) {
      console.error('Error sending message:', err);
      // Remove the thinking placeholder
      setMessages(prev => prev.slice(0, -1));

      if (err instanceof DevilsAdvocateError) {
        if (err.code === 'RATE_LIMITED') {
          setRateLimitError('You\'ve used all 5 messages for today. Come back later!');
          setUsageInfo({
            remaining: 0,
            resetAt: err.resetAt ?? null,
            limit: 5,
          });
        } else if (err.code === 'AUTH_REQUIRED' || err.code === 'AUTH_INVALID') {
          // Session may have expired
          localStorage.setItem(PENDING_MESSAGE_KEY, textToSend);
          setShowAuthPrompt(true);
        } else {
          // Add error message
          setMessages(prev => [...prev, { role: 'model', text: 'Sorry, something went wrong. Please try again.' }]);
        }
      } else {
        setMessages(prev => [...prev, { role: 'model', text: 'Sorry, something went wrong. Please try again.' }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:p-6">

      {/* Main Container Card */}
      <div className="relative border border-gray-800 bg-[#080808] overflow-hidden shadow-2xl transition-all duration-500">

        {/* Ambient Glow - Purple/Blue tint for the advisor feel */}
        <div className="absolute -top-[150px] -left-[150px] w-[600px] h-[600px] rounded-full blur-[120px] pointer-events-none bg-indigo-500/10"></div>

        {/* Secondary Glow (Bottom Right) */}
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-purple-900/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 p-5 sm:p-8 md:p-12">

          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-serif text-white mb-3 tracking-tight">Devil's Advocate</h2>
            <p className="text-gray-400 font-mono text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
              Your experienced business strategist. Share your idea and get honest, constructive feedback to make it stronger.
            </p>

            {/* Usage indicator for authenticated users */}
            {user && usageInfo && (
              <div className="mt-4 flex items-center justify-center gap-2">
                {usageInfo.remaining > 0 ? (
                  <span className="text-gray-500 font-mono text-xs flex items-center gap-1.5">
                    <ChatBubbleLeftRightIcon className="w-3.5 h-3.5 text-indigo-400" />
                    {usageInfo.remaining} of 5 messages remaining today
                  </span>
                ) : (
                  <span className="text-indigo-400 font-mono text-xs flex items-center gap-1.5">
                    <ClockIcon className="w-3.5 h-3.5" />
                    Next message available in {timeRemaining || 'calculating...'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Rate limit warning */}
          {rateLimitError && (
            <div className="mb-6 p-4 border border-indigo-500/50 bg-indigo-500/10 rounded-sm">
              <div className="flex items-center gap-3">
                <ClockIcon className="w-6 h-6 text-indigo-400 flex-shrink-0" />
                <div>
                  <p className="text-indigo-300 font-mono text-sm">{rateLimitError}</p>
                  {usageInfo?.resetAt && (
                    <p className="text-indigo-400/70 font-mono text-xs mt-1">
                      Next message available in {timeRemaining || formatTimeRemaining(usageInfo.resetAt)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages Area */}
          <div
            className="mb-6 min-h-[200px] max-h-[400px] overflow-y-auto border border-gray-800 rounded-sm bg-black/40 p-4"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-[180px] text-gray-600 font-mono text-sm">
                <div className="text-center">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto mb-3 text-gray-700" />
                  <p>Share your business idea to get started...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-sm ${
                        msg.role === 'user'
                          ? 'bg-indigo-600/20 border border-indigo-500/30 text-gray-200'
                          : 'bg-gray-800/50 border border-gray-700/50 text-gray-300'
                      }`}
                    >
                      {msg.isThinking ? (
                        <div className="flex items-center gap-2 text-gray-400">
                          <div className="animate-pulse">Thinking...</div>
                        </div>
                      ) : (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              strong: ({node, ...props}) => <span className="text-indigo-300 font-semibold" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2" {...props} />,
                              li: ({node, ...props}) => <li className="mb-1" {...props} />,
                            }}
                          >
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Auth Prompt - Shows when unauthenticated user tries to send a message */}
          {showAuthPrompt && !user && (
            <div className="mb-6 animate-fade-in">
              <div className="border border-indigo-500/50 bg-indigo-500/5 p-6 sm:p-8 text-center rounded-sm">
                <div className="mb-4">
                  <ChatBubbleLeftRightIcon className="w-12 h-12 mx-auto text-indigo-400 animate-pulse" />
                </div>
                <h3 className="text-xl sm:text-2xl font-serif text-white mb-3">
                  Great question! Let me help you think through this.
                </h3>
                <p className="text-gray-400 font-mono text-xs sm:text-sm mb-6 max-w-md mx-auto">
                  Sign in or create a free account to start your brainstorming session. Your message is saved and ready to go.
                </p>
                <button
                  onClick={() => {
                    // Store redirect destination for OAuth flow
                    localStorage.setItem(PENDING_REDIRECT_KEY, AppSection.DEVILS_ADVOCATE);
                    setShowAuthModal(true);
                  }}
                  className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 font-mono uppercase tracking-wider hover:bg-white hover:text-black transition"
                >
                  Sign In to Continue
                </button>
              </div>
            </div>
          )}

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="relative group">
            <div className="relative overflow-hidden rounded-sm bg-black/40 border border-gray-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
              <textarea
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  // Hide auth prompt if user is typing a new message
                  if (showAuthPrompt && !user) {
                    setShowAuthPrompt(false);
                  }
                }}
                onKeyDown={(e) => {
                  // Submit on Enter (without Shift)
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={messages.length === 0
                  ? "Describe your business idea... (e.g., 'I want to build an app that helps people...')"
                  : "Ask a follow-up question or share more details..."
                }
                disabled={loading}
                rows={3}
                aria-label="Message input for Devil's Advocate chat"
                className="w-full bg-transparent p-4 sm:p-6 font-mono outline-none transition-all resize-none rounded-sm placeholder:text-gray-700 text-base sm:text-lg leading-relaxed text-gray-200"
              />

              {/* Action Bar */}
              <div className="absolute bottom-3 sm:bottom-4 right-3 sm:right-4 flex items-center gap-2 sm:gap-3 z-30">
                <span className={`text-xs font-mono text-indigo-400 transition-opacity duration-300 ${loading ? 'opacity-100' : 'opacity-0'}`}>
                  THINKING...
                </span>
                <button
                  type="submit"
                  disabled={loading || !input || (!!user && usageInfo?.remaining === 0)}
                  className={`flex items-center gap-2 px-4 sm:px-6 py-2 font-mono text-xs sm:text-sm uppercase tracking-wider transition-all border
                    ${loading
                      ? 'bg-transparent border-transparent text-transparent cursor-not-allowed opacity-0'
                      : (!!user && usageInfo?.remaining === 0)
                        ? 'bg-gray-700 border-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                        : 'bg-indigo-600 border-indigo-600 text-white hover:bg-white hover:border-white hover:text-black shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] opacity-100'}
                  `}
                >
                  {loading ? '' : (!!user && usageInfo?.remaining === 0) ? 'Limit Reached' : 'Send'}
                  {!loading && <PaperAirplaneIcon className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </form>

          {/* Hint text */}
          <p className="mt-3 text-gray-600 font-mono text-xs text-center">
            Press Enter to send, Shift+Enter for new line
          </p>
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

export default DevilsAdvocate;
