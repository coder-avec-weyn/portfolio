import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner, LoadingScreen } from "@/components/ui/loading-spinner";
import ErrorBoundary from "@/components/ui/error-boundary";
import HireViewErrorBoundary from "./HireViewErrorBoundary";
import DatabaseStatus from "@/components/ui/database-status";

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
  const { toast } = useToast();

  useEffect(() => {
    fetchHireViewData();
    setupRealtimeSubscriptions();
  }, []);

  const fetchHireViewData = useCallback(
    async (showToast = false) => {
      try {
        setIsLoading(true);
        setError(null);

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

  const generatePDF = () => {
    const resumeSection = sections.find((s) => s.section_type === "resume");
    const fileUrl = resumeSection?.content?.file_url;

    if (fileUrl) {
      window.open(fileUrl, "_blank");
    } else {
      toast({
        title: "Resume Download",
        description: "Resume file is being prepared. Please try again shortly.",
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
      className="text-center space-y-4"
    >
      <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
        JD
      </div>
      <h1 className="text-4xl font-bold text-gray-900">
        {section.content?.headline || "Professional Developer"}
      </h1>
      <p className="text-xl text-blue-600 font-medium">
        {section.content?.tagline || "Full-Stack Developer"}
      </p>
      <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Mail className="w-4 h-4" />
          <span>john@example.com</span>
        </div>
        <div className="flex items-center gap-1">
          <Phone className="w-4 h-4" />
          <span>+1 (555) 123-4567</span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-4 h-4" />
          <span>Remote / New York, NY</span>
        </div>
      </div>
    </motion.div>
  );

  const renderSkillsSection = (section: HireSection) => (
    <motion.div
      key={section.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
    >
      <Card className="shadow-lg border-blue-100">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-blue-600" />
            {section.title || "Technical Skills"}
          </CardTitle>
          {section.content?.description && (
            <p className="text-gray-600">{section.content.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {["Frontend", "Backend", "Database", "Tools"].map((category) => {
              const categorySkills = skills.filter(
                (skill) => skill.category === category,
              );
              if (categorySkills.length === 0) return null;

              return (
                <div key={category} className="space-y-3">
                  <h4 className="font-semibold text-gray-800 text-lg">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {categorySkills.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between"
                      >
                        <span className="text-gray-700">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: skill.color }}
                              initial={{ width: 0 }}
                              animate={{ width: `${skill.proficiency}%` }}
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </div>
                          <span className="text-sm text-gray-500 w-8">
                            {skill.proficiency}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderExperienceSection = (section: HireSection) => (
    <motion.div
      key={section.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <Card className="shadow-lg border-blue-100">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            {section.title || "Professional Experience"}
          </CardTitle>
          {section.content?.description && (
            <p className="text-gray-600">{section.content.description}</p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {experiences.map((exp, index) => (
              <motion.div
                key={exp.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative pl-8 border-l-2 border-blue-200 last:border-l-0"
              >
                <div className="absolute -left-2 top-0 w-4 h-4 bg-blue-600 rounded-full"></div>
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {exp.position}
                    </h4>
                    <Badge variant="secondary" className="w-fit">
                      {new Date(exp.start_date).getFullYear()} -{" "}
                      {exp.is_current
                        ? "Present"
                        : new Date(exp.end_date!).getFullYear()}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-blue-600 font-medium">
                    <span>{exp.company}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">{exp.location}</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {exp.description}
                  </p>
                  {exp.achievements && exp.achievements.length > 0 && (
                    <div className="mt-3">
                      <h5 className="text-sm font-semibold text-gray-800 mb-2">
                        Key Achievements:
                      </h5>
                      <ul className="list-disc list-inside space-y-1">
                        {exp.achievements.map((achievement, idx) => (
                          <li key={idx} className="text-sm text-gray-600">
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
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderContactSection = (section: HireSection) => (
    <motion.div
      key={section.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
    >
      <Card className="shadow-lg border-blue-100">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
            <Mail className="w-6 h-6 text-blue-600" />
            {section.title || "Let's Connect"}
          </CardTitle>
          {section.content?.description && (
            <p className="text-gray-600">{section.content.description}</p>
          )}
        </CardHeader>
        <CardContent>
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8 space-y-4"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h3 className="text-xl font-semibold text-gray-900">
                Message Sent!
              </h3>
              <p className="text-gray-600">
                {section.content?.success_message ||
                  "Thank you for reaching out. I'll get back to you within 24 hours."}
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleContactSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {contactFields.map((field) => {
                  const isFullWidth = field.field_type === "textarea";
                  const colSpan = isFullWidth ? "md:col-span-2" : "";

                  return (
                    <div key={field.id} className={`space-y-2 ${colSpan}`}>
                      <label className="text-sm font-medium text-gray-700">
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
                          className="border-blue-200 focus:border-blue-500"
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
                          className="border-blue-200 focus:border-blue-500"
                          placeholder={field.placeholder || ""}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
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
            </form>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderResumeSection = (section: HireSection) => (
    <motion.div
      key={section.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="text-center"
    >
      <Card className="shadow-lg border-blue-100">
        <CardContent className="p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            {section.title || "Download Resume"}
          </h3>
          <Button
            onClick={generatePDF}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 mx-auto"
          >
            <Download className="w-4 h-4" />
            {section.content?.button_text || "Download PDF Resume"}
          </Button>
          {section.content?.version && (
            <p className="text-sm text-gray-500 mt-2">
              Version {section.content.version} • Last updated{" "}
              {section.content.last_updated}
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
            {onBackToLanding && (
              <button
                onClick={onBackToLanding}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Landing</span>
              </button>
            )}
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <div className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Last updated: {lastUpdated.toLocaleTimeString()}
              </div>
              <Button
                onClick={() => fetchHireViewData(true)}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
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
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((section, index) => (
                    <motion.div
                      key={section.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      {renderSection(section)}
                    </motion.div>
                  ))
              )}
            </AnimatePresence>
          </ErrorBoundary>

          <Separator className="my-8" />

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-center text-gray-500 text-sm"
          >
            <p>© 2024 John Developer. Available for new opportunities.</p>
            <p className="mt-2">
              <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Currently available for freelance and full-time positions
            </p>
          </motion.div>
        </motion.div>
      </div>
    </HireViewErrorBoundary>
  );
}
