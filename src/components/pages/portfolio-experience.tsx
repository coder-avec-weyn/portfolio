import { useEffect, useState, useRef } from "react";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Moon,
  Sun,
  Github,
  ExternalLink,
  Mail,
  Send,
  Star,
  Code,
  Palette,
  Rocket,
  Heart,
  Coffee,
  Zap,
  Target,
  CheckCircle,
} from "lucide-react";
import { supabase } from "../../../supabase/supabase";
import { useToast } from "@/components/ui/use-toast";
import ChatWidget from "@/components/ui/chat-widget";

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number;
  icon_url: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  long_description: string;
  tech_stack: string[];
  github_url: string;
  live_url: string;
  image_url: string;
  video_url: string;
  featured: boolean;
}

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  published_at: string;
  tags: string[];
  featured_image: string;
}

interface PortfolioExperienceProps {
  onBackToLanding?: () => void;
}

export default function PortfolioExperience({
  onBackToLanding,
}: PortfolioExperienceProps = {}) {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("portfolioTheme");
    return saved === "dark";
  });
  const [skills, setSkills] = useState<Skill[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [blogPosts] = useState<BlogPost[]>([
    {
      id: "1",
      title: "Building Scalable React Applications",
      excerpt:
        "Best practices and patterns for creating maintainable React apps that scale with your team.",
      content: "",
      published_at: "2024-01-15",
      tags: ["React", "Architecture", "Best Practices"],
      featured_image:
        "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80",
    },
    {
      id: "2",
      title: "The Future of Web Development",
      excerpt:
        "Exploring emerging technologies and trends that will shape the next decade of web development.",
      content: "",
      published_at: "2024-01-10",
      tags: ["Web Development", "Future Tech", "Trends"],
      featured_image:
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80",
    },
    {
      id: "3",
      title: "Mastering CSS Grid and Flexbox",
      excerpt:
        "A comprehensive guide to modern CSS layout techniques with practical examples.",
      content: "",
      published_at: "2024-01-05",
      tags: ["CSS", "Layout", "Tutorial"],
      featured_image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&q=80",
    },
  ]);
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const [profile, setProfile] = useState<any>(null);
  const { toast } = useToast();

  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"]);

  useEffect(() => {
    fetchData();
    fetchProfileData();
    localStorage.setItem("portfolioTheme", isDarkMode ? "dark" : "light");
    document.documentElement.classList.toggle("dark", isDarkMode);
  }, [isDarkMode]);

  const fetchProfileData = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .single();

      if (data && !error) {
        setProfile(data);
      } else {
        // Fallback data
        setProfile({
          full_name: "Ramya Lakhani",
          bio: "Full-stack developer passionate about creating amazing digital experiences",
          role: "Full-Stack Developer",
          avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=ramya",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      // Use fallback data
      setProfile({
        full_name: "Ramya Lakhani",
        bio: "Full-stack developer passionate about creating amazing digital experiences",
        role: "Full-Stack Developer",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=ramya",
      });
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "hero",
        "about",
        "skills",
        "projects",
        "blog",
        "contact",
      ];
      const scrollPosition = window.scrollY + 100;

      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchData = async () => {
    try {
      const [skillsRes, projectsRes] = await Promise.all([
        supabase
          .from("skills")
          .select("*")
          .order("proficiency", { ascending: false }),
        supabase
          .from("projects")
          .select("*")
          .order("order_index", { ascending: true }),
      ]);

      if (skillsRes.data) setSkills(skillsRes.data);
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
        user_flow: "viewer",
      });

      if (error) throw error;

      setIsSubmitted(true);
      setContactForm({ name: "", email: "", subject: "", message: "" });
      toast({
        title: "Message sent successfully!",
        description: "Thanks for reaching out! I'll get back to you soon.",
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

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
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
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const skillCategories = {
    Frontend: { icon: Code, color: "from-blue-500 to-cyan-500" },
    Backend: { icon: Zap, color: "from-green-500 to-emerald-500" },
    Database: { icon: Target, color: "from-purple-500 to-violet-500" },
    Tools: { icon: Palette, color: "from-orange-500 to-red-500" },
  };

  return (
    <div
      ref={containerRef}
      className={`min-h-screen transition-colors duration-500 ${
        isDarkMode
          ? "bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white"
          : "bg-gradient-to-br from-white via-blue-50 to-purple-50 text-gray-900"
      }`}
    >
      {/* Fixed Navigation */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-xl transition-colors duration-500 ${
          isDarkMode
            ? "bg-gray-900/80 border-gray-700/50"
            : "bg-white/80 border-gray-200/50"
        } border-b`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBackToLanding}
            className={`flex items-center gap-2 transition-colors ${
              isDarkMode
                ? "text-purple-400 hover:text-purple-300"
                : "text-purple-600 hover:text-purple-700"
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Back to Landing</span>
          </button>

          {/* Navigation Menu */}
          <div className="hidden md:flex items-center gap-6">
            {["About", "Skills", "Projects", "Blog", "Contact"].map((item) => (
              <button
                key={item}
                onClick={() => scrollToSection(item.toLowerCase())}
                className={`text-sm font-medium transition-colors ${
                  activeSection === item.toLowerCase()
                    ? isDarkMode
                      ? "text-purple-400"
                      : "text-purple-600"
                    : isDarkMode
                      ? "text-gray-300 hover:text-white"
                      : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Theme Toggle */}
          <div className="flex items-center gap-3">
            <Sun
              className={`w-4 h-4 transition-colors ${
                isDarkMode ? "text-gray-400" : "text-yellow-500"
              }`}
            />
            <Switch
              checked={isDarkMode}
              onCheckedChange={setIsDarkMode}
              className="data-[state=checked]:bg-purple-600"
            />
            <Moon
              className={`w-4 h-4 transition-colors ${
                isDarkMode ? "text-purple-400" : "text-gray-400"
              }`}
            />
          </div>
        </div>
      </nav>

      {/* Hero Section with 3D Effect */}
      <section
        id="hero"
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
      >
        <motion.div style={{ y: backgroundY }} className="absolute inset-0 z-0">
          <div
            className={`absolute inset-0 opacity-20 ${
              isDarkMode
                ? "bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600"
                : "bg-gradient-to-br from-purple-400 via-blue-400 to-cyan-400"
            }`}
          ></div>
        </motion.div>

        <motion.div
          style={{ y: textY }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="relative z-10 text-center max-w-4xl mx-auto px-6"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <div
              className={`w-40 h-40 mx-auto rounded-full mb-8 shadow-2xl bg-gradient-to-br overflow-hidden ${
                isDarkMode
                  ? "from-purple-500 to-cyan-500"
                  : "from-purple-600 to-blue-600"
              } flex items-center justify-center text-white text-6xl font-bold`}
            >
              {profile?.avatar_url ? (
                <img
                  src={(() => {
                    // Check if it's a storage path or full URL
                    if (profile.avatar_url.startsWith("http")) {
                      return profile.avatar_url;
                    } else {
                      // Generate public URL from storage path
                      const { data } = supabase.storage
                        .from("public-profile-images")
                        .getPublicUrl(profile.avatar_url);
                      return `${data.publicUrl}?v=${Date.now()}`;
                    }
                  })()}
                  alt={profile?.full_name || "Profile"}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src =
                      "https://api.dicebear.com/7.x/avataaars/svg?seed=developer&accessories=sunglasses&accessoriesChance=100&clothingGraphic=skull&top=shortHair&topChance=100&facialHair=goatee&facialHairChance=100";
                  }}
                />
              ) : (
                profile?.full_name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("") || "RL"
              )}
            </div>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
          >
            Creative
            <motion.span
              className={`block bg-gradient-to-r bg-clip-text text-transparent ${
                isDarkMode
                  ? "from-purple-400 via-cyan-400 to-pink-400"
                  : "from-purple-600 via-blue-600 to-cyan-600"
              }`}
              animate={{
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              Developer
            </motion.span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className={`text-xl md:text-2xl mb-12 leading-relaxed ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Crafting digital experiences that blend
            <br className="hidden md:block" />
            <span
              className={isDarkMode ? "text-purple-400" : "text-purple-600"}
            >
              innovation
            </span>{" "}
            with{" "}
            <span className={isDarkMode ? "text-cyan-400" : "text-cyan-600"}>
              functionality
            </span>
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              onClick={() => scrollToSection("projects")}
              size="lg"
              className={`bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-all duration-300 ${
                isDarkMode
                  ? "from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
                  : "from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              }`}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Explore My Work
            </Button>
            <Button
              onClick={() => scrollToSection("contact")}
              variant="outline"
              size="lg"
              className={`border-2 transition-all duration-300 ${
                isDarkMode
                  ? "border-purple-400 text-purple-400 hover:bg-purple-400 hover:text-gray-900"
                  : "border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
              }`}
            >
              <Heart className="w-5 h-5 mr-2" />
              Let's Connect
            </Button>
          </motion.div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-4 h-4 bg-purple-400 rounded-full animate-pulse opacity-60"></div>
        <div className="absolute top-40 right-20 w-2 h-2 bg-cyan-400 rounded-full animate-pulse opacity-40 delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-6 h-6 bg-pink-400 rounded-full animate-pulse opacity-50 delay-2000"></div>
        <div className="absolute bottom-40 right-10 w-3 h-3 bg-blue-400 rounded-full animate-pulse opacity-30 delay-3000"></div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              About Me
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className={`text-xl leading-relaxed max-w-3xl mx-auto ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              I'm a passionate full-stack developer who loves creating digital
              experiences that make a difference. With a keen eye for design and
              a deep understanding of modern web technologies, I bridge the gap
              between beautiful interfaces and robust functionality.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Code,
                title: "Clean Code",
                desc: "Writing maintainable, scalable code that stands the test of time.",
              },
              {
                icon: Palette,
                title: "Design Focus",
                desc: "Creating beautiful, intuitive interfaces that users love to interact with.",
              },
              {
                icon: Coffee,
                title: "Problem Solver",
                desc: "Turning complex challenges into elegant, simple solutions.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`p-8 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                    : "bg-white/50 border-gray-200 hover:bg-white/70"
                } shadow-lg hover:shadow-xl`}
              >
                <item.icon
                  className={`w-12 h-12 mb-4 ${
                    isDarkMode ? "text-purple-400" : "text-purple-600"
                  }`}
                />
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Skills Galaxy */}
      <section id="skills" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Skills Galaxy
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className={`text-xl ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Technologies I work with to bring ideas to life
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(skillCategories).map(
              ([category, config], categoryIndex) => {
                const categorySkills = skills.filter(
                  (skill) => skill.category === category,
                );
                return (
                  <motion.div
                    key={category}
                    variants={itemVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    transition={{ delay: categoryIndex * 0.1 }}
                    className={`p-6 rounded-2xl backdrop-blur-sm border transition-all duration-300 hover:scale-105 ${
                      isDarkMode
                        ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                        : "bg-white/50 border-gray-200 hover:bg-white/70"
                    } shadow-lg hover:shadow-xl`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-r ${config.color} flex items-center justify-center mb-4`}
                    >
                      <config.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold mb-4">{category}</h3>
                    <div className="space-y-3">
                      {categorySkills.map((skill) => (
                        <div key={skill.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {skill.name}
                            </span>
                            <span
                              className={`text-xs ${
                                isDarkMode ? "text-gray-400" : "text-gray-500"
                              }`}
                            >
                              {skill.proficiency}%
                            </span>
                          </div>
                          <div
                            className={`w-full h-2 rounded-full overflow-hidden ${
                              isDarkMode ? "bg-gray-700" : "bg-gray-200"
                            }`}
                          >
                            <motion.div
                              className={`h-full bg-gradient-to-r ${config.color} rounded-full`}
                              initial={{ width: 0 }}
                              whileInView={{ width: `${skill.proficiency}%` }}
                              viewport={{ once: true }}
                              transition={{ duration: 1, delay: 0.5 }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              },
            )}
          </div>
        </div>
      </section>

      {/* Projects Showcase */}
      <section id="projects" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Featured Projects
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className={`text-xl ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              A showcase of my recent work and creative solutions
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className={`group rounded-2xl overflow-hidden backdrop-blur-sm border transition-all duration-500 hover:scale-[1.02] ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                    : "bg-white/50 border-gray-200 hover:bg-white/70"
                } shadow-lg hover:shadow-2xl`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={project.image_url}
                    alt={project.title}
                    className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold mb-3">{project.title}</h3>
                  <p
                    className={`mb-6 leading-relaxed ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {project.long_description || project.description}
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech_stack.map((tech) => (
                      <Badge
                        key={tech}
                        variant="secondary"
                        className={`text-xs ${
                          isDarkMode
                            ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-4">
                    <a
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 font-medium transition-colors ${
                        isDarkMode
                          ? "text-purple-400 hover:text-purple-300"
                          : "text-purple-600 hover:text-purple-700"
                      }`}
                    >
                      <Github className="w-4 h-4" />
                      Code
                    </a>
                    <a
                      href={project.live_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-2 font-medium transition-colors ${
                        isDarkMode
                          ? "text-cyan-400 hover:text-cyan-300"
                          : "text-cyan-600 hover:text-cyan-700"
                      }`}
                    >
                      <ExternalLink className="w-4 h-4" />
                      Live Demo
                    </a>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section id="blog" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Latest Insights
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className={`text-xl ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Thoughts on development, design, and the future of web
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <motion.article
                key={post.id}
                variants={itemVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group rounded-2xl overflow-hidden backdrop-blur-sm border transition-all duration-300 hover:scale-105 cursor-pointer ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700 hover:bg-gray-800/70"
                    : "bg-white/50 border-gray-200 hover:bg-white/70"
                } shadow-lg hover:shadow-xl`}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={post.featured_image}
                    alt={post.title}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="outline"
                        className={`text-xs ${
                          isDarkMode
                            ? "border-gray-600 text-gray-400"
                            : "border-gray-300 text-gray-600"
                        }`}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-purple-500 transition-colors">
                    {post.title}
                  </h3>
                  <p
                    className={`text-sm leading-relaxed mb-4 ${
                      isDarkMode ? "text-gray-300" : "text-gray-600"
                    }`}
                  >
                    {post.excerpt}
                  </p>
                  <div
                    className={`text-xs ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {new Date(post.published_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2
              variants={itemVariants}
              className="text-4xl md:text-5xl font-bold mb-6"
            >
              Let's Create Together
            </motion.h2>
            <motion.p
              variants={itemVariants}
              className={`text-xl ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Have a project in mind? Let's discuss how we can bring your vision
              to life.
            </motion.p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className={`p-8 rounded-2xl backdrop-blur-sm border ${
              isDarkMode
                ? "bg-gray-800/50 border-gray-700"
                : "bg-white/50 border-gray-200"
            } shadow-xl`}
          >
            {isSubmitted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-4"
              >
                <CheckCircle
                  className={`w-20 h-20 mx-auto ${
                    isDarkMode ? "text-green-400" : "text-green-500"
                  }`}
                />
                <h3 className="text-2xl font-semibold">Message Sent!</h3>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                  Thanks for reaching out! I'll get back to you soon with some
                  creative ideas.
                </p>
              </motion.div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
                      Name *
                    </label>
                    <Input
                      required
                      value={contactForm.name}
                      onChange={(e) =>
                        setContactForm({ ...contactForm, name: e.target.value })
                      }
                      className={`transition-colors ${
                        isDarkMode
                          ? "bg-gray-700/50 border-gray-600 focus:border-purple-400 text-white"
                          : "bg-white/50 border-gray-300 focus:border-purple-500"
                      }`}
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      className={`text-sm font-medium ${
                        isDarkMode ? "text-gray-300" : "text-gray-700"
                      }`}
                    >
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
                      className={`transition-colors ${
                        isDarkMode
                          ? "bg-gray-700/50 border-gray-600 focus:border-purple-400 text-white"
                          : "bg-white/50 border-gray-300 focus:border-purple-500"
                      }`}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
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
                    className={`transition-colors ${
                      isDarkMode
                        ? "bg-gray-700/50 border-gray-600 focus:border-purple-400 text-white"
                        : "bg-white/50 border-gray-300 focus:border-purple-500"
                    }`}
                    placeholder="e.g., Project Collaboration, Freelance Opportunity"
                  />
                </div>
                <div className="space-y-2">
                  <label
                    className={`text-sm font-medium ${
                      isDarkMode ? "text-gray-300" : "text-gray-700"
                    }`}
                  >
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
                    className={`transition-colors ${
                      isDarkMode
                        ? "bg-gray-700/50 border-gray-600 focus:border-purple-400 text-white"
                        : "bg-white/50 border-gray-300 focus:border-purple-500"
                    }`}
                    placeholder="Tell me about your project or idea..."
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full text-white flex items-center justify-center gap-2 bg-gradient-to-r ${
                    isDarkMode
                      ? "from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500"
                      : "from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  } shadow-lg hover:shadow-xl transition-all duration-300`}
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
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className={`py-12 px-6 border-t ${
          isDarkMode ? "border-gray-700" : "border-gray-200"
        }`}
      >
        <div className="max-w-6xl mx-auto text-center">
          <p
            className={`text-sm ${
              isDarkMode ? "text-gray-400" : "text-gray-600"
            }`}
          >
            © 2024 John Developer. Crafted with{" "}
            <Heart className="w-4 h-4 inline text-red-500" /> and lots of{" "}
            <Coffee className="w-4 h-4 inline text-amber-600" />
          </p>
          <p
            className={`mt-2 text-xs ${
              isDarkMode ? "text-gray-500" : "text-gray-500"
            }`}
          >
            <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Available for exciting new projects and collaborations
          </p>
        </div>
      </footer>

      {/* Enhanced Gemini AI Chatbot - Available on Portfolio Experience */}
      {profile && <ChatWidget profile={profile} />}
    </div>
  );
}
