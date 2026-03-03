// Memory integration for WhatsApp Chat - gracefully handles missing SDK
let memory: any = null;

try {
  // Try to import MemoryStack SDK if available
  const { MemoryStackClient } = require('@memorystack/sdk');
  memory = new MemoryStackClient({
    apiKey: process.env.MEMORYSTACK_API_KEY || '',
    baseUrl: 'https://memorystack.app',
    agentName: 'ira_chat_assistant',
    agentType: 'conversational',
  });
  console.log('✅ MemoryStack SDK initialized for agent: ira_chat_assistant');
} catch (e) {
  console.log('❌ MemoryStack SDK not available, running without memory features');
}

export interface UserProfile {
  name: string;
  interests: string[];
  preferences: Record<string, any>;
  importantDates: Record<string, string>;
  relationships: Record<string, string>;
}

export interface ConversationMemory {
  topic: string;
  timestamp: string;
  summary: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  keywords: string[];
}

// Enhanced metadata for MemoryStack
export interface EnhancedMemoryMetadata {
  // Custom Ira-specific memory types (MemoryStack supports custom types)
  memory_type:
  // Personal Information
  | 'personal_fact'        // Name, age, birthday, location
  | 'personal_preference'  // Likes, favorites, choices
  | 'personal_dislike'     // Dislikes, avoidances
  | 'personal_goal'        // Wants, plans, aspirations
  | 'personal_habit'       // Routines, patterns, behaviors
  | 'personal_skill'       // Abilities, knowledge, expertise

  // Emotional & Social
  | 'emotional_moment'     // Significant emotional experiences
  | 'relationship'         // People, connections, social context
  | 'shared_experience'    // Stories, events, memories together
  | 'inside_joke'          // Jokes, references, shared humor

  // Contextual
  | 'conversation_context' // General conversation memory
  | 'temporal_pattern'     // Time-based patterns (morning routine, etc.)
  | 'environmental_trigger'// Weather, location-based memories
  | 'cultural_reference'   // Hinglish, Indian cultural context

  // Insights & Learning
  | 'behavioral_insight'   // Learned patterns about user
  | 'preference_evolution' // How preferences change over time
  | 'proactive_suggestion' // Things Ira suggested that worked

  // Special
  | 'important_date'       // Birthdays, anniversaries, events
  | 'sensitive_topic'      // Topics to handle carefully
  | 'conversation_style';  // How user likes to communicate

  // Emotional context
  emotional_context?: {
    user_emotion: string;
    emotional_intensity: number;
    emotional_trigger?: string;
    ira_response_tone: string;
  };

  // Recall triggers
  recall_triggers?: {
    keywords: string[];
    contexts: string[];
    temporal: string[];
    environmental: string[];
  };

  // Significance
  significance?: 'critical' | 'high' | 'medium' | 'low';

  // Additional metadata
  topic?: string;
  keywords?: string[];
  timestamp?: string;
  category?: string;

  // Time context
  time_context?: {
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'night';
    day_of_week: string;
    is_weekend: boolean;
  };

  // Ira-specific tags
  ira_tags?: {
    conversation_depth?: 'casual' | 'deep' | 'emotional' | 'playful';
    user_mood?: 'positive' | 'negative' | 'neutral' | 'mixed';
    response_quality?: 'excellent' | 'good' | 'needs_improvement';
    follow_up_needed?: boolean;
    proactive_recall_success?: boolean;
    original_language?: string;
    preserve_language?: boolean;
  };
}

