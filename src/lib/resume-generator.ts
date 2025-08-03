import jsPDF from "jspdf";
import { supabase } from "../../supabase/supabase";
import { queryGemini } from "./gemini";

// LinkedIn profile scraping function
async function scrapeLinkedInProfile(linkedinUrl: string) {
  try {
    // Since we can't directly scrape LinkedIn due to CORS and anti-scraping measures,
    // we'll use Gemini AI to help structure the resume based on the LinkedIn URL
    const prompt = `
      Based on the LinkedIn profile URL: ${linkedinUrl}
      
      Please provide suggestions for a professional resume structure that would typically be found on a LinkedIn profile.
      Include sections like:
      - Professional Summary
      - Key Skills
      - Work Experience format
      - Education
      - Certifications
      - Projects
      
      Format your response as a JSON structure with these sections and sample professional content that would be appropriate for a full-stack developer.
    `;

    const portfolioData = {
      full_name: "Professional",
      bio: "Full-stack developer",
      role: "Full-Stack Developer",
    };

    const aiResponse = await queryGemini(prompt, portfolioData);

    // Parse AI response to extract structured data
    try {
      const structuredData = JSON.parse(aiResponse);
      return structuredData;
    } catch {
      // If JSON parsing fails, return a default structure
      return {
        summary:
          "Experienced full-stack developer with expertise in modern web technologies",
        skills: ["React", "TypeScript", "Node.js", "Python", "AWS"],
        experience: [],
        education: [],
        certifications: [],
      };
    }
  } catch (error) {
    console.error("Error processing LinkedIn profile:", error);
    return null;
  }
}

// Enhanced resume generation with AI assistance
export async function generateEnhancedResumePDF(includeLinkedIn = false) {
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

    // LinkedIn profile enhancement
    let linkedInData = null;
    if (includeLinkedIn && resumeData.personalInfo.linkedin) {
      linkedInData = await scrapeLinkedInProfile(
        resumeData.personalInfo.linkedin,
      );
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

    const enhancementPrompt = `
      Create an enhanced professional summary and improve the content for a resume based on this data:
      
      Name: ${portfolioData.full_name}
      Role: ${portfolioData.role}
      Current Bio: ${portfolioData.bio}
      Skills: ${portfolioData.skills.join(", ")}
      
      ${linkedInData ? `LinkedIn Data: ${JSON.stringify(linkedInData)}` : ""}
      
      Please provide:
      1. An enhanced professional summary (2-3 sentences)
      2. Improved skill categorization
      3. Better achievement descriptions for experience
      
      Format as JSON with keys: enhancedSummary, skillCategories, achievementSuggestions
    `;

    let aiEnhancements = null;
    try {
      const aiResponse = await queryGemini(enhancementPrompt, portfolioData);
      aiEnhancements = JSON.parse(aiResponse);
    } catch (error) {
      console.log("AI enhancement failed, using original content");
    }

    // Create PDF with enhanced content
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 20;

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

    // Contact Information with better formatting
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    const contactInfo = [
      resumeData.personalInfo.email || "lakhani.ramya.u@gmail.co",
      resumeData.personalInfo.phone || "+91 7202800803",
      resumeData.personalInfo.location || "India",
    ];

    if (resumeData.personalInfo.linkedin) {
      contactInfo.push(resumeData.personalInfo.linkedin);
    }
    if (resumeData.personalInfo.github) {
      contactInfo.push(resumeData.personalInfo.github);
    }

    pdf.text(contactInfo.join(" | "), pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 25;

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

    // Enhanced Skills Section
    if (skills.length > 0) {
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(44, 62, 80);
      pdf.text("TECHNICAL SKILLS", 20, yPosition);

      pdf.setLineWidth(0.5);
      pdf.setDrawColor(52, 152, 219);
      pdf.line(20, yPosition + 2, 75, yPosition + 2);
      yPosition += 10;

      const skillsByCategory = skills.reduce((acc: any, skill: any) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(`${skill.name} (${skill.proficiency}%)`);
        return acc;
      }, {});

      pdf.setFontSize(11);
      Object.entries(skillsByCategory).forEach(
        ([category, skillList]: [string, any]) => {
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(52, 152, 219);
          pdf.text(`${category}:`, 20, yPosition);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          const skillText = pdf.splitTextToSize(
            skillList.join(", "),
            pageWidth - 80,
          );
          pdf.text(skillText, 70, yPosition);
          yPosition += Math.max(6, skillText.length * 5);
        },
      );
      yPosition += 10;
    }

    // Enhanced Experience Section
    if (experiences.length > 0) {
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

      experiences.forEach((exp: any, index: number) => {
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
        const dateRange = `${new Date(exp.start_date).getFullYear()} - ${exp.is_current ? "Present" : new Date(exp.end_date).getFullYear()}`;
        pdf.text(dateRange, pageWidth - 20, yPosition, { align: "right" });
        yPosition += 6;

        // Company and location
        pdf.setFontSize(11);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(52, 152, 219);
        pdf.text(`${exp.company} | ${exp.location}`, 20, yPosition);
        yPosition += 8;

        // Description
        if (exp.description) {
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          const descText = pdf.splitTextToSize(exp.description, pageWidth - 40);
          pdf.text(descText, 20, yPosition);
          yPosition += descText.length * 4 + 5;
        }

        // Enhanced achievements
        if (exp.achievements && exp.achievements.length > 0) {
          exp.achievements.forEach((achievement: string) => {
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

    // Enhanced Projects Section
    if (projects.length > 0) {
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

      projects.slice(0, 4).forEach((project: any) => {
        if (yPosition > pageHeight - 40) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(12);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(44, 62, 80);
        pdf.text(project.title, 20, yPosition);
        yPosition += 6;

        if (project.description) {
          pdf.setFontSize(10);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(0, 0, 0);
          const projText = pdf.splitTextToSize(
            project.description,
            pageWidth - 40,
          );
          pdf.text(projText, 20, yPosition);
          yPosition += projText.length * 4 + 3;
        }

        if (project.tech_stack && project.tech_stack.length > 0) {
          pdf.setFont("helvetica", "italic");
          pdf.setTextColor(52, 152, 219);
          pdf.text(
            `Technologies: ${project.tech_stack.join(", ")}`,
            20,
            yPosition,
          );
          yPosition += 6;
        }

        if (project.live_url || project.github_url) {
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 100, 100);
          const urls = [];
          if (project.live_url) urls.push(`Live: ${project.live_url}`);
          if (project.github_url) urls.push(`Code: ${project.github_url}`);
          pdf.text(urls.join(" | "), 20, yPosition);
          yPosition += 6;
        }

        yPosition += 6;
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

    // Save PDF with enhanced filename
    const fileName = `${portfolioData.full_name.replace(/\s+/g, "_")}_Enhanced_Resume_${new Date().toISOString().split("T")[0]}.pdf`;
    pdf.save(fileName);

    return { success: true, fileName, enhanced: true };
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
