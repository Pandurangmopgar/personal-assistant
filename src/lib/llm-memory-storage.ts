// LLM Function Calling for Memory Storage & Retrieval
// LLM calls MemoryStack directly via function/tool calling

import { memory } from './memory';

/**
 * Define the store_memory function for LLM to call
 * SIMPLIFIED: Only content required. Server handles categorization.
 */
export const storeMemoryFunction = {
  name: 'store_memory',
  description: `Yaad rakh — jab bhi user kuch personal bataye toh ZAROOR store kar. Naam, preferences, dislikes, feelings, relationships, plans, koi bhi person ka naam, jo dekh/khel/padh raha hai — sab store kar.

ZAROOR STORE KAR:
- Names/people: "Rajesh ne call kiya" → store "Rajesh user ka koi jaanne wala hai"
- Negation/dislikes: "chess nahi khelta" → store "User AB chess nahi khelta"
- Third-person info: "meri mom ka BP badh gaya" → store "User ki mom ka BP high hai"
- Changed facts: "ab Mumbai shift ho gaya" → store "User ab Mumbai mein hai (pehle aur jagah tha)"
- Emotions: "mood off hai" → store "User ka mood off hai"
- What they're doing: "anime dekh raha" → store with specific name if available

MAT STORE KAR:
- Fillers: ok, haan, hmm, lol, haha, achha
- Sarcasm: "haan main toh NASA mein kaam karta hu" (clearly sarcastic) → skip
- Hypothetical: "agar 1 crore mile toh Dubai jaunga" → skip (ye real plan nahi hai)
- General knowledge: facts Google pe milte hain
- Ira ki baatein: apni (assistant ki) response mat store kar, sirf USER ki baatein`,
  parameters: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Kya yaad rakhna hai — ek line mein. "User ko barish pasand NAHI", "Rajesh user ka dost hai jo baar baar call karta hai", "User ki mom ka BP badh gaya", "User AB chess nahi khelta", "User ka crush Divya hai jisko glaucoma hai"',
      },
    },
    required: ['content'],
  },
};

/**
 * Define the recall_memories function for LLM to call
 */
export const recallMemoriesFunction = {
  name: 'recall_memories',
  description: `Yaadein dhundo — jab bhi user kisi topic, person, ya cheez ke baare mein baat kare toh search kar. IMPORTANT: Agar user vague bole jaise "wo jo dekhta tha", "wo banda", "wo wala" — toh query EXPAND kar based on context. Agar user time mention kare (kal, parso, last week) toh time_hint mein likho.`,
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Search query — EXPANDED and SPECIFIC. Vague mat likho. "wo jo khelta tha" → "chess games sports hobbies". "wo banda" → "friends people Rajesh Arjun relationships". Always add related terms.',
      },
      time_hint: {
        type: 'string',
        description: 'Time reference if user mentioned when. Examples: "yesterday", "yesterday evening", "kal sham", "2 days ago", "last week", "today morning", "parso". Empty if no time mentioned.',
      },
    },
    required: ['query'],
  },
};


// ============================================================================
// AUTO-CATEGORIZATION: Server-side memory type and significance detection
// ============================================================================

