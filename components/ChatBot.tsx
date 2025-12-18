import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/supabaseService';
import { ChatMessage } from '../types';
import { ChatBubbleLeftRightIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'I am The Liquidator. I doubt your business plan will work, but go ahead, ask me anything.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    try {
      // Convert internal ChatMessage to History format for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const streamResult = await sendChatMessage(history, userMsg);
      
      let fullResponse = "";
      
      // Add placeholder for streaming response
      setMessages(prev => [...prev, { role: 'model', text: '', isThinking: true }]);

      for await (const chunk of streamResult) {
         if (chunk.text) {
             fullResponse += chunk.text;
             setMessages(prev => {
                 const newMsgs = [...prev];
                 const lastMsg = newMsgs[newMsgs.length - 1];
                 lastMsg.text = fullResponse;
                 lastMsg.isThinking = false;
                 return newMsgs;
             });
         }
      }
    } catch (error) {
      console.error("Chat Error:", error instanceof Error ? error.message : String(error));
      setMessages(prev => [...prev, { role: 'model', text: "Error: I've lost my train of thought." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-lg transition-all duration-300 
          ${isOpen ? 'bg-tower-gray rotate-90 text-white' : 'bg-tower-accent hover:bg-white hover:text-black text-white'}`}
      >
        {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatBubbleLeftRightIcon className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-tower-dark border border-tower-gray shadow-2xl flex flex-col rounded-sm overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-black/50 p-4 border-b border-tower-gray flex justify-between items-center backdrop-blur-sm">
            <h3 className="text-white font-mono text-sm uppercase tracking-wider">The Liquidator</h3>
            <span className="text-[10px] text-tower-neon border border-tower-neon px-2 py-0.5 rounded-full">Gemini 3 Pro</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3 text-sm rounded-sm font-light leading-relaxed
                    ${msg.role === 'user' 
                      ? 'bg-tower-gray text-white border border-gray-700' 
                      : 'bg-black text-gray-300 border border-tower-gray'
                    }`}
                >
                  {msg.isThinking && !msg.text ? (
                      <span className="animate-pulse text-tower-neon font-mono text-xs">Thinking...</span>
                  ) : (
                      msg.text
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-tower-gray bg-black/30">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                className="w-full bg-tower-black border border-tower-gray text-white px-4 py-3 pr-10 text-sm focus:border-white outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={!input || isTyping}
                className="absolute right-3 top-3 text-gray-500 hover:text-white disabled:opacity-50 transition-colors"
              >
                <PaperAirplaneIcon className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default ChatBot;