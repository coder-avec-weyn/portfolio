import jsPDF from "jspdf";
import { supabase } from "../../supabase/supabase";

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
