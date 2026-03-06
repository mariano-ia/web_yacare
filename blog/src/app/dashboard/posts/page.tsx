import Link from "next/link";
import { getServiceClient } from "@/lib/supabase";
import { PostsClient } from "./PostsClient";

export const dynamic = "force-dynamic";

async function getPosts() {
    const sb = getServiceClient();
    const { data, error } = await sb
        .from("articles")
        .select("id, title, slug, status, published_at, is_hero, is_featured, view_count, category:categories(name,slug,color), author:authors(name)")
        .order("published_at", { ascending: false })
        .limit(200);

    if (error) throw error;
    return data ?? [];
}

export default async function PostsPage() {
    const posts = await getPosts();

    return (
        <>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Posts</h1>
                    <p className="dash-page-subtitle">{posts.length} artículos en total</p>
                </div>
                <Link href="/dashboard/posts/new" className="dash-btn dash-btn--primary">
                    + Crear post
                </Link>
            </div>

            <div className="dash-section">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <PostsClient initialPosts={posts as any} />
            </div>
        </>
    );
}
