import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
}

interface Experience {
  id: string;
  company: string;
  position: string;
  description: string;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  location: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  tech_stack: string[];
  github_url: string;
  live_url: string;
  featured: boolean;
}

interface EmployerResumeProps {
  onBackToLanding?: () => void;
}

export default function EmployerResume({
  onBackToLanding,
}: EmployerResumeProps = {}) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [skillsRes, experiencesRes, projectsRes] = await Promise.all([
        supabase
          .from("skills")
          .select("*")
          .order("proficiency", { ascending: false }),
        supabase
          .from("experiences")
          .select("*")
          .order("order_index", { ascending: true }),
        supabase
          .from("projects")
          .select("*")
          .eq("featured", true)
          .order("order_index", { ascending: true }),
      ]);

      if (skillsRes.data) setSkills(skillsRes.data);
      if (experiencesRes.data) setExperiences(experiencesRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("contact_submissions").insert({
        name: contactForm.name,
        email: contactForm.email,
        subject: contactForm.subject,
        message: contactForm.message,
        user_flow: "employer",
      });

      if (error) throw error;

      setIsSubmitted(true);
      setContactForm({ name: "", email: "", subject: "", message: "" });
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
    // This would integrate with html2pdf.js or similar
    toast({
      title: "PDF Generation",
      description: "PDF download feature coming soon!",
    });
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
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Landing</span>
          </button>
          <Button
            onClick={generatePDF}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </Button>
        </div>
      </header>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-6 py-8 space-y-8"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
            JD
          </div>
          <h1 className="text-4xl font-bold text-gray-900">John Developer</h1>
          <p className="text-xl text-blue-600 font-medium">
            Full-Stack Developer
          </p>
          <p className="text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Passionate full-stack developer with 1+ years of professional
            experience building scalable web applications. Specialized in React,
            Node.js, and modern web technologies.
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

        {/* Skills Matrix */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-blue-100">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <Star className="w-6 h-6 text-blue-600" />
                Technical Skills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {["Frontend", "Backend", "Database", "Tools"].map(
                  (category) => {
                    const categorySkills = skills.filter(
                      (skill) => skill.category === category,
                    );
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
                              <span className="text-gray-700">
                                {skill.name}
                              </span>
                              <div className="flex items-center gap-2">
                                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
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
                  },
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Experience Timeline */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-blue-100">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                Professional Experience
              </CardTitle>
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
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Featured Projects */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-blue-100">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <ExternalLink className="w-6 h-6 text-blue-600" />
                Featured Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="p-6 border border-blue-100 rounded-lg hover:shadow-md transition-shadow"
                  >
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">
                      {project.title}
                    </h4>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      {project.description}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {project.tech_stack.map((tech) => (
                        <Badge key={tech} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-3">
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Code
                      </a>
                      <a
                        href={project.live_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Live Demo
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Contact Form */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-blue-100">
            <CardHeader>
              <CardTitle className="text-2xl text-gray-900 flex items-center gap-2">
                <Mail className="w-6 h-6 text-blue-600" />
                Let's Connect
              </CardTitle>
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
                    Thank you for reaching out. I'll get back to you within 24
                    hours.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Name *
                      </label>
                      <Input
                        required
                        value={contactForm.name}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            name: e.target.value,
                          })
                        }
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Email *
                      </label>
                      <Input
                        type="email"
                        required
                        value={contactForm.email}
                        onChange={(e) =>
                          setContactForm({
                            ...contactForm,
                            email: e.target.value,
                          })
                        }
                        className="border-blue-200 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Subject *
                    </label>
                    <Input
                      required
                      value={contactForm.subject}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          subject: e.target.value,
                        })
                      }
                      className="border-blue-200 focus:border-blue-500"
                      placeholder="e.g., Job Opportunity, Project Collaboration"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Message *
                    </label>
                    <Textarea
                      required
                      rows={4}
                      value={contactForm.message}
                      onChange={(e) =>
                        setContactForm({
                          ...contactForm,
                          message: e.target.value,
                        })
                      }
                      className="border-blue-200 focus:border-blue-500"
                      placeholder="Tell me about the opportunity or project..."
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <Separator className="my-8" />

        {/* Footer */}
        <motion.div
          variants={itemVariants}
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
  );
}
