import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/supabase";
import { EditPostClient } from "./EditPostClient";

export const dynamic = "force-dynamic";

async function getPost(id: string) {
    const sb = getServiceClient();
    const { data } = await sb
        .from("articles")
        .select("*, category:categories(id,name,slug), author:authors(id,name,slug)")
        .eq("id", id)
        .single();
    return data;
}

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await getPost(id);
    if (!post) notFound();

    return (
        <>
            <div className="dash-page-header">
                <div>
                    <h1 className="dash-page-title">Editar post</h1>
                    <p className="dash-page-subtitle">{post.title}</p>
                </div>
                <Link href="/dashboard/posts" className="dash-btn">← Volver</Link>
            </div>

            <div className="dash-section">
                <div style={{ padding: "24px" }}>
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <EditPostClient post={post as any} />
                </div>
            </div>
        </>
    );
}
