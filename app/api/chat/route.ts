import { streamText } from 'ai';
import { createAzure } from '@ai-sdk/azure';
import { getExecutiveSummary } from '@/lib/ai/tools';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// Extract resource name from endpoint URL if not provided separately
function getResourceName(): string | undefined {
  const resourceName = process.env.AZURE_OPENAI_RESOURCE_NAME;
  if (resourceName) return resourceName;
  
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  if (endpoint) {
    // Extract resource name from URL like: https://your-resource-name.openai.azure.com
    const match = endpoint.match(/https:\/\/([^.]+)\.openai\.azure\.com/);
    return match ? match[1] : undefined;
  }
  
  return undefined;
}

// Configure Azure OpenAI with proper error handling
const azure = createAzure({
  resourceName: getResourceName(),
  apiKey: process.env.AZURE_OPENAI_API_KEY || undefined,
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log('Chat API: Processing request with', messages.length, 'messages');

    // Validate required environment variables
    if (!process.env.AZURE_OPENAI_DEPLOYMENT_MODEL) {
      throw new Error('AZURE_OPENAI_DEPLOYMENT_MODEL environment variable is required');
    }

    if (!process.env.AZURE_OPENAI_API_KEY) {
      throw new Error('AZURE_OPENAI_API_KEY environment variable is required');
    }

    if (!getResourceName()) {
      throw new Error('Either AZURE_OPENAI_RESOURCE_NAME or AZURE_OPENAI_ENDPOINT must be provided');
    }

    console.log('Azure configuration:', {
      resourceName: getResourceName(),
      deploymentModel: process.env.AZURE_OPENAI_DEPLOYMENT_MODEL,
      apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-02-01',
    });

    const result = streamText({
      model: azure(process.env.AZURE_OPENAI_DEPLOYMENT_MODEL),
      system: `You are a budget analysis assistant at Solitwork that helps users analyze budget performance data. **Always respond in well-formatted Markdown format.**

You can provide reports of budget performance including:

- **Executive Summary**
- **Team-level performance analysis**

When users ask about budget summaries, executive summary, overall performance, or how teams are doing, use the getExecutiveSummary tool. This tool accepts:
- **period**: Monthly Time period for analysis (e.g., "May 2025", "June 2025")
- **team**: Optional team filter (if not specified, analyzes all teams)

Provide a written report that integrates 1-3 key metrics in natural language. Do not list the metrics.
[Report]

Based on the report, provide 1 recommendation. 
- Do not recommend performance reviews.
- Do not create lists in the response.
[Recommendations]

<Guidelines>
- Format all responses in professional, well-structured Markdown.
- Use percentages instead of whole numbers when analyzing variances.
</Guidelines>

<Solitwork>
- CST3 and CST4 belong to Solitwork Denmark.
- CST5 belong to Solitwork Deutschland.
</Solitwork>

<limitations>
Do not create individual employee performance analysis.
Do not include any Employee names or initials in the response.
Do not create any tables in the response.
Do not recommend performance reviews.
Do not create lists in the response.
</limitations>
`,
      messages,
      tools: {
        getExecutiveSummary,
      },
      maxTokens: 4000,
      temperature: 0.1, // Keep responses consistent and focused for business analysis
      onChunk({ chunk }) {
        // Log tool calls for debugging
        if (chunk.type === 'tool-call') {
          console.log(`AI Decision: Calling tool '${chunk.toolName}' with args:`, chunk.args);
        } else if (chunk.type === 'tool-result') {
          console.log(`Tool Result: ${chunk.toolName} completed successfully`);
        }
      },
      onError({ error }) {
        console.error('Streaming error:', error);
      },
      maxSteps: 10,
    });

    // Return the response with proper headers for markdown content
    return result.toDataStreamResponse({
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Content-Format': 'markdown',
        'Transfer-Encoding': 'chunked',
        'Connection': 'keep-alive'
      }
    });
  } catch (error: unknown) {
    console.error('Chat API Error:', error);
    
    if (error instanceof Error) {
      return new Response(`Error: ${error.message}`, { status: 500 });
    }
    
    return new Response('Internal server error', { status: 500 });
  }
} 