function autoCategorizeMem(content: string): { memory_type: string; significance: string } {
  const lower = content.toLowerCase();

  // Critical — names, birthday, identity
  if (/\b(naam|name|birthday|janamdin|age|umar)\b/i.test(lower)) {
    return { memory_type: 'personal_fact', significance: 'critical' };
  }

  // Critical — relationships, people
  if (/\b(crush|girlfriend|boyfriend|gf|bf|wife|husband|bhai|behen|sister|brother|mom|dad|papa|maa|dost|friend|family)\b/i.test(lower)) {
    return { memory_type: 'relationship', significance: 'critical' };
  }

  // Critical — person names (any sentence mentioning "naam ka" pattern)
  if (/\b\w+\s+naam\s+(ka|ki|ke)\b/i.test(lower)) {
    return { memory_type: 'relationship', significance: 'critical' };
  }

  // High — dislikes
  if (/\b(pasand nahi|nahi pasand|hate|dislike|nahi chahiye|dar lagta|avoid)\b/i.test(lower)) {
    return { memory_type: 'personal_dislike', significance: 'high' };
  }

  // High — preferences, likes
  if (/\b(pasand|favourite|favorite|like|love|enjoy|prefer)\b/i.test(lower)) {
    return { memory_type: 'personal_preference', significance: 'high' };
  }

  // High — emotions
  if (/\b(khush|happy|sad|udaas|nervous|tension|excited|proud|scared|dar|stressed|mood|crying|ro raha)\b/i.test(lower)) {
    return { memory_type: 'emotional_moment', significance: 'high' };
  }

  // High — goals, plans
  if (/\b(goal|plan|chahta|chahiye|banna|sikhna|karna hai|want to|dream|sapna|donate|stipend)\b/i.test(lower)) {
    return { memory_type: 'personal_goal', significance: 'high' };
  }

  // Medium — skills, hobbies
  if (/\b(chess|guitar|coding|rating|skill|hobby|game|sport|play|khel)\b/i.test(lower)) {
    return { memory_type: 'personal_skill', significance: 'medium' };
  }

  // Medium — what they're watching/reading/playing
  if (/\b(dekh raha|watching|padh raha|reading|khel raha|playing|anime|series|movie|show|film)\b/i.test(lower)) {
    return { memory_type: 'shared_experience', significance: 'medium' };
  }

  // Medium — habits, routine
  if (/\b(routine|hamesha|always|usually|roz|daily|subah|raat ko|habit)\b/i.test(lower)) {
    return { memory_type: 'personal_habit', significance: 'medium' };
  }

  // Medium — dates, events
  if (/\b(birthday|anniversary|exam|interview|surgery|date|festival|diwali|holi)\b/i.test(lower)) {
    return { memory_type: 'important_date', significance: 'high' };
  }

  // Default — medium personal fact
  return { memory_type: 'personal_fact', significance: 'medium' };
}


/**
 * Handle LLM function call to store memory
 * Now only requires content — categorization is automatic
 */
