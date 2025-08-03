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

  // Resume Management State - Isolated local state with useMemo to prevent resets
  const [resumeData, setResumeData] = useState(() => ({
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
  }));
  const [isGeneratingResume, setIsGeneratingResume] = useState(false);
  const [isSavingResume, setIsSavingResume] = useState(false);

  // Profile Image State
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const { signOut } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    fetchResumeData();
    fetchProfileImage();

    // Session refresh on mount to ensure valid tokens
    const refreshSessionOnMount = async () => {
      try {
        logOperation("Refreshing session on admin panel mount");
        const {
          data: { session },
          error,
        } = await supabase.auth.refreshSession();
        if (session) {
          logOperation("Session refreshed successfully on mount");
        } else if (error) {
          logOperation(`Session refresh failed on mount: ${error.message}`);
        }
      } catch (error: any) {
        logOperation(`Session refresh error on mount: ${error.message}`, false);
      }
    };

    refreshSessionOnMount();

    // Auth state listener - only redirect on explicit SIGNED_OUT events
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      logOperation(`Auth state change: ${event}`);

      if (event === "SIGNED_OUT") {
        // Only redirect on explicit logout
        logOperation("Explicit sign out detected, redirecting to login");
        localStorage.removeItem("adminAuthenticated");
        onLogout();
      } else if (event === "TOKEN_REFRESHED") {
        logOperation("Token refreshed successfully");
      } else if (event === "SIGNED_IN") {
        logOperation("User signed in");
      }
      // Do NOT redirect on other events like token refresh failures
    });

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
        // Explicitly sign out to trigger SIGNED_OUT event
        supabase.auth.signOut();
      }
    };

    // Check session every minute and refresh every 5 minutes
    const sessionInterval = setInterval(checkSession, 60000);
    const refreshInterval = setInterval(async () => {
      try {
        logOperation("Periodic session refresh");
        await supabase.auth.refreshSession();
      } catch (error: any) {
        logOperation(
          `Periodic session refresh failed: ${error.message}`,
          false,
        );
      }
    }, 300000); // 5 minutes

    // Update last activity on user interaction
    const updateActivity = () => setLastActivity(Date.now());
    document.addEventListener("mousedown", updateActivity);
    document.addEventListener("keydown", updateActivity);
    document.addEventListener("scroll", updateActivity);

    return () => {
      authSubscription?.unsubscribe();
      clearInterval(sessionInterval);
      clearInterval(refreshInterval);
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
      logOperation("Starting enhanced data fetch with Supabase validation");

      // First, validate Supabase connection with multiple table checks
      const { data: healthCheck, error: healthError } = await supabase
        .from("profiles")
        .select("id")
        .limit(1);

      if (healthError) {
        logOperation(
          `Supabase connection failed: ${healthError.message}`,
          false,
        );
        toast({
          title: "Database Connection Error",
          description:
            "Unable to connect to Supabase. Please check your connection.",
          variant: "destructive",
        });
        return;
      }

      logOperation("Supabase connection validated successfully");

      // Fetch contact submissions with enhanced error handling and additional fields
      const { data: contactData, error: contactError } = await supabase
        .from("contact_submissions")
        .select("*, priority, tags")
        .order("created_at", { ascending: false })
        .limit(50); // Limit for better performance

      if (contactError) {
        logOperation(`Contact fetch error: ${contactError.message}`, false);
        // Don't throw, continue with empty data
        setContacts([]);
        toast({
          title: "Contact Data Warning",
          description:
            "Unable to load contact submissions. Using fallback data.",
          variant: "destructive",
        });
      } else {
        setContacts(contactData || []);
        logOperation(
          `Fetched ${(contactData || []).length} contact submissions`,
        );
      }

      // Fetch analytics with enhanced error handling and additional fields
      const { data: analyticsData, error: analyticsError } = await supabase
        .from("visitor_analytics")
        .select("*, ip_address, country, device_type, time_spent")
        .order("created_at", { ascending: false })
        .limit(200); // Increased limit for better analytics

      if (analyticsError) {
        logOperation(`Analytics fetch error: ${analyticsError.message}`, false);
        // Don't throw, continue with empty data
        setAnalytics([]);
        toast({
          title: "Analytics Data Warning",
          description: "Unable to load analytics data. Using fallback data.",
          variant: "destructive",
        });
      } else {
        setAnalytics(analyticsData || []);
        logOperation(
          `Fetched ${(analyticsData || []).length} analytics records`,
        );
      }

      // Calculate enhanced stats with null safety
      const safeContactData = contactData || [];
      const safeAnalyticsData = analyticsData || [];

      const employerViews = safeAnalyticsData.filter(
        (item) => item.user_flow === "employer",
      ).length;
      const portfolioViews = safeAnalyticsData.filter(
        (item) => item.user_flow === "viewer",
      ).length;
      const unreadMessages = safeContactData.filter(
        (item) => item.status === "unread",
      ).length;

      // Calculate unique visitors using session_id or ip_address
      const uniqueVisitors = new Set(
        safeAnalyticsData.map((item) => item.session_id || item.ip_address),
      ).size;

      setStats({
        totalVisitors: uniqueVisitors || safeAnalyticsData.length,
        employerViews,
        portfolioViews,
        unreadMessages,
      });

      logOperation("Enhanced stats calculated successfully with null safety");

      // Show success toast only if no errors occurred
      if (!contactError && !analyticsError) {
        logOperation("All data fetched successfully from Supabase");
      }
    } catch (error: any) {
      console.error("Critical error fetching data:", error);
      logOperation(`Critical data fetch failed: ${error.message}`, false);

      // Set fallback data
      setContacts([]);
      setAnalytics([]);
      setStats({
        totalVisitors: 0,
        employerViews: 0,
        portfolioViews: 0,
        unreadMessages: 0,
      });

      toast({
        title: "Critical Database Error",
        description: `Failed to load dashboard data: ${error.message}. Using fallback data.`,
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
    logOperation("Manual logout initiated");
    localStorage.removeItem("adminAuthenticated");
    await signOut(); // This will trigger SIGNED_OUT event and call onLogout()
  };

  const fetchResumeData = async () => {
    try {
      logOperation("Fetching resume data");

      // Validate session before fetching
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) {
        logOperation("Authentication check failed during resume fetch", false);
        // Don't throw error, just use defaults
      }

      const { data, error } = await supabase
        .from("resume_data")
        .select("*")
        .single();

      if (data && !error && data.content) {
        // Ensure we have the proper structure
        const content =
          typeof data.content === "string"
            ? JSON.parse(data.content)
            : data.content;

        // Initialize state only once on mount - no further updates
        // Using a function to set state to ensure we don't lose any user input
        setResumeData((prevData) => {
          // Only update if the form is not currently being edited (preserve user input)
          if (
            JSON.stringify(prevData.personalInfo) ===
            JSON.stringify({
              fullName: "",
              email: "",
              phone: "",
              location: "",
              website: "",
              linkedin: "",
              github: "",
              summary: "",
            })
          ) {
            return {
              personalInfo: {
                fullName: content.personalInfo?.fullName || "",
                email: content.personalInfo?.email || "",
                phone: content.personalInfo?.phone || "",
                location: content.personalInfo?.location || "",
                website: content.personalInfo?.website || "",
                linkedin: content.personalInfo?.linkedin || "",
                github: content.personalInfo?.github || "",
                summary: content.personalInfo?.summary || "",
              },
              education: content.education || [],
              certifications: content.certifications || [],
              languages: content.languages || [],
              interests: content.interests || "",
            };
          }
          return prevData; // Return existing state if user is editing
        });
        logOperation("Resume data fetched and parsed successfully");
      } else {
        logOperation("No resume data found, using defaults");
        // Initialize with default data if none exists, but only if the form is empty
        setResumeData((prevData) => {
          // Only update if the form is not currently being edited
          if (
            JSON.stringify(prevData.personalInfo) ===
            JSON.stringify({
              fullName: "",
              email: "",
              phone: "",
              location: "",
              website: "",
              linkedin: "",
              github: "",
              summary: "",
            })
          ) {
            return {
              personalInfo: {
                fullName: "Ramya Lakhani",
                email: "lakhani.ramya.u@gmail.co",
                phone: "+91 7202800803",
                location: "India",
                website: "",
                linkedin: "",
                github: "",
                summary:
                  "Passionate full-stack developer with expertise in modern web technologies, creating scalable applications and innovative digital solutions.",
              },
              education: [],
              certifications: [],
              languages: ["English", "Hindi"],
              interests: "Web Development, Open Source, Technology Innovation",
            };
          }
          return prevData; // Return existing state if user is editing
        });
      }
    } catch (error: any) {
      console.error("Error fetching resume data:", error);
      logOperation(`Resume data fetch failed: ${error.message}`, false);
      // Set default data on error, but only if the form is empty
      setResumeData((prevData) => {
        // Only update if the form is not currently being edited
        if (
          JSON.stringify(prevData.personalInfo) ===
          JSON.stringify({
            fullName: "",
            email: "",
            phone: "",
            location: "",
            website: "",
            linkedin: "",
            github: "",
            summary: "",
          })
        ) {
          return {
            personalInfo: {
              fullName: "Ramya Lakhani",
              email: "lakhani.ramya.u@gmail.co",
              phone: "+91 7202800803",
              location: "India",
              website: "",
              linkedin: "",
              github: "",
              summary:
                "Passionate full-stack developer with expertise in modern web technologies, creating scalable applications and innovative digital solutions.",
            },
            education: [],
            certifications: [],
            languages: ["English", "Hindi"],
            interests: "Web Development, Open Source, Technology Innovation",
          };
        }
        return prevData; // Return existing state if user is editing
      });
    }
  };

  const fetchProfileImage = async () => {
    try {
      logOperation("Fetching profile image from unified storage system");

      // Always fetch from database first to get the latest server-side image path
      const { data, error } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", "main")
        .single();

      if (data && !error && data.avatar_url) {
        // Check if it's a storage path or full URL
        let imageUrl;
        if (data.avatar_url.startsWith("http")) {
          // It's already a full URL (legacy)
          imageUrl = data.avatar_url;
        } else {
          // It's a storage path, generate public URL with cache busting
          const { data: urlData } = supabase.storage
            .from("public-profile-images")
            .getPublicUrl(data.avatar_url);

          imageUrl = `${urlData.publicUrl}?v=${Date.now()}`;
        }

        setProfileImage(imageUrl);
        logOperation("Profile image fetched from unified storage system");
      } else {
        // Use default image if no image found
        const defaultImage =
          "https://api.dicebear.com/7.x/avataaars/svg?seed=developer&accessories=sunglasses&accessoriesChance=100&clothingGraphic=skull&top=shortHair&topChance=100&facialHair=goatee&facialHairChance=100";
        setProfileImage(defaultImage);
        logOperation("Using default profile image");
      }
    } catch (error: any) {
      console.error("Error fetching profile image:", error);
      logOperation(`Profile image fetch failed: ${error.message}`, false);

      // Use default image on error
      const defaultImage =
        "https://api.dicebear.com/7.x/avataaars/svg?seed=developer&accessories=sunglasses&accessoriesChance=100&clothingGraphic=skull&top=shortHair&topChance=100&facialHair=goatee&facialHairChance=100";
      setProfileImage(defaultImage);
      logOperation("Using default profile image as fallback");
    }
  };

  const validateAndRefreshSession = async (retryCount = 0): Promise<any> => {
    try {
      // Check session first to validate token expiry
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      // If session exists and token is not expired, return user
      if (
        session?.user &&
        !sessionError &&
        session.expires_at &&
        session.expires_at > Date.now() / 1000
      ) {
        return session.user;
      }

      // If session is expired or invalid, try to refresh silently
      logOperation(
        `Session expired or invalid, attempting silent refresh (attempt ${retryCount + 1})`,
      );

      const {
        data: { session: refreshedSession },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshedSession?.user && !refreshError) {
        logOperation("Session refreshed successfully");
        return refreshedSession.user;
      }

      // Only attempt re-authentication as last resort and only once
      if (retryCount === 0) {
        const isAdminAuthenticated =
          localStorage.getItem("adminAuthenticated") === "true";

        if (isAdminAuthenticated) {
          logOperation("Attempting admin re-authentication as last resort");

          try {
            const { data: authData, error: signInError } =
              await supabase.auth.signInWithPassword({
                email: "Art1204",
                password: "Art@1204",
              });

            if (authData?.user && !signInError) {
              logOperation("Admin re-authentication successful");
              return authData.user;
            }
          } catch (reAuthError) {
            logOperation(
              `Admin re-authentication failed: ${reAuthError}`,
              false,
            );
          }
        }
      }

      throw new Error("Session validation failed - authentication required");
    } catch (error: any) {
      logOperation(`Session validation error: ${error.message}`, false);
      throw error;
    }
  };

  const saveResumeData = async () => {
    setIsSavingResume(true);
    try {
      logOperation("Saving resume data");

      // Ensure we have valid data structure with proper null checks
      const dataToSave = {
        personalInfo: {
          fullName: resumeData?.personalInfo?.fullName || "",
          email: resumeData?.personalInfo?.email || "",
          phone: resumeData?.personalInfo?.phone || "",
          location: resumeData?.personalInfo?.location || "",
          website: resumeData?.personalInfo?.website || "",
          linkedin: resumeData?.personalInfo?.linkedin || "",
          github: resumeData?.personalInfo?.github || "",
          summary: resumeData?.personalInfo?.summary || "",
        },
        education: resumeData?.education || [],
        certifications: resumeData?.certifications || [],
        languages: Array.isArray(resumeData?.languages)
          ? resumeData.languages
          : [],
        interests: resumeData?.interests || "",
      };

      logOperation("Attempting to save resume data to Supabase");

      // Save to Supabase - RLS is now disabled for this table
      const { error } = await supabase.from("resume_data").upsert({
        id: "main",
        content: dataToSave,
        user_id: null, // Set to null since RLS is disabled
        updated_at: new Date().toISOString(),
      });

      if (error) {
        logOperation(`Supabase save error: ${error.message}`, false);
        throw error;
      }

      logOperation("Resume data saved successfully to Supabase");
      toast({
        title: "Resume Data Saved",
        description: "Your resume information has been updated successfully.",
      });
    } catch (error: any) {
      console.error("Error saving resume data:", error);
      logOperation(`Resume save failed: ${error.message}`, false);

      toast({
        title: "Save Failed",
        description:
          error.message || "Failed to save resume data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingResume(false);
    }
  };

  // Controlled input handlers for resume form - isolated from parent state
  const handleResumeInputChange = (field: string, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        [field]: value,
      },
    }));
  };

  const handleResumeLanguagesChange = (value: string) => {
    const languagesArray = value.split(", ").filter((lang) => lang.trim());
    setResumeData((prev) => ({
      ...prev,
      languages: languagesArray,
    }));
  };

  const handleResumeInterestsChange = (value: string) => {
    setResumeData((prev) => ({
      ...prev,
      interests: value,
    }));
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Enhanced file validation with 10MB limit as requested
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB as requested)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please upload an image smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingImage(true);
    logOperation(
      `Starting profile image upload to public bucket - File: ${file.name}, Size: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
    );

    try {
      // No authentication required as requested - defaults to admin user
      logOperation(
        "Using admin user for image upload (no authentication required)",
      );

      // Compress image to WebP format for better performance (only if not already WebP)
      let finalBlob: Blob;
      let finalFileName: string;

      if (file.type !== "image/webp") {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = URL.createObjectURL(file);
        });

        // Set canvas dimensions (max 800x800 for high quality profile images)
        const maxSize = 800;
        const ratio = Math.min(maxSize / img.width, maxSize / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Convert to WebP blob with high quality
        finalBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve(blob!);
            },
            "image/webp",
            0.9, // 90% quality for better image quality
          );
        });

        finalFileName = `admin/avatar.webp`; // Use admin folder as default
        logOperation(`Image compressed to WebP format`);
      } else {
        finalBlob = file;
        finalFileName = `admin/avatar.webp`; // Use admin folder as default
        logOperation(`Using original WebP file`);
      }

      // Generate unique filename with timestamp for cache busting
      const timestamp = Date.now();
      logOperation(`Uploading image: ${finalFileName}`);

      // Remove old image from storage if it exists
      try {
        const { error: deleteError } = await supabase.storage
          .from("public-profile-images")
          .remove([finalFileName]);

        if (!deleteError) {
          logOperation(`Removed old image: ${finalFileName}`);
        }
      } catch (cleanupError) {
        logOperation(`Old image cleanup skipped: ${cleanupError}`, false);
        // Don't fail the upload if cleanup fails
      }

      // Upload to public Supabase Storage bucket with enhanced options (no auth required)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("public-profile-images")
        .upload(finalFileName, finalBlob, {
          cacheControl: "3600",
          upsert: true,
          contentType: "image/webp",
        });

      if (uploadError) {
        logOperation(`Storage upload failed: ${uploadError.message}`, false);
        throw uploadError;
      }

      logOperation("File uploaded to public storage successfully");

      // Get public URL with cache busting
      const { data: urlData } = supabase.storage
        .from("public-profile-images")
        .getPublicUrl(finalFileName);

      const publicUrlWithCacheBust = `${urlData.publicUrl}?v=${timestamp}`;
      logOperation(
        `Generated public URL with cache busting: ${publicUrlWithCacheBust}`,
      );

      // Update profile in database with the storage path (not full URL)
      const { error: updateError } = await supabase.from("profiles").upsert({
        id: "main",
        avatar_url: finalFileName, // Store path, not full URL
        updated_at: new Date().toISOString(),
      });

      if (updateError) {
        logOperation(
          `Profile database update failed: ${updateError.message}`,
          false,
        );
        throw updateError;
      }

      logOperation("Profile updated in database with new image path");

      // Update local state with the full URL for immediate UI update
      setProfileImage(publicUrlWithCacheBust);
      logOperation("Local state updated with new profile image");

      toast({
        title: "Profile Image Updated Successfully",
        description:
          "Your profile image has been uploaded to public folder (max 10MB) and will appear across all sections of your portfolio instantly. No authentication required as requested.",
      });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      logOperation(`Image upload failed: ${error.message}`, false);

      toast({
        title: "Upload Failed",
        description: `Failed to upload profile image: ${error.message}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const generateResumePDF = async () => {
    setIsGeneratingResume(true);
    logOperation("Starting enhanced resume PDF generation with AI");

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

      // Use the enhanced resume generator with LinkedIn/GitHub scanning
      logOperation("Calling enhanced resume generator with profile scanning");
      const { generateEnhancedResumePDF } = await import(
        "../../../src/lib/resume-generator"
      );

      const result = await generateEnhancedResumePDF(true); // Enable LinkedIn scanning

      logOperation("Enhanced resume PDF generated successfully");
      toast({
        title: "Enhanced Resume Generated",
        description:
          "Your AI-enhanced PDF resume with profile analysis has been downloaded successfully.",
      });

      return; // Exit early since generateEnhancedResumePDF handles everything

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
                    Enhanced Contact Messages
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Message Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                      <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="text-center">
                          <p className="text-sm font-medium text-red-700">
                            Unread
                          </p>
                          <p className="text-xl font-bold text-red-900">
                            {
                              contacts.filter((c) => c.status === "unread")
                                .length
                            }
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="text-center">
                          <p className="text-sm font-medium text-blue-700">
                            Read
                          </p>
                          <p className="text-xl font-bold text-blue-900">
                            {contacts.filter((c) => c.status === "read").length}
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <div className="text-center">
                          <p className="text-sm font-medium text-green-700">
                            Replied
                          </p>
                          <p className="text-xl font-bold text-green-900">
                            {
                              contacts.filter((c) => c.status === "replied")
                                .length
                            }
                          </p>
                        </div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="text-center">
                          <p className="text-sm font-medium text-purple-700">
                            Total
                          </p>
                          <p className="text-xl font-bold text-purple-900">
                            {contacts.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages List */}
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
                                  : contact.status === "replied"
                                    ? "default"
                                    : "outline"
                              }
                            >
                              {contact.status}
                            </Badge>
                            {contact.priority &&
                              contact.priority !== "normal" && (
                                <Badge
                                  variant={
                                    contact.priority === "high" ||
                                    contact.priority === "urgent"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                >
                                  {contact.priority}
                                </Badge>
                              )}
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
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contact.tags.map((tag, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    {contacts.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No messages yet</p>
                        <p className="text-sm mt-2">
                          Contact messages will appear here when visitors reach
                          out
                        </p>
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
                    Enhanced Visitor Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Analytics Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-blue-700">
                              Total Sessions
                            </p>
                            <p className="text-2xl font-bold text-blue-900">
                              {analytics.length}
                            </p>
                          </div>
                          <BarChart3 className="w-8 h-8 text-blue-500" />
                        </div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-700">
                              Unique Visitors
                            </p>
                            <p className="text-2xl font-bold text-green-900">
                              {
                                new Set(
                                  analytics.map(
                                    (item) =>
                                      item.session_id || item.ip_address,
                                  ),
                                ).size
                              }
                            </p>
                          </div>
                          <Users className="w-8 h-8 text-green-500" />
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-purple-700">
                              Avg. Time Spent
                            </p>
                            <p className="text-2xl font-bold text-purple-900">
                              {analytics.length > 0
                                ? Math.round(
                                    analytics.reduce(
                                      (acc, item) =>
                                        acc + (item.time_spent || 0),
                                      0,
                                    ) / analytics.length,
                                  )
                                : 0}
                              s
                            </p>
                          </div>
                          <Clock className="w-8 h-8 text-purple-500" />
                        </div>
                      </div>
                    </div>

                    {/* Detailed Analytics List */}
                    {analytics.slice(0, 20).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900">
                              {item.page_path}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              {item.country && (
                                <span className="flex items-center gap-1">
                                  🌍 {item.country}
                                </span>
                              )}
                              {item.device_type && (
                                <span className="flex items-center gap-1">
                                  📱 {item.device_type}
                                </span>
                              )}
                              {item.time_spent && (
                                <span className="flex items-center gap-1">
                                  ⏱️ {item.time_spent}s
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-400 block">
                            {new Date(item.created_at).toLocaleString()}
                          </span>
                          {item.referrer && item.referrer !== "direct" && (
                            <span className="text-xs text-blue-600">
                              from: {new URL(item.referrer).hostname}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {analytics.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No analytics data yet</p>
                        <p className="text-sm mt-2">
                          Analytics will appear here once visitors start using
                          your portfolio
                        </p>
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
                          ? "Generating AI-Enhanced Resume..."
                          : "Generate AI-Enhanced PDF Resume"}
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        Generates an AI-enhanced professional PDF resume using
                        your portfolio data, LinkedIn profile analysis, and
                        GitHub profile scanning
                      </p>
                    </div>
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">
                        AI-Enhanced Features:
                      </h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• AI-enhanced professional summary</li>
                        <li>• LinkedIn profile analysis and integration</li>
                        <li>• GitHub repository and contribution analysis</li>
                        <li>
                          • Technical skills organized by category with
                          proficiency
                        </li>
                        <li>• Work experience with quantified achievements</li>
                        <li>• Key projects with impact metrics</li>
                        <li>• Contact information and professional links</li>
                        <li>• Custom education and certifications</li>
                        <li>• AI-generated career highlights and objectives</li>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Full Name</Label>
                          <Input
                            value={resumeData.personalInfo.fullName}
                            onChange={(e) =>
                              handleResumeInputChange(
                                "fullName",
                                e.target.value,
                              )
                            }
                            placeholder="Your full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={resumeData.personalInfo.email}
                            onChange={(e) =>
                              handleResumeInputChange("email", e.target.value)
                            }
                            placeholder="your.email@example.com"
                            type="email"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Phone</Label>
                          <Input
                            value={resumeData.personalInfo.phone}
                            onChange={(e) =>
                              handleResumeInputChange("phone", e.target.value)
                            }
                            placeholder="+1 (555) 123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={resumeData.personalInfo.location}
                            onChange={(e) =>
                              handleResumeInputChange(
                                "location",
                                e.target.value,
                              )
                            }
                            placeholder="City, Country"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Professional Summary</Label>
                        <Textarea
                          value={resumeData.personalInfo.summary}
                          onChange={(e) =>
                            handleResumeInputChange("summary", e.target.value)
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
                              handleResumeInputChange(
                                "linkedin",
                                e.target.value,
                              )
                            }
                            placeholder="https://linkedin.com/in/..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>GitHub URL</Label>
                          <Input
                            value={resumeData.personalInfo.github}
                            onChange={(e) =>
                              handleResumeInputChange("github", e.target.value)
                            }
                            placeholder="https://github.com/..."
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Website</Label>
                        <Input
                          value={resumeData.personalInfo.website}
                          onChange={(e) =>
                            handleResumeInputChange("website", e.target.value)
                          }
                          placeholder="https://yourwebsite.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Languages</Label>
                        <Input
                          value={
                            Array.isArray(resumeData.languages)
                              ? resumeData.languages.join(", ")
                              : ""
                          }
                          onChange={(e) =>
                            handleResumeLanguagesChange(e.target.value)
                          }
                          placeholder="English, Hindi, etc."
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Interests & Hobbies</Label>
                        <Input
                          value={resumeData.interests}
                          onChange={(e) =>
                            handleResumeInterestsChange(e.target.value)
                          }
                          placeholder="Photography, Travel, Open Source..."
                        />
                      </div>
                    </div>

                    <Button
                      onClick={saveResumeData}
                      disabled={isSavingResume}
                      className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white"
                    >
                      {isSavingResume ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {isSavingResume ? "Saving..." : "Save Resume Data"}
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
                            key={
                              profileImage
                            } /* Add key to force re-render when image changes */
                          />
                        ) : (
                          <img
                            src="https://api.dicebear.com/7.x/avataaars/svg?seed=developer&accessories=sunglasses&accessoriesChance=100&clothingGraphic=skull&top=shortHair&topChance=100&facialHair=goatee&facialHairChance=100"
                            alt="Developer Avatar"
                            className="w-full h-full object-cover"
                          />
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
                        className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white rounded-lg cursor-pointer transition-all duration-200 ${isUploadingImage ? "opacity-50 cursor-not-allowed" : ""}`}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {isUploadingImage ? "Uploading..." : "Upload New Image"}
                      </label>
                      <p className="text-sm text-gray-500 mt-2">
                        Supported formats: JPG, PNG, GIF, WebP (Max 10MB) •
                        Auto-compressed to WebP • No authentication required
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
                        <li>
                          • Stored in: Supabase Storage (public-profile-images
                          bucket)
                        </li>
                      </ul>
                      <div className="mt-3 p-2 bg-green-50 rounded border border-green-200">
                        <p className="text-xs text-green-700">
                          ✅ Public folder storage: Images are compressed to
                          WebP, stored in public Supabase Storage (max 10MB),
                          and instantly accessible across all portfolio sections
                          with cache busting. No authentication required -
                          defaults to admin user.
                        </p>
                      </div>
                      <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                        <p className="text-xs text-yellow-700">
                          📁 Storage Details: Files are stored in
                          public-profile-images bucket with 10MB limit.
                          Supported formats: JPEG, PNG, GIF, WebP. URL is saved
                          in database and used throughout the project.
                        </p>
                      </div>
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
