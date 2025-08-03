import { z } from "zod";

// Section validation schemas
export const HeroContentSchema = z.object({
  headline: z.string().min(1, "Headline is required"),
  tagline: z.string().min(1, "Tagline is required"),
  cta_text: z.string().optional(),
  background_image: z.string().url().optional().or(z.literal("")),
  show_avatar: z.boolean().optional().default(true),
});

export const SkillsContentSchema = z.object({
  description: z.string().optional(),
  show_proficiency: z.boolean().optional().default(true),
  layout: z.enum(["grid", "list"]).optional().default("grid"),
});

export const ExperienceContentSchema = z.object({
  description: z.string().optional(),
  show_timeline: z.boolean().optional().default(true),
  show_achievements: z.boolean().optional().default(true),
});

export const ContactContentSchema = z.object({
  description: z.string().optional(),
  submit_text: z.string().optional().default("Send Message"),
  success_message: z.string().optional(),
});

export const ResumeContentSchema = z.object({
  button_text: z.string().optional().default("Download PDF Resume"),
  file_url: z.string().url().optional().or(z.literal("")),
  version: z.string().optional(),
  last_updated: z.string().optional(),
});

// Main section schema
export const HireSectionSchema = z.object({
  id: z.string().uuid().optional(),
  section_type: z.enum(["hero", "skills", "experience", "contact", "resume"]),
  title: z.string().optional(),
  content: z.union([
    HeroContentSchema,
    SkillsContentSchema,
    ExperienceContentSchema,
    ContactContentSchema,
    ResumeContentSchema,
    z.record(z.any()), // Fallback for unknown content
  ]),
  order_index: z.number().int().min(0),
  is_active: z.boolean().default(true),
});

// Skill schema
export const HireSkillSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Skill name is required"),
  category: z.string().min(1, "Category is required"),
  proficiency: z.number().int().min(0).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format"),
  order_index: z.number().int().min(0),
  is_active: z.boolean().default(true),
});

// Experience schema
export const HireExperienceSchema = z.object({
  id: z.string().uuid().optional(),
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  description: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  end_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional()
    .nullable(),
  is_current: z.boolean().default(false),
  location: z.string().optional(),
  achievements: z.array(z.string()).optional().default([]),
  order_index: z.number().int().min(0),
  is_active: z.boolean().default(true),
});

// Contact field schema
export const HireContactFieldSchema = z.object({
  id: z.string().uuid().optional(),
  field_type: z.enum(["text", "email", "textarea", "select", "checkbox"]),
  label: z.string().min(1, "Label is required"),
  placeholder: z.string().optional(),
  is_required: z.boolean().default(false),
  options: z.array(z.string()).optional().default([]),
  order_index: z.number().int().min(0),
  is_active: z.boolean().default(true),
});

// Validation functions
export function validateSectionData(data: any) {
  try {
    return HireSectionSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

export function validateSkillData(data: any) {
  try {
    return HireSkillSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

export function validateExperienceData(data: any) {
  try {
    return HireExperienceSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

export function validateContactFieldData(data: any) {
  try {
    return HireContactFieldSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join(".")}: ${err.message}`)
        .join(", ");
      throw new Error(`Validation failed: ${errorMessages}`);
    }
    throw error;
  }
}

// Content validation by section type
export function validateSectionContent(sectionType: string, content: any) {
  switch (sectionType) {
    case "hero":
      return HeroContentSchema.parse(content);
    case "skills":
      return SkillsContentSchema.parse(content);
    case "experience":
      return ExperienceContentSchema.parse(content);
    case "contact":
      return ContactContentSchema.parse(content);
    case "resume":
      return ResumeContentSchema.parse(content);
    default:
      throw new Error(`Unknown section type: ${sectionType}`);
  }
}
