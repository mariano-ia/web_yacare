// Script to update article images in Supabase
// Run with: node scripts/update-images.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ajqjicwuqbxpgkrrnryn.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqcWppY3d1cWJ4cGdrcnJucnluIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjY2MDk0MywiZXhwIjoyMDg4MjM2OTQzfQ.tNnp611ATeatCgpnfL2NUu-g4cgbALK0kkVob8kqpvE';

const supabase = createClient(supabaseUrl, serviceKey);
const siteUrl = 'https://elpantano-app.vercel.app';

const updates = [
    {
        slug: 'figma-ai-actions-diseno-producto-2026',
        featured_image: `${siteUrl}/images/articles/figma-ai-actions.png`,
    },
    {
        slug: 'n8n-gpt4o-automatizacion-contenido-2026',
        featured_image: `${siteUrl}/images/articles/n8n-gpt4o-automation.png`,
    },
    {
        slug: 'frontend-invisible-server-components-2026',
        featured_image: `${siteUrl}/images/articles/server-components.png`,
    },
    {
        slug: 'producto-menos-features-menos-friccion-2026',
        featured_image: `${siteUrl}/images/articles/product-strategy.png`,
    },
    {
        slug: 'interfaces-voz-matar-boton-futuro-2026',
        featured_image: `${siteUrl}/images/articles/voice-interfaces.png`,
    },
];

for (const { slug, featured_image } of updates) {
    const { error } = await supabase
        .from('articles')
        .update({ featured_image })
        .eq('slug', slug);

    if (error) {
        console.error(`❌ ${slug}:`, error.message);
    } else {
        console.log(`✅ ${slug}`);
    }
}

console.log('\nDone! Revalidating cache...');

// Revalidate the homepage
await fetch(`${siteUrl}/api/revalidate?path=/&secret=ep_n8n_secret_2026_xK9mP4`);
console.log('✅ Cache revalidated');