// Store a conversation memory with enhanced metadata
export async function storeConversationMemory(
  userId: string,
  messages: string[],
  topic: string,
  keywords: string[],
  enhancedMetadata?: Partial<EnhancedMemoryMetadata>
): Promise<void> {
  if (!memory) return;

  // Store original messages in their language (Hinglish)
  const content = messages.join('\n');

  // Determine memory type based on content
  const memoryType = determineMemoryType(content, topic);

  // Build complete metadata with language preservation
  const metadata: EnhancedMemoryMetadata = {
    memory_type: memoryType,
    topic,
    keywords,
    timestamp: new Date().toISOString(),
    ...enhancedMetadata,
    // Add language metadata to preserve original
    ira_tags: {
      ...enhancedMetadata?.ira_tags,
      original_language: 'hinglish',
      preserve_language: true,
    },
  };

  try {
    const result = await memory.createMemory({
      messages: [
        { role: 'user', content: messages[0] },
        { role: 'assistant', content: messages[1] || '' }
      ],
      user_id: userId,
      metadata,
    });

    console.log('✅ MemoryStack stored:', {
      type: memoryType,
      significance: metadata.significance,
      emotion: metadata.emotional_context?.user_emotion,
      memoryId: result?.id || 'unknown',
      language: 'hinglish',
    });
  } catch (e) {
    console.error('❌ MemoryStack store failed:', e);
  }
}

// Store user preference or personal info with proper typing
export async function storeUserInfo(
  userId: string,
  category: string,
  info: string,
  value?: any,
  enhancedMetadata?: Partial<EnhancedMemoryMetadata>
): Promise<void> {
  if (!memory) return;

  const metadata: EnhancedMemoryMetadata = {
    memory_type: 'personal_preference',
    category,
    timestamp: new Date().toISOString(),
    ...enhancedMetadata,
  };

  try {
    await memory.createMemory({
      messages: [{ role: 'assistant', content: `User ${category}: ${info}` }],
      user_id: userId,
      metadata: {
        ...metadata,
        value,
      },
    });
  } catch (e) {
    console.error('Failed to store user info:', e);
  }
}

// Store important facts (name, birthday, preferences, etc.)
export async function storeFact(
  userId: string,
  fact: string,
  category: string,
  enhancedMetadata?: Partial<EnhancedMemoryMetadata>
): Promise<void> {
  if (!memory) return;

  const metadata: EnhancedMemoryMetadata = {
    memory_type: 'personal_fact',
    category,
    timestamp: new Date().toISOString(),
    significance: 'high', // Facts are generally important
    ...enhancedMetadata,
  };

  try {
    await memory.createMemory({
      messages: [{ role: 'assistant', content: fact }],
      user_id: userId,
      metadata,
    });
  } catch (e) {
    console.error('Failed to store fact:', e);
  }
}

// Store emotional memory
export async function storeEmotionalMemory(
  userId: string,
  content: string,
  emotionalContext: {
    user_emotion: string;
    emotional_intensity: number;
    emotional_trigger?: string;
    ira_response_tone: string;
  },
  recallTriggers?: {
    keywords: string[];
    contexts: string[];
    temporal: string[];
    environmental: string[];
  }
): Promise<void> {
  if (!memory) return;

  const metadata: EnhancedMemoryMetadata = {
    memory_type: 'emotional_moment',
    emotional_context: emotionalContext,
    recall_triggers: recallTriggers,
    significance: emotionalContext.emotional_intensity > 0.7 ? 'high' : 'medium',
    timestamp: new Date().toISOString(),
  };

  try {
    await memory.createMemory({
      messages: [{ role: 'assistant', content }],
      user_id: userId,
      metadata,
    });

    console.log('💾 Stored emotional memory:', emotionalContext.user_emotion);
  } catch (e) {
    console.error('Failed to store emotional memory:', e);
  }
}

// Get conversation context with filtering options
export async function getConversationContext(
  userId: string,
  currentMessage: string,
  filters?: {
    memory_types?: string[];
    emotional_context?: any;
    significance?: string[];
  }
): Promise<string> {
  if (!memory) return '';

  try {
    const searchParams: any = {
      query: currentMessage,
      user_id: userId,
      limit: 30,
      mode: 'hybrid',
    };

    // Add filters if provided
    if (filters) {
      searchParams.filters = filters;
    }

    const results = await memory.searchMemories(searchParams);

    if (!results.results || results.results.length === 0) {
      return '';
    }

    const context = results.results
      .map((mem: any) => mem.content)
      .join('\n');

    return context;
  } catch (e) {
    console.error('Failed to get conversation context:', e);
    return '';
  }
}

