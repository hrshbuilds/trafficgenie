import { useState, useRef, useEffect } from 'react';
import { useTrafficContext } from '../context/TrafficContextProvider';
import './ChatBot.css';

/**
 * Context-Aware ChatBot Component
 * Provides conversational interface with live traffic data awareness
 */
export function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hello! 👋 I\'m TrafficGenie AI. Ask me about violations, hotspots, or traffic patterns. I\'m aware of where you are in the app and have access to live data!',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  
  const { currentPage, pageData, liveStats, liveViolations, getContextString } = useTrafficContext();

  // Scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending query
  const handleSendQuery = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = {
      type: 'user',
      text: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/ask`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: input,
            currentPage: currentPage,
            pageData: pageData,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Add bot response
      const botMessage = {
        type: 'bot',
        text: data.response || data.analysis || 'Unable to generate response',
        timestamp: new Date(),
        suggestions: data.suggestions || [],
        contextUsed: data.context_used,
        stats: data.live_stats,
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      setError(err.message);
      const errorMessage = {
        type: 'bot',
        text: `⚠️ Error: ${err.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle quick suggestions
  const handleSuggestion = (suggestion) => {
    setInput(suggestion);
  };

  // Quick action buttons
  const quickQuestions = [
    "🔴 What are the hotspots today?",
    "📊 How many violations pending?",
    "⚠️ Show critical violations",
    "🎯 Deployment suggestions?",
  ];

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        className="chatbot-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title="TrafficGenie AI Chat"
      >
        <span className="chat-icon">💬</span>
        {messages.length > 1 && <span className="chat-badge">{messages.length - 1}</span>}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="chatbot-container">
          <div className="chatbot-header">
            <div className="chatbot-title">
              <span className="chat-icon-header">🤖</span>
              TrafficGenie AI
              <span className="context-badge">{currentPage}</span>
            </div>
            <button
              className="chatbot-close"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="chatbot-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message message-${msg.type}`}>
                <div className="message-content">
                  {msg.type === 'user' ? (
                    <div className="message-text user-text">👤 {msg.text}</div>
                  ) : (
                    <>
                      <div className="message-text bot-text">
                        🤖 {msg.text}
                      </div>
                      
                      {/* Show suggestions if available */}
                      {msg.suggestions && msg.suggestions.length > 0 && (
                        <div className="message-suggestions">
                          <p className="suggestions-label">Suggested actions:</p>
                          {msg.suggestions.map((sug, sidx) => (
                            <button
                              key={sidx}
                              className="suggestion-btn"
                              onClick={() => handleSuggestion(sug)}
                            >
                              {sug}
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* Show stats if available */}
                      {msg.stats && (
                        <div className="message-stats">
                          <div className="stat-item">
                            <span>📍 Total Violations:</span>
                            <strong>{msg.stats.totalViolations || 0}</strong>
                          </div>
                          <div className="stat-item">
                            <span>⏳ Pending:</span>
                            <strong>{msg.stats.pendingChallans || 0}</strong>
                          </div>
                          <div className="stat-item">
                            <span>✓ Approved:</span>
                            <strong>{msg.stats.approvedChallans || 0}</strong>
                          </div>
                        </div>
                      )}
                      
                      {msg.contextUsed && (
                        <p className="context-indicator">
                          ✓ Used live data from <strong>{currentPage}</strong> page
                        </p>
                      )}
                    </>
                  )}
                  <span className="message-time">
                    {msg.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            
            {loading && (
              <div className="message message-bot">
                <div className="message-content">
                  <div className="loading-dots">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            
            {error && (
              <div className="message message-error">
                <div className="message-content error-text">
                  ❌ {error}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div className="quick-questions">
              <p className="quick-label">Quick questions:</p>
              <div className="quick-buttons">
                {quickQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    className="quick-btn"
                    onClick={() => {
                      setInput(q);
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="chatbot-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loading) {
                  handleSendQuery();
                }
              }}
              placeholder="Ask me about violations, hotspots, or anything traffic-related..."
              className="chatbot-input"
              disabled={loading}
            />
            <button
              onClick={handleSendQuery}
              disabled={!input.trim() || loading}
              className="chatbot-send-btn"
            >
              {loading ? '⏳' : '➤'}
            </button>
          </div>

          {/* Status Indicator */}
          <div className="chatbot-footer">
            <div className="context-info">
              <span className="dot"></span>
              Live data • Page: <strong>{currentPage}</strong>
              {liveViolations.length > 0 && (
                <span className="violation-count"> • {liveViolations.length} recent violations</span>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatBot;
