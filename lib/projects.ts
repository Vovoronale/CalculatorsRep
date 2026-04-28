import contentData from "@/data/content.json";

export type AuthorProject = {
  slug: string;
  title: string;
  description: string;
  href: string;
};

export type ProjectCategorySlug =
  | "engineering-calculations"
  | "design-and-norms"
  | "bim-tools"
  | "ai-products";

export type ProjectCategory = {
  slug: ProjectCategorySlug;
  title: string;
  description: string;
  projects: AuthorProject[];
};

export type AiAssistant = {
  slug: string;
  title: string;
  description: string;
  href: string;
};

export const projectCategories: ProjectCategory[] = contentData.projectCategories as ProjectCategory[];

export const aiAssistants: AiAssistant[] = contentData.aiAssistants as AiAssistant[];
