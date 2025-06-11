import { streamText } from 'ai';
import { azure } from '@ai-sdk/azure';
import { getExecutiveSummary, getTeamPerformance } from '@/lib/ai/tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const result = streamText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_MODEL!),
      system: 'You are a budget analysis assistant. Help users analyze budget performance and provide insights through natural language conversation. Use the available tools to fetch data when users ask about budget summaries or team performance.',
      messages,
      tools: {
        getExecutiveSummary,
        getTeamPerformance,
      },
      maxTokens: 4000,
      temperature: 0.1, // Keep responses consistent and focused for business analysis
    });

    return result.toDataStreamResponse();
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    
    if (error instanceof Error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
    
    return new Response('Internal server error', { status: 500 });
  }
} 