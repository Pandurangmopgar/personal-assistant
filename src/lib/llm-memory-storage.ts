// LLM Function Calling for Memory Storage & Retrieval
// LLM calls MemoryStack directly via function/tool calling

import { memory } from './memory';

/**
 * Define the store_memory function for LLM to call
 */
export const storeMemoryFunction = {
  name: 'store_memory',
  description: 'Store important information about the user for future conversations. Only call this when the user shares meaningful information like personal facts, preferences, goals, habits, or experiences. Do NOT call for filler words, greetings, or casual acknowledgments.',
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'What to remember about the user (e.g., "User\'s name is Pandurang", "User likes bhindi sabji")',
      },
      memory_type: {
        type: 'string',
        enum: [
          'personal_fact',
          'personal_preference',
          'personal_dislike',
          'personal_goal',
          'personal_habit',
          'personal_skill',
          'emotional_moment',
          'relationship',
          'shared_experience',
          'important_date',
        ],
        description: 'Type of memory being stored',
      },
      significance: {
        type: 'string',
        enum: ['critical', 'high', 'medium', 'low'],
        description: 'How important this information is (critical: name/birthday, high: preferences/goals, medium: habits, low: casual facts)',
      },
      source_type: {
        type: 'string',
        enum: ['text', 'image', 'audio', 'video'],
        description: 'Where this information came from (text: typed message, image: photo shared, audio: voice message, video: video shared)',
      },
    },
    required: ['content', 'memory_type', 'significance', 'source_type'],
  },
};

/**
 * Define the recall_memories function for LLM to call
 */
export const recallMemoriesFunction = {
  name: 'recall_memories',
  description: 'Search for specific memories about the user. Use this to recall past conversations, preferences, or experiences. Great for temporal queries like "last weekend", "last month", or contextual queries like "food preferences", "weekend activities". Can also filter by source (text, image, audio). Call this proactively to make conversations more personal and engaging.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What to search for. Can be temporal ("last weekend", "last Monday", "last month"), contextual ("food preferences", "weekend activities", "movies watched"), or specific ("chess rating", "favorite food")',
      },
      time_filter: {
        type: 'string',
        enum: ['last_week', 'last_month', 'last_3_months', 'any_time'],
        description: 'Optional time filter to narrow search',
      },
      source_filter: {
        type: 'string',
        enum: ['text', 'image', 'audio', 'video', 'any'],
        description: 'Optional filter by source type (e.g., "image" to recall only photo-based memories)',
      },
      limit: {
        type: 'number',
        description: 'Number of memories to retrieve (default: 3, max: 5)',
      },
    },
    required: ['query'],
  },
};

/**
 * Handle LLM function call to store memory
 */
export async function handleStoreMemoryCall(
  functionArgs: {
    content: string;
    memory_type: string;
    significance: string;
    source_type?: string;
  },
  userId: string,
  enhancedMetadata?: any
): Promise<{ success: boolean; message: string }> {
  if (!memory) {
    return { success: false, message: 'Memory system not available' };
  }

  try {
    const metadata = {
      memory_type: functionArgs.memory_type,
      significance: functionArgs.significance,
      source_type: functionArgs.source_type || 'text', // Default to text if not specified
      timestamp: new Date().toISOString(),
      llm_decided: true,
      ...enhancedMetadata,
    };

    await memory.createMemory({
      messages: [{ role: 'assistant', content: functionArgs.content }],
      user_id: userId,
      metadata,
    });

    console.log('✅ LLM stored memory:', {
      type: functionArgs.memory_type,
      significance: functionArgs.significance,
      source: functionArgs.source_type || 'text',
      content: functionArgs.content.substring(0, 50) + '...',
    });

    return {
      success: true,
      message: 'Memory stored successfully',
    };
  } catch (error) {
    console.error('❌ Failed to store memory:', error);
    return {
      success: false,
      message: 'Failed to store memory',
    };
  }
}

/**
 * Handle LLM function call to recall memories
 */
