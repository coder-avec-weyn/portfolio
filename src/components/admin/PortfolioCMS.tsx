import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
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
  Filter,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Download,
  Upload,
  Star,
  Building,
  Award,
  Users,
  Palette,
  Settings,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface Project {
  id: string;
  title: string;
  description: string | null;
  long_description: string | null;
  tech_stack: string[] | null;
  github_url: string | null;
  live_url: string | null;
  image_url: string | null;
  video_url: string | null;
  featured: boolean | null;
  order_index: number | null;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number | null;
  icon_url: string | null;
  is_active?: boolean;
  created_at: string;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean | null;
  location: string | null;
  company_logo: string | null;
  order_index: number | null;
  is_active?: boolean;
  created_at: string;
}

interface Testimonial {
  id: string;
  name: string;
  position: string | null;
  company: string | null;
  content: string;
  avatar_url: string | null;
  rating: number | null;
  featured: boolean | null;
  is_active?: boolean;
  created_at: string;
}

type FilterType = "all" | "active" | "inactive";

export default function PortfolioCMS() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("projects");
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [projectsRes, skillsRes, experiencesRes, testimonialsRes] =
        await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .order("order_index", { ascending: true }),
          supabase
            .from("skills")
            .select("*")
            .order("name", { ascending: true }),
          supabase
            .from("experiences")
            .select("*")
            .order("order_index", { ascending: true }),
          supabase
            .from("testimonials")
            .select("*")
            .order("created_at", { ascending: false }),
        ]);

      const errors = [
        projectsRes.error,
        skillsRes.error,
        experiencesRes.error,
        testimonialsRes.error,
      ].filter(Boolean);

      if (errors.length > 0) {
        throw new Error(
          `Database errors: ${errors.map((e) => e?.message).join(", ")}`,
        );
      }

      // Add is_active field if it doesn't exist (default to true for existing records)
      setProjects(
        (projectsRes.data || []).map((p) => ({
          ...p,
          is_active: p.is_active ?? true,
        })),
      );
      setSkills(
        (skillsRes.data || []).map((s) => ({
          ...s,
          is_active: s.is_active ?? true,
        })),
      );
      setExperiences(
        (experiencesRes.data || []).map((e) => ({
          ...e,
          is_active: e.is_active ?? true,
        })),
      );
      setTestimonials(
        (testimonialsRes.data || []).map((t) => ({
          ...t,
          is_active: t.is_active ?? true,
        })),
      );
    } catch (error: any) {
      console.error("Error fetching portfolio data:", error);
      setError(error.message || "Failed to load portfolio data");
      toast({
        title: "Error loading data",
        description: error.message || "Failed to load portfolio data.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add is_active column to tables if it doesn't exist
  const ensureActiveColumn = async (tableName: string) => {
    try {
      // Try to add the column - this will fail silently if it already exists
      await supabase.rpc("exec_sql", {
        sql: `ALTER TABLE ${tableName} ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;`,
      });
    } catch (error) {
      // Column might already exist, which is fine
      console.log(`Column is_active might already exist in ${tableName}`);
    }
  };

  useEffect(() => {
    // Ensure all tables have is_active column
    const tables = ["projects", "skills", "experiences", "testimonials"];
    tables.forEach((table) => ensureActiveColumn(table));
  }, []);

  const updateProjectStatus = async (projectId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ is_active: isActive })
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) =>
        prev.map((p) =>
          p.id === projectId ? { ...p, is_active: isActive } : p,
        ),
      );

      toast({
        title: "Project Updated",
        description: `Project ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update project status.",
        variant: "destructive",
      });
    }
  };

  const updateSkillStatus = async (skillId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("skills")
        .update({ is_active: isActive })
        .eq("id", skillId);

      if (error) throw error;

      setSkills((prev) =>
        prev.map((s) => (s.id === skillId ? { ...s, is_active: isActive } : s)),
      );

      toast({
        title: "Skill Updated",
        description: `Skill ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update skill status.",
        variant: "destructive",
      });
    }
  };

  const updateExperienceStatus = async (
    experienceId: string,
    isActive: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("experiences")
        .update({ is_active: isActive })
        .eq("id", experienceId);

      if (error) throw error;

      setExperiences((prev) =>
        prev.map((e) =>
          e.id === experienceId ? { ...e, is_active: isActive } : e,
        ),
      );

      toast({
        title: "Experience Updated",
        description: `Experience ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update experience status.",
        variant: "destructive",
      });
    }
  };

  const updateTestimonialStatus = async (
    testimonialId: string,
    isActive: boolean,
  ) => {
    try {
      const { error } = await supabase
        .from("testimonials")
        .update({ is_active: isActive })
        .eq("id", testimonialId);

      if (error) throw error;

      setTestimonials((prev) =>
        prev.map((t) =>
          t.id === testimonialId ? { ...t, is_active: isActive } : t,
        ),
      );

      toast({
        title: "Testimonial Updated",
        description: `Testimonial ${isActive ? "activated" : "deactivated"} successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update testimonial status.",
        variant: "destructive",
      });
    }
  };

  const addProject = async () => {
    try {
      setIsSaving(true);
      const newProject = {
        title: "",
        description: "",
        long_description: "",
        tech_stack: [],
        github_url: "",
        live_url: "",
        image_url: "",
        featured: false,
        order_index: projects.length,
        is_active: true,
      };

      const { data, error } = await supabase
        .from("projects")
        .insert([newProject])
        .select()
        .single();

      if (error) throw error;

      setProjects((prev) => [...prev, data]);
      toast({
        title: "Project Added",
        description:
          "New blank project has been created. Please fill in the details.",
      });
    } catch (error: any) {
      toast({
        title: "Add Failed",
        description: error.message || "Failed to add new project.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast({
        title: "Project Deleted",
        description: "Project has been removed successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete project.",
        variant: "destructive",
      });
    }
  };

  const filterItems = <
    T extends {
      is_active?: boolean;
      title?: string;
      name?: string;
      company?: string;
    },
  >(
    items: T[],
  ) => {
    let filtered = items;

    // Apply status filter
    if (filter === "active") {
      filtered = filtered.filter((item) => item.is_active === true);
    } else if (filter === "inactive") {
      filtered = filtered.filter((item) => item.is_active === false);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter((item) => {
        const searchableText = (
          (item.title || "") +
          (item.name || "") +
          (item.company || "")
        ).toLowerCase();
        return searchableText.includes(searchTerm.toLowerCase());
      });
    }

    return filtered;
  };

  const getStatusBadge = (isActive?: boolean) => {
    if (isActive === true) {
      return (
        <Badge
          variant="default"
          className="bg-green-100 text-green-800 border-green-200"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    } else {
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-600 border-gray-200"
        >
          <XCircle className="w-3 h-3 mr-1" />
          Inactive
        </Badge>
      );
    }
  };

  const getStats = () => {
    const projectStats = {
      total: projects.length,
      active: projects.filter((p) => p.is_active).length,
      inactive: projects.filter((p) => !p.is_active).length,
    };

    const skillStats = {
      total: skills.length,
      active: skills.filter((s) => s.is_active).length,
      inactive: skills.filter((s) => !s.is_active).length,
    };

    const experienceStats = {
      total: experiences.length,
      active: experiences.filter((e) => e.is_active).length,
      inactive: experiences.filter((e) => !e.is_active).length,
    };

    const testimonialStats = {
      total: testimonials.length,
      active: testimonials.filter((t) => t.is_active).length,
      inactive: testimonials.filter((t) => !t.is_active).length,
    };

    return { projectStats, skillStats, experienceStats, testimonialStats };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading portfolio CMS..." />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <CardTitle className="text-red-900">Failed to Load CMS</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={fetchData} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio CMS</h2>
          <p className="text-gray-600">
            Manage your portfolio content with active/inactive controls
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={fetchData}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => window.open("/", "_blank")}
            className="flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview Live Site
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Projects</p>
                <p className="text-2xl font-bold text-blue-900">
                  {stats.projectStats.active}/{stats.projectStats.total}
                </p>
                <p className="text-xs text-blue-600">Active/Total</p>
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
                  {stats.skillStats.active}/{stats.skillStats.total}
                </p>
                <p className="text-xs text-green-600">Active/Total</p>
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
                  {stats.experienceStats.active}/{stats.experienceStats.total}
                </p>
                <p className="text-xs text-purple-600">Active/Total</p>
              </div>
              <Building className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">
                  Testimonials
                </p>
                <p className="text-2xl font-bold text-orange-900">
                  {stats.testimonialStats.active}/{stats.testimonialStats.total}
                </p>
                <p className="text-xs text-orange-600">Active/Total</p>
              </div>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500" />
                <Label>Filter:</Label>
                <Select
                  value={filter}
                  onValueChange={(value: FilterType) => setFilter(value)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="active">Active Only</SelectItem>
                    <SelectItem value="inactive">Inactive Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="projects" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Projects ({stats.projectStats.active})
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Star className="w-4 h-4" />
            Skills ({stats.skillStats.active})
          </TabsTrigger>
          <TabsTrigger value="experience" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            Experience ({stats.experienceStats.active})
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Testimonials ({stats.testimonialStats.active})
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Projects Management</CardTitle>
                <Button
                  onClick={addProject}
                  className="flex items-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Add Project
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {filterItems(projects).map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 border rounded-lg space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{project.title}</h4>
                        {getStatusBadge(project.is_active)}
                        {project.featured && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={project.is_active || false}
                          onCheckedChange={(checked) =>
                            updateProjectStatus(project.id, checked)
                          }
                        />
                        <span className="text-sm text-gray-500">Active</span>
                        <Button
                          onClick={() => deleteProject(project.id)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {project.description}
                    </p>
                    {project.tech_stack && (
                      <div className="flex flex-wrap gap-1">
                        {project.tech_stack.map((tech, index) => (
                          <Badge
                            key={index}
                            variant="outline"
                            className="text-xs"
                          >
                            {tech}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {filterItems(projects).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No projects found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {filterItems(skills).map((skill) => (
                  <motion.div
                    key={skill.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 border rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{skill.name}</h4>
                        {getStatusBadge(skill.is_active)}
                        <Badge variant="outline">{skill.category}</Badge>
                        {skill.proficiency && (
                          <Badge variant="secondary">
                            {skill.proficiency}%
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={skill.is_active || false}
                          onCheckedChange={(checked) =>
                            updateSkillStatus(skill.id, checked)
                          }
                        />
                        <span className="text-sm text-gray-500">Active</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filterItems(skills).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No skills found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Experience Tab */}
        <TabsContent value="experience" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Experience Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {filterItems(experiences).map((experience) => (
                  <motion.div
                    key={experience.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">
                          {experience.company} - {experience.position}
                        </h4>
                        {getStatusBadge(experience.is_active)}
                        {experience.is_current && (
                          <Badge
                            variant="default"
                            className="bg-blue-100 text-blue-800"
                          >
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={experience.is_active || false}
                          onCheckedChange={(checked) =>
                            updateExperienceStatus(experience.id, checked)
                          }
                        />
                        <span className="text-sm text-gray-500">Active</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      {experience.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>
                        {experience.start_date} -{" "}
                        {experience.end_date || "Present"}
                      </span>
                      {experience.location && (
                        <span>{experience.location}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filterItems(experiences).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No experience entries found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testimonials Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <AnimatePresence>
                {filterItems(testimonials).map((testimonial) => (
                  <motion.div
                    key={testimonial.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="p-4 border rounded-lg space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{testimonial.name}</h4>
                        {getStatusBadge(testimonial.is_active)}
                        {testimonial.featured && (
                          <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                          >
                            <Star className="w-3 h-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {testimonial.rating && (
                          <Badge variant="secondary">
                            {testimonial.rating}/5 ⭐
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={testimonial.is_active || false}
                          onCheckedChange={(checked) =>
                            updateTestimonialStatus(testimonial.id, checked)
                          }
                        />
                        <span className="text-sm text-gray-500">Active</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 italic">
                      "{testimonial.content}"
                    </p>
                    <div className="text-xs text-gray-500">
                      {testimonial.position && testimonial.company && (
                        <span>
                          {testimonial.position} at {testimonial.company}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filterItems(testimonials).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No testimonials found matching your criteria</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
