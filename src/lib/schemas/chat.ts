import { z } from 'zod';

// Message validation schema
export const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().min(1, 'Message content cannot be empty'),
  name: z.string().optional(),
  tool_call_id: z.string().optional(),
});

export const messagesArraySchema = z.array(messageSchema);

// Tool parameter schemas
export const executiveSummaryParamsSchema = z.object({
  period: z.string().describe('Time period for analysis (e.g., "Q1 2024", "last month")'),
  team: z.string().optional().describe('Team name to filter by'),
});

export const teamPerformanceParamsSchema = z.object({
  teamName: z.string().describe('Name of the team to analyze'),
  period: z.string().describe('Time period for analysis (e.g., "Q1 2024", "last month")'),
  includeIndividuals: z.boolean().default(true).describe('Whether to include individual performance breakdown'),
});

// Type exports
export type Message = z.infer<typeof messageSchema>;
export type MessagesArray = z.infer<typeof messagesArraySchema>;
export type ExecutiveSummaryParams = z.infer<typeof executiveSummaryParamsSchema>;
export type TeamPerformanceParams = z.infer<typeof teamPerformanceParamsSchema>; 