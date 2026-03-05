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
  const lowerMessage = message.toLowerCase().trim();

  // ---- SKIP: Messages that don't need recall ----

  // Skip very short messages (< 3 chars) unless they're questions
  if (lowerMessage.length < 3 && !lowerMessage.includes('?')) {
    return false;
  }

  // Skip emoji-only messages
  if (/^[\p{Emoji}\s]+$/u.test(message.trim())) {
    return false;
  }

  // Skip filler words that never need recall
  const fillerWords = new Set([
    'ok', 'okay', 'k', 'kk', 'haan', 'hmm', 'hm', 'yeah', 'yup', 'yep',
    'nah', 'no', 'nope', 'nahi', 'lol', 'haha', 'hehe', 'nice', 'cool',
    'achha', 'accha', 'theek', 'thik', 'sahi', 'right', 'wow', 'oh',
    'bas', 'ji', 'ha', 'na', 'bye', 'thanks', 'thx'
  ]);

  const strippedMessage = lowerMessage.replace(/[^a-z\s]/g, '').trim();
  if (fillerWords.has(strippedMessage)) {
    return false;
  }

  // Skip multi-word but all fillers (e.g., "ok ok", "haan haan", "achha theek")
  const words = strippedMessage.split(/\s+/);
  if (words.length <= 3 && words.every(w => fillerWords.has(w))) {
    return false;
  }

  // ---- TRIGGER: Messages that need recall ----

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

  // 4. Substantive messages (5+ words) — enough content for semantic matching
  if (message.trim().split(' ').length >= 5) {
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

  // ---- SMART QUERY: Detect vague messages and use conversation context instead ----
  const vaguePatterns = /^(acch[e]*\s*se|sahi\s*se|dhang\s*se|theek\s*se|puri\s*tarah|detail\s*mein|bata\s*(na|yr|yaar)?|yaad\s*kar|yaad\s*kr|haan\s*wahi|wahi\s*bata|bol\s*na|soch\s*ke\s*bata|phirse\s*bata|fir\s*se\s*bata|aur\s*bata|sab\s*bata)/i;
  const isVague = vaguePatterns.test(lowerMessage.replace(/[^a-z\s]/g, '').trim()) || lowerMessage.length < 15;

  let searchQuery = message;

  if (isVague && conversationHistory.length >= 2) {
    // Use last 3-5 user messages as the search query (the actual topic)
    const recentUserMessages = conversationHistory
      .filter((msg: any) => msg.sender === 'user' || msg.role === 'user')
      .slice(-5)
      .map((msg: any) => msg.text || msg.content || '')
      .filter((text: string) => text.length > 10) // Skip short fillers
      .join(' ');

    if (recentUserMessages.length > 15) {
      searchQuery = recentUserMessages;
      console.log('🎯 Vague message detected! Using conversation topic:', searchQuery.substring(0, 80) + '...');
    }
  }

  try {
    // STRATEGY 1: Direct semantic search with user's message (or resolved topic)
    console.log('🧠 Proactive search query:', searchQuery.substring(0, 80));
    const semanticResults = await memory.searchMemories({
      query: searchQuery,
      user_id: userId,
      limit: 15,
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
        limit: 8,
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
        limit: 5,
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

    // STRATEGY 4: Recent important memories for FOLLOW-UP
    // Fetch yesterday's important events so Ira can ask "interview kaisa gaya?"
    try {
      const followUpResults = await memory.searchMemories({
        query: 'interview exam plan mood nervous excited important event goal date',
        user_id: userId,
        limit: 10,
        mode: 'hybrid',
      });

      const nowMs = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      const twoDaysMs = 48 * 60 * 60 * 1000;

      const recentImportant = (followUpResults.results || [])
        .filter((mem: any) => {
          const ts = mem.metadata?.timestamp;
          if (!ts) return false;
          const age = nowMs - new Date(ts).getTime();
          // Only memories from last 6-48 hours (not too old, not from this session)
          const sig = mem.metadata?.significance;
          return age > 6 * 60 * 60 * 1000 && age < twoDaysMs &&
            (sig === 'critical' || sig === 'high');
        })
        .map((mem: any) =>
          enrichMemoryWithTimeContext({
            content: mem.content,
            recallReason: 'follow_up',
            confidence: 0.85,
            memoryType: mem.metadata?.memory_type || 'unknown',
            metadata: mem.metadata,
          })
        );

      if (recentImportant.length > 0) {
        console.log('📋 Follow-up memories found:', recentImportant.length);
      }
      memories.push(...recentImportant);
    } catch (followUpError) {
      // Don't block on follow-up search failure
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

  // Return top 12
  return unique.slice(0, 12);
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
