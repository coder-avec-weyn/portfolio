import jsPDF from "jspdf";
import { supabase } from "../../supabase/supabase";
import {
  queryGemini,
  scrapeLinkedInProfile,
  scrapeGitHubProfile,
  generateEnhancedResumeContent,
} from "./gemini";

// Enhanced resume generation with AI assistance
export async function generateEnhancedResumePDF(includeLinkedIn = false) {
  try {
    console.log("Starting enhanced resume generation...");

    // Fetch latest data from database
    const [profileRes, skillsRes, experiencesRes, projectsRes, resumeRes] =
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
        supabase.from("resume_data").select("*").single(),
      ]);

    const profile = profileRes.data;
    const skills = skillsRes.data || [];
    const experiences = experiencesRes.data || [];
    const projects = projectsRes.data || [];
    const resumeData = resumeRes.data?.content || {
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
    };

    console.log("Resume data loaded:", {
      hasProfile: !!profile,
      skillsCount: skills.length,
      experiencesCount: experiences.length,
      projectsCount: projects.length,
      linkedinUrl: resumeData.personalInfo.linkedin,
      githubUrl: resumeData.personalInfo.github,
    });

    // LinkedIn and GitHub profile enhancement
    let linkedInData = null;
    let githubData = null;

    // Always try to analyze LinkedIn and GitHub if URLs are provided
    if (
      resumeData.personalInfo.linkedin &&
      resumeData.personalInfo.linkedin.trim()
    ) {
      console.log(
        "Analyzing LinkedIn profile:",
        resumeData.personalInfo.linkedin,
      );
      try {
        linkedInData = await scrapeLinkedInProfile(
          resumeData.personalInfo.linkedin,
        );
        console.log("LinkedIn data retrieved successfully:", {
          hasExperience: linkedInData?.experience?.length > 0,
          hasSkills: linkedInData?.keySkills?.length > 0,
          hasSummary: !!linkedInData?.professionalSummary,
        });
      } catch (error) {
        console.error("LinkedIn analysis failed:", error);
      }
    } else {
      console.log("No LinkedIn URL provided, skipping LinkedIn analysis");
    }

    if (
      resumeData.personalInfo.github &&
      resumeData.personalInfo.github.trim()
    ) {
      console.log("Analyzing GitHub profile:", resumeData.personalInfo.github);
      try {
        githubData = await scrapeGitHubProfile(resumeData.personalInfo.github);
        console.log("GitHub data retrieved successfully:", {
          hasRepositories: githubData?.repositories?.length > 0,
          hasLanguages: githubData?.topLanguages?.length > 0,
          hasFrameworks: githubData?.frameworks?.length > 0,
        });
      } catch (error) {
        console.error("GitHub analysis failed:", error);
      }
    } else {
      console.log("No GitHub URL provided, skipping GitHub analysis");
    }

    // Use Gemini AI to enhance resume content
    const portfolioData = {
      full_name:
        resumeData.personalInfo.fullName ||
        profile?.full_name ||
        "Ramya Lakhani",
      bio: resumeData.personalInfo.summary || profile?.bio || "",
      role: profile?.role || "Full-Stack Developer",
      skills: skills.map((s) => s.name),
      projects: projects,
      experience: experiences,
    };

    console.log("Portfolio data prepared:", portfolioData);

    // Generate enhanced resume content using all available data
    let aiEnhancements = null;
    if (linkedInData || githubData) {
      try {
        console.log("Generating enhanced resume content with AI...");
        console.log("Using LinkedIn data:", !!linkedInData);
        console.log("Using GitHub data:", !!githubData);
        aiEnhancements = await generateEnhancedResumeContent(
          resumeData,
          linkedInData,
          githubData,
        );
        console.log("AI enhancements generated successfully:", {
          hasEnhancedSummary: !!aiEnhancements?.enhancedSummary,
          hasSkillCategories: !!aiEnhancements?.skillCategories,
          hasExperienceEnhancements:
            aiEnhancements?.experienceEnhancements?.length > 0,
          hasProjectHighlights: aiEnhancements?.projectHighlights?.length > 0,
        });
      } catch (error) {
        console.log("AI enhancement failed, using original content:", error);
      }
    } else {
      console.log(
        "No LinkedIn or GitHub data available, skipping AI enhancement",
      );
    }

    // Create PDF with enhanced content
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;
    const margin = 20;
    const contentWidth = pageWidth - 2 * margin;

    console.log("Starting PDF generation with dimensions:", {
      pageWidth,
      pageHeight,
      contentWidth,
      margin,
    });

    // Header with enhanced styling
    pdf.setFontSize(28);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(44, 62, 80); // Dark blue-gray
    pdf.text(portfolioData.full_name, pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 12;

    pdf.setFontSize(16);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(52, 152, 219); // Blue
    pdf.text(portfolioData.role, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 18;

    // Contact Information with proper line formatting
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);

    // Create contact info lines with proper spacing
    const contactLines = [];

    // First line: Email and Phone
    const line1 = [];
    if (resumeData.personalInfo.email) {
      line1.push(resumeData.personalInfo.email);
    }
    if (resumeData.personalInfo.phone) {
      line1.push(resumeData.personalInfo.phone);
    }
    if (line1.length > 0) {
      contactLines.push(line1.join(" | "));
    }

    // Second line: Location and Website
    const line2 = [];
    if (resumeData.personalInfo.location) {
      line2.push(resumeData.personalInfo.location);
    }
    if (resumeData.personalInfo.website) {
      line2.push(resumeData.personalInfo.website);
    }
    if (line2.length > 0) {
      contactLines.push(line2.join(" | "));
    }

    // Third line: LinkedIn and GitHub
    const line3 = [];
    if (resumeData.personalInfo.linkedin) {
      line3.push(resumeData.personalInfo.linkedin);
    }
    if (resumeData.personalInfo.github) {
      line3.push(resumeData.personalInfo.github);
    }
    if (line3.length > 0) {
      contactLines.push(line3.join(" | "));
    }

    // Render each contact line with proper spacing
    contactLines.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, yPosition, {
        align: "center",
      });
      yPosition += 5; // 5 units spacing between lines
    });

    yPosition += 15; // Extra spacing after contact section

    // Enhanced Professional Summary
    const summaryText =
      aiEnhancements?.enhancedSummary ||
      resumeData.personalInfo.summary ||
      profile?.bio ||
      "Experienced full-stack developer passionate about creating innovative digital solutions with modern web technologies.";

    if (summaryText) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 62, 80);
      pdf.text("PROFESSIONAL SUMMARY", 20, yPosition);

      // Add underline
      pdf.setLineWidth(0.5);
      pdf.setDrawColor(52, 152, 219);
      pdf.line(20, yPosition + 2, 80, yPosition + 2);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(0, 0, 0);
      const splitSummary = pdf.splitTextToSize(summaryText, pageWidth - 40);
      pdf.text(splitSummary, 20, yPosition);
      yPosition += splitSummary.length * 5 + 15;
    }

    // Enhanced Skills Section - Combine database, LinkedIn, and GitHub data
    let enhancedSkills = [...skills];
    console.log("Starting with database skills:", enhancedSkills.length);

    // Add LinkedIn skills if available
    if (
      linkedInData?.keySkills &&
      Array.isArray(linkedInData.keySkills) &&
      linkedInData.keySkills.length > 0
    ) {
      console.log("Adding LinkedIn skills to resume:", linkedInData.keySkills);
      linkedInData.keySkills.forEach((skill: string) => {
        if (skill && skill.trim()) {
          const existsInDb = enhancedSkills.some(
            (dbSkill) =>
              dbSkill.name?.toLowerCase().includes(skill.toLowerCase()) ||
              skill.toLowerCase().includes(dbSkill.name?.toLowerCase()),
          );
          if (!existsInDb) {
            enhancedSkills.push({
              name: skill.trim(),
              category: "Professional Skills",
              proficiency: 85,
            });
          }
        }
      });
      console.log("After adding LinkedIn skills:", enhancedSkills.length);
    }

    // Add GitHub languages and frameworks if available
    if (
      githubData?.topLanguages &&
      Array.isArray(githubData.topLanguages) &&
      githubData.topLanguages.length > 0
    ) {
      console.log(
        "Adding GitHub languages to resume:",
        githubData.topLanguages,
      );
      githubData.topLanguages.forEach((lang: string) => {
        if (lang && lang.trim()) {
          const existsInDb = enhancedSkills.some(
            (skill) =>
              skill.name?.toLowerCase().includes(lang.toLowerCase()) ||
              lang.toLowerCase().includes(skill.name?.toLowerCase()),
          );
          if (!existsInDb) {
            enhancedSkills.push({
              name: lang.trim(),
              category: "Programming Languages",
              proficiency: 80,
            });
          }
        }
      });
      console.log("After adding GitHub languages:", enhancedSkills.length);
    }

    if (
      githubData?.frameworks &&
      Array.isArray(githubData.frameworks) &&
      githubData.frameworks.length > 0
    ) {
      console.log("Adding GitHub frameworks to resume:", githubData.frameworks);
      githubData.frameworks.forEach((framework: string) => {
        if (framework && framework.trim()) {
          const existsInDb = enhancedSkills.some(
            (skill) =>
              skill.name?.toLowerCase().includes(framework.toLowerCase()) ||
              framework.toLowerCase().includes(skill.name?.toLowerCase()),
          );
          if (!existsInDb) {
            enhancedSkills.push({
              name: framework.trim(),
              category: "Frameworks & Libraries",
              proficiency: 75,
            });
          }
        }
      });
      console.log("After adding GitHub frameworks:", enhancedSkills.length);
    }

    if (enhancedSkills.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 62, 80);
      pdf.text("TECHNICAL SKILLS", 20, yPosition);

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(52, 152, 219);
      pdf.line(20, yPosition + 2, 75, yPosition + 2);
      yPosition += 10;

      // Use AI-enhanced skill categories if available
      let skillsByCategory;
      if (
        aiEnhancements?.skillCategories &&
        Object.keys(aiEnhancements.skillCategories).length > 0
      ) {
        skillsByCategory = aiEnhancements.skillCategories;
        console.log(
          "Using AI-enhanced skill categories:",
          Object.keys(skillsByCategory),
        );
      } else {
        skillsByCategory = enhancedSkills.reduce((acc: any, skill: any) => {
          const category = skill.category || "Technical Skills";
          if (!acc[category]) acc[category] = [];
          const skillName = skill.proficiency
            ? `${skill.name} (${skill.proficiency}%)`
            : skill.name;
          acc[category].push(skillName);
          return acc;
        }, {});
        console.log(
          "Using database skill categories:",
          Object.keys(skillsByCategory),
        );
      }

      pdf.setFontSize(11);
      Object.entries(skillsByCategory).forEach(
        ([category, skillList]: [string, any]) => {
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(52, 152, 219);
          pdf.text(`${category}:`, 20, yPosition);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);

          const skillText = Array.isArray(skillList)
            ? skillList.join(", ")
            : skillList;
          const splitSkillText = pdf.splitTextToSize(skillText, pageWidth - 80);
          pdf.text(splitSkillText, 70, yPosition);
          yPosition += Math.max(6, splitSkillText.length * 5);
        },
      );
      yPosition += 10;
    }

    // Enhanced Experience Section - Combine database and LinkedIn data
    const allExperiences = [...experiences];
    console.log("Starting with database experiences:", allExperiences.length);

    // Add LinkedIn experience data if available
    if (
      linkedInData?.experience &&
      Array.isArray(linkedInData.experience) &&
      linkedInData.experience.length > 0
    ) {
      console.log(
        "Adding LinkedIn experience data to resume:",
        linkedInData.experience.length,
        "experiences",
      );
      linkedInData.experience.forEach((linkedExp: any, index: number) => {
        if (linkedExp && linkedExp.company && linkedExp.position) {
          // Check if this experience already exists in database
          const existsInDb = allExperiences.some(
            (dbExp) =>
              dbExp.company
                ?.toLowerCase()
                .includes(linkedExp.company?.toLowerCase()) ||
              linkedExp.company
                ?.toLowerCase()
                .includes(dbExp.company?.toLowerCase()),
          );

          if (!existsInDb) {
            console.log(
              `Adding LinkedIn experience ${index + 1}:`,
              linkedExp.position,
              "at",
              linkedExp.company,
            );
            allExperiences.push({
              position: linkedExp.position,
              company: linkedExp.company,
              location: linkedExp.location || "Remote",
              start_date: linkedExp.duration?.split(" - ")[0] || "2020",
              end_date: linkedExp.duration?.split(" - ")[1] || "Present",
              is_current: linkedExp.duration?.includes("Present") || false,
              description:
                linkedExp.description ||
                `Professional experience at ${linkedExp.company}`,
              achievements: Array.isArray(linkedExp.achievements)
                ? linkedExp.achievements
                : [],
            });
          } else {
            console.log(
              `Skipping duplicate LinkedIn experience:`,
              linkedExp.company,
            );
          }
        }
      });
      console.log("After adding LinkedIn experiences:", allExperiences.length);
    }

    if (allExperiences.length > 0) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 62, 80);
      pdf.text("PROFESSIONAL EXPERIENCE", 20, yPosition);

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(52, 152, 219);
      pdf.line(20, yPosition + 2, 95, yPosition + 2);
      yPosition += 12;

      allExperiences.forEach((exp: any, index: number) => {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = 20;
        }

        // Position and Company
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.text(exp.position, 20, yPosition);

        // Date range
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 100, 100);
        let dateRange;
        if (exp.start_date && exp.start_date.includes("-")) {
          dateRange = `${new Date(exp.start_date).getFullYear()} - ${exp.is_current ? "Present" : new Date(exp.end_date).getFullYear()}`;
        } else {
          dateRange = `${exp.start_date || "2020"} - ${exp.end_date || "Present"}`;
        }
        pdf.text(dateRange, pageWidth - 20, yPosition, { align: "right" });
        yPosition += 6;

        // Company and location
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(52, 152, 219);
        pdf.text(`${exp.company} | ${exp.location || "Remote"}`, 20, yPosition);
        yPosition += 8;

        // Enhanced description using AI if available
        let description = exp.description;
        if (aiEnhancements?.experienceEnhancements) {
          const enhancement = aiEnhancements.experienceEnhancements.find(
            (enh: any) =>
              enh.company?.toLowerCase().includes(exp.company?.toLowerCase()) ||
              exp.company?.toLowerCase().includes(enh.company?.toLowerCase()),
          );
          if (enhancement?.enhancedDescription) {
            description = enhancement.enhancedDescription;
          }
        }

        if (description) {
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          const descText = pdf.splitTextToSize(description, pageWidth - 40);
          pdf.text(descText, 20, yPosition);
          yPosition += descText.length * 4 + 5;
        }

        // Enhanced achievements
        const achievements = exp.achievements || [];
        if (achievements.length > 0) {
          achievements.forEach((achievement: string) => {
            if (achievement.trim()) {
              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(0, 0, 0);
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

    // Enhanced Projects Section - Combine database and GitHub data
    const allProjects = [...projects];
    console.log("Starting with database projects:", allProjects.length);

    // Add GitHub repository data if available
    if (
      githubData?.repositories &&
      Array.isArray(githubData.repositories) &&
      githubData.repositories.length > 0
    ) {
      console.log(
        "Adding GitHub repository data to resume:",
        githubData.repositories.length,
        "repositories",
      );
      githubData.repositories.forEach((repo: any, index: number) => {
        if (repo && repo.name) {
          // Check if this project already exists in database
          const existsInDb = allProjects.some(
            (dbProj) =>
              dbProj.title?.toLowerCase().includes(repo.name?.toLowerCase()) ||
              repo.name?.toLowerCase().includes(dbProj.title?.toLowerCase()),
          );

          if (!existsInDb) {
            console.log(`Adding GitHub repository ${index + 1}:`, repo.name);
            const githubUsername =
              resumeData.personalInfo.github?.split("/").pop() || "user";
            allProjects.push({
              title: repo.name,
              description:
                repo.description ||
                `GitHub repository showcasing ${Array.isArray(repo.technologies) ? repo.technologies.join(", ") : "various technologies"}`,
              tech_stack: Array.isArray(repo.technologies)
                ? repo.technologies
                : [],
              github_url: `https://github.com/${githubUsername}/${repo.name}`,
              live_url: null,
              highlights: Array.isArray(repo.highlights) ? repo.highlights : [],
            });
          } else {
            console.log(`Skipping duplicate GitHub repository:`, repo.name);
          }
        }
      });
      console.log("After adding GitHub repositories:", allProjects.length);
    }

    if (allProjects.length > 0) {
      if (yPosition > pageHeight - 60) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 62, 80);
      pdf.text("KEY PROJECTS", 20, yPosition);

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(52, 152, 219);
      pdf.line(20, yPosition + 2, 65, yPosition + 2);
      yPosition += 12;

      allProjects.slice(0, 6).forEach((project: any) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.text(project.title, 20, yPosition);
        yPosition += 6;

        // Enhanced description using AI if available
        let description = project.description;
        if (
          aiEnhancements?.projectHighlights &&
          Array.isArray(aiEnhancements.projectHighlights)
        ) {
          const enhancement = aiEnhancements.projectHighlights.find(
            (proj: any) =>
              proj.name?.toLowerCase().includes(project.title?.toLowerCase()) ||
              project.title?.toLowerCase().includes(proj.name?.toLowerCase()),
          );
          if (enhancement?.enhancedDescription) {
            description = enhancement.enhancedDescription;
            console.log(
              `Using AI-enhanced description for project: ${project.title}`,
            );
          }
        }

        if (description) {
          // Check if we need a new page
          if (yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          const projText = pdf.splitTextToSize(description, contentWidth);
          pdf.text(projText, margin, yPosition);
          yPosition += projText.length * 4 + 3;
        }

        // Project highlights from GitHub data
        if (
          project.highlights &&
          Array.isArray(project.highlights) &&
          project.highlights.length > 0
        ) {
          project.highlights.forEach((highlight: string) => {
            if (highlight && highlight.trim()) {
              // Check if we need a new page
              if (yPosition > pageHeight - 30) {
                pdf.addPage();
                yPosition = 20;
              }

              pdf.setFont("helvetica", "normal");
              pdf.setTextColor(0, 0, 0);
              const highlightText = pdf.splitTextToSize(
                `• ${highlight.trim()}`,
                contentWidth - 30,
              );
              pdf.text(highlightText, margin + 10, yPosition);
              yPosition += highlightText.length * 4 + 2;
            }
          });
        }

        if (
          project.tech_stack &&
          Array.isArray(project.tech_stack) &&
          project.tech_stack.length > 0
        ) {
          // Check if we need a new page
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(52, 152, 219);
          const techText = `Technologies: ${project.tech_stack.join(", ")}`;
          const splitTechText = pdf.splitTextToSize(techText, contentWidth);
          pdf.text(splitTechText, margin, yPosition);
          yPosition += splitTechText.length * 4 + 3;
        }

        if (project.live_url || project.github_url) {
          // Check if we need a new page
          if (yPosition > pageHeight - 20) {
            pdf.addPage();
            yPosition = 20;
          }

          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          const urls = [];
          if (project.live_url) urls.push(`Live: ${project.live_url}`);
          if (project.github_url) urls.push(`Code: ${project.github_url}`);
          const urlText = urls.join(" | ");
          const splitUrlText = pdf.splitTextToSize(urlText, contentWidth);
          pdf.text(splitUrlText, margin, yPosition);
          yPosition += splitUrlText.length * 4 + 3;
        }

        yPosition += 8;
      });
    }

    // Education and Certifications
    if (
      resumeData.education.length > 0 ||
      resumeData.certifications.length > 0
    ) {
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }

      if (resumeData.education.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.text("EDUCATION", 20, yPosition);

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(52, 152, 219);
        pdf.line(20, yPosition + 2, 55, yPosition + 2);
        yPosition += 10;

        resumeData.education.forEach((edu: any) => {
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(0, 0, 0);
          pdf.text(edu.degree, 20, yPosition);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          pdf.text(edu.year, pageWidth - 20, yPosition, { align: "right" });
          yPosition += 5;
          pdf.setTextColor(52, 152, 219);
          pdf.text(edu.institution, 20, yPosition);
          yPosition += 10;
        });
      }

      if (resumeData.certifications.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.text("CERTIFICATIONS", 20, yPosition);

        pdf.setLineWidth(0.5);
        pdf.setDrawColor(52, 152, 219);
        pdf.line(20, yPosition + 2, 70, yPosition + 2);
        yPosition += 10;

        resumeData.certifications.forEach((cert: any) => {
          pdf.setFontSize(11);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          pdf.text(
            `• ${cert.name} - ${cert.issuer} (${cert.year})`,
            20,
            yPosition,
          );
          yPosition += 6;
        });
      }
    }

    // Additional sections
    if (resumeData.languages.length > 0 || resumeData.interests) {
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 20;
      }

      if (resumeData.languages.length > 0) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.text("LANGUAGES", 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(resumeData.languages.join(", "), 20, yPosition);
        yPosition += 12;
      }

      if (resumeData.interests) {
        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.text("INTERESTS", 20, yPosition);
        yPosition += 8;

        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        pdf.text(resumeData.interests, 20, yPosition);
      }
    }

    // Add AI Enhancement Summary at the end if available
    if (
      (linkedInData || githubData) &&
      (aiEnhancements || linkedInData || githubData)
    ) {
      // Ensure we have enough space for the enhancement note
      if (yPosition > pageHeight - 50) {
        pdf.addPage();
        yPosition = 20;
      }

      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 62, 80);
      pdf.text("AI-ENHANCED RESUME", margin, yPosition);

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(52, 152, 219);
      pdf.line(margin, yPosition + 2, margin + 80, yPosition + 2);
      yPosition += 12;

      pdf.setFontSize(9);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(100, 100, 100);

      const sources = [];
      if (linkedInData) sources.push("LinkedIn profile analysis");
      if (githubData) sources.push("GitHub repository analysis");
      if (aiEnhancements) sources.push("AI content enhancement");

      const enhancementNote = `This resume was enhanced using ${sources.join(", ")} to provide comprehensive professional insights and up-to-date technical information.`;
      const noteText = pdf.splitTextToSize(enhancementNote, contentWidth);
      pdf.text(noteText, margin, yPosition);
      yPosition += noteText.length * 4 + 5;

      // Add data source summary
      if (linkedInData || githubData) {
        const dataInfo = [];
        if (linkedInData) {
          dataInfo.push(
            `LinkedIn: ${linkedInData.experience?.length || 0} experiences, ${linkedInData.keySkills?.length || 0} skills`,
          );
        }
        if (githubData) {
          dataInfo.push(
            `GitHub: ${githubData.repositories?.length || 0} repositories, ${githubData.topLanguages?.length || 0} languages`,
          );
        }

        pdf.setFontSize(8);
        pdf.setTextColor(120, 120, 120);
        const dataText = pdf.splitTextToSize(
          `Data sources: ${dataInfo.join("; ")}`,
          contentWidth,
        );
        pdf.text(dataText, margin, yPosition);
      }
    }

    // Save PDF with enhanced filename
    const fileName = `${portfolioData.full_name.replace(/\s+/g, "_")}_AI_Enhanced_Resume_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);

    console.log("Enhanced resume PDF generated successfully with:", {
      linkedInDataIncluded: !!linkedInData,
      githubDataIncluded: !!githubData,
      aiEnhancementsApplied: !!aiEnhancements,
      totalSkills: enhancedSkills.length,
      totalExperiences: allExperiences.length,
      totalProjects: allProjects.length,
      fileName,
    });

    return {
      success: true,
      fileName,
      enhanced: true,
      linkedInData,
      githubData,
      aiEnhancements,
    };
  } catch (error) {
    console.error("Error generating enhanced resume PDF:", error);
    throw error;
  }
}

export async function generateResumePDF() {
  try {
    // Fetch latest data from database
    const [profileRes, skillsRes, experiencesRes, projectsRes, resumeRes] =
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
        supabase.from("resume_data").select("*").single(),
      ]);

    const profile = profileRes.data;
    const skills = skillsRes.data || [];
    const experiences = experiencesRes.data || [];
    const projects = projectsRes.data || [];
    const resumeData = resumeRes.data?.content || {
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
    };

    // Create PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header
    pdf.setFontSize(24);
    pdf.setFont("helvetica", "bold");
    pdf.text(
      resumeData.personalInfo.fullName || profile?.full_name || "Ramya Lakhani",
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

    // Contact Information with proper line formatting
    pdf.setFontSize(10);

    // Create contact info lines with proper spacing
    const contactLines = [];

    // First line: Email and Phone
    const line1 = [];
    if (resumeData.personalInfo.email) {
      line1.push(resumeData.personalInfo.email);
    }
    if (resumeData.personalInfo.phone) {
      line1.push(resumeData.personalInfo.phone);
    }
    if (line1.length > 0) {
      contactLines.push(line1.join(" | "));
    }

    // Second line: Location and Website
    const line2 = [];
    if (resumeData.personalInfo.location) {
      line2.push(resumeData.personalInfo.location);
    }
    if (resumeData.personalInfo.website) {
      line2.push(resumeData.personalInfo.website);
    }
    if (line2.length > 0) {
      contactLines.push(line2.join(" | "));
    }

    // Third line: LinkedIn and GitHub
    const line3 = [];
    if (resumeData.personalInfo.linkedin) {
      line3.push(resumeData.personalInfo.linkedin);
    }
    if (resumeData.personalInfo.github) {
      line3.push(resumeData.personalInfo.github);
    }
    if (line3.length > 0) {
      contactLines.push(line3.join(" | "));
    }

    // Render each contact line with proper spacing
    contactLines.forEach((line, index) => {
      pdf.text(line, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 5; // 5 units spacing between lines
    });

    yPosition += 15; // Extra spacing after contact section

    // Professional Summary
    if (resumeData.personalInfo.summary || profile?.bio) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.text("PROFESSIONAL SUMMARY", 20, yPosition);
      yPosition += 8;

      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      const summaryText = resumeData.personalInfo.summary || profile?.bio || "";
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
          const descText = pdf.splitTextToSize(exp.description, pageWidth - 40);
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

    return { success: true, fileName };
  } catch (error) {
    console.error("Error generating resume PDF:", error);
    throw error;
  }
}
