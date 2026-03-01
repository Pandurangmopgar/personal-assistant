// Proactive Memory Recall System
// Intelligently surfaces relevant memories using semantic search

import { memory } from './memory';

export interface RecallTrigger {
  type: 'semantic' | 'explicit' | 'contextual';
  value: string;
  confidence: number;
}

export interface ProactiveMemory {
  content: string;
  recallReason: string;
  confidence: number;
  memoryType: string;
  metadata?: any;
  timestamp?: string;
  timeContext?: string; // Human-readable time context like "3 days ago", "last Monday"
}

// ============================================================================
// WHEN TO RECALL: Determine if proactive recall should be triggered
// ============================================================================

export function shouldTriggerProactiveRecall(
  message: string,
  conversationLength: number
): boolean {
  const lowerMessage = message.toLowerCase();
  
  // 1. Always recall for first 3 messages (establish context)
  if (conversationLength < 3) {
    return true;
  }
  
  // 2. Explicit memory requests (user asking to remember)
  const explicitMemoryKeywords = [
    'remember', 'yaad', 'recall', 'batao', 'bola tha',
    'last time', 'pehle', 'before', 'earlier', 'previous',
    'told you', 'mentioned', 'kaha tha', 'baat ki thi'
  ];
  
  if (explicitMemoryKeywords.some(keyword => lowerMessage.includes(keyword))) {
    return true;
  }
  
  // 3. Questions (likely need context from past)
  if (message.includes('?') || lowerMessage.includes('kya') || lowerMessage.includes('kaise') || lowerMessage.includes('kaun')) {
    return true;
  }
  
  // 4. User mentions topics that likely have stored memories
  // Keep this minimal - just check if message has substance
  if (message.trim().split(' ').length >= 3) {
    return true;
  }
  
  // 5. Periodic recall (every 5 messages to maintain context)
  if (conversationLength % 5 === 0) {
    return true;
  }
  
  return false;
}

// ============================================================================
// WHAT TO RECALL: Use semantic search to find relevant memories
// ============================================================================

export async function proactiveRecall(
  userId: string,
  message: string,
  conversationHistory: any[]
): Promise<ProactiveMemory[]> {
  if (!memory) return [];
  
  const lowerMessage = message.toLowerCase();
  
  try {
    // STRATEGY 1: Direct semantic search with user's message
    // This is the primary strategy - let MemoryStack's semantic search do the work
    const semanticResults = await memory.searchMemories({
      query: message, // Use the actual user message for semantic matching
      user_id: userId,
      limit: 5,
      mode: 'hybrid', // Hybrid combines semantic + keyword matching
    });
    
    const memories: ProactiveMemory[] = (semanticResults.results || []).map((mem: any) => 
      enrichMemoryWithTimeContext({
        content: mem.content,
        recallReason: 'semantic_match',
        confidence: mem.score || 0.75,
        memoryType: mem.metadata?.memory_type || 'unknown',
        metadata: mem.metadata,
      })
    );
    
    // STRATEGY 2: If explicit memory request, boost high-significance memories
    if (lowerMessage.includes('remember') || lowerMessage.includes('yaad') || 
        lowerMessage.includes('batao') || lowerMessage.includes('bola tha')) {
      
      const explicitResults = await memory.searchMemories({
        query: message,
        user_id: userId,
        limit: 3,
        mode: 'hybrid',
        filters: {
          significance: ['high', 'critical'],
        },
      });
      
      const explicitMemories = (explicitResults.results || []).map((mem: any) => 
        enrichMemoryWithTimeContext({
          content: mem.content,
          recallReason: 'explicit_request',
          confidence: 0.95,
          memoryType: mem.metadata?.memory_type || 'unknown',
          metadata: mem.metadata,
        })
      );
      
      memories.push(...explicitMemories);
    }
    
    // STRATEGY 3: Add recent conversation context (last 3 messages)
    // This helps maintain conversation flow
    if (conversationHistory.length >= 3) {
      const recentContext = conversationHistory
        .slice(-3)
        .map(msg => msg.text)
        .join(' ');
      
      const contextResults = await memory.searchMemories({
        query: recentContext,
        user_id: userId,
        limit: 2,
        mode: 'hybrid',
      });
      
      const contextMemories = (contextResults.results || []).map((mem: any) => 
        enrichMemoryWithTimeContext({
          content: mem.content,
          recallReason: 'conversation_context',
          confidence: 0.70,
          memoryType: mem.metadata?.memory_type || 'unknown',
          metadata: mem.metadata,
        })
      );
      
      memories.push(...contextMemories);
    }
    
    // Rank and deduplicate
    return rankAndFilterMemories(memories);
    
  } catch (error) {
    console.error('Proactive recall error:', error);
    return [];
  }
}

// ============================================================================
// RANKING & FILTERING
// ============================================================================

function rankAndFilterMemories(memories: ProactiveMemory[]): ProactiveMemory[] {
  // Remove duplicates
  const seen = new Set<string>();
  const unique = memories.filter(mem => {
    if (seen.has(mem.content)) return false;
    seen.add(mem.content);
    return true;
  });
  
  // Sort by confidence
  unique.sort((a, b) => b.confidence - a.confidence);
  
  // Return top 3
  return unique.slice(0, 3);
}

// ============================================================================
// TIME CONTEXT FORMATTING
// ============================================================================

function formatTimeContext(timestamp: string): string {
  try {
    const memoryDate = new Date(timestamp);
    const now = new Date();
    
    // Calculate difference in milliseconds
    const diffMs = now.getTime() - memoryDate.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Format time of day
    const hours = memoryDate.getHours();
    const minutes = memoryDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    const timeOfDay = `${displayHours}:${displayMinutes} ${ampm}`;
    
    // Format based on recency
    if (diffMins < 60) {
      return `${diffMins} min ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago at ${timeOfDay}`;
    } else if (diffDays === 0) {
      return `today at ${timeOfDay}`;
    } else if (diffDays === 1) {
      return `yesterday at ${timeOfDay}`;
    } else if (diffDays === 2) {
      return `2 days ago at ${timeOfDay}`;
    } else if (diffDays === 3) {
      return `3 days ago at ${timeOfDay}`;
    } else if (diffDays < 7) {
      // Show day of week for recent days
      const dayName = memoryDate.toLocaleDateString('en-US', { weekday: 'long' });
      return `last ${dayName} at ${timeOfDay}`;
    } else if (diffDays < 14) {
      return `last week at ${timeOfDay}`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} weeks ago at ${timeOfDay}`;
    } else if (diffDays < 60) {
      return `last month at ${timeOfDay}`;
    } else {
      const monthName = memoryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${monthName} at ${timeOfDay}`;
    }
  } catch (error) {
    return '';
  }
}

function enrichMemoryWithTimeContext(memory: ProactiveMemory): ProactiveMemory {
  // Extract timestamp from metadata
  const timestamp = memory.metadata?.timestamp || memory.metadata?.date;
  
  if (timestamp) {
    const timeContext = formatTimeContext(timestamp);
    return {
      ...memory,
      timestamp,
      timeContext,
    };
  }
  
  return memory;
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  shouldTriggerProactiveRecall,
  proactiveRecall,
};
