import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import client from '../api/client';

const ChatbotWidget = ({ isOpen, setIsOpen }) => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I am ABHIRAAM_AI. Ask me anything about Abhiraam's experience, skills, and projects.", sender: 'ai' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await client.post('/chat', { message: userMessage.text });
      // Clean up response if it's returning markdown/structured text nicely, or just dump string
      const aiMessage = { id: Date.now(), text: response.data.reply, sender: 'ai' };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = { id: Date.now(), text: "System Error: Connection to backend neural network failed.", sender: 'ai' };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-24 right-6 w-full max-w-[380px] h-[500px] z-50 rounded-lg border border-accent/20 bg-background/90 backdrop-blur-xl shadow-2xl shadow-accent/10 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-accent/10 border-b border-accent/20 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-accent" />
                <span className="font-mono text-xs text-accent uppercase tracking-widest font-bold">ABHIRAAM_AI</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-text-dim hover:text-accent transition-colors"
                aria-label="Close Chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg) => (
                <motion.div 
                  initial={{ opacity: 0, x: msg.sender === 'user' ? 20 : -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={msg.id} 
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-[85%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'user' ? 'bg-white/10 ml-2' : 'bg-accent/20 mr-2'}`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-accent" />}
                    </div>
                    <div className={`p-3 rounded-tr-none rounded-lg text-sm font-sans ${msg.sender === 'user' ? 'bg-white/10 text-white border border-white/5 rounded-br-none' : 'bg-accent/10 text-text border border-accent/20 rounded-bl-none'} whitespace-pre-wrap`}>
                      {msg.sender === 'ai' ? (
                        <div className="prose prose-invert max-w-none text-sm leading-relaxed prose-p:my-1 prose-headings:text-accent prose-strong:text-accent prose-ul:my-2 prose-li:my-0 mt-0">
                          <ReactMarkdown>
                            {msg.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex max-w-[85%] flex-row">
                    <div className="w-8 h-8 rounded-full bg-accent/20 mr-2 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-accent" />
                    </div>
                    <div className="p-3 rounded-lg rounded-bl-none text-sm font-sans bg-accent/10 text-accent border border-accent/20 flex items-center space-x-2">
                       <Loader2 className="w-4 h-4 animate-spin" />
                       <span className="text-xs">Processing...</span>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-accent/20 bg-background/50 flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me a question..."
                className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-text-dim focus:outline-none focus:border-accent transition-colors font-sans"
              />
              <button 
                type="submit" 
                disabled={isLoading || !inputValue.trim()}
                className="bg-accent/20 text-accent hover:bg-accent hover:text-black border border-accent p-2 rounded flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-accent text-background rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] hover:shadow-[0_0_25px_rgba(var(--accent-rgb),0.7)] z-50 transition-shadow"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </motion.button>
    </>
  );
};

ChatbotWidget.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  setIsOpen: PropTypes.func.isRequired,
};

export default ChatbotWidget;
