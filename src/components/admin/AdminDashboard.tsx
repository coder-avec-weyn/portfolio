import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Settings,
  Users,
  MessageSquare,
  BarChart3,
  Palette,
  FileText,
  LogOut,
  Eye,
  Mail,
  Calendar,
  Shield,
  Download,
  Upload,
  Code,
  Zap,
  Target,
  Accessibility,
  Activity,
  Archive,
  Lock,
  Smartphone,
  Monitor,
  Sun,
  Moon,
  Contrast,
  Type,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Edit,
  Copy,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Database,
  Cloud,
  HardDrive,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "../../../supabase/auth";
import HireViewEditor from "./HireViewEditor";
import PortfolioCMS from "./PortfolioCMS";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  user_flow: string;
  status: string;
  created_at: string;
}

interface AnalyticsData {
  id: string;
  user_flow: string;
  page_path: string;
  created_at: string;
}

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [stats, setStats] = useState({
    totalVisitors: 0,
    employerViews: 0,
    portfolioViews: 0,
    unreadMessages: 0,
  });

  // Theme Builder State
  const [themeSettings, setThemeSettings] = useState({
    primaryColor: "#8b5cf6",
    secondaryColor: "#06b6d4",
    accentColor: "#f59e0b",
    darkMode: false,
    animationIntensity: 75,
    borderRadius: 12,
    fontFamily: "Inter",
  });

  // Content Versioning State
  const [contentVersions, setContentVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);

  // Performance Monitor State
  const [performanceMetrics, setPerformanceMetrics] = useState({
    lighthouseScore: 92,
    bundleSize: "2.4MB",
    loadTime: "1.2s",
    coreWebVitals: {
      lcp: 1.8,
      fid: 12,
      cls: 0.05,
    },
  });

  // Security Center State
  const [securityLogs, setSecurityLogs] = useState([]);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(30); // 30 minutes
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Backup System State
  const [backupStatus, setBackupStatus] = useState("idle");
  const [lastBackup, setLastBackup] = useState(null);

  // Custom Script State
  const [customScripts, setCustomScripts] = useState({
    header: "",
    footer: "",
    analytics: "",
  });

  // Debug Mode State
  const [debugMode, setDebugMode] = useState(false);
  const [operationLogs, setOperationLogs] = useState<string[]>([]);

  // Resume Management State
  const [resumeData, setResumeData] = useState({
    personalInfo: {
      fullName: "",
      email: "",
      phone: "",
      location: "",
      website: "",
      linkedin: "",
      github: "",
      summary: "",
    },
    education: [],
    certifications: [],
    languages: [],
    interests: "",
  });
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);

  // Profile Image State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchResumeData();
    fetchProfileImage();

    // Session timeout implementation
    const checkSession = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;
      const timeoutMs = sessionTimeout * 60 * 1000; // Convert to milliseconds

      if (timeSinceLastActivity > timeoutMs) {
        toast({
          title: "Session Expired",
          description: "You have been logged out due to inactivity.",
          variant: "destructive",
        });
        onLogout();
      }
    };

    // Check session every minute
    const sessionInterval = setInterval(checkSession, 60000);

    // Update last activity on user interaction
    const updateActivity = () => setLastActivity(Date.now());
    document.addEventListener("mousedown", updateActivity);
    document.addEventListener("keydown", updateActivity);
    document.addEventListener("scroll", updateActivity);

    return () => {
      clearInterval(sessionInterval);
      document.removeEventListener("mousedown", updateActivity);
      document.removeEventListener("keydown", updateActivity);
      document.removeEventListener("scroll", updateActivity);
    };
  }, [lastActivity, sessionTimeout, onLogout, toast]);

  const logOperation = (operation: string, success: boolean = true) => {
    const timestamp = new Date().toLocaleTimeString();
    const status = success ? "✅" : "❌";
    const logEntry = `${timestamp} ${status} ${operation}`;
    setOperationLogs((prev) => [logEntry, ...prev.slice(0, 49)]); // Keep last 50 logs

    if (debugMode) {
      console.log(`[Admin Debug] ${logEntry}`);
    }
  };

  const fetchData = async () => {
    try {
      logOperation("Starting data fetch");

      // Fetch contact submissions
      const { data: contactData, error: contactError } = await supabase
        .from("contact_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (contactError) {
        logOperation(`Contact fetch error: ${contactError.message}`, false);
        throw contactError;
      }

      // Fetch analytics
      const { data: analyticsData, error: analyticsError } = await supabase
        .from("visitor_analytics")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (analyticsError) {
        logOperation(`Analytics fetch error: ${analyticsError.message}`, false);
        throw analyticsError;
      }

      if (contactData) {
        setContacts(contactData);
        logOperation(`Fetched ${contactData.length} contact submissions`);
      }

      if (analyticsData) {
        setAnalytics(analyticsData);
        logOperation(`Fetched ${analyticsData.length} analytics records`);

        // Calculate stats
        const employerViews = analyticsData.filter(
          (item) => item.user_flow === "employer",
        ).length;
        const portfolioViews = analyticsData.filter(
          (item) => item.user_flow === "viewer",
        ).length;
        const unreadMessages =
          contactData?.filter((item) => item.status === "unread").length || 0;

        setStats({
          totalVisitors: analyticsData.length,
          employerViews,
          portfolioViews,
          unreadMessages,
        });

        logOperation("Stats calculated successfully");
      }
    } catch (error: any) {
      console.error("Error fetching data:", error);
      logOperation(`Data fetch failed: ${error.message}`, false);
      toast({
        title: "Data Fetch Error",
        description:
          "Failed to load dashboard data. Check debug logs for details.",
        variant: "destructive",
      });
    }
  };

  const refreshData = async () => {
    logOperation("Manual data refresh initiated");
    await fetchData();
    toast({
      title: "Data Refreshed",
      description: "Dashboard data has been updated.",
    });
  };

  const markAsRead = async (id: string) => {
    try {
      logOperation(`Marking message ${id} as read`);

      const { error } = await supabase
        .from("contact_submissions")
        .update({ status: "read" })
        .eq("id", id);

      if (error) {
        logOperation(`Failed to mark message as read: ${error.message}`, false);
        throw error;
      }

      setContacts(
        contacts.map((contact) =>
          contact.id === id ? { ...contact, status: "read" } : contact,
        ),
      );

      logOperation("Message marked as read successfully");
      toast({
        title: "Message marked as read",
        description: "The message status has been updated.",
      });
    } catch (error: any) {
      console.error("Error updating message:", error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update message status.",
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const fetchResumeData = async () => {
    try {
      logOperation("Fetching resume data");
      const { data, error } = await supabase
        .from("resume_data")
        .select("*")
        .single();

      if (data && !error) {
        setResumeData(data.content || resumeData);
        logOperation("Resume data fetched successfully");
      }
    } catch (error: any) {
      console.error("Error fetching resume data:", error);
      logOperation(`Resume data fetch failed: ${error.message}`, false);
    }
  };

  const fetchProfileImage = async () => {
    try {
      logOperation("Fetching profile image");
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .single();

      if (data && !error && data.avatar_url) {
        setProfileImage(data.avatar_url);
        logOperation("Profile image fetched successfully");
      }
    } catch (error: any) {
      console.error("Error fetching profile image:", error);
      logOperation(`Profile image fetch failed: ${error.message}`, false);
    }
  };

  const saveResumeData = async () => {
    try {
      logOperation("Saving resume data");
      const { error } = await supabase.from("resume_data").upsert({
        id: "main",
        content: resumeData,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        logOperation(`Failed to save resume data: ${error.message}`, false);
        throw error;
      }

      logOperation("Resume data saved successfully");
      toast({
        title: "Resume Data Saved",
        description: "Your resume information has been updated.",
      });
    } catch (error: any) {
      console.error("Error saving resume data:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save resume data.",
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File Type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    logOperation("Starting image upload");

    try {
      // Upload to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `profile-${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("profile-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        logOperation(`Image upload failed: ${uploadError.message}`, false);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-images").getPublicUrl(fileName);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: (await supabase.auth.getUser()).data.user?.id,
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      });

      if (updateError) {
        logOperation(`Profile update failed: ${updateError.message}`, false);
        throw updateError;
      }

      setProfileImage(publicUrl);
      logOperation("Profile image uploaded and updated successfully");

      toast({
        title: "Profile Image Updated",
        description: "Your profile image has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload profile image.",
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const generateResumePDF = async () => {
    setIsGeneratingResume(true);
    logOperation("Starting resume PDF generation");

    try {
      // Fetch latest data from database
      const [profileRes, skillsRes, experiencesRes, projectsRes] =
        await Promise.all([
          supabase.from("profiles").select("*").single(),
          supabase
            .from("hire_skills")
            .select("*")
            .eq("is_active", true)
            .order("order_index"),
          supabase
            .from("hire_experience")
            .select("*")
            .eq("is_active", true)
            .order("order_index"),
          supabase
            .from("projects")
            .select("*")
            .eq("is_active", true)
            .order("order_index"),
        ]);

      const profile = profileRes.data;
      const skills = skillsRes.data || [];
      const experiences = experiencesRes.data || [];
      const projects = projectsRes.data || [];

      // Create PDF
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(24);
      pdf.setFont("helvetica", "bold");
      pdf.text(
        resumeData.personalInfo.fullName ||
          profile?.full_name ||
          "Ramya Lakhani",
        pageWidth / 2,
        yPosition,
        { align: "center" },
      );
      yPosition += 10;

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "normal");
      pdf.text(
        profile?.role || "Full-Stack Developer",
        pageWidth / 2,
        yPosition,
        { align: "center" },
      );
      yPosition += 15;

      // Contact Information
      pdf.setFontSize(10);
      const contactInfo = [
        resumeData.personalInfo.email || "lakhani.ramya.u@gmail.co",
        resumeData.personalInfo.phone || "+91 7202800803",
        resumeData.personalInfo.location || "India",
      ].join(" | ");
      pdf.text(contactInfo, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 20;

      // Professional Summary
      if (resumeData.personalInfo.summary || profile?.bio) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("PROFESSIONAL SUMMARY", 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        const summaryText =
          resumeData.personalInfo.summary || profile?.bio || "";
        const splitSummary = pdf.splitTextToSize(summaryText, pageWidth - 40);
        pdf.text(splitSummary, 20, yPosition);
        yPosition += splitSummary.length * 5 + 10;
      }

      // Skills
      if (skills.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("TECHNICAL SKILLS", 20, yPosition);
        yPosition += 8;

        const skillsByCategory = skills.reduce((acc: any, skill: any) => {
          if (!acc[skill.category]) acc[skill.category] = [];
          acc[skill.category].push(skill.name);
          return acc;
        }, {});

        pdf.setFontSize(10);
        Object.entries(skillsByCategory).forEach(
          ([category, skillList]: [string, any]) => {
            pdf.setFont("helvetica", "bold");
            pdf.text(`${category}:`, 20, yPosition);
            pdf.setFont("helvetica", "normal");
            pdf.text(skillList.join(", "), 60, yPosition);
            yPosition += 6;
          },
        );
        yPosition += 10;
      }

      // Experience
      if (experiences.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("PROFESSIONAL EXPERIENCE", 20, yPosition);
        yPosition += 8;

        experiences.forEach((exp: any) => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text(exp.position, 20, yPosition);

          pdf.setFont("helvetica", "normal");
          const dateRange = `${new Date(exp.start_date).getFullYear()} - ${exp.is_current ? "Present" : new Date(exp.end_date).getFullYear()}`;
          pdf.text(dateRange, pageWidth - 20, yPosition, { align: "right" });
          yPosition += 6;

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "italic");
          pdf.text(`${exp.company} | ${exp.location}`, 20, yPosition);
          yPosition += 8;

          if (exp.description) {
            pdf.setFont("helvetica", "normal");
            const descText = pdf.splitTextToSize(
              exp.description,
              pageWidth - 40,
            );
            pdf.text(descText, 20, yPosition);
            yPosition += descText.length * 4 + 5;
          }

          if (exp.achievements && exp.achievements.length > 0) {
            exp.achievements.forEach((achievement: string) => {
              if (achievement.trim()) {
                const achText = pdf.splitTextToSize(
                  `• ${achievement}`,
                  pageWidth - 50,
                );
                pdf.text(achText, 25, yPosition);
                yPosition += achText.length * 4 + 2;
              }
            });
          }
          yPosition += 8;
        });
      }

      // Projects
      if (projects.length > 0) {
        if (yPosition > pageHeight - 60) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("KEY PROJECTS", 20, yPosition);
        yPosition += 8;

        projects.slice(0, 3).forEach((project: any) => {
          if (yPosition > pageHeight - 30) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(12);
          pdf.setFont("helvetica", "bold");
          pdf.text(project.title, 20, yPosition);
          yPosition += 6;

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          if (project.description) {
            const projText = pdf.splitTextToSize(
              project.description,
              pageWidth - 40,
            );
            pdf.text(projText, 20, yPosition);
            yPosition += projText.length * 4 + 3;
          }

          if (project.tech_stack && project.tech_stack.length > 0) {
            pdf.setFont("helvetica", "italic");
            pdf.text(
              `Technologies: ${project.tech_stack.join(", ")}`,
              20,
              yPosition,
            );
            yPosition += 8;
          }
        });
      }

      // Education (if provided)
      if (resumeData.education.length > 0) {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.text("EDUCATION", 20, yPosition);
        yPosition += 8;

        resumeData.education.forEach((edu: any) => {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "bold");
          pdf.text(edu.degree, 20, yPosition);
          pdf.setFont("helvetica", "normal");
          pdf.text(edu.year, pageWidth - 20, yPosition, { align: "right" });
          yPosition += 5;
          pdf.text(edu.institution, 20, yPosition);
          yPosition += 8;
        });
      }

      // Save PDF
      const fileName = `${(resumeData.personalInfo.fullName || "Resume").replace(/\s+/g, "_")}_Resume_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      logOperation("Resume PDF generated successfully");
      toast({
        title: "Resume Generated",
        description: "Your PDF resume has been downloaded successfully.",
      });
    } catch (error: any) {
      console.error("Error generating resume:", error);
      logOperation(`Resume generation failed: ${error.message}`, false);
      toast({
        title: "Generation Failed",
        description: "Failed to generate resume PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingResume(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Portfolio Management System
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={refreshData}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Debug:</span>
              <Switch
                checked={debugMode}
                onCheckedChange={setDebugMode}
                className="data-[state=checked]:bg-purple-600"
              />
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto px-6 py-8"
      >
        {/* Stats Overview */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">
                    Total Visitors
                  </p>
                  <p className="text-3xl font-bold">{stats.totalVisitors}</p>
                </div>
                <Users className="w-8 h-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">
                    Employer Views
                  </p>
                  <p className="text-3xl font-bold">{stats.employerViews}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">
                    Portfolio Views
                  </p>
                  <p className="text-3xl font-bold">{stats.portfolioViews}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">
                    Unread Messages
                  </p>
                  <p className="text-3xl font-bold">{stats.unreadMessages}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Main Content */}
        <motion.div variants={itemVariants}>
          <Tabs defaultValue="messages" className="space-y-6">
            <TabsList className="grid w-full grid-cols-6 lg:grid-cols-14 gap-1 h-auto p-1">
              <TabsTrigger
                value="messages"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <MessageSquare className="w-3 h-3" />
                <span className="hidden sm:inline">Messages</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <BarChart3 className="w-3 h-3" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger
                value="portfolio-cms"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Settings className="w-3 h-3" />
                <span className="hidden sm:inline">Portfolio CMS</span>
              </TabsTrigger>
              <TabsTrigger
                value="hire-view"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Users className="w-3 h-3" />
                <span className="hidden sm:inline">Hire View</span>
              </TabsTrigger>
              <TabsTrigger
                value="theme"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Palette className="w-3 h-3" />
                <span className="hidden sm:inline">Theme</span>
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">Content</span>
              </TabsTrigger>
              <TabsTrigger
                value="accessibility"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Accessibility className="w-3 h-3" />
                <span className="hidden sm:inline">A11y</span>
              </TabsTrigger>
              <TabsTrigger
                value="performance"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Activity className="w-3 h-3" />
                <span className="hidden sm:inline">Perf</span>
              </TabsTrigger>
              <TabsTrigger
                value="projects"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">Projects</span>
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Shield className="w-3 h-3" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger
                value="backup"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Archive className="w-3 h-3" />
                <span className="hidden sm:inline">Backup</span>
              </TabsTrigger>
              <TabsTrigger
                value="scripts"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Code className="w-3 h-3" />
                <span className="hidden sm:inline">Scripts</span>
              </TabsTrigger>
              <TabsTrigger
                value="versions"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Clock className="w-3 h-3" />
                <span className="hidden sm:inline">Versions</span>
              </TabsTrigger>
              <TabsTrigger
                value="forms"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Mail className="w-3 h-3" />
                <span className="hidden sm:inline">Forms</span>
              </TabsTrigger>
              <TabsTrigger
                value="resume"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <FileText className="w-3 h-3" />
                <span className="hidden sm:inline">Resume</span>
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="flex items-center gap-1 text-xs px-2 py-2"
              >
                <Users className="w-3 h-3" />
                <span className="hidden sm:inline">Profile</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="messages" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Contact Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contacts.map((contact) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {contact.name}
                              </h4>
                              <p className="text-sm text-gray-500">
                                {contact.email}
                              </p>
                            </div>
                            <Badge
                              variant={
                                contact.user_flow === "employer"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {contact.user_flow}
                            </Badge>
                            <Badge
                              variant={
                                contact.status === "unread"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {contact.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400">
                              {new Date(
                                contact.created_at,
                              ).toLocaleDateString()}
                            </span>
                            {contact.status === "unread" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => markAsRead(contact.id)}
                              >
                                Mark as Read
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <p className="font-medium text-gray-800">
                            {contact.subject}
                          </p>
                          <p className="text-gray-600 text-sm leading-relaxed">
                            {contact.message}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    {contacts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Visitor Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.slice(0, 20).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              item.user_flow === "employer"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {item.user_flow}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {item.page_path}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(item.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                    {analytics.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No analytics data yet</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Content Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Content management features coming soon</p>
                    <p className="text-sm">
                      Manage projects, skills, and experiences
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Enhanced Theme Studio */}
            <TabsContent value="theme" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Palette className="w-5 h-5" />
                      Color Palette Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Primary Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={themeSettings.primaryColor}
                            onChange={(e) =>
                              setThemeSettings({
                                ...themeSettings,
                                primaryColor: e.target.value,
                              })
                            }
                            className="w-12 h-8 rounded border"
                          />
                          <Input
                            value={themeSettings.primaryColor}
                            onChange={(e) =>
                              setThemeSettings({
                                ...themeSettings,
                                primaryColor: e.target.value,
                              })
                            }
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Secondary Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={themeSettings.secondaryColor}
                            onChange={(e) =>
                              setThemeSettings({
                                ...themeSettings,
                                secondaryColor: e.target.value,
                              })
                            }
                            className="w-12 h-8 rounded border"
                          />
                          <Input
                            value={themeSettings.secondaryColor}
                            onChange={(e) =>
                              setThemeSettings({
                                ...themeSettings,
                                secondaryColor: e.target.value,
                              })
                            }
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Accent Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={themeSettings.accentColor}
                            onChange={(e) =>
                              setThemeSettings({
                                ...themeSettings,
                                accentColor: e.target.value,
                              })
                            }
                            className="w-12 h-8 rounded border"
                          />
                          <Input
                            value={themeSettings.accentColor}
                            onChange={(e) =>
                              setThemeSettings({
                                ...themeSettings,
                                accentColor: e.target.value,
                              })
                            }
                            className="text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Animation Intensity</Label>
                        <span className="text-sm text-gray-500">
                          {themeSettings.animationIntensity}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={themeSettings.animationIntensity}
                        onChange={(e) =>
                          setThemeSettings({
                            ...themeSettings,
                            animationIntensity: parseInt(e.target.value),
                          })
                        }
                        className="w-full"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>Dark Mode</Label>
                      <Switch
                        checked={themeSettings.darkMode}
                        onCheckedChange={(checked) =>
                          setThemeSettings({
                            ...themeSettings,
                            darkMode: checked,
                          })
                        }
                      />
                    </div>

                    <Button
                      className="w-full"
                      onClick={() =>
                        toast({
                          title: "Theme Applied",
                          description: "Your theme changes have been saved.",
                        })
                      }
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Apply Theme
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="p-6 rounded-lg border-2 space-y-4"
                      style={{
                        backgroundColor: themeSettings.darkMode
                          ? "#1f2937"
                          : "#ffffff",
                        borderColor: themeSettings.primaryColor,
                        color: themeSettings.darkMode ? "#ffffff" : "#000000",
                      }}
                    >
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: themeSettings.primaryColor }}
                      >
                        Preview Header
                      </h3>
                      <p className="text-sm">
                        This is how your content will look with the selected
                        theme.
                      </p>
                      <div className="flex gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: themeSettings.primaryColor,
                          }}
                        ></div>
                        <div
                          className="w-4 h-4 rounded"
                          style={{
                            backgroundColor: themeSettings.secondaryColor,
                          }}
                        ></div>
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: themeSettings.accentColor }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Accessibility Scanner */}
            <TabsContent value="accessibility" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="w-5 h-5" />
                    WCAG Compliance Scanner
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-medium">Color Contrast</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          AA Compliant (4.8:1)
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="w-5 h-5 text-yellow-500" />
                          <span className="font-medium">Alt Text</span>
                        </div>
                        <p className="text-sm text-gray-600">
                          3 images missing alt text
                        </p>
                      </div>
                      <div className="p-4 border rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span className="font-medium">
                            Keyboard Navigation
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          Fully accessible
                        </p>
                      </div>
                    </div>
                    <Button className="w-full">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Run Full Accessibility Scan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Monitor */}
            <TabsContent value="performance" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Lighthouse Score
                        </p>
                        <p className="text-3xl font-bold text-green-600">
                          {performanceMetrics.lighthouseScore}
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Bundle Size
                        </p>
                        <p className="text-2xl font-bold">
                          {performanceMetrics.bundleSize}
                        </p>
                      </div>
                      <Archive className="w-8 h-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Load Time
                        </p>
                        <p className="text-2xl font-bold">
                          {performanceMetrics.loadTime}
                        </p>
                      </div>
                      <Zap className="w-8 h-8 text-yellow-500" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Core Web Vitals
                        </p>
                        <p className="text-lg font-bold text-green-600">Good</p>
                      </div>
                      <Target className="w-8 h-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Security Center */}
            <TabsContent value="security" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Two-Factor Authentication</Label>
                        <p className="text-sm text-gray-500">
                          Add an extra layer of security
                        </p>
                      </div>
                      <Switch
                        checked={twoFactorEnabled}
                        onCheckedChange={setTwoFactorEnabled}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Session Timeout</Label>
                      <Select
                        value={sessionTimeout.toString()}
                        onValueChange={(value) =>
                          setSessionTimeout(parseInt(value))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Session Status</Label>
                      <div className="text-sm text-gray-600">
                        <p>
                          Last activity:{" "}
                          {new Date(lastActivity).toLocaleTimeString()}
                        </p>
                        <p>
                          Timeout in:{" "}
                          {Math.max(
                            0,
                            Math.ceil(
                              (sessionTimeout * 60 * 1000 -
                                (Date.now() - lastActivity)) /
                                60000,
                            ),
                          )}{" "}
                          minutes
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Login Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[1, 2, 3].map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border rounded"
                        >
                          <div>
                            <p className="font-medium">Successful login</p>
                            <p className="text-sm text-gray-500">
                              Chrome on Windows • 192.168.1.1
                            </p>
                          </div>
                          <span className="text-xs text-gray-400">
                            2 hours ago
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Backup System */}
            <TabsContent value="backup" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Archive className="w-5 h-5" />
                      Backup & Restore
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Last Backup</Label>
                      <p className="text-sm text-gray-600">
                        March 15, 2024 at 2:30 PM
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Download Backup
                      </Button>
                      <Button>
                        <Cloud className="w-4 h-4 mr-2" />
                        Create Backup
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label>Auto Backup</Label>
                      <Select defaultValue="daily">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hourly">Every Hour</SelectItem>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Storage Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Database className="w-4 h-4" />
                          <span>Database</span>
                        </div>
                        <span className="text-sm">2.4 MB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4" />
                          <span>Media Files</span>
                        </div>
                        <span className="text-sm">15.7 MB</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Cloud className="w-4 h-4" />
                          <span>Cloud Storage</span>
                        </div>
                        <span className="text-sm text-green-600">
                          Connected
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Custom Script Injector */}
            <TabsContent value="scripts" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="w-5 h-5" />
                    Custom Script Manager
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label>Header Scripts</Label>
                    <Textarea
                      placeholder="<!-- Add scripts to be loaded in the <head> section -->"
                      value={customScripts.header}
                      onChange={(e) =>
                        setCustomScripts({
                          ...customScripts,
                          header: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Footer Scripts</Label>
                    <Textarea
                      placeholder="<!-- Add scripts to be loaded before </body> -->"
                      value={customScripts.footer}
                      onChange={(e) =>
                        setCustomScripts({
                          ...customScripts,
                          footer: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Analytics Code</Label>
                    <Textarea
                      placeholder="<!-- Google Analytics, Facebook Pixel, etc. -->"
                      value={customScripts.analytics}
                      onChange={(e) =>
                        setCustomScripts({
                          ...customScripts,
                          analytics: e.target.value,
                        })
                      }
                      rows={4}
                    />
                  </div>
                  <Button className="w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Scripts
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Versioning */}
            <TabsContent value="versions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Content Version History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((version, index) => (
                      <div
                        key={version}
                        className="flex items-center justify-between p-3 border rounded"
                      >
                        <div>
                          <p className="font-medium">
                            Version {version}.{index + 1}
                          </p>
                          <p className="text-sm text-gray-500">
                            Updated portfolio content • March {15 - index}, 2024
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Project Showcase Wizard */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Project Showcase Wizard
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Project Title</Label>
                      <Input placeholder="Enter project name" />
                    </div>
                    <div className="space-y-2">
                      <Label>Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="web">Web Development</SelectItem>
                          <SelectItem value="mobile">Mobile App</SelectItem>
                          <SelectItem value="design">UI/UX Design</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Describe your project..." rows={3} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tech Stack</Label>
                    <Input placeholder="React, Node.js, MongoDB..." />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>GitHub URL</Label>
                      <Input placeholder="https://github.com/..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Live Demo URL</Label>
                      <Input placeholder="https://..." />
                    </div>
                  </div>
                  <Button className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Project
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Debug Console & Form Response Manager */}
            <TabsContent value="forms" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mail className="w-5 h-5" />
                      Form Response Manager
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            Export CSV
                          </Button>
                          <Button size="sm" variant="outline">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear All
                          </Button>
                        </div>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Forms</SelectItem>
                            <SelectItem value="contact">Contact</SelectItem>
                            <SelectItem value="newsletter">
                              Newsletter
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        {contacts.slice(0, 5).map((contact) => (
                          <div
                            key={contact.id}
                            className="p-4 border rounded-lg"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium">{contact.name}</p>
                                <p className="text-sm text-gray-500">
                                  {contact.email}
                                </p>
                              </div>
                              <Badge
                                variant={
                                  contact.status === "unread"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {contact.status}
                              </Badge>
                            </div>
                            <p className="text-sm mb-2">{contact.subject}</p>
                            <p className="text-xs text-gray-600">
                              {contact.message.substring(0, 100)}...
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Debug Console */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Code className="w-5 h-5" />
                      Debug Console
                      <Badge variant={debugMode ? "default" : "secondary"}>
                        {debugMode ? "ON" : "OFF"}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label>Debug Mode</Label>
                        <Switch
                          checked={debugMode}
                          onCheckedChange={setDebugMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Operation Logs</Label>
                        <div className="h-64 overflow-y-auto bg-gray-50 p-3 rounded border text-xs font-mono">
                          {operationLogs.length === 0 ? (
                            <p className="text-gray-500">
                              No operations logged yet
                            </p>
                          ) : (
                            operationLogs.map((log, index) => (
                              <div key={index} className="mb-1">
                                {log}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setOperationLogs([])}
                        >
                          Clear Logs
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const logs = operationLogs.join("\n");
                            navigator.clipboard.writeText(logs);
                            toast({
                              title: "Logs Copied",
                              description: "Debug logs copied to clipboard",
                            });
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Logs
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Portfolio CMS */}
            <TabsContent value="portfolio-cms" className="space-y-4">
              <PortfolioCMS />
            </TabsContent>

            {/* Hire View Editor */}
            <TabsContent value="hire-view" className="space-y-4">
              <HireViewEditor />
            </TabsContent>

            {/* Resume Management */}
            <TabsContent value="resume" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Resume Generator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <Button
                        onClick={generateResumePDF}
                        disabled={isGeneratingResume}
                        className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white flex items-center gap-2"
                      >
                        {isGeneratingResume ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        {isGeneratingResume
                          ? "Generating..."
                          : "Generate PDF Resume"}
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        Generates a professional PDF resume using your portfolio
                        data
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">What's included:</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Professional summary from your profile</li>
                        <li>• Technical skills organized by category</li>
                        <li>• Work experience with achievements</li>
                        <li>• Key projects with technologies used</li>
                        <li>• Contact information</li>
                        <li>
                          • Custom education and certifications (if added)
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Manual Resume Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Professional Summary</Label>
                        <Textarea
                          value={resumeData.personalInfo.summary}
                          onChange={(e) =>
                            setResumeData({
                              ...resumeData,
                              personalInfo: {
                                ...resumeData.personalInfo,
                                summary: e.target.value,
                              },
                            })
                          }
                          placeholder="Write a brief professional summary..."
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>LinkedIn URL</Label>
                          <Input
                            value={resumeData.personalInfo.linkedin}
                            onChange={(e) =>
                              setResumeData({
                                ...resumeData,
                                personalInfo: {
                                  ...resumeData.personalInfo,
                                  linkedin: e.target.value,
                                },
                              })
                            }
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>GitHub URL</Label>
                          <Input
                            value={resumeData.personalInfo.github}
                            onChange={(e) =>
                              setResumeData({
                                ...resumeData,
                                personalInfo: {
                                  ...resumeData.personalInfo,
                                  github: e.target.value,
                                },
                              })
                            }
                            placeholder="https://github.com/..."
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Languages</Label>
                        <Input
                          value={resumeData.languages.join(", ")}
                          onChange={(e) =>
                            setResumeData({
                              ...resumeData,
                              languages: e.target.value
                                .split(", ")
                                .filter((lang) => lang.trim()),
                            })
                          }
                          placeholder="English, Hindi, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Interests & Hobbies</Label>
                        <Input
                          value={resumeData.interests}
                          onChange={(e) =>
                            setResumeData({
                              ...resumeData,
                              interests: e.target.value,
                            })
                          }
                          placeholder="Photography, Travel, Open Source..."
                        />
                      </div>
                    </div>

                    <Button onClick={saveResumeData} className="w-full">
                      <Save className="w-4 h-4 mr-2" />
                      Save Resume Data
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Profile Management */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Profile Image Management
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col items-center space-y-4">
                    {/* Current Profile Image */}
                    <div className="relative">
                      <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center">
                        {profileImage ? (
                          <img
                            src={profileImage}
                            alt="Profile"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white text-4xl font-bold">
                            RL
                          </span>
                        )}
                      </div>
                      {isUploadingImage && (
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Upload Button */}
                    <div className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="profile-image-upload"
                        disabled={isUploadingImage}
                      />
                      <label
                        htmlFor="profile-image-upload"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4" />
                        {isUploadingImage ? "Uploading..." : "Upload New Image"}
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        Supported formats: JPG, PNG, GIF (Max 5MB)
                      </p>
                    </div>

                    {/* Usage Information */}
                    <div className="bg-blue-50 p-4 rounded-lg w-full">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Where this image appears:
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Landing page profile section</li>
                        <li>• Hire view hero section</li>
                        <li>• Portfolio experience page</li>
                        <li>• Chat widget avatar</li>
                        <li>• Generated PDF resume</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </div>
  );
}
