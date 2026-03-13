import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/supabase";
import type { ApiResponse } from "@/lib/types";

const API_SECRET = process.env.API_SECRET || "changeme";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

function authorize(req: NextRequest): boolean {
    const auth = req.headers.get("authorization");
    return auth === `Bearer ${API_SECRET}`;
}

// ─── POST: Translate a Spanish article to English ────────
export async function POST(req: NextRequest) {
    if (!authorize(req)) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    if (!OPENAI_API_KEY) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: "OPENAI_API_KEY not configured" },
            { status: 500 }
        );
    }

    try {
        const { article_id } = await req.json();

        if (!article_id) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "article_id is required" },
                { status: 400 }
            );
        }

        const sb = getServiceClient();

        // Fetch the Spanish article
        const { data: article, error: fetchError } = await sb
            .from("articles")
            .select("*")
            .eq("id", article_id)
            .single();

        if (fetchError || !article) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: `Article not found: ${fetchError?.message || "no data"}` },
                { status: 404 }
            );
        }

        if (article.lang !== "es") {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "Only Spanish articles can be translated" },
                { status: 400 }
            );
        }

        // Check if English translation already exists
        const { data: existing } = await sb
            .from("articles")
            .select("id")
            .eq("translation_of", article_id)
            .eq("lang", "en")
            .single();

        if (existing) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: "English translation already exists" },
                { status: 409 }
            );
        }

        // ─── Call OpenAI GPT-4o for translation ──────────
        const systemPrompt = `You are a professional translator for the tech blog "El Pantano" by Yacaré Studio. Translate this Spanish article into natural, engaging English. Maintain the same HTML structure and tone.

RULES:
- Translate ALL text content (headings, paragraphs, lists)
- Keep HTML tags and structure intact
- Generate SEO-optimized English slug (lowercase, hyphens, no accents)
- Title: max 60 chars, SEO-friendly in English
- Excerpt: 120-155 chars, compelling meta description
- Translate keywords to English equivalents
- Translate FAQ questions and answers to English
- Do NOT translate: Yacaré, El Pantano, brand names, code snippets, URLs

RESPOND WITH VALID JSON ONLY:
{
  "title": "English SEO title",
  "slug": "english-seo-slug",
  "excerpt": "English meta description 120-155 chars",
  "content": "<p>Translated HTML content...</p>",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "faq": [{"question": "English question?", "answer": "English answer."}]
}`;

        const userPrompt = `Translate this Spanish tech article to English:

TITLE: ${article.title}
EXCERPT: ${article.excerpt}
KEYWORDS: ${JSON.stringify(article.keywords || [])}
FAQ: ${JSON.stringify(article.faq || [])}

CONTENT:
${article.content}`;

        const openaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${OPENAI_API_KEY}`,
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt },
                ],
                temperature: 0.3,
                max_tokens: 6000,
                response_format: { type: "json_object" },
            }),
        });

        if (!openaiResp.ok) {
            const errText = await openaiResp.text();
            return NextResponse.json<ApiResponse>(
                { success: false, error: `OpenAI error: ${errText}` },
                { status: 502 }
            );
        }

        const openaiData = await openaiResp.json();
        const translationText = openaiData.choices[0].message.content;
        const translation = JSON.parse(translationText);

        // ─── Insert translated article ───────────────────
        const { data: enArticle, error: insertError } = await sb
            .from("articles")
            .insert({
                title: translation.title,
                slug: translation.slug,
                excerpt: translation.excerpt,
                content: translation.content,
                featured_image: article.featured_image || "",
                image_alt: translation.title,
                category_id: article.category_id,
                author_id: article.author_id,
                reading_time: article.reading_time,
                keywords: translation.keywords || [],
                faq: translation.faq || [],
                lang: "en",
                translation_of: article.id,
                is_featured: false,
                is_hero: false,
                status: "published",
                published_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: insertError.message },
                { status: 500 }
            );
        }

        // ─── Revalidate ISR pages ────────────────────────
        revalidatePath("/en");
        revalidatePath(`/en/${translation.slug}`);
        revalidatePath(`/es/${article.slug}`); // hreflang update

        return NextResponse.json<ApiResponse>(
            { success: true, data: enArticle },
            { status: 201 }
        );
    } catch (err) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: (err as Error).message },
            { status: 500 }
        );
    }
}