export async function handleStoreMemoryCall(
  functionArgs: {
    content: string;
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
      console.warn('⚠️ Dedup check failed, proceeding with storage:', dedupError);
    }

    // ================================================================
    // AUTO-CATEGORIZE + STORE
    // ================================================================
    const { memory_type, significance } = autoCategorizeMem(functionArgs.content);

    const metadata = {
      memory_type,
      significance,
      source_type: 'text',
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
      type: memory_type,
      significance,
      content: functionArgs.content.substring(0, 60) + '...',
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

// ============================================================================
// TIME HINT PARSER: Convert natural language time to IST date range
// ============================================================================

function parseTimeHint(hint: string): { start: Date; end: Date } | null {
  if (!hint || !hint.trim()) return null;

  const lower = hint.toLowerCase().trim();
  const nowUtc = new Date();

  // IST offset in milliseconds (UTC+5:30)
  const istOffsetMs = 5.5 * 60 * 60 * 1000;

  // Helper: create date range for X days ago with optional hour range (in IST)
  const makeRange = (daysAgo: number, startHour: number, endHour: number) => {
    // Get IST "now"
    const istNow = new Date(nowUtc.getTime() + istOffsetMs);
    // Target day in IST
    const targetDay = new Date(istNow);
    targetDay.setDate(targetDay.getDate() - daysAgo);

    const start = new Date(targetDay);
    start.setHours(startHour, 0, 0, 0);

    const end = new Date(targetDay);
    end.setHours(endHour, 59, 59, 999);

    // Convert back to UTC for comparison with stored timestamps
    return {
      start: new Date(start.getTime() - istOffsetMs),
      end: new Date(end.getTime() - istOffsetMs),
    };
  };

  // Detect time-of-day modifier
  const hasMorning = /morning|subah|savere/i.test(lower);
  const hasAfternoon = /afternoon|dopahar|dopaher/i.test(lower);
  const hasEvening = /evening|shaam|sham/i.test(lower);
  const hasNight = /night|raat/i.test(lower);

  let startHour = 0, endHour = 23;
  if (hasMorning) { startHour = 5; endHour = 11; }
  else if (hasAfternoon) { startHour = 12; endHour = 16; }
  else if (hasEvening) { startHour = 17; endHour = 20; }
  else if (hasNight) { startHour = 21; endHour = 23; }

  // Parse day references
  if (/today|aaj/i.test(lower)) return makeRange(0, startHour, endHour);
  if (/yesterday|kal|kl/i.test(lower) && !/parso/i.test(lower)) return makeRange(1, startHour, endHour);
  if (/parso|day before yesterday|2 days? ago/i.test(lower)) return makeRange(2, startHour, endHour);
  if (/3 days? ago/i.test(lower)) return makeRange(3, startHour, endHour);

  // "X days ago" pattern
  const daysAgoMatch = lower.match(/(\d+)\s*days?\s*ago/i);
  if (daysAgoMatch) return makeRange(parseInt(daysAgoMatch[1]), startHour, endHour);

  // Last week / this week / last month
  if (/last\s*week|pichle\s*hafte/i.test(lower)) {
    return { start: new Date(nowUtc.getTime() - 7 * 24 * 60 * 60 * 1000), end: nowUtc };
  }
  if (/this\s*week|is\s*hafte/i.test(lower)) {
    return { start: new Date(nowUtc.getTime() - 3 * 24 * 60 * 60 * 1000), end: nowUtc };
  }
  if (/last\s*month|pichle\s*mahine/i.test(lower)) {
    return { start: new Date(nowUtc.getTime() - 30 * 24 * 60 * 60 * 1000), end: nowUtc };
  }

  return null;
}


/**
 * Handle LLM function call to recall memories
 * Supports time_hint for time-aware searching
 */
export async function handleRecallMemoriesCall(
  functionArgs: {
    query: string;
    time_hint?: string;
  },
  userId: string
): Promise<{ success: boolean; memories: string[]; message: string }> {
  if (!memory) {
    return { success: false, memories: [], message: 'Memory system not available' };
  }

  try {
    const limit = 10;

    // Parse time hint into IST date range
    const timeRange = parseTimeHint(functionArgs.time_hint || '');
    if (timeRange) {
      console.log('⏰ Time filter:', {
        hint: functionArgs.time_hint,
        from: timeRange.start.toISOString(),
        to: timeRange.end.toISOString(),
      });
    }

    // Search memories — get extra results when time-filtering
    const results = await memory.searchMemories({
      query: functionArgs.query,
      user_id: userId,
      limit: timeRange ? limit * 3 : limit * 2,
      mode: 'hybrid',
    });

    let memories = results.results || [];

    // Filter by time range if specified
    if (timeRange) {
      memories = memories.filter((mem: any) => {
        const memDate = new Date(mem.metadata?.timestamp || 0);
        return memDate >= timeRange.start && memDate <= timeRange.end;
      });
      console.log('⏰ After time filter:', memories.length, 'memories remain');
    }

    memories = memories.slice(0, limit);

    // Format memories with time context
    const formattedMemories = memories.map((mem: any) => {
      const timestamp = mem.metadata?.timestamp;
      const sourceType = mem.metadata?.source_type || 'text';
      let timeContext = '';
      let sourceIcon = '';

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

        const hours = memDate.getHours();
        const minutes = memDate.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12;
        const displayMinutes = minutes.toString().padStart(2, '0');
        const timeOfDay = `${displayHours}:${displayMinutes} ${ampm}`;

        if (diffMins < 60) timeContext = ` (${diffMins} min ago)`;
        else if (diffHours < 24) timeContext = ` (${diffHours}h ago at ${timeOfDay})`;
        else if (diffDays === 1) timeContext = ` (yesterday at ${timeOfDay})`;
        else if (diffDays < 7) {
          const dayName = memDate.toLocaleDateString('en-US', { weekday: 'long' });
          timeContext = ` (last ${dayName} at ${timeOfDay})`;
        } else if (diffDays < 30) timeContext = ` (${Math.floor(diffDays / 7)} weeks ago)`;
        else {
          const monthName = memDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          timeContext = ` (${monthName})`;
        }
      }

      return `${sourceIcon}${mem.content}${timeContext}`;
    });

    console.log('🔍 LLM recalled:', {
      query: functionArgs.query,
      timeHint: functionArgs.time_hint || 'none',
      found: formattedMemories.length,
    });

    return {
      success: true,
      memories: formattedMemories,
      message: `Found ${formattedMemories.length} memories`,
    };
  } catch (error) {
    console.error('❌ Failed to recall memories:', error);
    return { success: false, memories: [], message: 'Failed to recall memories' };
  }
}