// Get memories by type
export async function getMemoriesByType(
  userId: string,
  memoryType: string,
  limit: number = 10
): Promise<any[]> {
  if (!memory) return [];

  try {
    const results = await memory.searchMemories({
      user_id: userId,
      limit,
      mode: 'hybrid',
      filters: {
        memory_type: memoryType,
      },
    });

    return results.results || [];
  } catch (e) {
    console.error('Failed to get memories by type:', e);
    return [];
  }
}

// Get emotional memories
export async function getEmotionalMemories(
  userId: string,
  emotion?: string,
  limit: number = 5
): Promise<any[]> {
  if (!memory) return [];

  try {
    const filters: any = {
      memory_type: 'emotional_moment',
    };

    if (emotion) {
      filters['emotional_context.user_emotion'] = emotion;
    }

    const results = await memory.searchMemories({
      user_id: userId,
      limit,
      mode: 'hybrid',
      filters,
    });

    return results.results || [];
  } catch (e) {
    console.error('Failed to get emotional memories:', e);
    return [];
  }
}

// Get user profile information
export async function getUserProfile(userId: string): Promise<Partial<UserProfile>> {
  const profile: Partial<UserProfile> = {
    interests: [],
    preferences: {},
    importantDates: {},
    relationships: {},
  };

  if (!memory) return profile;

  try {
    // Get facts and preferences
    const results = await memory.searchMemories({
      query: 'user name birthday interest preference favorite',
      user_id: userId,
      limit: 20,
      mode: 'hybrid',
      filters: {
        memory_type: ['personal_fact', 'personal_preference', 'important_date'],
      },
    });

    if (!results.results || results.results.length === 0) {
      return profile;
    }

    // Extract information from memories
    for (const mem of results.results) {
      const memType = mem.metadata?.memory_type;
      const category = mem.metadata?.category;

      if (memType === 'personal_preference') {
        if (category === 'interest') {
          profile.interests?.push(mem.content);
        } else {
          profile.preferences![category || 'general'] = mem.content;
        }
      } else if (memType === 'personal_fact') {
        if (category === 'name' && !profile.name) {
          profile.name = mem.content;
        } else if (category === 'birthday') {
          profile.importantDates!['birthday'] = mem.content;
        }
      } else if (memType === 'important_date') {
        if (category === 'birthday') {
          profile.importantDates!['birthday'] = mem.content;
        }
      }
    }

    return profile;
  } catch (e) {
    console.error('Failed to get user profile:', e);
    return profile;
  }
}

// Get relevant memories with advanced filtering
export async function getRelevantMemories(
  userId: string,
  query: string,
  limit: number = 3,
  options?: {
    memory_types?: string[];
    significance?: string[];
    time_context?: any;
  }
): Promise<string[]> {
  if (!memory) return [];

  try {
    const searchParams: any = {
      query,
      user_id: userId,
      limit,
      mode: 'hybrid',
    };

    if (options) {
      searchParams.filters = options;
    }

    const results = await memory.searchMemories(searchParams);

    if (!results.results || results.results.length === 0) {
      return [];
    }

    return results.results.map((mem: any) => mem.content);
  } catch (e) {
    console.error('Failed to get relevant memories:', e);
    return [];
  }
}

