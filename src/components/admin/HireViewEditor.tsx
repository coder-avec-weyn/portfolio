import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  RefreshCw,
  Upload,
  Download,
  Settings,
  Users,
  Star,
  Calendar,
  Mail,
  FileText,
  Palette,
  ArrowUp,
  ArrowDown,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Clock,
  Database,
  Zap,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { debounce } from "lodash";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import ErrorBoundary from "@/components/ui/error-boundary";
import DatabaseStatus from "@/components/ui/database-status";
import {
  validateSectionData,
  validateSkillData,
  validateExperienceData,
  validateContactFieldData,
} from "@/lib/hire-view-validation";

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
  is_active: boolean;
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
  is_active: boolean;
}

interface HireContactField {
  id: string;
  field_type: string;
  label: string;
  placeholder: string;
  is_required: boolean;
  order_index: number;
  is_active: boolean;
}

// Connection Status Component
function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(true);
  const [lastCheck, setLastCheck] = useState(new Date());

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const testConnection = async () => {
      try {
        const { error } = await supabase
          .from("hire_sections")
          .select("id")
          .limit(1);
        setIsConnected(!error);
        setLastCheck(new Date());
      } catch {
        setIsConnected(false);
        setLastCheck(new Date());
      }
    };

    testConnection();
    const interval = setInterval(testConnection, 30000);

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
      <span className="text-gray-500">• {lastCheck.toLocaleTimeString()}</span>
    </div>
  );
}

// Real-time Sync Indicator
function SyncIndicator({ isActive }: { isActive: boolean }) {
  return (
    <div
      className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${
        isActive ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
      }`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          isActive ? "bg-blue-500 animate-pulse" : "bg-gray-400"
        }`}
      />
      <span>{isActive ? "Live Sync" : "Sync Off"}</span>
    </div>
  );
}

