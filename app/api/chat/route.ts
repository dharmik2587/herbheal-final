import { NextResponse } from 'next/server';
import { generateGeminiInsight } from '@/lib/external-services';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt = typeof body?.prompt === 'string' ? body.prompt : '';
    const context = typeof body?.context === 'string' ? body.context : '';

    if (!prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Build a context-aware prompt if additional context is provided
    const fullPrompt = context
      ? `Context: ${context}\n\nUser question: ${prompt}`
      : prompt;

    const insight = await generateGeminiInsight(fullPrompt);

    const fallbackText = `I'm your HerbHeal Compass AI assistant. I can help with:
• 🌿 Herb identification and properties
• 💊 Drug interaction safety checks
• 🧭 Ayurvedic remedy recommendations
• 📊 Market price insights

For "${prompt.slice(0, 60)}...", please provide more context about the herb or health topic you'd like to explore, and I'll give you a detailed, grounded answer.`;

    return NextResponse.json({
      ok: true,
      data: insight || {
        text: fallbackText,
        provider: 'fallback' as const,
      },
    });
  } catch (error: any) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    );
  }
}
