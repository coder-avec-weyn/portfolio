import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings, User, Briefcase, FolderOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../supabase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../../../supabase/supabase";
import EmployerResume from "./employer-resume";
import PortfolioExperience from "./portfolio-experience";

// Declare particles for TypeScript
declare global {
  interface Window {
    particlesJS: any;
  }
}

interface AnalyticsData {
  session_id: string;
  user_flow: "employer" | "viewer";
  page_path: string;
  user_agent: string;
  referrer: string;
}

type ViewMode = "landing" | "hire" | "portfolio";

export default function LandingPage() {
  const { user, signOut } = useAuth();
  const particlesRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [viewMode, setViewMode] = useState<ViewMode>("landing");

  useEffect(() => {
    // Initialize particles.js with enhanced configuration
    if (window.particlesJS && particlesRef.current) {
      window.particlesJS("particles-js", {
        particles: {
          number: {
            value: 120,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: ["#ffffff", "#64b5f6", "#81c784", "#ffb74d", "#f06292"],
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: "#000000",
            },
          },
          opacity: {
            value: 0.6,
            random: true,
            anim: {
              enable: true,
              speed: 1,
              opacity_min: 0.1,
              sync: false,
            },
          },
          size: {
            value: 3,
            random: true,
            anim: {
              enable: true,
              speed: 2,
              size_min: 0.1,
              sync: false,
            },
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#ffffff",
            opacity: 0.2,
            width: 1,
          },
          move: {
            enable: true,
            speed: 2,
            direction: "none",
            random: true,
            straight: false,
            out_mode: "out",
            bounce: false,
            attract: {
              enable: true,
              rotateX: 600,
              rotateY: 1200,
            },
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: true,
              mode: "bubble",
            },
            onclick: {
              enable: true,
              mode: "push",
            },
            resize: true,
          },
          modes: {
            grab: {
              distance: 400,
              line_linked: {
                opacity: 1,
              },
            },
            bubble: {
              distance: 200,
              size: 8,
              duration: 2,
              opacity: 0.8,
              speed: 3,
            },
            repulse: {
              distance: 200,
              duration: 0.4,
            },
            push: {
              particles_nb: 4,
            },
            remove: {
              particles_nb: 2,
            },
          },
        },
        retina_detect: true,
      });
    }

    // Track page visit
    trackAnalytics({
      session_id: sessionId,
      user_flow: "viewer",
      page_path: "/",
      user_agent: navigator.userAgent,
      referrer: document.referrer,
    });
  }, [sessionId]);

  const trackAnalytics = async (data: AnalyticsData) => {
    try {
      await supabase.from("visitor_analytics").insert({
        session_id: data.session_id,
        user_flow: data.user_flow,
        page_path: data.page_path,
        user_agent: data.user_agent,
        ip_address: null, // Will be handled by Supabase
        referrer: data.referrer,
      });
    } catch (error) {
      console.error("Analytics tracking error:", error);
    }
  };

  const handleFlowSelection = async (flow: "employer" | "viewer") => {
    setIsLoading(true);

    // Track flow selection
    await trackAnalytics({
      session_id: sessionId,
      user_flow: flow,
      page_path: `/${flow}-flow`,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
    });

    // Set view mode without navigation
    setTimeout(() => {
      if (flow === "employer") {
        setViewMode("hire");
      } else {
        setViewMode("portfolio");
      }
      setIsLoading(false);
    }, 800);
  };

  const handleBackToLanding = () => {
    setViewMode("landing");
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        type: "spring",
        stiffness: 100,
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
      },
    },
  };

  // Conditional rendering based on view mode
  if (viewMode === "hire") {
    return <EmployerResume onBackToLanding={handleBackToLanding} />;
  }

  if (viewMode === "portfolio") {
    return <PortfolioExperience onBackToLanding={handleBackToLanding} />;
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Enhanced Particles.js Background */}
      <div
        id="particles-js"
        ref={particlesRef}
        className="absolute inset-0"
      ></div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/30 to-indigo-900/20"></div>

      {/* Glass morphism navigation */}
      <header className="fixed top-0 z-50 w-full">
        <div className="backdrop-blur-xl bg-white/5 border-b border-white/10 shadow-lg">
          <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center"
            >
              <Link
                to="/"
                className="font-bold text-xl text-white flex items-center gap-2"
              >
                <Sparkles className="w-6 h-6 text-cyan-400" />
                Portfolio
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex items-center space-x-4"
            >
              {user ? (
                <div className="flex items-center gap-4">
                  <Link to="/dashboard">
                    <Button
                      variant="ghost"
                      className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                    >
                      Dashboard
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="h-8 w-8 hover:cursor-pointer border-2 border-white/20 hover:border-white/40 transition-all">
                        <AvatarImage
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                          alt={user.email || ""}
                        />
                        <AvatarFallback className="bg-white/20 text-white">
                          {user.email?.[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="backdrop-blur-xl bg-white/10 border border-white/20 text-white shadow-2xl"
                    >
                      <DropdownMenuLabel className="text-white/60">
                        {user.email}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white focus:bg-white/10">
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer hover:bg-white/10 text-white focus:bg-white/10">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/20" />
                      <DropdownMenuItem
                        className="cursor-pointer hover:bg-white/10 text-white focus:bg-white/10"
                        onSelect={() => signOut()}
                      >
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <>
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-sm border border-white/30 shadow-lg">
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-screen px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-5xl mx-auto"
        >
          {/* Enhanced Glass morphism container */}
          <motion.div
            variants={itemVariants}
            className="backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-12 md:p-16 border border-white/20 shadow-2xl relative overflow-hidden"
          >
            {/* Animated background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-3xl"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-60"></div>

            <div className="relative z-10">
              <motion.h1
                variants={itemVariants}
                className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight"
              >
                Choose Your
                <motion.span
                  className="block bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                >
                  Journey
                </motion.span>
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl md:text-2xl text-white/80 mb-16 max-w-3xl mx-auto leading-relaxed"
              >
                Two distinct experiences crafted for different perspectives.
                <br className="hidden md:block" />
                <span className="text-cyan-300">
                  Are you here to hire?
                </span> Or{" "}
                <span className="text-purple-300">here to explore?</span>
              </motion.p>

              {/* Enhanced Path Selection Buttons */}
              <div className="flex flex-col lg:flex-row gap-8 justify-center items-center">
                {/* Employer Flow Button */}
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => handleFlowSelection("employer")}
                  disabled={isLoading}
                  className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 border border-white/30 hover:border-cyan-400/50 rounded-3xl p-10 w-full lg:w-96 transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-cyan-600/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>

                  {/* Glowing border effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/20 to-cyan-400/20 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>

                  <div className="relative z-10">
                    <motion.div
                      className="mb-6"
                      whileHover={{
                        rotate: [0, -5, 5, 0],
                        scale: [1, 1.1, 1],
                        transition: { duration: 0.6 },
                      }}
                    >
                      <Briefcase className="w-16 h-16 text-cyan-400 mx-auto drop-shadow-lg" />
                    </motion.div>
                    <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-cyan-100 transition-colors">
                      I'm Here to Hire
                    </h3>
                    <p className="text-white/70 text-base leading-relaxed group-hover:text-white/90 transition-colors">
                      <strong className="text-cyan-300">
                        Streamlined resume experience
                      </strong>
                      <br />
                      Timeline • Skills Matrix • Direct Contact
                      <br />
                      Perfect for recruiters and hiring managers
                    </p>
                    <div className="mt-6 text-sm text-cyan-300/80 group-hover:text-cyan-300 transition-colors">
                      ⚡ Quick overview • 📊 Skills assessment • 📞 Easy contact
                    </div>
                  </div>
                </motion.button>

                {/* Portfolio Flow Button */}
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => handleFlowSelection("viewer")}
                  disabled={isLoading}
                  className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-white/30 hover:border-purple-400/50 rounded-3xl p-10 w-full lg:w-96 transition-all duration-500 hover:shadow-2xl hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {/* Animated background gradient */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-3xl"></div>

                  {/* Glowing border effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 group-hover:opacity-100 transition-all duration-500 blur-sm"></div>

                  <div className="relative z-10">
                    <motion.div
                      className="mb-6"
                      whileHover={{
                        rotate: [0, -5, 5, 0],
                        scale: [1, 1.1, 1],
                        transition: { duration: 0.6 },
                      }}
                    >
                      <FolderOpen className="w-16 h-16 text-pink-400 mx-auto drop-shadow-lg" />
                    </motion.div>
                    <h3 className="text-3xl font-bold text-white mb-4 group-hover:text-purple-100 transition-colors">
                      I'm Here to Explore
                    </h3>
                    <p className="text-white/70 text-base leading-relaxed group-hover:text-white/90 transition-colors">
                      <strong className="text-purple-300">
                        Full creative experience
                      </strong>
                      <br />
                      3D Animations • Project Showcases • Blog
                      <br />
                      Dive deep into the creative process
                    </p>
                    <div className="mt-6 text-sm text-purple-300/80 group-hover:text-purple-300 transition-colors">
                      🎨 Interactive demos • 🚀 3D experiences • 📝 Insights
                    </div>
                  </div>
                </motion.button>
              </div>

              {/* Loading State */}
              <AnimatePresence>
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="mt-8 flex items-center justify-center gap-3 text-white/80"
                  >
                    <div className="w-6 h-6 border-2 border-white/30 border-t-cyan-400 rounded-full animate-spin"></div>
                    <span className="text-lg">
                      Preparing your experience...
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Additional Info */}
              <motion.div
                variants={itemVariants}
                className="mt-16 text-white/60 text-sm max-w-2xl mx-auto"
              >
                <p className="mb-2">
                  <span className="text-cyan-300">💡 Pro tip:</span> Both paths
                  lead to the same destination with different journeys.
                </p>
                <p className="text-xs text-white/40">
                  Your choice helps me tailor the experience to your needs.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* Floating elements for extra visual appeal */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-40 delay-1000"></div>
      <div className="absolute bottom-20 left-20 w-3 h-3 bg-pink-400 rounded-full animate-pulse opacity-50 delay-2000"></div>
      <div className="absolute bottom-40 right-10 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse opacity-30 delay-3000"></div>
    </div>
  );
}
