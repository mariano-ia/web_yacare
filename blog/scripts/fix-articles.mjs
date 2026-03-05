import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Config
const SUPABASE_URL = 'https://ajqjicwuqbxpgkrrnryn.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcWppY3d1cWJ4cGdrcnJucnluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY2MDk0MywiZXhwIjoyMDg4MjM2OTQzfQ.tNnp611ATeatCgpnfL2NUu-g4cgbALK0kkVob8kqpvE';
const OPENAI_KEY = process.env.OPENAI_API_KEY;

const sb = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI({ apiKey: OPENAI_KEY });

async function expandArticle(title, currentContent) {
    const prompt = `Eres un redactor experto en diseño de producto, UX, y tecnología, escribiendo para el blog "El Pantano" de la agencia Yacaré.
El siguiente artículo quedó truncado o demasiado corto (solo tiene esto: "${currentContent}").
Basado en el título "${title}", escribe un artículo completo, estilizado en formato HTML utilizando etiquetas como <h2>, <p>, <blockquote>, <ul> y <strong>. 
El tono debe ser directo, provocador, analítico e inteligente (evita ser condescendiente o genérico). 
La longitud ideal es de aproximadamente 500-700 palabras (unos 4-5 párrafos, subtítulos, quizás una lista).
Solo devuelve el código HTML, no incluyas el Markdown \`\`\`html.`;

    const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
    });

    let html = res.choices[0].message.content.trim();
    if (html.startsWith('```html')) html = html.substring(7);
    if (html.endsWith('```')) html = html.slice(0, -3);

    return html.trim();
}

async function run() {
    console.log("🐊 Iniciando revisión del blog: Fechas y Contenido...");

    // 1. Fetch all articles ordered by created_at (most recent first)
    const { data: articles, error } = await sb
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error obteniendo artículos:", error.message);
        return;
    }

    console.log(`Encontrados ${articles.length} artículos en total.`);

    // 2. Fix dates
    // Queremos que el artículo más nuevo (índice 0) sea de hoy a las 10:00 AM, 
    // y para atrás le restamos ~6 horas o 1 día a cada uno para espaciarlos de forma realista.
    console.log("\n🔄 1. Corrigiendo y estandarizando fechas...");
    let baseDate = new Date();
    baseDate.setHours(10, 0, 0, 0);

    for (let i = 0; i < articles.length; i++) {
        const art = articles[i];

        // Espaciar artículos (cada uno ~8 horas más antiguo que el anterior, con una ligera randomización)
        const hoursToSubtract = 8 + Math.floor(Math.random() * 4);
        baseDate.setHours(baseDate.getHours() - hoursToSubtract);

        const newDateStr = baseDate.toISOString();

        const { error: updateError } = await sb
            .from('articles')
            .update({
                published_at: newDateStr,
                updated_at: newDateStr
            })
            .eq('id', art.id);

        if (updateError) {
            console.log(`❌ Error al actualizar fecha de ${art.title}`);
        }
    }
    console.log("✅ Fechas corregidas y escalonadas cronológicamente.");

    // 3. Fix short content
    console.log("\n✍️  2. Revisando contenido demasiado corto...");
    let fixedCount = 0;

    for (let i = 0; i < articles.length; i++) {
        const art = articles[i];
        let content = art.content || "";

        // Strip basic HTML to count actual text length
        const rawText = content.replace(/<[^>]*>?/gm, '');

        // Si el artículo tiene menos de 250 caracteres de texto real
        if (rawText.length < 250) {
            console.log(`\n- Expandiendo artículo enano: "${art.title}" (Largo actual: ${rawText.length} caracteres)`);
            try {
                const newContent = await expandArticle(art.title, content);

                // Estimate reading time: 200 words / minute
                const wordCount = newContent.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
                const readingTime = Math.max(1, Math.ceil(wordCount / 200));

                const { error: updErr } = await sb
                    .from('articles')
                    .update({
                        content: newContent,
                        reading_time: readingTime
                    })
                    .eq('id', art.id);

                if (updErr) throw updErr;
                console.log(`  ✅ Expandido con éxito. Nuevo largo: ${newContent.length} chars, Tiempo lectura: ${readingTime}m`);
                fixedCount++;
            } catch (err) {
                console.error(`  ❌ Falló al expandir: ${err.message}`);
            }
        }
    }
    console.log(`\n🎉 Revisión completa. Se expandieron ${fixedCount} artículos.`);

    // 4. Force Next.js Cache Revalidation
    console.log("\n🌐 3. Forzando revalidación de la caché en producción...");
    try {
        const revRes = await fetch("https://elpantano-app.vercel.app/api/revalidate?secret=ep_n8n_secret_2026_xK9mP4", {
            method: "POST"
        });
        const revData = await revRes.json();
        console.log("  Revalidación API status:", revRes.status);
        console.log("  Revalidación respuesta:", revData);
    } catch (err) {
        console.error("  ❌ Error llamando a revalidate:", err.message);
    }

    console.log("\n🐊 ¡Todo listo! Revisá el sitio en producción.");
}

run();
