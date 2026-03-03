// LLM Function Calling for Memory Storage & Retrieval
// LLM calls MemoryStack directly via function/tool calling

import { memory } from './memory';

/**
 * Define the store_memory function for LLM to call
 * Ira-specific: Hinglish companion memory storage
 */
export const storeMemoryFunction = {
  name: 'store_memory',
  description: `Store important information about the user for future conversations. Use when user shares personal facts, feelings, preferences, goals, relationships, or experiences. Do NOT use for filler words (ok, haan, hmm), greetings, or generic reactions. Write content in Hinglish. Example: "User ka naam Pandurang hai", "User ko bhindi pasand hai".`,
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'What to remember about the user — write in Hinglish. E.g., "User ka naam Pandurang hai", "User ko chess pasand hai, rating 1600 hai"',
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
          'inside_joke',
        ],
        description: 'Type of memory: personal_fact (name, birthday), personal_preference (likes), personal_dislike (dislikes), emotional_moment (happy/sad events), relationship (family/friends), etc.',
      },
      significance: {
        type: 'string',
        enum: ['critical', 'high', 'medium', 'low'],
        description: 'How important: critical (name, birthday), high (preferences, goals, emotions), medium (habits, shared experiences), low (casual mentions)',
      },
      source_type: {
        type: 'string',
        enum: ['text', 'image', 'audio', 'video'],
        description: 'How the info was shared. Default: text',
      },
      emotional_tone: {
        type: 'string',
        enum: ['happy', 'sad', 'excited', 'nervous', 'frustrated', 'grateful', 'neutral'],
        description: 'User mood when sharing this. Optional.',
      },
    },
    required: ['content', 'memory_type', 'significance'],
  },
};

/**
 * Define the recall_memories function for LLM to call
 * Ira-specific: Hinglish companion memory recall
 */
export const recallMemoriesFunction = {
  name: 'recall_memories',
  description: `Search for past memories about the user. Use proactively like a best friend — don't wait to be asked. Examples: if rain is mentioned, recall "chai preferences"; if it's meal time, recall "favourite khana"; if user is sad, recall a happy moment. Write query in simple terms.`,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'What to search for. E.g., "favourite food", "chess rating", "birthday", "weekend plans", "happy memories"',
      },
      time_filter: {
        type: 'string',
        enum: ['last_week', 'last_month', 'last_3_months', 'any_time'],
        description: 'Time filter for memories. Default: any_time',
      },
      source_filter: {
        type: 'string',
        enum: ['text', 'image', 'audio', 'video', 'any'],
        description: 'Filter by source type. Default: any',
      },
      limit: {
        type: 'number',
        description: 'How many memories to return (default: 3, max: 5)',
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
    // ================================================================
    // DE-DUPLICATION CHECK: Skip if very similar memory already exists
    // ================================================================
    try {
      const existingMemories = await memory.searchMemories({
        query: functionArgs.content,
        user_id: userId,
        limit: 1,
        mode: 'hybrid',
      });

      if (existingMemories.results && existingMemories.results.length > 0) {
        const topResult = existingMemories.results[0];
        const similarityScore = topResult.score || 0;

        // If very high similarity (>0.90), skip as duplicate
        if (similarityScore > 0.90) {
          console.log('⏭️  Duplicate memory skipped:', {
            existing: topResult.content?.substring(0, 50) + '...',
            new: functionArgs.content.substring(0, 50) + '...',
            similarity: similarityScore.toFixed(3),
          });
          return {
            success: true,
            message: 'Memory already exists (duplicate skipped)',
          };
        }
      }
    } catch (dedupError) {
      // Don't block storage if dedup check fails
      console.warn('⚠️ Dedup check failed, proceeding with storage:', dedupError);
    }

    // ================================================================
    // STORE THE MEMORY
    // ================================================================
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
    const limit = Math.min(functionArgs.limit || 10, 10); // Max 10

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
