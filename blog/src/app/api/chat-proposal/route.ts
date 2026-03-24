import { NextRequest, NextResponse } from "next/server";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const SYSTEM_PROMPT = `Sos un asistente de Yacaré Studio que responde preguntas sobre una propuesta de trabajo específica. Tu único objetivo es ayudar al lector a entender mejor lo que se le está proponiendo.

REGLAS ESTRICTAS:

1. SOLO respondés con información que esté en el documento de la propuesta que se te proporciona como contexto. Nada más.

2. Si la pregunta no puede responderse con el contenido de la propuesta, decí exactamente: "Esa información no está incluida en esta propuesta. Te recomiendo consultarlo directamente con el equipo de Yacaré en hola@yacare.io."

3. Nunca inventés datos, precios, plazos, entregables o detalles que no estén explícitamente en el documento.

4. Nunca especulés sobre lo que "probablemente" incluye o "podría" incluir. Si no está escrito, no está.

5. Citá las secciones relevantes cuando respondas (por ejemplo: "Según la sección de entregables...").

6. Respondé en español, de forma clara y concisa. Sin formalidad excesiva.

7. Nunca uses guiones (—, –, -) como separador en tus respuestas. Usá comas, puntos, dos puntos o paréntesis.

8. Si te preguntan algo fuera del ámbito de la propuesta (clima, deportes, código, etc.), respondé: "Solo puedo responder preguntas relacionadas con esta propuesta de trabajo."

9. Sé honesto. Si algo es ambiguo en la propuesta, decilo: "La propuesta menciona X, pero no detalla Y. Te sugiero consultarlo con el equipo."

El documento de la propuesta es el siguiente:
`;

interface ChatMessage {
    role: "user" | "assistant";
    content: string;
}

export async function POST(req: NextRequest) {
    if (!OPENAI_API_KEY) {
        return NextResponse.json(
            { error: "Chat not configured" },
            { status: 500 }
        );
    }

    try {
        const { message, context, history } = (await req.json()) as {
            message: string;
            context: string;
            history?: ChatMessage[];
        };

        if (!message || !context) {
            return NextResponse.json(
                { error: "message and context are required" },
                { status: 400 }
            );
        }

        // Build messages array
        const messages: { role: string; content: string }[] = [
            {
                role: "system",
                content: SYSTEM_PROMPT + context,
            },
        ];

        // Include conversation history (limited to last 10 exchanges)
        if (history && Array.isArray(history)) {
            const recent = history.slice(-10);
            for (const msg of recent) {
                messages.push({
                    role: msg.role,
                    content: msg.content,
                });
            }
        }

        // Add current user message
        messages.push({ role: "user", content: message });

        const openaiResp = await fetch(
            "https://api.openai.com/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages,
                    temperature: 0,
                    max_tokens: 800,
                }),
            }
        );

        if (!openaiResp.ok) {
            const errText = await openaiResp.text();
            return NextResponse.json(
                { error: `AI service error: ${errText}` },
                { status: 502 }
            );
        }

        const data = await openaiResp.json();
        const reply = data.choices[0].message.content;

        return NextResponse.json({ reply });
    } catch (err) {
        return NextResponse.json(
            { error: (err as Error).message },
            { status: 500 }
        );
    }
}
