import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Briefcase,
  FolderOpen,
  Sparkles,
  Code,
  MessageCircle,
  X,
  Send,
  Loader2,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
} from "framer-motion";
import { supabase } from "../../../supabase/supabase";
import DynamicHireView from "../hire-view/DynamicHireView";
import PortfolioExperience from "./portfolio-experience";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import ChatWidget from "@/components/ui/chat-widget";

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
  avatar_url: string;
}

export default function LandingPage() {
  const particlesRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [viewMode, setViewMode] = useState<ViewMode>("landing");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [lastDataRefresh, setLastDataRefresh] = useState(Date.now());

  const { toast } = useToast();

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const springConfig = { stiffness: 150, damping: 15, mass: 0.1 };
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const { clientX, clientY } = e;
      setMousePosition({ x: clientX, y: clientY });
      mouseX.set(clientX);
      mouseY.set(clientY);
    },
    [mouseX, mouseY],
  );

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    // Initialize enhanced particles.js with optimized performance
    if (window.particlesJS && particlesRef.current) {
      window.particlesJS("particles-js", {
        particles: {
          number: {
            value: 80,
            density: {
              enable: true,
              value_area: 800,
            },
          },
          color: {
            value: ["#8b5cf6", "#06b6d4", "#f59e0b", "#ec4899"],
          },
          shape: {
            type: "circle",
            stroke: {
              width: 0,
              color: "#000000",
            },
          },
          opacity: {
            value: 0.3,
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
              size_min: 0.5,
              sync: false,
            },
          },
          line_linked: {
            enable: true,
            distance: 150,
            color: "#ffffff",
            opacity: 0.1,
            width: 1,
          },
          move: {
            enable: true,
            speed: 1,
            direction: "none",
            random: false,
            straight: false,
            out_mode: "out",
            bounce: false,
          },
        },
        interactivity: {
          detect_on: "canvas",
          events: {
            onhover: {
              enable: true,
              mode: "grab",
            },
            onclick: {
              enable: true,
              mode: "push",
            },
            resize: true,
          },
          modes: {
            grab: {
              distance: 140,
              line_linked: {
                opacity: 0.5,
              },
            },
            push: {
              particles_nb: 4,
            },
          },
        },
        retina_detect: true,
      });
    }

    // Fetch profile data and track analytics
    fetchProfileData();
    trackAnalytics({
      session_id: sessionId,
      user_flow: "viewer",
      page_path: "/",
      user_agent: navigator.userAgent,
      referrer: document.referrer,
    });

    // Auto-refresh data every 60 seconds
    const refreshInterval = setInterval(() => {
      fetchProfileData();
      setLastDataRefresh(Date.now());
    }, 60000);

    return () => clearInterval(refreshInterval);
  }, [sessionId]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", "main")
        .single();

      if (data && !error) {
        setProfile(data);
      } else {
        // Fallback data for offline development
        setProfile({
          full_name: "Ramya Lakhani",
          bio: "Full-stack developer passionate about creating amazing digital experiences",
          role: "Full-Stack Developer",
          avatar_url:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Use fallback data
      setProfile({
        full_name: "Ramya Lakhani",
        bio: "Full-stack developer passionate about creating amazing digital experiences",
        role: "Full-Stack Developer",
        avatar_url:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80",
      });
    }
  };

  const trackAnalytics = async (data: AnalyticsData) => {
    try {
      await supabase.from("visitor_analytics").insert({
        session_id: data.session_id,
        user_flow: data.user_flow,
        page_path: data.page_path,
        user_agent: data.user_agent,
        ip_address: null,
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
    return <DynamicHireView onBackToLanding={handleBackToLanding} />;
  }

  if (viewMode === "portfolio") {
    return <PortfolioExperience onBackToLanding={handleBackToLanding} />;
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      style={{ height: "100vh" }}
    >
      {/* Cursor Following Light Spot */}
      <motion.div
        className="fixed w-64 h-64 rounded-full pointer-events-none z-10"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%)",
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          willChange: "transform, opacity",
        }}
      />

      {/* Enhanced Particles.js Background with Parallax */}
      <motion.div
        id="particles-js"
        ref={particlesRef}
        className="absolute inset-0"
        style={{ y: backgroundY, willChange: "transform" }}
      />

      {/* Dynamic Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/30 to-indigo-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-purple-500/3 to-transparent" />
      </div>

      {/* Main Content */}
      <main className="relative z-20 flex items-center justify-center h-screen px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl mx-auto w-full items-center">
          {/* Profile Section */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-5 text-center lg:text-left"
            style={{ y: textY, willChange: "transform" }}
          >
            {/* 3D Profile Card with Flip Effect */}
            <motion.div
              variants={itemVariants}
              className="mb-8"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              <motion.div
                className="relative w-32 h-32 lg:w-40 lg:h-40 mx-auto lg:mx-0 mb-6 perspective-1000"
                animate={{ rotateY: isHovering ? 180 : 0 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front of card */}
                <div
                  className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-purple-500 via-cyan-500 to-pink-500 p-1 shadow-2xl"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center text-white text-4xl lg:text-5xl font-bold overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80"
                      alt={profile?.full_name || "Profile Avatar"}
                      className="w-full h-full object-cover rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format&q=80";
                      }}
                    />
                  </div>
                </div>
                {/* Back of card */}
                <div
                  className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-br from-cyan-500 via-purple-500 to-pink-500 p-1 shadow-2xl"
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                >
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-900 to-cyan-900 flex flex-col items-center justify-center text-white p-4">
                    <Code className="w-8 h-8 mb-2" />
                    <span className="text-xs font-semibold">Full Stack</span>
                    <span className="text-xs">Developer</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Profile Info */}
            <motion.div variants={itemVariants} className="mb-8">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4 leading-tight">
                {profile?.full_name || "Ramya Lakhani"}
              </h1>
              <p className="text-xl lg:text-2xl text-cyan-300 font-medium mb-4">
                {profile?.role || "Full-Stack Developer"}
              </p>
              <p className="text-gray-300 text-lg leading-relaxed max-w-lg mx-auto lg:mx-0">
                {profile?.bio ||
                  "Passionate developer creating amazing digital experiences with modern technologies."}
              </p>
            </motion.div>
          </motion.div>

          {/* Journey Selection */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-7"
          >
            {/* Enhanced Glass morphism container */}
            <motion.div
              variants={itemVariants}
              className="backdrop-blur-2xl bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 lg:p-12 border border-white/20 shadow-xl relative overflow-hidden"
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5 rounded-2xl"></div>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 opacity-60 rounded-t-2xl"></div>

              <div className="relative z-10">
                {/* Staggered Text Animation */}
                <motion.div className="mb-6">
                  {"Choose Your".split("").map((char, index) => (
                    <motion.span
                      key={index}
                      className="inline-block text-3xl lg:text-5xl font-bold text-white"
                      variants={{
                        hidden: { opacity: 0, y: 30, rotateX: -90 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          rotateX: 0,
                          transition: {
                            delay: index * 0.03,
                            duration: 0.6,
                            ease: "easeOut",
                          },
                        },
                      }}
                      initial="hidden"
                      animate="visible"
                    >
                      {char === " " ? "\u00A0" : char}
                    </motion.span>
                  ))}
                </motion.div>

                <motion.div
                  className="block text-3xl lg:text-5xl font-bold mb-6"
                  variants={itemVariants}
                >
                  <motion.span
                    className="bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                    animate={{
                      backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      backgroundSize: "200% 200%",
                    }}
                  >
                    Journey
                  </motion.span>
                </motion.div>

                <motion.p
                  variants={itemVariants}
                  className="text-lg lg:text-xl text-white/90 mb-8 leading-relaxed"
                >
                  Two distinct experiences crafted for different perspectives.
                  <br className="hidden lg:block" />
                  <motion.span
                    className="text-cyan-300 font-semibold"
                    whileHover={{ scale: 1.05, color: "#67e8f9" }}
                  >
                    Are you here to hire?
                  </motion.span>{" "}
                  Or{" "}
                  <motion.span
                    className="text-purple-300 font-semibold"
                    whileHover={{ scale: 1.05, color: "#c084fc" }}
                  >
                    here to explore?
                  </motion.span>
                </motion.p>

                {/* Enhanced Path Selection Buttons */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Employer Flow Button */}
                  <motion.button
                    variants={buttonVariants}
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => handleFlowSelection("employer")}
                    disabled={isLoading}
                    className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-blue-500/15 to-cyan-500/15 hover:from-blue-500/25 hover:to-cyan-500/25 border border-white/20 hover:border-cyan-400/40 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="relative z-10">
                      <motion.div
                        className="mb-4"
                        whileHover={{
                          rotate: [0, -3, 3, 0],
                          scale: [1, 1.05, 1],
                          transition: { duration: 0.4 },
                        }}
                      >
                        <Briefcase className="w-12 h-12 text-cyan-400 mx-auto" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-100 transition-colors">
                        I'm Here to Hire
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                        <strong className="text-cyan-300">
                          Streamlined resume experience
                        </strong>
                        <br />
                        Timeline • Skills Matrix • Direct Contact
                      </p>
                      <div className="mt-4 text-xs text-cyan-300/80 group-hover:text-cyan-300 transition-colors">
                        ⚡ Quick overview • 📊 Skills assessment • 📞 Easy
                        contact
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
                    className="group relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-purple-500/15 to-pink-500/15 hover:from-purple-500/25 hover:to-pink-500/25 border border-white/20 hover:border-purple-400/40 rounded-2xl p-8 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="relative z-10">
                      <motion.div
                        className="mb-4"
                        whileHover={{
                          rotate: [0, -3, 3, 0],
                          scale: [1, 1.05, 1],
                          transition: { duration: 0.4 },
                        }}
                      >
                        <FolderOpen className="w-12 h-12 text-pink-400 mx-auto" />
                      </motion.div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-100 transition-colors">
                        I'm Here to Explore
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed group-hover:text-white/90 transition-colors">
                        <strong className="text-purple-300">
                          Full creative experience
                        </strong>
                        <br />
                        3D Animations • Project Showcases • Blog
                      </p>
                      <div className="mt-4 text-xs text-purple-300/80 group-hover:text-purple-300 transition-colors">
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
                  className="mt-8 text-white/60 text-sm"
                >
                  <p className="mb-2">
                    <span className="text-cyan-300">💡 Pro tip:</span> Both
                    paths lead to the same destination with different journeys.
                  </p>
                  <p className="text-xs text-white/40">
                    Your choice helps me tailor the experience to your needs.
                  </p>
                  <div className="mt-4 text-xs text-white/30">
                    Last updated:{" "}
                    {new Date(lastDataRefresh).toLocaleTimeString()}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* Enhanced Gemini AI Chatbot - Available on Landing Page */}
      {profile && <ChatWidget profile={profile} />}

      {/* Floating elements for extra visual appeal */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-40"></div>
      <div className="absolute top-40 right-20 w-1 h-1 bg-purple-400 rounded-full animate-pulse opacity-30 delay-1000"></div>
      <div className="absolute bottom-32 left-20 w-3 h-3 bg-pink-400 rounded-full animate-pulse opacity-35 delay-2000"></div>
      <div className="absolute bottom-40 right-32 w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse opacity-25 delay-3000"></div>
    </div>
  );
}
