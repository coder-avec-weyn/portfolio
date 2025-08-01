import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { queryGemini, validatePortfolioQuery } from "@/lib/gemini";
import { useToast } from "./use-toast";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Profile {
  full_name: string;
  bio: string;
  role: string;
  avatar_url?: string;
  skills?: string[];
  projects?: any[];
  experience?: any[];
}

interface ChatWidgetProps {
  profile: Profile;
  className?: string;
}

const TypingIndicator = () => {
  return (
    <div className="flex items-center space-x-1 p-3">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
      </div>
      <span className="text-white/60 text-sm ml-2">AI is thinking...</span>
    </div>
  );
};

const MessageBubble = ({
  message,
  isLast,
}: {
  message: ChatMessage;
  isLast: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.3,
        ease: "easeOut",
        type: "spring",
        stiffness: 200,
        damping: 20,
      }}
      className={`flex ${message.isUser ? "justify-end" : "justify-start"} ${isLast ? "mb-2" : "mb-3"}`}
    >
      <div
        className={cn(
          "max-w-[85%] p-3 rounded-2xl text-sm relative",
          message.isUser
            ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white shadow-lg"
            : "bg-white/10 text-white/90 border border-white/10 backdrop-blur-sm shadow-lg",
        )}
      >
        {!message.isUser && (
          <div className="absolute -left-2 top-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-r-[8px] border-r-white/10"></div>
        )}
        {message.isUser && (
          <div className="absolute -right-2 top-3 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-purple-600"></div>
        )}

        <p className="leading-relaxed">{message.text}</p>
        <p className="text-xs opacity-60 mt-2">
          {message.timestamp.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </motion.div>
  );
};

const SuggestedQuestions = ({
  onQuestionClick,
  profile,
}: {
  onQuestionClick: (question: string) => void;
  profile: Profile;
}) => {
  const questions = [
    `What are ${profile.full_name.split(" ")[0]}'s main technical skills?`,
    `Tell me about ${profile.full_name.split(" ")[0]}'s recent projects`,
    `What's ${profile.full_name.split(" ")[0]}'s development experience?`,
    `How can I contact ${profile.full_name.split(" ")[0]} for work?`,
  ];

  return (
    <div className="space-y-2 p-4">
      <p className="text-white/60 text-sm mb-3 text-center">
        Ask me anything about {profile.full_name}'s portfolio!
      </p>
      {questions.map((question, index) => (
        <motion.button
          key={index}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onQuestionClick(question)}
          className="block w-full text-left text-xs text-white/50 hover:text-white/80 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-all duration-200 border border-white/10 hover:border-white/20"
        >
          {question}
        </motion.button>
      ))}
    </div>
  );
};

export default function ChatWidget({ profile, className }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [lastQueryTime, setLastQueryTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Rate limiting check
  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const timeSinceLastQuery = now - lastQueryTime;

    if (timeSinceLastQuery < 20000) {
      // 20 seconds between queries
      if (queryCount >= 3) {
        toast({
          title: "Rate limit reached",
          description:
            "Please wait a moment before asking another question. Limit: 3 queries per minute.",
          variant: "destructive",
        });
        return false;
      }
    } else {
      setQueryCount(0);
    }

    return true;
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Rate limiting
    if (!checkRateLimit()) return;

    // Input validation
    if (text.length > 200) {
      toast({
        title: "Message too long",
        description: "Please keep your question under 200 characters.",
        variant: "destructive",
      });
      return;
    }

    // Validate if question is portfolio-related
    if (!validatePortfolioQuery(text)) {
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `I can only answer questions about ${profile.full_name}'s portfolio, skills, and professional experience. Please ask about their technical background or projects.`,
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setInput("");
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await queryGemini(text, profile);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setQueryCount((prev) => prev + 1);
      setLastQueryTime(Date.now());
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble right now. Please try again later or contact directly through the form.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);

      toast({
        title: "Connection error",
        description: "Unable to process your question. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  return (
    <div className={cn("fixed bottom-6 right-6 z-50", className)}>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute bottom-16 right-0 w-96 max-w-[calc(100vw-3rem)] bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-cyan-600/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">
                      Portfolio Assistant
                    </h3>
                    <p className="text-white/60 text-xs">
                      Powered by Gemini AI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-1">
              {messages.length === 0 ? (
                <SuggestedQuestions
                  onQuestionClick={handleSendMessage}
                  profile={profile}
                />
              ) : (
                messages.map((message, index) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isLast={index === messages.length - 1}
                  />
                ))
              )}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 border border-white/10 rounded-2xl backdrop-blur-sm">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="p-4 border-t border-white/10 bg-slate-900/50"
            >
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about skills, projects, experience..."
                  className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-purple-400/20"
                  maxLength={200}
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-3"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-white/40">
                <span>{input.length}/200 characters</span>
                <span>Queries: {3 - queryCount}/3 remaining</span>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-purple-500/25"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: "spring", stiffness: 200 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6 text-white" />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageCircle className="w-6 h-6 text-white" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
