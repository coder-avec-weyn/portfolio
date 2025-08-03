"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ExternalLink,
  Star,
  ArrowLeft,
  Send,
  CheckCircle,
  Loader2,
  RefreshCw,
  Wifi,
  WifiOff,
  AlertTriangle,
  Clock,
  Moon,
  Sun,
  Palette,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner, LoadingScreen } from "@/components/ui/loading-spinner";
import ErrorBoundary from "@/components/ui/error-boundary";
import HireViewErrorBoundary from "./HireViewErrorBoundary";
import DatabaseStatus from "@/components/ui/database-status";
import ChatWidget from "@/components/ui/chat-widget";
import { testSupabaseConnection, testAllTables } from "@/lib/connection-test";

interface HireSection {
  id: string;
  section_type: string;
  title: string;
  content: any;
  order_index: number;
  is_active: boolean;
}

interface HireSkill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  color: string;
  order_index: number;
}

interface HireExperience {
  id: string;
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  location: string;
  achievements: string[];
  order_index: number;
}

interface HireContactField {
  id: string;
  field_type: string;
  label: string;
  placeholder: string;
  is_required: boolean;
  order_index: number;
}

interface DynamicHireViewProps {
  onBackToLanding?: () => void;
}

interface ThemeSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  darkMode: boolean;
  animationIntensity: number;
  borderRadius: number;
  fontFamily: string;
}