export default function HireViewEditor() {
  const [sections, setSections] = useState<HireSection[]>([]);
  const [skills, setSkills] = useState<HireSkill[]>([]);
  const [experiences, setExperiences] = useState<HireExperience[]>([]);
  const [contactFields, setContactFields] = useState<HireContactField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("sections");
  const [error, setError] = useState<string | null>(null);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(
    new Set(),
  );
  const [realtimeActive, setRealtimeActive] = useState(false);
  const channelsRef = useRef<any[]>([]);
  const { toast } = useToast();

  // Enhanced database connection test
  const testDatabaseConnection = async () => {
    try {
      console.log("Testing database connection...");

      // Test each table individually
      const tables = [
        "hire_sections",
        "hire_skills",
        "hire_experience",
        "hire_contact_fields",
      ];

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select("id")
          .limit(1);

        if (error) {
          console.error(`Error accessing ${table}:`, error);
          throw new Error(`Cannot access ${table}: ${error.message}`);
        }

        console.log(`✓ ${table} table accessible`);
      }

      console.log("✓ All database tables accessible");
      return true;
    } catch (error: any) {
      console.error("Database connection test failed:", error);
      setError(`Database connection failed: ${error.message}`);
      return false;
    }
  };

  const fetchHireViewData = useCallback(
    async (showToast = false) => {
      try {
        setIsLoading(true);
        setError(null);

        // Test database connection first
        const connectionOk = await testDatabaseConnection();
        if (!connectionOk) {
          throw new Error("Database connection failed");
        }

        console.log("Fetching hire view data...");

        const [sectionsRes, skillsRes, experiencesRes, contactFieldsRes] =
          await Promise.all([
            supabase
              .from("hire_sections")
              .select("*")
              .order("order_index", { ascending: true }),
            supabase
              .from("hire_skills")
              .select("*")
              .order("order_index", { ascending: true }),
            supabase
              .from("hire_experience")
              .select("*")
              .order("order_index", { ascending: true }),
            supabase
              .from("hire_contact_fields")
              .select("*")
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
          console.error("Database fetch errors:", errors);
          throw new Error(
            `Database errors: ${errors.map((e) => e?.message).join(", ")}`,
          );
        }

        // Log data counts
        console.log("Data fetched successfully:", {
          sections: sectionsRes.data?.length || 0,
          skills: skillsRes.data?.length || 0,
          experiences: experiencesRes.data?.length || 0,
          contactFields: contactFieldsRes.data?.length || 0,
        });

        // Clear optimistic updates set when refreshing data
        setOptimisticUpdates(new Set());

        setSections(sectionsRes.data || []);
        setSkills(skillsRes.data || []);
        setExperiences(experiencesRes.data || []);
        setContactFields(contactFieldsRes.data || []);

        if (showToast) {
          toast({
            title: "Data Refreshed",
            description: "All hire view data has been updated successfully.",
          });
        }
      } catch (error: any) {
        console.error("Error fetching hire view data:", error);
        setError(error.message || "Failed to load hire view data");
        toast({
          title: "Error loading data",
          description: error.message || "Failed to load hire view data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  // Setup real-time subscriptions with unique channel names and better error handling
  const setupRealtimeSubscriptions = useCallback(() => {
    // Clean up existing channels
    channelsRef.current.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    const tables = [
      "hire_sections",
      "hire_skills",
      "hire_experience",
      "hire_contact_fields",
    ];

    let subscribedCount = 0;
    const sessionId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    tables.forEach((table) => {
      const channel = supabase
        .channel(`${sessionId}_${table}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table },
          (payload) => {
            console.log(`Admin: ${table} updated:`, payload);
            // Refresh data after external changes (with small delay to avoid conflicts)
            setTimeout(() => {
              fetchHireViewData(false);
            }, 200);
          },
        )
        .subscribe((status) => {
          console.log(`Admin subscription status for ${table}:`, status);
          if (status === "SUBSCRIBED") {
            subscribedCount++;
            if (subscribedCount === tables.length) {
              setRealtimeActive(true);
              console.log("All admin real-time subscriptions active");
            }
          } else if (status === "CHANNEL_ERROR") {
            setRealtimeActive(false);
            console.error(`Admin real-time subscription error for ${table}`);
            toast({
              title: "Real-time sync error",
              description: `Failed to subscribe to ${table} changes`,
              variant: "destructive",
            });
          }
        });

      channelsRef.current.push(channel);
    });

    return () => {
      channelsRef.current.forEach((channel) => {
        supabase.removeChannel(channel);
      });
      channelsRef.current = [];
      setRealtimeActive(false);
    };
  }, [fetchHireViewData, toast]);

  useEffect(() => {
    fetchHireViewData();
    const cleanup = setupRealtimeSubscriptions();

    return cleanup;
  }, [fetchHireViewData, setupRealtimeSubscriptions]);

  // Optimistic update helper
  const withOptimisticUpdate = async <T,>(
    id: string,
    operation: () => Promise<T>,
    optimisticUpdate: () => void,
    rollback: () => void,
  ): Promise<T | null> => {
    try {
      // Add to optimistic updates set
      setOptimisticUpdates((prev) => new Set(prev).add(id));

      // Apply optimistic update
      optimisticUpdate();

      // Perform actual operation
      const result = await operation();

      toast({
        title: "Success",
        description: "Changes saved successfully.",
      });

      return result;
    } catch (error: any) {
      console.error("Operation failed:", error);

      // Rollback optimistic update
      rollback();

      toast({
        title: "Error",
        description: error.message || "Operation failed. Please try again.",
        variant: "destructive",
      });

      return null;
    } finally {
      // Remove from optimistic updates set
      setOptimisticUpdates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const updateSection = async (
    sectionId: string,
    updates: Partial<HireSection>,
  ) => {
    const originalSection = sections.find((s) => s.id === sectionId);
    if (!originalSection) {
      console.error(`Section with id ${sectionId} not found in local state`);
      toast({
        title: "Update Failed",
        description:
          "Section not found in local state. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Updating section ${sectionId}:`, updates);

    try {
      // Create a complete section object with updates
      const updatedSection = { ...originalSection, ...updates };

      // Always validate the complete section data
      validateSectionData(updatedSection);

      // Apply optimistic update after validation passes
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? updatedSection : section,
        ),
      );

      // Prepare update data with timestamp
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      };

      console.log(
        `Sending update to database for section ${sectionId}:`,
        updateData,
      );

      // Database update with proper error handling
      const { data, error, count } = await supabase
        .from("hire_sections")
        .update(updateData)
        .eq("id", sectionId)
        .select("*");

      if (error) {
        console.error("Database update error:", error);
        // Revert optimistic update
        setSections((prev) =>
          prev.map((section) =>
            section.id === sectionId ? originalSection : section,
          ),
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`Database response for section ${sectionId}:`, {
        data,
        count,
      });

      // Check if any rows were affected
      if (!data || data.length === 0) {
        console.error("No rows updated - section may not exist");

        // Check if section exists
        const { data: existingSection, error: checkError } = await supabase
          .from("hire_sections")
          .select("id")
          .eq("id", sectionId)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking section existence:", checkError);
          // Revert optimistic update
          setSections((prev) =>
            prev.map((section) =>
              section.id === sectionId ? originalSection : section,
            ),
          );
          throw new Error(
            `Failed to verify section existence: ${checkError.message}`,
          );
        }

        if (!existingSection) {
          console.error("Section no longer exists in database");
          // Revert optimistic update
          setSections((prev) =>
            prev.map((section) =>
              section.id === sectionId ? originalSection : section,
            ),
          );
          await fetchHireViewData();
          throw new Error(
            `Section with id ${sectionId} no longer exists in the database. Data has been refreshed.`,
          );
        }

        // If we get here, the section exists but wasn't updated
        // Try a direct update with all fields
        console.log("Retrying section update with full data...");
        const { data: retryData, error: retryError } = await supabase
          .from("hire_sections")
          .update({
            section_type: updatedSection.section_type,
            title: updatedSection.title,
            content: updatedSection.content,
            order_index: updatedSection.order_index,
            is_active: updatedSection.is_active,
            updated_at: new Date().toISOString(),
          })
          .eq("id", sectionId)
          .select("*");

        if (retryError) {
          console.error("Retry section update error:", retryError);
          // Revert optimistic update
          setSections((prev) =>
            prev.map((section) =>
              section.id === sectionId ? originalSection : section,
            ),
          );
          throw new Error(`Database retry error: ${retryError.message}`);
        }

        if (!retryData || retryData.length === 0) {
          // Still no success, revert and throw error
          setSections((prev) =>
            prev.map((section) =>
              section.id === sectionId ? originalSection : section,
            ),
          );
          throw new Error(
            "Update operation failed after retry - no rows were updated",
          );
        }

        // Update local state with retry data
        const updatedSectionData = retryData[0];
        setSections((prev) =>
          prev.map((section) =>
            section.id === sectionId ? updatedSectionData : section,
          ),
        );

        console.log(
          `Section ${sectionId} updated successfully after retry:`,
          updatedSectionData,
        );

        // Remove from optimistic updates
        setOptimisticUpdates((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sectionId);
          return newSet;
        });

        toast({
          title: "Saved",
          description: "Section updated successfully.",
        });
        return;
      }

      // Update local state with server data
      const updatedSectionData = data[0];
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? updatedSectionData : section,
        ),
      );

      console.log(
        `Section ${sectionId} updated successfully:`,
        updatedSectionData,
      );

      // Remove from optimistic updates
      setOptimisticUpdates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });

      toast({
        title: "Saved",
        description: "Section updated successfully.",
      });
    } catch (validationError: any) {
      console.error("Section update failed:", validationError);
      // Ensure we revert optimistic update on any error
      setSections((prev) =>
        prev.map((section) =>
          section.id === sectionId ? originalSection : section,
        ),
      );

      // Remove from optimistic updates
      setOptimisticUpdates((prev) => {
        const newSet = new Set(prev);
        newSet.delete(sectionId);
        return newSet;
      });

      toast({
        title: "Save Failed",
        description: validationError.message || "Failed to update section",
        variant: "destructive",
      });
    }
  };

  // Track pending changes for each section
  const [pendingChanges, setPendingChanges] = useState<
    Map<string, Partial<HireSection>>
  >(new Map());

  const handleSectionFieldChange = (
    sectionId: string,
    field: string,
    value: any,
  ) => {
    // Immediate UI update for responsiveness
    setSections((prev) =>
      prev.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section,
      ),
    );

    // Track pending changes
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(sectionId) || {};
      newMap.set(sectionId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const handleSectionContentChange = (
    sectionId: string,
    contentField: string,
    value: any,
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) {
      console.error(`Section ${sectionId} not found for content update`);
      return;
    }

    const updatedContent = { ...section.content, [contentField]: value };

    // Immediate UI update for responsiveness
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, content: updatedContent } : s,
      ),
    );

    // Track pending changes
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(sectionId) || {};
      newMap.set(sectionId, { ...existing, content: updatedContent });
      return newMap;
    });
  };

  const saveSection = async (sectionId: string) => {
    const changes = pendingChanges.get(sectionId);
    if (!changes) {
      toast({
        title: "No Changes",
        description: "No changes to save for this section.",
      });
      return;
    }

    await updateSection(sectionId, changes);

    // Clear pending changes for this section
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      newMap.delete(sectionId);
      return newMap;
    });
  };

  const hasPendingChanges = (sectionId: string) => {
    return pendingChanges.has(sectionId);
  };

  const addSkill = async () => {
    const newSkillData = {
      name: "New Skill",
      category: "Frontend",
      proficiency: 80,
      color: "#8b5cf6",
      order_index: skills.length,
      is_active: true,
    };

    try {
      // Validate skill data before sending to database
      validateSkillData({ ...newSkillData, id: "temp" });

      // Show loading state
      setIsSaving(true);
      toast({
        title: "Adding skill",
        description: "Please wait...",
      });

      const { data, error } = await supabase
        .from("hire_skills")
        .insert([newSkillData])
        .select();

      if (error) {
        console.error("Add skill error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (data && data.length > 0) {
        const newSkill = data[0];
        setSkills((prev) => [...prev, newSkill]);
        console.log("Skill added successfully:", newSkill);
        toast({
          title: "Skill Added",
          description: "New skill has been added successfully.",
        });
      } else {
        throw new Error(
          "No data returned from skill insertion - insert may have failed",
        );
      }
    } catch (validationError: any) {
      console.error("Add skill failed:", validationError);
      toast({
        title: "Add Skill Failed",
        description: validationError.message || "Failed to add new skill",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Track pending skill changes
  const [pendingSkillChanges, setPendingSkillChanges] = useState<
    Map<string, Partial<HireSkill>>
  >(new Map());

  const handleSkillChange = (skillId: string, field: string, value: any) => {
    // Immediate UI update
    setSkills((prev) =>
      prev.map((skill) =>
        skill.id === skillId ? { ...skill, [field]: value } : skill,
      ),
    );

    // Track pending changes
    setPendingSkillChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(skillId) || {};
      newMap.set(skillId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const saveSkill = async (skillId: string) => {
    const changes = pendingSkillChanges.get(skillId);
    if (!changes) {
      toast({
        title: "No Changes",
        description: "No changes to save for this skill.",
      });
      return;
    }

    await updateSkill(skillId, changes);

    // Clear pending changes for this skill
    setPendingSkillChanges((prev) => {
      const newMap = new Map(prev);
      newMap.delete(skillId);
      return newMap;
    });
  };

  const hasSkillPendingChanges = (skillId: string) => {
    return pendingSkillChanges.has(skillId);
  };

  const updateSkill = async (skillId: string, updates: Partial<HireSkill>) => {
    const originalSkill = skills.find((s) => s.id === skillId);
    if (!originalSkill) {
      console.error(`Skill with id ${skillId} not found in local state`);
      toast({
        title: "Update Failed",
        description: "Skill not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    console.log(`Updating skill ${skillId}:`, updates);

    try {
      // Create a complete skill object with updates for validation
      const updatedSkill = { ...originalSkill, ...updates };

      // Validate the complete skill data before proceeding
      validateSkillData(updatedSkill);

      // Only after validation passes, apply optimistic update
      setSkills((prev) =>
        prev.map((skill) => (skill.id === skillId ? updatedSkill : skill)),
      );

      console.log(`Sending skill update to database for ${skillId}:`, updates);

      // Database update with proper error handling
      const { data, error, count } = await supabase
        .from("hire_skills")
        .update(updates)
        .eq("id", skillId)
        .select("*");

      if (error) {
        console.error("Skill update error:", error);
        // Revert optimistic update on database error
        setSkills((prev) =>
          prev.map((skill) => (skill.id === skillId ? originalSkill : skill)),
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`Database response for skill ${skillId}:`, { data, count });

      // Check if any rows were updated
      if (!data || data.length === 0) {
        console.error("No rows updated - skill may not exist");

        // Check if skill exists in database
        const { data: existingSkill, error: checkError } = await supabase
          .from("hire_skills")
          .select("id")
          .eq("id", skillId)
          .maybeSingle();

        if (checkError) {
          console.error("Error checking skill existence:", checkError);
          // Revert optimistic update
          setSkills((prev) =>
            prev.map((skill) => (skill.id === skillId ? originalSkill : skill)),
          );
          throw new Error(
            `Failed to verify skill existence: ${checkError.message}`,
          );
        }

        if (!existingSkill) {
          console.error("Skill no longer exists in database");
          await fetchHireViewData();
          throw new Error(
            `Skill with id ${skillId} no longer exists in the database. Data has been refreshed.`,
          );
        }

        // Try a direct update with all fields
        console.log("Retrying skill update with full data...");
        const { data: retryData, error: retryError } = await supabase
          .from("hire_skills")
          .update({
            name: updatedSkill.name,
            category: updatedSkill.category,
            proficiency: updatedSkill.proficiency,
            color: updatedSkill.color,
            order_index: updatedSkill.order_index,
            is_active: updatedSkill.is_active,
          })
          .eq("id", skillId)
          .select("*");

        if (retryError) {
          console.error("Retry skill update error:", retryError);
          // Revert optimistic update
          setSkills((prev) =>
            prev.map((skill) => (skill.id === skillId ? originalSkill : skill)),
          );
          throw new Error(`Database retry error: ${retryError.message}`);
        }

        if (!retryData || retryData.length === 0) {
          // Still no success, revert and throw error
          setSkills((prev) =>
            prev.map((skill) => (skill.id === skillId ? originalSkill : skill)),
          );
          throw new Error(
            "Update operation failed after retry - no rows were updated",
          );
        }

        // Update local state with retry data
        const updatedSkillData = retryData[0];
        setSkills((prev) =>
          prev.map((skill) =>
            skill.id === skillId ? updatedSkillData : skill,
          ),
        );

        console.log(
          `Skill ${skillId} updated successfully after retry:`,
          updatedSkillData,
        );
        toast({
          title: "Success",
          description: "Skill updated successfully.",
        });
        return;
      }

      // Update local state with server data
      const updatedSkillData = data[0];
      setSkills((prev) =>
        prev.map((skill) => (skill.id === skillId ? updatedSkillData : skill)),
      );

      console.log(`Skill ${skillId} updated successfully:`, updatedSkillData);
      toast({
        title: "Success",
        description: "Skill updated successfully.",
      });
    } catch (validationError: any) {
      console.error("Skill update failed:", validationError);
      // Ensure we revert optimistic update on any error
      setSkills((prev) =>
        prev.map((skill) => (skill.id === skillId ? originalSkill : skill)),
      );
      toast({
        title: "Skill Update Failed",
        description: validationError.message || "Failed to update skill",
        variant: "destructive",
      });
    }
  };

  const deleteSkill = async (skillId: string) => {
    const skillToDelete = skills.find((s) => s.id === skillId);
    if (!skillToDelete) {
      console.error(`Skill with id ${skillId} not found`);
      toast({
        title: "Delete Failed",
        description: "Skill not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading state
      setIsSaving(true);

      // Immediate optimistic update
      setSkills((prev) => prev.filter((skill) => skill.id !== skillId));

      const { error } = await supabase
        .from("hire_skills")
        .delete()
        .eq("id", skillId);

      if (error) {
        console.error("Delete skill error:", error);
        // Rollback optimistic update
        setSkills((prev) =>
          [...prev, skillToDelete].sort(
            (a, b) => a.order_index - b.order_index,
          ),
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`Skill ${skillId} deleted successfully`);
      toast({
        title: "Skill Deleted",
        description: "Skill has been removed successfully.",
      });
    } catch (error: any) {
      console.error("Delete skill failed:", error);
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete skill",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addExperience = async () => {
    try {
      const newExperience = {
        company: "New Company",
        position: "New Position",
        description: "Description of role and responsibilities",
        start_date: new Date().toISOString().split("T")[0],
        end_date: null,
        is_current: true,
        location: "Remote",
        achievements: [],
        order_index: experiences.length,
        is_active: true,
      };

      // Validate experience data before sending to database
      validateExperienceData({ ...newExperience, id: "temp" });

      // Show loading state
      setIsSaving(true);
      toast({
        title: "Adding experience",
        description: "Please wait...",
      });

      const { data, error } = await supabase
        .from("hire_experience")
        .insert([newExperience])
        .select();

      if (error) {
        console.error("Add experience error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (data && data.length > 0) {
        const newExp = data[0];
        setExperiences((prev) => [...prev, newExp]);
        console.log("Experience added successfully:", newExp);
        toast({
          title: "Experience added",
          description: "New experience has been added successfully.",
        });
      } else {
        throw new Error(
          "No data returned from experience insertion - insert may have failed",
        );
      }
    } catch (error: any) {
      console.error("Error adding experience:", error);
      toast({
        title: "Error adding experience",
        description: error.message || "Failed to add new experience.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Track pending experience changes
  const [pendingExperienceChanges, setPendingExperienceChanges] = useState<
    Map<string, Partial<HireExperience>>
  >(new Map());

  const handleExperienceChange = (expId: string, field: string, value: any) => {
    // Immediate UI update
    setExperiences((prev) =>
      prev.map((exp) => (exp.id === expId ? { ...exp, [field]: value } : exp)),
    );

    // Track pending changes
    setPendingExperienceChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(expId) || {};
      newMap.set(expId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const saveExperience = async (expId: string) => {
    const changes = pendingExperienceChanges.get(expId);
    if (!changes) {
      toast({
        title: "No Changes",
        description: "No changes to save for this experience.",
      });
      return;
    }

    await updateExperience(expId, changes);

    // Clear pending changes for this experience
    setPendingExperienceChanges((prev) => {
      const newMap = new Map(prev);
      newMap.delete(expId);
      return newMap;
    });
  };

  const hasExperiencePendingChanges = (expId: string) => {
    return pendingExperienceChanges.has(expId);
  };

  const updateExperience = async (
    expId: string,
    updates: Partial<HireExperience>,
  ) => {
    const originalExp = experiences.find((e) => e.id === expId);
    if (!originalExp) {
      console.error(`Experience with id ${expId} not found in local state`);
      toast({
        title: "Update Failed",
        description: "Experience not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a complete experience object with updates
      const updatedExp = { ...originalExp, ...updates };

      // Validate the complete experience data before proceeding
      validateExperienceData(updatedExp);

      // Only after validation passes, apply optimistic update
      setExperiences((prev) =>
        prev.map((exp) => (exp.id === expId ? updatedExp : exp)),
      );

      const { data, error } = await supabase
        .from("hire_experience")
        .update(updates)
        .eq("id", expId)
        .select();

      if (error) {
        console.error("Experience update error:", error);
        // Revert optimistic update
        setExperiences((prev) =>
          prev.map((exp) => (exp.id === expId ? originalExp : exp)),
        );
        throw new Error(`Database error: ${error.message}`);
      }

      // Check if any rows were updated
      if (!data || data.length === 0) {
        console.error("No rows updated - experience may not exist");

        // Check if experience exists
        const { data: existingExp, error: checkError } = await supabase
          .from("hire_experience")
          .select("id")
          .eq("id", expId)
          .single();

        if (checkError) {
          if (checkError.code === "PGRST116") {
            // Record not found
            console.error("Experience no longer exists in database");
            // Revert optimistic update
            setExperiences((prev) =>
              prev.map((exp) => (exp.id === expId ? originalExp : exp)),
            );
            await fetchHireViewData();
            throw new Error(
              `Experience with id ${expId} no longer exists in the database. Data has been refreshed.`,
            );
          } else {
            console.error("Error checking experience existence:", checkError);
            // Revert optimistic update
            setExperiences((prev) =>
              prev.map((exp) => (exp.id === expId ? originalExp : exp)),
            );
            throw new Error(
              `Failed to verify experience existence: ${checkError.message}`,
            );
          }
        }

        // If we get here, the experience exists but wasn't updated (unlikely)
        // Try again with a different approach - full update
        const { data: retryData, error: retryError } = await supabase
          .from("hire_experience")
          .update(updatedExp)
          .eq("id", expId)
          .select();

        if (retryError) {
          console.error("Retry experience update error:", retryError);
          // Revert optimistic update
          setExperiences((prev) =>
            prev.map((exp) => (exp.id === expId ? originalExp : exp)),
          );
          throw new Error(`Database retry error: ${retryError.message}`);
        }

        if (!retryData || retryData.length === 0) {
          // Still no success, revert and throw error
          setExperiences((prev) =>
            prev.map((exp) => (exp.id === expId ? originalExp : exp)),
          );
          throw new Error(
            "Update operation failed after retry - no rows were updated",
          );
        }

        // Update local state with retry data
        const updatedExpData = retryData[0];
        setExperiences((prev) =>
          prev.map((exp) => (exp.id === expId ? updatedExpData : exp)),
        );

        console.log(
          `Experience ${expId} updated successfully after retry:`,
          updatedExpData,
        );
        toast({
          title: "Success",
          description: "Experience updated successfully.",
        });
        return;
      }

      // Update local state with server data
      const updatedExpData = data[0];
      setExperiences((prev) =>
        prev.map((exp) => (exp.id === expId ? updatedExpData : exp)),
      );

      console.log(`Experience ${expId} updated successfully:`, updatedExpData);
      toast({
        title: "Success",
        description: "Experience updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating experience:", error);
      // Ensure we revert optimistic update on any error
      setExperiences((prev) =>
        prev.map((exp) => (exp.id === expId ? originalExp : exp)),
      );
      toast({
        title: "Error updating experience",
        description: error.message || "Failed to save experience changes.",
        variant: "destructive",
      });
    }
  };

  const deleteExperience = async (expId: string) => {
    const expToDelete = experiences.find((e) => e.id === expId);
    if (!expToDelete) {
      console.error(`Experience with id ${expId} not found`);
      toast({
        title: "Delete Failed",
        description: "Experience not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading state
      setIsSaving(true);

      // Immediate optimistic update
      setExperiences((prev) => prev.filter((exp) => exp.id !== expId));

      const { error } = await supabase
        .from("hire_experience")
        .delete()
        .eq("id", expId);

      if (error) {
        console.error("Delete experience error:", error);
        // Rollback optimistic update
        setExperiences((prev) =>
          [...prev, expToDelete].sort((a, b) => a.order_index - b.order_index),
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`Experience ${expId} deleted successfully`);
      toast({
        title: "Experience deleted",
        description: "Experience has been removed successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting experience:", error);
      toast({
        title: "Error deleting experience",
        description: error.message || "Failed to delete experience.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const addContactField = async () => {
    try {
      const newField = {
        field_type: "text",
        label: "New Field",
        placeholder: "Enter value",
        is_required: false,
        order_index: contactFields.length,
        is_active: true,
      };

      // Validate contact field data before sending to database
      validateContactFieldData({ ...newField, id: "temp" });

      // Show loading state
      setIsSaving(true);
      toast({
        title: "Adding contact field",
        description: "Please wait...",
      });

      const { data, error } = await supabase
        .from("hire_contact_fields")
        .insert([newField])
        .select();

      if (error) {
        console.error("Add contact field error:", error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (data && data.length > 0) {
        const newContactField = data[0];
        setContactFields((prev) => [...prev, newContactField]);
        console.log("Contact field added successfully:", newContactField);
        toast({
          title: "Contact field added",
          description: "New contact field has been added successfully.",
        });
      } else {
        throw new Error(
          "No data returned from contact field insertion - insert may have failed",
        );
      }
    } catch (error: any) {
      console.error("Error adding contact field:", error);
      toast({
        title: "Error adding contact field",
        description: error.message || "Failed to add new contact field.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Track pending contact field changes
  const [pendingContactFieldChanges, setPendingContactFieldChanges] = useState<
    Map<string, Partial<HireContactField>>
  >(new Map());

  const handleContactFieldChange = (
    fieldId: string,
    field: string,
    value: any,
  ) => {
    // Immediate UI update
    setContactFields((prev) =>
      prev.map((contactField) =>
        contactField.id === fieldId
          ? { ...contactField, [field]: value }
          : contactField,
      ),
    );

    // Track pending changes
    setPendingContactFieldChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(fieldId) || {};
      newMap.set(fieldId, { ...existing, [field]: value });
      return newMap;
    });
  };

  const saveContactField = async (fieldId: string) => {
    const changes = pendingContactFieldChanges.get(fieldId);
    if (!changes) {
      toast({
        title: "No Changes",
        description: "No changes to save for this contact field.",
      });
      return;
    }

    await updateContactField(fieldId, changes);

    // Clear pending changes for this contact field
    setPendingContactFieldChanges((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fieldId);
      return newMap;
    });
  };

  const hasContactFieldPendingChanges = (fieldId: string) => {
    return pendingContactFieldChanges.has(fieldId);
  };

  const updateContactField = async (
    fieldId: string,
    updates: Partial<HireContactField>,
  ) => {
    const originalField = contactFields.find((f) => f.id === fieldId);
    if (!originalField) {
      console.error(
        `Contact field with id ${fieldId} not found in local state`,
      );
      toast({
        title: "Update Failed",
        description: "Contact field not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a complete field object with updates
      const updatedField = { ...originalField, ...updates };

      // Validate the complete field data before proceeding
      validateContactFieldData(updatedField);

      // Only after validation passes, apply optimistic update
      setContactFields((prev) =>
        prev.map((field) => (field.id === fieldId ? updatedField : field)),
      );

      const { data, error } = await supabase
        .from("hire_contact_fields")
        .update(updates)
        .eq("id", fieldId)
        .select();

      if (error) {
        console.error("Contact field update error:", error);
        // Revert optimistic update
        setContactFields((prev) =>
          prev.map((field) => (field.id === fieldId ? originalField : field)),
        );
        throw new Error(`Database error: ${error.message}`);
      }

      // Check if any rows were updated
      if (!data || data.length === 0) {
        console.error("No rows updated - contact field may not exist");

        // Check if contact field exists
        const { data: existingField, error: checkError } = await supabase
          .from("hire_contact_fields")
          .select("id")
          .eq("id", fieldId)
          .single();

        if (checkError) {
          if (checkError.code === "PGRST116") {
            // Record not found
            console.error("Contact field no longer exists in database");
            // Revert optimistic update
            setContactFields((prev) =>
              prev.map((field) =>
                field.id === fieldId ? originalField : field,
              ),
            );
            await fetchHireViewData();
            throw new Error(
              `Contact field with id ${fieldId} no longer exists in the database. Data has been refreshed.`,
            );
          } else {
            console.error(
              "Error checking contact field existence:",
              checkError,
            );
            // Revert optimistic update
            setContactFields((prev) =>
              prev.map((field) =>
                field.id === fieldId ? originalField : field,
              ),
            );
            throw new Error(
              `Failed to verify contact field existence: ${checkError.message}`,
            );
          }
        }

        // If we get here, the field exists but wasn't updated (unlikely)
        // Try again with a different approach - full update
        const { data: retryData, error: retryError } = await supabase
          .from("hire_contact_fields")
          .update(updatedField)
          .eq("id", fieldId)
          .select();

        if (retryError) {
          console.error("Retry contact field update error:", retryError);
          // Revert optimistic update
          setContactFields((prev) =>
            prev.map((field) => (field.id === fieldId ? originalField : field)),
          );
          throw new Error(`Database retry error: ${retryError.message}`);
        }

        if (!retryData || retryData.length === 0) {
          // Still no success, revert and throw error
          setContactFields((prev) =>
            prev.map((field) => (field.id === fieldId ? originalField : field)),
          );
          throw new Error(
            "Update operation failed after retry - no rows were updated",
          );
        }

        // Update local state with retry data
        const updatedFieldData = retryData[0];
        setContactFields((prev) =>
          prev.map((field) =>
            field.id === fieldId ? updatedFieldData : field,
          ),
        );

        console.log(
          `Contact field ${fieldId} updated successfully after retry:`,
          updatedFieldData,
        );
        toast({
          title: "Success",
          description: "Contact field updated successfully.",
        });
        return;
      }

      // Update local state with server data
      const updatedFieldData = data[0];
      setContactFields((prev) =>
        prev.map((field) => (field.id === fieldId ? updatedFieldData : field)),
      );

      console.log(
        `Contact field ${fieldId} updated successfully:`,
        updatedFieldData,
      );
      toast({
        title: "Success",
        description: "Contact field updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating contact field:", error);
      // Ensure we revert optimistic update on any error
      setContactFields((prev) =>
        prev.map((field) => (field.id === fieldId ? originalField : field)),
      );
      toast({
        title: "Error updating contact field",
        description: error.message || "Failed to save contact field changes.",
        variant: "destructive",
      });
    }
  };

  const deleteContactField = async (fieldId: string) => {
    const fieldToDelete = contactFields.find((f) => f.id === fieldId);
    if (!fieldToDelete) {
      console.error(`Contact field with id ${fieldId} not found`);
      toast({
        title: "Delete Failed",
        description: "Contact field not found. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Show loading state
      setIsSaving(true);

      // Immediate optimistic update
      setContactFields((prev) => prev.filter((field) => field.id !== fieldId));

      const { error } = await supabase
        .from("hire_contact_fields")
        .delete()
        .eq("id", fieldId);

      if (error) {
        console.error("Delete contact field error:", error);
        // Rollback optimistic update
        setContactFields((prev) =>
          [...prev, fieldToDelete].sort(
            (a, b) => a.order_index - b.order_index,
          ),
        );
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`Contact field ${fieldId} deleted successfully`);
      toast({
        title: "Contact field deleted",
        description: "Contact field has been removed successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting contact field:", error);
      toast({
        title: "Error deleting contact field",
        description: error.message || "Failed to delete contact field.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Error state
  if (error && !isLoading) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-900">
              Failed to Load Editor
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">{error}</p>
          <Button
            onClick={() => fetchHireViewData()}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading hire view editor..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ErrorBoundary>
        <div className="space-y-6">
          <DatabaseStatus onRetry={() => fetchHireViewData()} />

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Hire View Editor
              </h2>
              <p className="text-gray-600">
                Manage your dynamic hire view content
              </p>
            </div>
            <div className="flex items-center gap-3">
              <ConnectionStatus />
              <SyncIndicator isActive={realtimeActive} />
              <div className="flex gap-2">
                <Button
                  onClick={() => fetchHireViewData(true)}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isLoading}
                >
                  <RefreshCw
                    className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  onClick={() => window.open("/", "_blank")}
                  className="flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </Button>
              </div>
            </div>
          </div>

          {/* Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-700">
                      Sections
                    </p>
                    <p className="text-2xl font-bold text-blue-900">
                      {sections.length}
                    </p>
                  </div>
                  <Settings className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-700">Skills</p>
                    <p className="text-2xl font-bold text-green-900">
                      {skills.length}
                    </p>
                  </div>
                  <Star className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-700">
                      Experience
                    </p>
                    <p className="text-2xl font-bold text-purple-900">
                      {experiences.length}
                    </p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-700">
                      Contact Fields
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {contactFields.length}
                    </p>
                  </div>
                  <Mail className="w-8 h-8 text-orange-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="skills" className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              Skills
            </TabsTrigger>
            <TabsTrigger value="experience" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Experience
            </TabsTrigger>
            <TabsTrigger value="contact" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Contact
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Section Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={section.is_active ? "default" : "secondary"}
                        >
                          {section.section_type}
                        </Badge>
                        <h4 className="font-semibold">{section.title}</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={section.is_active}
                          onCheckedChange={(checked) =>
                            handleSectionFieldChange(
                              section.id,
                              "is_active",
                              checked,
                            )
                          }
                        />
                        <span className="text-sm text-gray-500">Active</span>
                        {optimisticUpdates.has(section.id) && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Saving...</span>
                          </div>
                        )}
                        {hasPendingChanges(section.id) && (
                          <Badge variant="outline" className="text-xs">
                            Unsaved
                          </Badge>
                        )}
                        <Button
                          onClick={() => saveSection(section.id)}
                          size="sm"
                          disabled={
                            !hasPendingChanges(section.id) ||
                            optimisticUpdates.has(section.id)
                          }
                          className="flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Section Title</Label>
                        <Input
                          value={section.title || ""}
                          onChange={(e) =>
                            handleSectionFieldChange(
                              section.id,
                              "title",
                              e.target.value,
                            )
                          }
                          placeholder="Section title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Order</Label>
                        <Input
                          type="number"
                          value={section.order_index}
                          onChange={(e) =>
                            handleSectionFieldChange(
                              section.id,
                              "order_index",
                              parseInt(e.target.value),
                            )
                          }
                        />
                      </div>
                    </div>

                    {section.section_type === "hero" && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Headline</Label>
                            <Input
                              value={section.content?.headline || ""}
                              onChange={(e) =>
                                handleSectionContentChange(
                                  section.id,
                                  "headline",
                                  e.target.value,
                                )
                              }
                              placeholder="Professional headline"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Tagline</Label>
                            <Input
                              value={section.content?.tagline || ""}
                              onChange={(e) =>
                                handleSectionContentChange(
                                  section.id,
                                  "tagline",
                                  e.target.value,
                                )
                              }
                              placeholder="Professional tagline"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>CTA Text</Label>
                          <Input
                            value={section.content?.cta_text || ""}
                            onChange={(e) =>
                              handleSectionContentChange(
                                section.id,
                                "cta_text",
                                e.target.value,
                              )
                            }
                            placeholder="Call to action text"
                          />
                        </div>
                      </div>
                    )}

                    {(section.section_type === "skills" ||
                      section.section_type === "experience" ||
                      section.section_type === "contact") && (
                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          value={section.content?.description || ""}
                          onChange={(e) =>
                            handleSectionContentChange(
                              section.id,
                              "description",
                              e.target.value,
                            )
                          }
                          placeholder="Section description"
                          rows={3}
                        />
                      </div>
                    )}

                    {section.section_type === "contact" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Submit Button Text</Label>
                          <Input
                            value={section.content?.submit_text || ""}
                            onChange={(e) =>
                              handleSectionContentChange(
                                section.id,
                                "submit_text",
                                e.target.value,
                              )
                            }
                            placeholder="Send Message"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Success Message</Label>
                          <Input
                            value={section.content?.success_message || ""}
                            onChange={(e) =>
                              handleSectionContentChange(
                                section.id,
                                "success_message",
                                e.target.value,
                              )
                            }
                            placeholder="Thank you message"
                          />
                        </div>
                      </div>
                    )}

                    {section.section_type === "resume" && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label>Button Text</Label>
                          <Input
                            value={section.content?.button_text || ""}
                            onChange={(e) =>
                              handleSectionContentChange(
                                section.id,
                                "button_text",
                                e.target.value,
                              )
                            }
                            placeholder="Download PDF Resume"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Version</Label>
                          <Input
                            value={section.content?.version || ""}
                            onChange={(e) =>
                              handleSectionContentChange(
                                section.id,
                                "version",
                                e.target.value,
                              )
                            }
                            placeholder="1.0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>File URL</Label>
                          <Input
                            value={section.content?.file_url || ""}
                            onChange={(e) =>
                              handleSectionContentChange(
                                section.id,
                                "file_url",
                                e.target.value,
                              )
                            }
                            placeholder="https://..."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Skills Management</CardTitle>
                  <Button
                    onClick={addSkill}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Skill
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {skills.map((skill) => (
                  <div key={skill.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Skill Name</Label>
                        <Input
                          value={skill.name}
                          onChange={(e) =>
                            handleSkillChange(skill.id, "name", e.target.value)
                          }
                          placeholder="Skill name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={skill.category}
                          onValueChange={(value) =>
                            handleSkillChange(skill.id, "category", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Frontend">Frontend</SelectItem>
                            <SelectItem value="Backend">Backend</SelectItem>
                            <SelectItem value="Database">Database</SelectItem>
                            <SelectItem value="Tools">Tools</SelectItem>
                            <SelectItem value="Language">Language</SelectItem>
                            <SelectItem value="Cloud">Cloud</SelectItem>
                            <SelectItem value="DevOps">DevOps</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Proficiency (%)</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={skill.proficiency}
                          onChange={(e) =>
                            handleSkillChange(
                              skill.id,
                              "proficiency",
                              parseInt(e.target.value),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={skill.color}
                            onChange={(e) =>
                              handleSkillChange(
                                skill.id,
                                "color",
                                e.target.value,
                              )
                            }
                            className="w-10 h-8 rounded border"
                          />
                          <Input
                            value={skill.color}
                            onChange={(e) =>
                              handleSkillChange(
                                skill.id,
                                "color",
                                e.target.value,
                              )
                            }
                            className="text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={skill.is_active}
                            onCheckedChange={(checked) =>
                              handleSkillChange(skill.id, "is_active", checked)
                            }
                            disabled={optimisticUpdates.has(skill.id)}
                          />
                          <Label className="text-xs">Active</Label>
                        </div>
                        {optimisticUpdates.has(skill.id) && (
                          <div className="flex items-center gap-1 text-xs text-blue-600">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Saving...</span>
                          </div>
                        )}
                        {hasSkillPendingChanges(skill.id) && (
                          <Badge variant="outline" className="text-xs">
                            Unsaved
                          </Badge>
                        )}
                        <Button
                          onClick={() => saveSkill(skill.id)}
                          size="sm"
                          disabled={
                            !hasSkillPendingChanges(skill.id) ||
                            optimisticUpdates.has(skill.id)
                          }
                          className="flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                        <Button
                          onClick={() => deleteSkill(skill.id)}
                          variant="destructive"
                          size="sm"
                          disabled={optimisticUpdates.has(skill.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="experience" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Experience Management</CardTitle>
                  <Button
                    onClick={addExperience}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Experience
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {experiences.map((exp) => (
                  <div key={exp.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">
                        {exp.company} - {exp.position}
                      </h4>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={exp.is_active}
                          onCheckedChange={(checked) =>
                            handleExperienceChange(exp.id, "is_active", checked)
                          }
                        />
                        {hasExperiencePendingChanges(exp.id) && (
                          <Badge variant="outline" className="text-xs">
                            Unsaved
                          </Badge>
                        )}
                        <Button
                          onClick={() => saveExperience(exp.id)}
                          size="sm"
                          disabled={!hasExperiencePendingChanges(exp.id)}
                          className="flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                        <Button
                          onClick={() => deleteExperience(exp.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Company</Label>
                        <Input
                          value={exp.company}
                          onChange={(e) =>
                            handleExperienceChange(
                              exp.id,
                              "company",
                              e.target.value,
                            )
                          }
                          placeholder="Company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) =>
                            handleExperienceChange(
                              exp.id,
                              "position",
                              e.target.value,
                            )
                          }
                          placeholder="Job title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          value={exp.location || ""}
                          onChange={(e) =>
                            handleExperienceChange(
                              exp.id,
                              "location",
                              e.target.value,
                            )
                          }
                          placeholder="Location"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                          type="date"
                          value={exp.start_date}
                          onChange={(e) =>
                            handleExperienceChange(
                              exp.id,
                              "start_date",
                              e.target.value,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={exp.end_date || ""}
                          onChange={(e) =>
                            handleExperienceChange(
                              exp.id,
                              "end_date",
                              e.target.value || null,
                            )
                          }
                          disabled={exp.is_current}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={exp.is_current}
                          onCheckedChange={(checked) =>
                            handleExperienceChange(
                              exp.id,
                              "is_current",
                              checked,
                            )
                          }
                        />
                        <Label>Current Position</Label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={exp.description || ""}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Job description and responsibilities"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Achievements (one per line)</Label>
                      <Textarea
                        value={exp.achievements?.join("\n") || ""}
                        onChange={(e) =>
                          handleExperienceChange(
                            exp.id,
                            "achievements",
                            e.target.value.split("\n").filter((a) => a.trim()),
                          )
                        }
                        placeholder="Key achievements and accomplishments"
                        rows={4}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Contact Form Fields</CardTitle>
                  <Button
                    onClick={addContactField}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactFields.map((field) => (
                  <div key={field.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="space-y-2">
                        <Label>Field Type</Label>
                        <Select
                          value={field.field_type}
                          onValueChange={(value) =>
                            handleContactFieldChange(
                              field.id,
                              "field_type",
                              value,
                            )
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Select</SelectItem>
                            <SelectItem value="checkbox">Checkbox</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            handleContactFieldChange(
                              field.id,
                              "label",
                              e.target.value,
                            )
                          }
                          placeholder="Field label"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            handleContactFieldChange(
                              field.id,
                              "placeholder",
                              e.target.value,
                            )
                          }
                          placeholder="Placeholder text"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.is_required}
                            onCheckedChange={(checked) =>
                              handleContactFieldChange(
                                field.id,
                                "is_required",
                                checked,
                              )
                            }
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.is_active}
                            onCheckedChange={(checked) =>
                              handleContactFieldChange(
                                field.id,
                                "is_active",
                                checked,
                              )
                            }
                          />
                          <Label className="text-xs">Active</Label>
                        </div>
                        {hasContactFieldPendingChanges(field.id) && (
                          <Badge variant="outline" className="text-xs">
                            Unsaved
                          </Badge>
                        )}
                        <Button
                          onClick={() => saveContactField(field.id)}
                          size="sm"
                          disabled={!hasContactFieldPendingChanges(field.id)}
                          className="flex items-center gap-1"
                        >
                          <Save className="w-3 h-3" />
                          Save
                        </Button>
                        <Button
                          onClick={() => deleteContactField(field.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </ErrorBoundary>
    </div>
  );
}
