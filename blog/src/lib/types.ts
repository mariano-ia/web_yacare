// ─── Database types for El Pantano ───

export interface Author {
    id: string;
    name: string;
    slug: string;
    role: string;
    bio: string;
    avatar_initial: string;
    created_at: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    color: string; // CSS class suffix: "tecnologia", "ia", "opinion", etc.
}

export interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string; // HTML
    featured_image: string;
    image_alt: string;
    category_id: string;
    author_id: string;
    published_at: string;
    reading_time: number;
    keywords: string[];
    is_featured: boolean;
    is_hero: boolean;
    status: "draft" | "published";
    created_at: string;
    updated_at: string;
}

// ─── Joined types for rendering ───

export interface ArticleWithRelations extends Article {
    category: Category;
    author: Author;
}

// ─── API types ───

export interface CreateArticlePayload {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featured_image: string;
    image_alt?: string;
    category: string; // category slug
    author: string; // author slug
    reading_time?: number;
    keywords?: string[];
    is_featured?: boolean;
    is_hero?: boolean;
    status?: "draft" | "published";
}

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
}