// Connection Status Component
function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Test Supabase connection
    const testConnection = async () => {
      try {
        const { error } = await supabase
          .from("hire_sections")
          .select("id")
          .limit(1);
        setIsConnected(!error);
      } catch {
        setIsConnected(false);
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, []);

  const status = isOnline && isConnected;

  return (
    <div
      className={`flex items-center gap-2 text-xs px-3 py-1 rounded-full ${
        status ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
      }`}
    >
      {status ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      <span>{status ? "Connected" : "Offline"}</span>
    </div>
  );
}

// Loading Skeleton Components
function SectionSkeleton() {
  return (
    <Card className="shadow-lg border-blue-100">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse" />
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="w-full h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
          <div className="w-1/2 h-4 bg-gray-200 rounded animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}

function HeroSkeleton() {
  return (
    <div className="text-center space-y-4">
      <div className="w-32 h-32 mx-auto rounded-full bg-gray-200 animate-pulse" />
      <div className="w-64 h-8 mx-auto bg-gray-200 rounded animate-pulse" />
      <div className="w-48 h-6 mx-auto bg-gray-200 rounded animate-pulse" />
      <div className="flex justify-center gap-4">
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
        <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export default function DynamicHireView({
  onBackToLanding,
}: DynamicHireViewProps = {}) {
  const [sections, setSections] = useState<HireSection[]>([]);
  const [skills, setSkills] = useState<HireSkill[]>([]);
  const [experiences, setExperiences] = useState<HireExperience[]>([]);
  const [contactFields, setContactFields] = useState<HireContactField[]>([]);
  const [contactForm, setContactForm] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    primaryColor: "#8b5cf6",
    secondaryColor: "#06b6d4",
    accentColor: "#f59e0b",
    darkMode: false,
    animationIntensity: 75,
    borderRadius: 12,
    fontFamily: "Inter",
  });
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Test connection first
    testSupabaseConnection().then((result) => {
      console.log("Connection test result:", result);
      if (!result.success) {
        setError(`Database connection failed: ${result.error}`);
        setIsLoading(false);
        return;
      }

      // If connection is successful, proceed with data fetching
      fetchHireViewData();
      setupRealtimeSubscriptions();
      loadThemeSettings();
      fetchProfileData();
    });
  }, []);

  // Fetch profile data for chatbot
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
        // Fallback data
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

  // Load theme settings from localStorage or admin panel
  const loadThemeSettings = useCallback(async () => {
    try {
      // Try to load from localStorage first (admin panel settings)
      const savedTheme = localStorage.getItem("admin-theme-settings");
      if (savedTheme) {
        const parsedTheme = JSON.parse(savedTheme);
        setThemeSettings(parsedTheme);
        setIsDarkMode(parsedTheme.darkMode);
        applyThemeToDocument(parsedTheme);
        return;
      }

      // Fallback: try to fetch from a theme configuration table if it exists
      const { data: themeData, error } = await supabase
        .from("theme_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (themeData && !error) {
        const theme = {
          primaryColor: themeData.primary_color || "#8b5cf6",
          secondaryColor: themeData.secondary_color || "#06b6d4",
          accentColor: themeData.accent_color || "#f59e0b",
          darkMode: themeData.dark_mode || false,
          animationIntensity: themeData.animation_intensity || 75,
          borderRadius: themeData.border_radius || 12,
          fontFamily: themeData.font_family || "Inter",
        };
        setThemeSettings(theme);
        setIsDarkMode(theme.darkMode);
        applyThemeToDocument(theme);
      }
    } catch (error) {
      console.log("Theme settings not available, using defaults");
    }
  }, []);

  // Apply theme settings to document
  const applyThemeToDocument = useCallback((theme: ThemeSettings) => {
    const root = document.documentElement;

    // Apply CSS custom properties
    root.style.setProperty("--hire-primary", theme.primaryColor);
    root.style.setProperty("--hire-secondary", theme.secondaryColor);
    root.style.setProperty("--hire-accent", theme.accentColor);
    root.style.setProperty("--hire-border-radius", `${theme.borderRadius}px`);
    root.style.setProperty("--hire-font-family", theme.fontFamily);

    // Apply dark mode class
    if (theme.darkMode) {
      document.body.classList.add("hire-dark-mode");
    } else {
      document.body.classList.remove("hire-dark-mode");
    }
  }, []);

  // Toggle dark mode manually
  const toggleDarkMode = useCallback(() => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    const newTheme = { ...themeSettings, darkMode: newDarkMode };
    setThemeSettings(newTheme);
    applyThemeToDocument(newTheme);

    // Save to localStorage
    localStorage.setItem("hire-view-dark-mode", JSON.stringify(newDarkMode));
  }, [isDarkMode, themeSettings, applyThemeToDocument]);

  const fetchHireViewData = useCallback(
    async (showToast = false) => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("Fetching hire view data for user-facing page...");

        const [sectionsRes, skillsRes, experiencesRes, contactFieldsRes] =
          await Promise.all([
            supabase
              .from("hire_sections")
              .select("*")
              .eq("is_active", true)
              .order("order_index", { ascending: true }),
            supabase
              .from("hire_skills")
              .select("*")
              .eq("is_active", true)
              .order("order_index", { ascending: true }),
            supabase
              .from("hire_experience")
              .select("*")
              .eq("is_active", true)
              .order("order_index", { ascending: true }),
            supabase
              .from("hire_contact_fields")
              .select("*")
              .eq("is_active", true)
              .order("order_index", { ascending: true }),
          ]);

        console.log("Data fetched for user view:", {
          sections: sectionsRes.data?.length || 0,
          skills: skillsRes.data?.length || 0,
          experiences: experiencesRes.data?.length || 0,
          contactFields: contactFieldsRes.data?.length || 0,
        });

        // Check for errors
        const errors = [
          sectionsRes.error,
          skillsRes.error,
          experiencesRes.error,
          contactFieldsRes.error,
        ].filter(Boolean);
        if (errors.length > 0) {
          throw new Error(
            `Database errors: ${errors.map((e) => e?.message).join(", ")}`,
          );
        }

        // Set data with fallbacks
        setSections(sectionsRes.data || []);
        setSkills(skillsRes.data || []);
        setExperiences(experiencesRes.data || []);
        setContactFields(contactFieldsRes.data || []);

        // Initialize contact form
        if (contactFieldsRes.data) {
          const initialForm: Record<string, string> = {};
          contactFieldsRes.data.forEach((field) => {
            initialForm[field.id] = "";
          });
          setContactForm(initialForm);
        }

        setLastUpdated(new Date());
        setRetryCount(0);

        if (showToast) {
          toast({
            title: "Content Updated",
            description: "Hire view data has been refreshed successfully.",
          });
        }
      } catch (error: any) {
        console.error("Error fetching hire view data:", error);
        setError(error.message || "Failed to load hire view data");

        // Implement exponential backoff for retries
        if (retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
            fetchHireViewData();
          }, delay);
        } else {
          toast({
            title: "Error loading content",
            description:
              "Failed to load hire view data after multiple attempts. Please check your connection.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [retryCount, toast],
  );

  const setupRealtimeSubscriptions = useCallback(() => {
    const sessionId = `hireview_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const sectionsChannel = supabase
      .channel(`${sessionId}_sections`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hire_sections" },
        (payload) => {
          console.log("HireView: Sections updated:", payload);
          // Immediate optimistic update for better UX
          if (payload.eventType === "UPDATE" && payload.new) {
            setSections((prev) =>
              prev.map((section) =>
                section.id === payload.new.id ? payload.new : section,
              ),
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            setSections((prev) =>
              [...prev, payload.new].sort(
                (a, b) => a.order_index - b.order_index,
              ),
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setSections((prev) =>
              prev.filter((section) => section.id !== payload.old.id),
            );
          }
          // Also refresh data to ensure consistency
          setTimeout(() => fetchHireViewData(false), 100);
        },
      )
      .subscribe();

    const skillsChannel = supabase
      .channel(`${sessionId}_skills`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hire_skills" },
        (payload) => {
          console.log("HireView: Skills updated:", payload);
          if (payload.eventType === "UPDATE" && payload.new) {
            setSkills((prev) =>
              prev.map((skill) =>
                skill.id === payload.new.id ? payload.new : skill,
              ),
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            setSkills((prev) =>
              [...prev, payload.new].sort(
                (a, b) => a.order_index - b.order_index,
              ),
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setSkills((prev) =>
              prev.filter((skill) => skill.id !== payload.old.id),
            );
          }
          setTimeout(() => fetchHireViewData(false), 100);
        },
      )
      .subscribe();

    const experienceChannel = supabase
      .channel(`${sessionId}_experience`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hire_experience" },
        (payload) => {
          console.log("HireView: Experience updated:", payload);
          if (payload.eventType === "UPDATE" && payload.new) {
            setExperiences((prev) =>
              prev.map((exp) =>
                exp.id === payload.new.id ? payload.new : exp,
              ),
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            setExperiences((prev) =>
              [...prev, payload.new].sort(
                (a, b) => a.order_index - b.order_index,
              ),
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setExperiences((prev) =>
              prev.filter((exp) => exp.id !== payload.old.id),
            );
          }
          setTimeout(() => fetchHireViewData(false), 100);
        },
      )
      .subscribe();

    const contactFieldsChannel = supabase
      .channel(`${sessionId}_contact_fields`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hire_contact_fields" },
        (payload) => {
          console.log("HireView: Contact fields updated:", payload);
          if (payload.eventType === "UPDATE" && payload.new) {
            setContactFields((prev) =>
              prev.map((field) =>
                field.id === payload.new.id ? payload.new : field,
              ),
            );
          } else if (payload.eventType === "INSERT" && payload.new) {
            setContactFields((prev) =>
              [...prev, payload.new].sort(
                (a, b) => a.order_index - b.order_index,
              ),
            );
          } else if (payload.eventType === "DELETE" && payload.old) {
            setContactFields((prev) =>
              prev.filter((field) => field.id !== payload.old.id),
            );
          }
          setTimeout(() => fetchHireViewData(false), 100);
        },
      )
      .subscribe();

    return () => {
      sectionsChannel.unsubscribe();
      skillsChannel.unsubscribe();
      experienceChannel.unsubscribe();
      contactFieldsChannel.unsubscribe();
    };
  }, [fetchHireViewData]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare submission data
      const submissionData: Record<string, any> = {
        user_flow: "employer",
      };

      contactFields.forEach((field) => {
        submissionData[field.label.toLowerCase().replace(/\s+/g, "_")] =
          contactForm[field.id];
      });

      const { error } = await supabase.from("contact_submissions").insert({
        name: submissionData.full_name || submissionData.name || "Unknown",
        email: submissionData.email_address || submissionData.email || "",
        subject: submissionData.subject || "Hire Inquiry",
        message: submissionData.message || "No message provided",
        user_flow: "employer",
      });

      if (error) throw error;

      setIsSubmitted(true);
      setContactForm({});
      toast({
        title: "Message sent successfully!",
        description: "I'll get back to you within 24 hours.",
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      toast({
        title: "Error sending message",
        description: "Please try again or contact me directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generatePDF = async (enhanced = false) => {
    try {
      toast({
        title: "Generating Resume",
        description: enhanced
          ? "Creating enhanced AI-powered resume with LinkedIn integration..."
          : "Generating standard resume...",
      });

      // Import the PDF generation logic dynamically
      const { generateResumePDF, generateEnhancedResumePDF } = await import(
        "@/lib/resume-generator"
      );

      let result;
      if (enhanced) {
        // Check if LinkedIn URL is available
        const resumeData = await supabase
          .from("resume_data")
          .select("*")
          .single();
        const hasLinkedIn = resumeData.data?.content?.personalInfo?.linkedin;

        result = await generateEnhancedResumePDF(hasLinkedIn);

        toast({
          title: "Enhanced Resume Generated!",
          description: hasLinkedIn
            ? "Resume created with LinkedIn profile integration and AI enhancements."
            : "Resume created with AI enhancements. Add LinkedIn URL in admin panel for profile integration.",
        });
      } else {
        result = await generateResumePDF();

        toast({
          title: "Resume Generated!",
          description:
            "Your professional resume has been downloaded successfully.",
        });
      }

      console.log("Resume generation result:", result);
    } catch (error) {
      console.error("Error generating resume:", error);
      toast({
        title: "Resume Generation Failed",
        description:
          "There was an error generating your resume. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  const renderSection = (section: HireSection) => {
    switch (section.section_type) {
      case "hero":
        return renderHeroSection(section);
      case "skills":
        return renderSkillsSection(section);
      case "experience":
        return renderExperienceSection(section);
      case "contact":
        return renderContactSection(section);
      case "resume":
        return renderResumeSection(section);
      default:
        return null;
    }
  };

  const renderHeroSection = (section: HireSection) => (
    <motion.div
      key={section.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="text-center space-y-6"
      style={{
        background: isDarkMode
          ? `linear-gradient(135deg, ${themeSettings.primaryColor}20, ${themeSettings.secondaryColor}20)`
          : `linear-gradient(135deg, ${themeSettings.primaryColor}10, ${themeSettings.secondaryColor}10)`,
        borderRadius: `${themeSettings.borderRadius}px`,
        padding: "3rem 2rem",
      }}
    >
      <div
        className="w-32 h-32 mx-auto rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${themeSettings.primaryColor}, ${themeSettings.secondaryColor})`,
        }}
      >
        <img
          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face&auto=format&q=80"
          alt={profile?.full_name || "Profile"}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src =
              "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face&auto=format&q=80";
          }}
        />
      </div>
      <h1
        className={`text-4xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}
        style={{ fontFamily: themeSettings.fontFamily }}
      >
        {section.content?.headline || "Professional Developer"}
      </h1>
      <p
        className="text-xl font-medium"
        style={{ color: themeSettings.primaryColor }}
      >
        {section.content?.tagline || "Full-Stack Developer"}
      </p>
      {section.content?.bio && (
        <p
          className={`text-lg max-w-2xl mx-auto ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          {section.content.bio}
        </p>
      )}
      <div
        className={`flex flex-wrap justify-center gap-4 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
      >
        {/* Always show contact information for hire view */}
        <div className="flex items-center gap-1">
          <Mail className="w-4 h-4" />
          <span>{section.content?.email || "lakhani.ramya.u@gmail.co"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Phone className="w-4 h-4" />
          <span>{section.content?.phone || "+91 7202800803"}</span>
        </div>
        {section.content?.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span>{section.content.location}</span>
          </div>
        )}
      </div>
      {section.content?.cta_text && (
        <Button
          className="mt-4"
          style={{
            backgroundColor: themeSettings.accentColor,
            borderColor: themeSettings.accentColor,
          }}
          onClick={() => {
            const contactSection = document.getElementById("contact-section");
            contactSection?.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {section.content.cta_text}
        </Button>
      )}
    </motion.div>
  );

  const renderSkillsSection = (section: HireSection) => {
    // Get all unique categories from skills and filter active skills
    const activeSkills = skills.filter((skill) => skill.is_active !== false);
    const allCategories = [
      ...new Set(activeSkills.map((skill) => skill.category)),
    ];

    return (
      <motion.div
        key={section.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        <Card
          className={`shadow-lg ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-blue-100"}`}
          style={{ borderRadius: `${themeSettings.borderRadius}px` }}
        >
          <CardHeader>
            <CardTitle
              className={`text-2xl flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              style={{ fontFamily: themeSettings.fontFamily }}
            >
              <Star
                className="w-6 h-6"
                style={{ color: themeSettings.primaryColor }}
              />
              {section.title || "Technical Skills"}
            </CardTitle>
            {section.content?.description && (
              <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                {section.content.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {allCategories.map((category) => {
                const categorySkills = activeSkills.filter(
                  (skill) => skill.category === category,
                );
                if (categorySkills.length === 0) return null;

                return (
                  <div key={category} className="space-y-3">
                    <h4
                      className={`font-semibold text-lg ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                      style={{ color: themeSettings.secondaryColor }}
                    >
                      {category}
                    </h4>
                    <div className="space-y-3">
                      {categorySkills.map((skill) => (
                        <div key={skill.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span
                              className={
                                isDarkMode ? "text-gray-300" : "text-gray-700"
                              }
                            >
                              {skill.name}
                            </span>
                            <span
                              className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                            >
                              {skill.proficiency}%
                            </span>
                          </div>
                          <div
                            className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                          >
                            <motion.div
                              className="h-full rounded-full"
                              style={{
                                backgroundColor:
                                  skill.color || themeSettings.primaryColor,
                              }}
                              initial={{ width: 0 }}
                              animate={{ width: `${skill.proficiency}%` }}
                              transition={{
                                duration: 1.5,
                                delay: 0.5,
                                ease: "easeOut",
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {activeSkills.length === 0 && (
              <div
                className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Skills information is being updated</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderExperienceSection = (section: HireSection) => {
    const activeExperiences = experiences.filter(
      (exp) => exp.is_active !== false,
    );

    return (
      <motion.div
        key={section.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <Card
          className={`shadow-lg ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-blue-100"}`}
          style={{ borderRadius: `${themeSettings.borderRadius}px` }}
        >
          <CardHeader>
            <CardTitle
              className={`text-2xl flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              style={{ fontFamily: themeSettings.fontFamily }}
            >
              <Calendar
                className="w-6 h-6"
                style={{ color: themeSettings.primaryColor }}
              />
              {section.title || "Professional Experience"}
            </CardTitle>
            {section.content?.description && (
              <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                {section.content.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activeExperiences.map((exp, index) => (
                <motion.div
                  key={exp.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`relative pl-8 border-l-2 last:border-l-0`}
                  style={{ borderColor: `${themeSettings.primaryColor}40` }}
                >
                  <div
                    className="absolute -left-2 top-0 w-4 h-4 rounded-full"
                    style={{ backgroundColor: themeSettings.primaryColor }}
                  ></div>
                  <div className="space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h4
                        className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                      >
                        {exp.position}
                      </h4>
                      <Badge
                        variant="secondary"
                        className={`w-fit ${isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}
                      >
                        {new Date(exp.start_date).getFullYear()} -{" "}
                        {exp.is_current
                          ? "Present"
                          : exp.end_date
                            ? new Date(exp.end_date).getFullYear()
                            : "Present"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                      <span style={{ color: themeSettings.secondaryColor }}>
                        {exp.company}
                      </span>
                      <span
                        className={
                          isDarkMode ? "text-gray-500" : "text-gray-400"
                        }
                      >
                        •
                      </span>
                      <span
                        className={
                          isDarkMode ? "text-gray-400" : "text-gray-600"
                        }
                      >
                        {exp.location}
                      </span>
                    </div>
                    <p
                      className={`leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      {exp.description}
                    </p>
                    {exp.achievements && exp.achievements.length > 0 && (
                      <div className="mt-4">
                        <h5
                          className={`text-sm font-semibold mb-2 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}
                          style={{ color: themeSettings.accentColor }}
                        >
                          Key Achievements:
                        </h5>
                        <ul className="space-y-1">
                          {exp.achievements
                            .filter((achievement) => achievement.trim())
                            .map((achievement, idx) => (
                              <li
                                key={idx}
                                className={`text-sm flex items-start gap-2 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
                              >
                                <span
                                  className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                                  style={{
                                    backgroundColor: themeSettings.accentColor,
                                  }}
                                ></span>
                                {achievement}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
            {activeExperiences.length === 0 && (
              <div
                className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
              >
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Experience information is being updated</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderContactSection = (section: HireSection) => {
    const activeContactFields = contactFields.filter(
      (field) => field.is_active !== false,
    );

    return (
      <motion.div
        key={section.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        id="contact-section"
      >
        <Card
          className={`shadow-lg ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-blue-100"}`}
          style={{ borderRadius: `${themeSettings.borderRadius}px` }}
        >
          <CardHeader>
            <CardTitle
              className={`text-2xl flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
              style={{ fontFamily: themeSettings.fontFamily }}
            >
              <Mail
                className="w-6 h-6"
                style={{ color: themeSettings.primaryColor }}
              />
              {section.title || "Let's Connect"}
            </CardTitle>
            {section.content?.description && (
              <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                {section.content.description}
              </p>
            )}
          </CardHeader>
          <CardContent>
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8 space-y-4"
              >
                <CheckCircle
                  className="w-16 h-16 mx-auto"
                  style={{ color: themeSettings.accentColor }}
                />
                <h3
                  className={`text-xl font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}
                >
                  Message Sent!
                </h3>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                  {section.content?.success_message ||
                    "Thank you for reaching out. I'll get back to you within 24 hours."}
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeContactFields.map((field) => {
                    const isFullWidth = field.field_type === "textarea";
                    const colSpan = isFullWidth ? "md:col-span-2" : "";

                    return (
                      <div key={field.id} className={`space-y-2 ${colSpan}`}>
                        <label
                          className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                        >
                          {field.label} {field.is_required && "*"}
                        </label>
                        {field.field_type === "textarea" ? (
                          <Textarea
                            required={field.is_required}
                            rows={4}
                            value={contactForm[field.id] || ""}
                            onChange={(e) =>
                              setContactForm({
                                ...contactForm,
                                [field.id]: e.target.value,
                              })
                            }
                            className={`${isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-blue-200"} focus:border-opacity-100`}
                            style={{
                              borderColor: `${themeSettings.primaryColor}40`,
                              "--tw-ring-color": themeSettings.primaryColor,
                            }}
                            placeholder={field.placeholder || ""}
                          />
                        ) : (
                          <Input
                            type={field.field_type}
                            required={field.is_required}
                            value={contactForm[field.id] || ""}
                            onChange={(e) =>
                              setContactForm({
                                ...contactForm,
                                [field.id]: e.target.value,
                              })
                            }
                            className={`${isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : "bg-white border-blue-200"} focus:border-opacity-100`}
                            style={{
                              borderColor: `${themeSettings.primaryColor}40`,
                              "--tw-ring-color": themeSettings.primaryColor,
                            }}
                            placeholder={field.placeholder || ""}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                {activeContactFields.length > 0 ? (
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: themeSettings.primaryColor,
                      borderColor: themeSettings.primaryColor,
                    }}
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isSubmitting
                      ? "Sending..."
                      : section.content?.submit_text || "Send Message"}
                  </Button>
                ) : (
                  <div
                    className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Contact form is being configured</p>
                  </div>
                )}
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderResumeSection = (section: HireSection) => (
    <motion.div
      key={section.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="text-center"
    >
      <Card
        className={`shadow-lg ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-blue-100"}`}
        style={{ borderRadius: `${themeSettings.borderRadius}px` }}
      >
        <CardContent className="p-8">
          <h3
            className={`text-xl font-semibold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            style={{ fontFamily: themeSettings.fontFamily }}
          >
            {section.title || "Download Resume"}
          </h3>

          <div className="space-y-4">
            {/* Standard Resume Button */}
            <Button
              onClick={() => generatePDF(false)}
              variant="outline"
              className={`w-full flex items-center gap-2 ${
                isDarkMode
                  ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Download className="w-4 h-4" />
              Standard Resume
            </Button>

            {/* Enhanced AI Resume Button */}
            <Button
              onClick={() => generatePDF(true)}
              className="w-full text-white flex items-center gap-2"
              style={{
                backgroundColor: themeSettings.accentColor,
                borderColor: themeSettings.accentColor,
              }}
            >
              <Download className="w-4 h-4" />
              <span className="flex items-center gap-2">
                Enhanced AI Resume
                <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  NEW
                </span>
              </span>
            </Button>
          </div>

          <div
            className={`mt-6 p-4 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-blue-50"}`}
          >
            <h4
              className={`font-medium mb-2 ${isDarkMode ? "text-gray-200" : "text-blue-900"}`}
            >
              Enhanced Resume Features:
            </h4>
            <ul
              className={`text-sm space-y-1 ${isDarkMode ? "text-gray-300" : "text-blue-700"}`}
            >
              <li>• AI-powered content enhancement</li>
              <li>• LinkedIn profile integration (if URL provided)</li>
              <li>• Professional formatting and styling</li>
              <li>• Optimized skill categorization</li>
              <li>• Enhanced project descriptions</li>
            </ul>
          </div>

          {(section.content?.version || section.content?.last_updated) && (
            <p
              className={`text-sm mt-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
            >
              {section.content?.version && `Version ${section.content.version}`}
              {section.content?.version &&
                section.content?.last_updated &&
                " • "}
              {section.content?.last_updated &&
                `Last updated ${section.content.last_updated}`}
            </p>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  // Error state with retry option
  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-xl font-semibold text-gray-900">
              Failed to Load Content
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 text-sm">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => fetchHireViewData()}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
              {onBackToLanding && (
                <Button
                  onClick={onBackToLanding}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Go Back
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading state with skeletons
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse" />
            <div className="w-24 h-6 bg-gray-200 rounded animate-pulse" />
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
          <HeroSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>
    );
  }

  return (
    <HireViewErrorBoundary
      onRetry={() => fetchHireViewData()}
      onBack={onBackToLanding}
    >
      <div
        className={`min-h-screen transition-colors duration-300 ${isDarkMode ? "bg-gradient-to-br from-gray-900 to-gray-800" : "bg-gradient-to-br from-slate-50 to-blue-50"}`}
        style={{
          background: isDarkMode
            ? `linear-gradient(135deg, #1f2937, #111827)`
            : `linear-gradient(135deg, #f8fafc, #dbeafe)`,
        }}
      >
        {/* Header */}
        <header
          className={`backdrop-blur-sm border-b sticky top-0 z-50 transition-colors duration-300 ${
            isDarkMode
              ? "bg-gray-800/80 border-gray-700"
              : "bg-white/80 border-blue-100"
          }`}
        >
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBackToLanding && (
                <button
                  onClick={onBackToLanding}
                  className={`flex items-center gap-2 transition-colors ${
                    isDarkMode
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-700"
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span className="font-medium">Back to Landing</span>
                </button>
              )}
              {/* Dark Mode Toggle */}
              <Button
                onClick={toggleDarkMode}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">
                  {isDarkMode ? "Light" : "Dark"}
                </span>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <div
                className={`text-xs flex items-center gap-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                <Clock className="w-3 h-3" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <Button
                onClick={() => fetchHireViewData(true)}
                variant="outline"
                size="sm"
                className={`flex items-center gap-2 ${
                  isDarkMode
                    ? "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </div>
          </div>
        </header>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto px-6 py-8 space-y-8"
        >
          <ErrorBoundary
            fallback={
              <Card className="shadow-lg border-red-100">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Section Failed to Load
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    This section encountered an error. Please refresh the page.
                  </p>
                  <Button
                    onClick={() => fetchHireViewData(true)}
                    variant="outline"
                    size="sm"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            }
          >
            <AnimatePresence mode="wait">
              {sections.length === 0 ? (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="text-center py-16"
                >
                  <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <Star className="w-12 h-12 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Content Available
                  </h3>
                  <p className="text-gray-600 mb-6">
                    The hire view content is being set up. Please check back
                    soon.
                  </p>
                  <Button
                    onClick={() => fetchHireViewData(true)}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Check Again
                  </Button>
                </motion.div>
              ) : (
                sections
                  .filter((section) => section.is_active)
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((section, index) => {
                    console.log(
                      `Rendering section: ${section.section_type} - ${section.title}`,
                    );
                    return (
                      <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      >
                        {renderSection(section)}
                      </motion.div>
                    );
                  })
              )}
            </AnimatePresence>
          </ErrorBoundary>

          <Separator className="my-8" />

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className={`text-center text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
          >
            <p>© 2024 Ramya Lakhani. Available for new opportunities.</p>
            <p className="mt-2 flex items-center justify-center gap-2">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: themeSettings.accentColor }}
              ></span>
              Currently available for freelance and full-time positions
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs">
              <Palette className="w-3 h-3" />
              <span>Theme powered by admin panel</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Enhanced Gemini AI Chatbot - Available on Hire View */}
        {profile && <ChatWidget profile={profile} />}
      </div>
    </HireViewErrorBoundary>
  );
}
