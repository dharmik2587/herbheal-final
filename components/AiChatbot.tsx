'use client';

import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AiChatbotProps {
  herbContext?: string;
}

export default function AiChatbot({ herbContext }: AiChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: 'Welcome to HerbHeal Compass AI! 🌿 I can help you with herb identification, Ayurvedic properties, drug interactions, and more. Ask me anything about medicinal plants!',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const QUICK_PROMPTS = [
    '🌿 What herbs help with stress?',
    '💊 Check Ashwagandha + Levothyroxine',
    '🧭 Best herbs for immunity',
    '📊 Tell me about Turmeric',
  ];

  const handleSend = async (messageText?: string) => {
    const text = (messageText || input).trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          context: herbContext || '',
        }),
      });

      const data = await res.json();
      const responseText = data?.data?.text || 'I\'m having trouble responding right now. Please try again.';

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: responseText,
          timestamp: new Date(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'The AI assistant is temporarily unavailable. Please try again in a moment.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        id="ai-chatbot-toggle"
        aria-label="Toggle AI Assistant"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #4caf50, #00bcd4)',
          color: '#fff',
          fontSize: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 4px 24px rgba(76, 175, 80, 0.4), 0 0 40px rgba(0, 188, 212, 0.15)',
          zIndex: 9999,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
        }}
      >
        {isOpen ? '✕' : '🧠'}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          id="ai-chatbot-panel"
          style={{
            position: 'fixed',
            bottom: '100px',
            right: '24px',
            width: 'min(420px, calc(100vw - 48px))',
            height: 'min(600px, calc(100vh - 140px))',
            backgroundColor: 'var(--bg-secondary, #111916)',
            border: '1px solid var(--border-color, rgba(76, 175, 80, 0.15))',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: 9998,
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), 0 0 60px rgba(76, 175, 80, 0.1)',
            animation: 'chatSlideUp 0.3s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.15), rgba(0, 188, 212, 0.08))',
              borderBottom: '1px solid var(--border-color, rgba(76, 175, 80, 0.15))',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #4caf50, #00bcd4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
              }}
            >
              🧠
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--text-primary, #e8f5e9)' }}>
                HerbHeal AI Assistant
              </h3>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-muted, #4a6b50)' }}>
                Powered by Gemini • Ayurvedic Intelligence
              </p>
            </div>
            <div
              style={{
                marginLeft: 'auto',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#4caf50',
                boxShadow: '0 0 8px rgba(76, 175, 80, 0.6)',
              }}
            />
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            {messages.map((msg, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  animationDelay: `${idx * 50}ms`,
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    backgroundColor:
                      msg.role === 'user'
                        ? 'rgba(76, 175, 80, 0.2)'
                        : 'rgba(255, 255, 255, 0.04)',
                    border: `1px solid ${
                      msg.role === 'user'
                        ? 'rgba(76, 175, 80, 0.3)'
                        : 'rgba(255, 255, 255, 0.06)'
                    }`,
                    color: 'var(--text-primary, #e8f5e9)',
                    fontSize: '13px',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '16px 16px 16px 4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    color: 'var(--text-muted, #4a6b50)',
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ animation: 'chatPulse 1.4s infinite' }}>●</span>
                  <span style={{ animation: 'chatPulse 1.4s infinite 0.2s' }}>●</span>
                  <span style={{ animation: 'chatPulse 1.4s infinite 0.4s' }}>●</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          {messages.length <= 1 && (
            <div
              style={{
                padding: '0 16px 8px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              {QUICK_PROMPTS.map((qp) => (
                <button
                  key={qp}
                  onClick={() => handleSend(qp)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    backgroundColor: 'rgba(76, 175, 80, 0.08)',
                    border: '1px solid rgba(76, 175, 80, 0.2)',
                    color: 'var(--accent-primary, #4caf50)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {qp}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: '1px solid var(--border-color, rgba(76, 175, 80, 0.15))',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about herbs, Ayurveda, safety..."
              disabled={isLoading}
              id="ai-chatbot-input"
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-color, rgba(76, 175, 80, 0.15))',
                backgroundColor: 'var(--bg-primary, #0a0f0d)',
                color: 'var(--text-primary, #e8f5e9)',
                fontSize: '13px',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              id="ai-chatbot-send"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: input.trim()
                  ? 'linear-gradient(135deg, #4caf50, #00bcd4)'
                  : 'rgba(255, 255, 255, 0.06)',
                color: '#fff',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'not-allowed',
                transition: 'all 0.3s ease',
              }}
            >
              ➤
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes chatSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes chatPulse {
          0%, 80%, 100% { opacity: 0.3; }
          40% { opacity: 1; }
        }
      `}} />
    </>
  );
}