export async function handleRecallMemoriesCall(
  functionArgs: {
    query: string;
    time_filter?: string;
    source_filter?: string;
    limit?: number;
  },
  userId: string
): Promise<{ success: boolean; memories: string[]; message: string }> {
  if (!memory) {
    return { 
      success: false, 
      memories: [], 
      message: 'Memory system not available' 
    };
  }

  try {
    const limit = Math.min(functionArgs.limit || 3, 5); // Max 5
    
    // Build time-based filter if specified
    let timeFilter: any = {};
    if (functionArgs.time_filter) {
      const now = new Date();
      let startDate: Date;
      
      switch (functionArgs.time_filter) {
        case 'last_week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'last_month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'last_3_months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(0); // Any time
      }
      
      timeFilter.startDate = startDate;
    }

    // Search memories
    const results = await memory.searchMemories({
      query: functionArgs.query,
      user_id: userId,
      limit: limit * 2, // Get more to filter by time/source
      mode: 'hybrid',
    });

    let memories = results.results || [];
    
    // Filter by time if specified
    if (timeFilter.startDate) {
      memories = memories.filter((mem: any) => {
        const memDate = new Date(mem.metadata?.timestamp || 0);
        return memDate >= timeFilter.startDate;
      });
    }
    
    // Filter by source if specified
    if (functionArgs.source_filter && functionArgs.source_filter !== 'any') {
      memories = memories.filter((mem: any) => {
        return mem.metadata?.source_type === functionArgs.source_filter;
      });
    }
    
    // Limit results
    memories = memories.slice(0, limit);
    
    // Format memories with time context and source
    const formattedMemories = memories.map((mem: any) => {
      const timestamp = mem.metadata?.timestamp;
      const sourceType = mem.metadata?.source_type || 'text';
      let timeContext = '';
      let sourceIcon = '';
      
      // Add source icon
      switch (sourceType) {
        case 'image': sourceIcon = '📷 '; break;
        case 'audio': sourceIcon = '🎤 '; break;
        case 'video': sourceIcon = '🎥 '; break;
        default: sourceIcon = '💬 '; break;
      }
      
      if (timestamp) {
        const memDate = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - memDate.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        // Format time of day
        const hours = memDate.getHours();
        const minutes = memDate.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        const timeOfDay = `${displayHours}:${displayMinutes} ${ampm}`;
        
        // Build context based on recency
        if (diffMins < 60) {
          timeContext = ` (${diffMins} min ago)`;
        } else if (diffHours < 24) {
          timeContext = ` (${diffHours}h ago at ${timeOfDay})`;
        } else if (diffDays === 0) {
          timeContext = ` (today at ${timeOfDay})`;
        } else if (diffDays === 1) {
          timeContext = ` (yesterday at ${timeOfDay})`;
        } else if (diffDays === 2) {
          timeContext = ` (2 days ago at ${timeOfDay})`;
        } else if (diffDays === 3) {
          timeContext = ` (3 days ago at ${timeOfDay})`;
        } else if (diffDays < 7) {
          const dayName = memDate.toLocaleDateString('en-US', { weekday: 'long' });
          timeContext = ` (last ${dayName} at ${timeOfDay})`;
        } else if (diffDays < 14) {
          timeContext = ` (last week at ${timeOfDay})`;
        } else if (diffDays < 30) {
          const weeks = Math.floor(diffDays / 7);
          timeContext = ` (${weeks} weeks ago at ${timeOfDay})`;
        } else {
          const monthName = memDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          timeContext = ` (${monthName} at ${timeOfDay})`;
        }
      }
      
      return `${sourceIcon}${mem.content}${timeContext}`;
    });

    console.log('🔍 LLM recalled memories:', {
      query: functionArgs.query,
      found: formattedMemories.length,
      timeFilter: functionArgs.time_filter || 'any_time',
      sourceFilter: functionArgs.source_filter || 'any',
    });

    return {
      success: true,
      memories: formattedMemories,
      message: `Found ${formattedMemories.length} memories`,
    };
  } catch (error) {
    console.error('❌ Failed to recall memories:', error);
    return {
      success: false,
      memories: [],
      message: 'Failed to recall memories',
    };
  }
}
