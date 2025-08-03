"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Sparkles,
  Reply,
  Bot,
  User,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { cn } from "@/lib/utils";
import { queryGemini, validatePortfolioQuery } from "@/lib/gemini";
import { useToast } from "./use-toast";
import { supabase } from "../../../supabase/supabase";

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isTyping?: boolean;
  reactions?: {
    liked: boolean;
    disliked: boolean;
  };
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

interface Profile {
  full_name: string;
  bio: string;
  role: string;
  avatar_url?: string;
  skills?: string[];
  projects?: any[];
  experience?: any[];
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
  onReply,
  onReaction,
  profile,
}: {
  message: ChatMessage;
  isLast: boolean;
  onReply?: (messageText: string) => void;
  onReaction?: (messageId: string, type: "like" | "dislike") => void;
  profile: Profile;
}) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy text:", error);
    }
  };

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
      className={`flex ${message.isUser ? "justify-end" : "justify-start"} ${isLast ? "mb-2" : "mb-4"} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Avatar for bot messages */}
      {!message.isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center mr-3 mt-1 flex-shrink-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80"
            alt={profile?.full_name || "AI Assistant"}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src =
                "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format&q=80";
            }}
          />
        </div>
      )}

      <div className="flex flex-col max-w-[85%]">
        <div
          className={cn(
            "p-4 rounded-2xl text-sm relative shadow-lg backdrop-blur-sm",
            message.isUser
              ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white ml-auto"
              : "bg-white/15 text-white/95 border border-white/20",
          )}
        >
          {/* Message tail */}
          {!message.isUser && (
            <div className="absolute -left-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-white/15"></div>
          )}
          {message.isUser && (
            <div className="absolute -right-2 top-4 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[10px] border-l-purple-600"></div>
          )}

          {/* Message content */}
          <div className="space-y-2">
            <p className="leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>

            {/* Timestamp and status */}
            <div className="flex items-center justify-between text-xs opacity-70">
              <span>
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {message.isUser && (
                <div className="flex items-center gap-1">
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                  <div className="w-1 h-1 bg-white/60 rounded-full"></div>
                  <span className="text-xs">Delivered</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message actions */}
        <AnimatePresence>
          {showActions && !message.isUser && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-1 mt-2 ml-2"
            >
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10"
                onClick={() => onReply?.(message.text)}
              >
                <Reply className="w-3 h-3 mr-1" />
                Reply
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 text-xs text-white/60 hover:text-white hover:bg-white/10"
                onClick={handleCopy}
              >
                <Copy className="w-3 h-3 mr-1" />
                {copied ? "Copied!" : "Copy"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 px-2 text-xs hover:bg-white/10 ${
                  message.reactions?.liked
                    ? "text-green-400"
                    : "text-white/60 hover:text-white"
                }`}
                onClick={() => onReaction?.(message.id, "like")}
              >
                <ThumbsUp className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className={`h-6 px-2 text-xs hover:bg-white/10 ${
                  message.reactions?.disliked
                    ? "text-red-400"
                    : "text-white/60 hover:text-white"
                }`}
                onClick={() => onReaction?.(message.id, "dislike")}
              >
                <ThumbsDown className="w-3 h-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Avatar for user messages */}
      {message.isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center ml-3 mt-1 flex-shrink-0">
          <User className="w-4 h-4 text-white" />
        </div>
      )}
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
    `Am I suitable for your job?`,
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
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queryCount, setQueryCount] = useState(0);
  const [lastQueryTime, setLastQueryTime] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
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

  const handleReply = (messageText: string) => {
    setReplyingTo(messageText);
    setInput(
      `Regarding "${messageText.substring(0, 50)}${messageText.length > 50 ? "..." : ""}": `,
    );
  };

  const handleReaction = (messageId: string, type: "like" | "dislike") => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            reactions: {
              liked: type === "like" ? !msg.reactions?.liked : false,
              disliked: type === "dislike" ? !msg.reactions?.disliked : false,
            },
          };
        }
        return msg;
      }),
    );
  };

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    // Rate limiting
    if (!checkRateLimit()) return;

    // Input validation
    if (text.length > 500) {
      toast({
        title: "Message too long",
        description: "Please keep your question under 500 characters.",
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
        reactions: { liked: false, disliked: false },
      };
      setMessages((prev) => [...prev, botMessage]);
      setInput("");
      setReplyingTo(null);
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
    setReplyingTo(null);
    setIsLoading(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: "typing",
      text: "AI is analyzing your question...",
      isUser: false,
      timestamp: new Date(),
      isTyping: true,
    };
    setMessages((prev) => [...prev, typingMessage]);

    try {
      const response = await queryGemini(text, profile);

      // Remove typing indicator and add real response
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
        reactions: { liked: false, disliked: false },
      };

      setMessages((prev) => [...prev, botMessage]);
      setQueryCount((prev) => prev + 1);
      setLastQueryTime(Date.now());
    } catch (error) {
      console.error("Chat error:", error);

      // Remove typing indicator
      setMessages((prev) => prev.filter((msg) => msg.id !== "typing"));

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble right now. Please try again later or contact directly through the form.",
        isUser: false,
        timestamp: new Date(),
        reactions: { liked: false, disliked: false },
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
            className={`absolute bottom-16 right-0 bg-slate-900/95 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
              isMinimized ? "w-80 h-16" : "w-96 max-w-[calc(100vw-3rem)]"
            }`}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-600/20 to-cyan-600/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center relative overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80"
                      alt={profile?.full_name || "AI Assistant"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format&q=80";
                      }}
                    />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm">
                      AI Portfolio Assistant
                    </h3>
                    <p className="text-white/60 text-xs flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                      Online • Powered by Gemini AI
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  >
                    {isMinimized ? (
                      <Maximize2 className="w-4 h-4" />
                    ) : (
                      <Minimize2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-white/60 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <div className="h-80 overflow-y-auto p-4 space-y-1 custom-scrollbar">
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
                      onReply={handleReply}
                      onReaction={handleReaction}
                      profile={profile}
                    />
                  ))
                )}

                <div ref={messagesEndRef} />
              </div>
            )}

            {/* Input */}
            {!isMinimized && (
              <form
                onSubmit={handleSubmit}
                className="p-4 border-t border-white/10 bg-slate-900/50"
              >
                {replyingTo && (
                  <div className="mb-3 p-2 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Reply className="w-3 h-3" />
                        <span>Replying to:</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyingTo(null);
                          setInput("");
                        }}
                        className="text-white/40 hover:text-white/60"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-white/50 mt-1 truncate">
                      "{replyingTo.substring(0, 60)}..."
                    </p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask about skills, projects, experience..."
                    className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-purple-400 focus:ring-purple-400/20 rounded-xl"
                    maxLength={500}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() || isLoading}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white border-0 px-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <div className="flex justify-between items-center mt-2 text-xs text-white/40">
                  <span>{input.length}/500 characters</span>
                  <div className="flex items-center gap-2">
                    <span>Queries: {3 - queryCount}/3 remaining</span>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                      <span>AI Ready</span>
                    </div>
                  </div>
                </div>
              </form>
            )}

            {/* Minimized quick input */}
            {isMinimized && (
              <div className="px-4 py-2">
                <div className="flex items-center gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Quick question..."
                    className="flex-1 bg-white/5 border-white/20 text-white placeholder:text-white/40 text-sm h-8"
                    onFocus={() => setIsMinimized(false)}
                  />
                  <Button
                    size="sm"
                    onClick={() => setIsMinimized(false)}
                    className="bg-gradient-to-r from-purple-600 to-cyan-600 h-8 px-2"
                  >
                    <Maximize2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
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