// Extract and store facts from conversation with enhanced metadata
export async function extractAndStoreFacts(
  userId: string,
  userMessage: string,
  _assistantMessage: string,
  enhancedMetadata?: Partial<EnhancedMemoryMetadata>
): Promise<void> {
  if (!memory) return;

  // Enhanced fact extraction patterns with Ira-specific types
  const patterns = [
    // Personal Facts
    { regex: /my name is (\w+)/i, category: 'name', type: 'personal_fact' as const },
    { regex: /i'?m (\w+)/i, category: 'name', type: 'personal_fact' as const },
    { regex: /my birthday is ([\w\s,]+)/i, category: 'birthday', type: 'important_date' as const },
    { regex: /i live in (\w+)/i, category: 'location', type: 'personal_fact' as const },
    { regex: /i'?m from (\w+)/i, category: 'location', type: 'personal_fact' as const },
    { regex: /i'?m (\d+) years old/i, category: 'age', type: 'personal_fact' as const },

    // Preferences
    { regex: /i like ([\w\s]+)/i, category: 'interest', type: 'personal_preference' as const },
    { regex: /i love ([\w\s]+)/i, category: 'interest', type: 'personal_preference' as const },
    { regex: /i enjoy ([\w\s]+)/i, category: 'interest', type: 'personal_preference' as const },
    { regex: /i prefer ([\w\s]+)/i, category: 'preference', type: 'personal_preference' as const },
    { regex: /my favorite ([\w\s]+) is ([\w\s]+)/i, category: 'favorite', type: 'personal_preference' as const },
    { regex: /mujhe ([\w\s]+) pasand hai/i, category: 'interest', type: 'personal_preference' as const },

    // Dislikes
    { regex: /i (?:hate|dislike) ([\w\s]+)/i, category: 'dislike', type: 'personal_dislike' as const },
    { regex: /i don'?t like ([\w\s]+)/i, category: 'dislike', type: 'personal_dislike' as const },
    { regex: /mujhe ([\w\s]+) pasand nahi/i, category: 'dislike', type: 'personal_dislike' as const },

    // Goals
    { regex: /i want to ([\w\s]+)/i, category: 'goal', type: 'personal_goal' as const },
    { regex: /i'?m planning to ([\w\s]+)/i, category: 'plan', type: 'personal_goal' as const },
    { regex: /my goal is ([\w\s]+)/i, category: 'goal', type: 'personal_goal' as const },
    { regex: /mai ([\w\s]+) karna chahta/i, category: 'goal', type: 'personal_goal' as const },

    // Habits
    { regex: /i usually ([\w\s]+)/i, category: 'habit', type: 'personal_habit' as const },
    { regex: /i always ([\w\s]+)/i, category: 'habit', type: 'personal_habit' as const },
    { regex: /every day i ([\w\s]+)/i, category: 'routine', type: 'personal_habit' as const },
    { regex: /mai hamesha ([\w\s]+)/i, category: 'habit', type: 'personal_habit' as const },
    { regex: /roz mai ([\w\s]+)/i, category: 'routine', type: 'personal_habit' as const },

    // Skills
    { regex: /i can ([\w\s]+)/i, category: 'skill', type: 'personal_skill' as const },
    { regex: /i know how to ([\w\s]+)/i, category: 'skill', type: 'personal_skill' as const },
    { regex: /i'?m good at ([\w\s]+)/i, category: 'skill', type: 'personal_skill' as const },
    { regex: /i play ([\w\s]+)/i, category: 'hobby', type: 'personal_skill' as const },
    { regex: /my rating is (\d+)/i, category: 'achievement', type: 'personal_skill' as const },

    // Relationships
    { regex: /my (?:friend|dost) ([\w\s]+)/i, category: 'friend', type: 'relationship' as const },
    { regex: /my (?:mom|mother|maa) ([\w\s]+)/i, category: 'family', type: 'relationship' as const },
    { regex: /my (?:dad|father|papa) ([\w\s]+)/i, category: 'family', type: 'relationship' as const },
  ];

  for (const pattern of patterns) {
    const match = userMessage.match(pattern.regex);
    if (match) {
      const metadata: EnhancedMemoryMetadata = {
        memory_type: pattern.type,
        category: pattern.category,
        significance: pattern.type === 'personal_fact' || pattern.type === 'important_date' ? 'critical' :
          pattern.type === 'personal_preference' || pattern.type === 'personal_dislike' ? 'high' :
            'medium',
        timestamp: new Date().toISOString(),
        ...enhancedMetadata,
      };

      const result = await memory.createMemory({
        messages: [{ role: 'assistant', content: match[0] }],
        user_id: userId,
        metadata,
      });

      console.log(`✅ MemoryStack extracted ${pattern.type}:`, pattern.category, 'ID:', result?.id || 'unknown');
    }
  }
}

// Helper function to determine memory type from content (Ira-specific)
function determineMemoryType(content: string, topic: string): EnhancedMemoryMetadata['memory_type'] {
  const lowerContent = content.toLowerCase();

  // Personal Information
  if (lowerContent.includes('name') || lowerContent.includes('age') ||
    lowerContent.includes('birthday') || lowerContent.includes('location') ||
    lowerContent.includes('live in') || lowerContent.includes('from')) {
    return 'personal_fact';
  }

  if (lowerContent.includes('like') || lowerContent.includes('prefer') ||
    lowerContent.includes('favorite') || lowerContent.includes('pasand')) {
    return 'personal_preference';
  }

  if (lowerContent.includes('dislike') || lowerContent.includes('hate') ||
    lowerContent.includes('nahi pasand')) {
    return 'personal_dislike';
  }

  if (lowerContent.includes('want') || lowerContent.includes('plan') ||
    lowerContent.includes('goal') || lowerContent.includes('chahta')) {
    return 'personal_goal';
  }

  if (lowerContent.includes('usually') || lowerContent.includes('always') ||
    lowerContent.includes('routine') || lowerContent.includes('hamesha') ||
    lowerContent.includes('roz') || lowerContent.includes('every day')) {
    return 'personal_habit';
  }

  if (lowerContent.includes('can') || lowerContent.includes('know how') ||
    lowerContent.includes('good at') || lowerContent.includes('skill')) {
    return 'personal_skill';
  }

  // Emotional & Social
  if (lowerContent.includes('feel') || lowerContent.includes('emotion') ||
    lowerContent.includes('happy') || lowerContent.includes('sad') ||
    lowerContent.includes('excited') || lowerContent.includes('nervous') ||
    lowerContent.includes('khushi') || lowerContent.includes('dukh')) {
    return 'emotional_moment';
  }

  if (lowerContent.includes('friend') || lowerContent.includes('family') ||
    lowerContent.includes('mom') || lowerContent.includes('dad') ||
    lowerContent.includes('dost') || lowerContent.includes('relationship')) {
    return 'relationship';
  }

  if (lowerContent.includes('remember when') || lowerContent.includes('that time') ||
    lowerContent.includes('yaad hai') || lowerContent.includes('woh din')) {
    return 'shared_experience';
  }

  if (lowerContent.includes('haha') || lowerContent.includes('lol') ||
    lowerContent.includes('funny') || lowerContent.includes('joke') ||
    lowerContent.includes('mazak')) {
    return 'inside_joke';
  }

  // Contextual
  if (lowerContent.includes('morning') || lowerContent.includes('evening') ||
    lowerContent.includes('night') || lowerContent.includes('subah') ||
    lowerContent.includes('shaam') || lowerContent.includes('raat')) {
    return 'temporal_pattern';
  }

  if (lowerContent.includes('rain') || lowerContent.includes('weather') ||
    lowerContent.includes('barish') || lowerContent.includes('mausam') ||
    lowerContent.includes('sunny') || lowerContent.includes('cold')) {
    return 'environmental_trigger';
  }

  if (lowerContent.includes('hinglish') || lowerContent.includes('yaar') ||
    lowerContent.includes('arre') || lowerContent.includes('achha') ||
    topic === 'cultural') {
    return 'cultural_reference';
  }

  // Special
  if (lowerContent.includes('birthday') || lowerContent.includes('anniversary') ||
    lowerContent.includes('janamdin')) {
    return 'important_date';
  }

  // Default
  return 'conversation_context';
}

export { memory };

