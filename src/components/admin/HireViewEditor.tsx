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
          throw new Error(
            `Database errors: ${errors.map((e) => e?.message).join(", ")}`,
          );
        }

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
      console.error(`Section with id ${sectionId} not found`);
      return;
    }

    try {
      // Validate updates if they include critical fields
      if (updates.content || updates.section_type) {
        const updatedSection = { ...originalSection, ...updates };
        validateSectionData(updatedSection);
      }

      // Database update FIRST (no optimistic updates to avoid conflicts)
      const { data, error } = await supabase
        .from("hire_sections")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", sectionId)
        .select()
        .single();

      if (error) {
        console.error("Database update error:", error);
        throw error;
      }

      // Update local state with server data
      if (data) {
        setSections((prev) =>
          prev.map((section) => (section.id === sectionId ? data : section)),
        );

        toast({
          title: "Section Updated",
          description: "Changes saved successfully.",
        });
      }

      console.log(`Section ${sectionId} updated successfully:`, data);
    } catch (validationError: any) {
      console.error("Section update failed:", validationError);
      toast({
        title: "Update Failed",
        description: validationError.message || "Failed to update section",
        variant: "destructive",
      });
    }
  };

  // Immediate save for real-time editing (removed debouncing to fix race conditions)
  const handleSectionFieldChange = async (
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

    // Immediate database save
    try {
      await updateSection(sectionId, { [field]: value });
    } catch (error) {
      console.error("Field update failed:", error);
      // Revert UI change on failure
      fetchHireViewData();
    }
  };

  const handleSectionContentChange = async (
    sectionId: string,
    contentField: string,
    value: any,
  ) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;

    const updatedContent = { ...section.content, [contentField]: value };

    // Immediate UI update for responsiveness
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId ? { ...s, content: updatedContent } : s,
      ),
    );

    // Immediate database save
    try {
      await updateSection(sectionId, { content: updatedContent });
    } catch (error) {
      console.error("Content update failed:", error);
      // Revert UI change on failure
      fetchHireViewData();
    }
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

      const { data, error } = await supabase
        .from("hire_skills")
        .insert(newSkillData)
        .select()
        .single();

      if (error) {
        console.error("Add skill error:", error);
        throw error;
      }

      if (data) {
        setSkills((prev) => [...prev, data]);
        console.log("Skill added successfully:", data);
        toast({
          title: "Skill Added",
          description: "New skill has been added successfully.",
        });
      }
    } catch (validationError: any) {
      console.error("Add skill failed:", validationError);
      toast({
        title: "Add Skill Failed",
        description: validationError.message || "Failed to add new skill",
        variant: "destructive",
      });
    }
  };

  const updateSkill = async (skillId: string, updates: Partial<HireSkill>) => {
    const originalSkill = skills.find((s) => s.id === skillId);
    if (!originalSkill) {
      console.error(`Skill with id ${skillId} not found`);
      return;
    }

    try {
      // Validate updates
      const updatedSkill = { ...originalSkill, ...updates };
      validateSkillData(updatedSkill);

      // Database update FIRST
      const { data, error } = await supabase
        .from("hire_skills")
        .update(updates)
        .eq("id", skillId)
        .select()
        .single();

      if (error) {
        console.error("Skill update error:", error);
        throw error;
      }

      // Update local state with server data
      if (data) {
        setSkills((prev) =>
          prev.map((skill) => (skill.id === skillId ? data : skill)),
        );

        toast({
          title: "Skill Updated",
          description: "Skill changes saved successfully.",
        });
      }

      console.log(`Skill ${skillId} updated successfully:`, data);
    } catch (validationError: any) {
      console.error("Skill update failed:", validationError);
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
      return;
    }

    try {
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
        throw error;
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

      const { data, error } = await supabase
        .from("hire_experience")
        .insert(newExperience)
        .select()
        .single();

      if (error) throw error;
      if (data) setExperiences((prev) => [...prev, data]);

      toast({
        title: "Experience added",
        description: "New experience has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding experience:", error);
      toast({
        title: "Error adding experience",
        description: "Failed to add new experience.",
        variant: "destructive",
      });
    }
  };

  const updateExperience = async (
    expId: string,
    updates: Partial<HireExperience>,
  ) => {
    try {
      const { error } = await supabase
        .from("hire_experience")
        .update(updates)
        .eq("id", expId);

      if (error) throw error;

      setExperiences((prev) =>
        prev.map((exp) => (exp.id === expId ? { ...exp, ...updates } : exp)),
      );
    } catch (error) {
      console.error("Error updating experience:", error);
      toast({
        title: "Error updating experience",
        description: "Failed to save experience changes.",
        variant: "destructive",
      });
    }
  };

  const deleteExperience = async (expId: string) => {
    try {
      const { error } = await supabase
        .from("hire_experience")
        .delete()
        .eq("id", expId);

      if (error) throw error;

      setExperiences((prev) => prev.filter((exp) => exp.id !== expId));

      toast({
        title: "Experience deleted",
        description: "Experience has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting experience:", error);
      toast({
        title: "Error deleting experience",
        description: "Failed to delete experience.",
        variant: "destructive",
      });
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

      const { data, error } = await supabase
        .from("hire_contact_fields")
        .insert(newField)
        .select()
        .single();

      if (error) throw error;
      if (data) setContactFields((prev) => [...prev, data]);

      toast({
        title: "Contact field added",
        description: "New contact field has been added successfully.",
      });
    } catch (error) {
      console.error("Error adding contact field:", error);
      toast({
        title: "Error adding contact field",
        description: "Failed to add new contact field.",
        variant: "destructive",
      });
    }
  };

  const updateContactField = async (
    fieldId: string,
    updates: Partial<HireContactField>,
  ) => {
    try {
      const { error } = await supabase
        .from("hire_contact_fields")
        .update(updates)
        .eq("id", fieldId);

      if (error) throw error;

      setContactFields((prev) =>
        prev.map((field) =>
          field.id === fieldId ? { ...field, ...updates } : field,
        ),
      );
    } catch (error) {
      console.error("Error updating contact field:", error);
      toast({
        title: "Error updating contact field",
        description: "Failed to save contact field changes.",
        variant: "destructive",
      });
    }
  };

  const deleteContactField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from("hire_contact_fields")
        .delete()
        .eq("id", fieldId);

      if (error) throw error;

      setContactFields((prev) => prev.filter((field) => field.id !== fieldId));

      toast({
        title: "Contact field deleted",
        description: "Contact field has been removed successfully.",
      });
    } catch (error) {
      console.error("Error deleting contact field:", error);
      toast({
        title: "Error deleting contact field",
        description: "Failed to delete contact field.",
        variant: "destructive",
      });
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
                            updateSection(section.id, { is_active: checked })
                          }
                        />
                        <span className="text-sm text-gray-500">Active</span>
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
                            updateSkill(skill.id, { name: e.target.value })
                          }
                          placeholder="Skill name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={skill.category}
                          onValueChange={(value) =>
                            updateSkill(skill.id, { category: value })
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
                            updateSkill(skill.id, {
                              proficiency: parseInt(e.target.value),
                            })
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
                              updateSkill(skill.id, { color: e.target.value })
                            }
                            className="w-10 h-8 rounded border"
                          />
                          <Input
                            value={skill.color}
                            onChange={(e) =>
                              updateSkill(skill.id, { color: e.target.value })
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
                              updateSkill(skill.id, { is_active: checked })
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
                            updateExperience(exp.id, { is_active: checked })
                          }
                        />
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
                            updateExperience(exp.id, {
                              company: e.target.value,
                            })
                          }
                          placeholder="Company name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Position</Label>
                        <Input
                          value={exp.position}
                          onChange={(e) =>
                            updateExperience(exp.id, {
                              position: e.target.value,
                            })
                          }
                          placeholder="Job title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Location</Label>
                        <Input
                          value={exp.location || ""}
                          onChange={(e) =>
                            updateExperience(exp.id, {
                              location: e.target.value,
                            })
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
                            updateExperience(exp.id, {
                              start_date: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input
                          type="date"
                          value={exp.end_date || ""}
                          onChange={(e) =>
                            updateExperience(exp.id, {
                              end_date: e.target.value || null,
                            })
                          }
                          disabled={exp.is_current}
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={exp.is_current}
                          onCheckedChange={(checked) =>
                            updateExperience(exp.id, { is_current: checked })
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
                          updateExperience(exp.id, {
                            description: e.target.value,
                          })
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
                          updateExperience(exp.id, {
                            achievements: e.target.value
                              .split("\n")
                              .filter((a) => a.trim()),
                          })
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
                            updateContactField(field.id, { field_type: value })
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
                            updateContactField(field.id, {
                              label: e.target.value,
                            })
                          }
                          placeholder="Field label"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Placeholder</Label>
                        <Input
                          value={field.placeholder || ""}
                          onChange={(e) =>
                            updateContactField(field.id, {
                              placeholder: e.target.value,
                            })
                          }
                          placeholder="Placeholder text"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.is_required}
                            onCheckedChange={(checked) =>
                              updateContactField(field.id, {
                                is_required: checked,
                              })
                            }
                          />
                          <Label className="text-xs">Required</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={field.is_active}
                            onCheckedChange={(checked) =>
                              updateContactField(field.id, {
                                is_active: checked,
                              })
                            }
                          />
                          <Label className="text-xs">Active</Label>
                        </div>
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
