// Conversation Checkpointing System
// Creates summaries of conversations to maintain long-term context

import { memory } from './memory';

export interface ConversationCheckpoint {
  id: string;
  userId: string;
  startMessageId: string;
  endMessageId: string;
  messageCount: number;
  summary: string;
  keyTopics: string[];
  importantFacts: string[];
  emotionalTone: string;
  dateRange: {
    start: string;
    end: string;
  };
  createdAt: string;
}

// Check if we need to create a checkpoint
export function shouldCreateCheckpoint(messageCount: number): boolean {
  // Create checkpoint every 250 messages
  return messageCount > 0 && messageCount % 250 === 0;
}

// Create a conversation summary using LLM
export async function createConversationSummary(
  messages: any[],
  azureConfig: {
    apiKey: string;
    endpoint: string;
    deployment: string;
    apiVersion: string;
  }
): Promise<string> {
  try {
    // Take last 50 messages for summary
    const recentMessages = messages.slice(-50);

    // Build conversation text
    const conversationText = recentMessages
      .map(msg => `${msg.sender === 'me' ? 'User' : 'Ira'}: ${msg.text}`)
      .join('\n');

    const summaryPrompt = `Yeh User aur Ira ke beech WhatsApp conversation ka summary banao 3-4 lines mein Hinglish mein. Focus kar:
1. Kya kya topics discuss hue
2. Kya important facts share hue (naam, preferences, plans)
3. Emotional tone kaisa tha (khushi, mazaak, serious, sad)
4. Koi plans ya commitments bane toh woh bhi likho

Conversation:
${conversationText}

Summary:`;

    const url = `${azureConfig.endpoint}/openai/deployments/${azureConfig.deployment}/chat/completions?api-version=${azureConfig.apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureConfig.apiKey,
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: 'Tu ek helper hai jo conversations ka concise summary Hinglish mein banata hai. Summary natural Hinglish mein likh — jaise ek dost ko bata raha ho ki conversation mein kya hua.',
          },
          {
            role: 'user',
            content: summaryPrompt,
          },
        ],
        max_completion_tokens: 200,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices?.[0]?.message?.content?.trim() || 'Summary unavailable';
    }

    return 'Summary unavailable';
  } catch (error) {
    console.error('Failed to create summary:', error);
    return 'Summary unavailable';
  }
}

// Extract key information from messages
export function extractCheckpointData(messages: any[]): {
  keyTopics: string[];
  importantFacts: string[];
  emotionalTone: string;
} {
  const recentMessages = messages.slice(-50);

  // Extract topics (simple keyword extraction)
  const topics = new Set<string>();
  const facts: string[] = [];
  let positiveCount = 0;
  let negativeCount = 0;

  recentMessages.forEach(msg => {
    const text = msg.text?.toLowerCase() || '';

    // Topic detection
    if (text.includes('food') || text.includes('khana') || text.includes('dinner') || text.includes('lunch')) {
      topics.add('food');
    }
    if (text.includes('movie') || text.includes('film') || text.includes('watch')) {
      topics.add('movies');
    }
    if (text.includes('work') || text.includes('job') || text.includes('office')) {
      topics.add('work');
    }
    if (text.includes('family') || text.includes('mom') || text.includes('dad')) {
      topics.add('family');
    }
    if (text.includes('friend') || text.includes('dost')) {
      topics.add('friends');
    }
    if (text.includes('weather') || text.includes('rain') || text.includes('barish')) {
      topics.add('weather');
    }

    // Fact detection (simple patterns)
    if (text.includes('my name is') || text.includes('naam hai')) {
      facts.push(msg.text);
    }
    if (text.includes('birthday') || text.includes('janamdin')) {
      facts.push(msg.text);
    }
    if (text.includes('i like') || text.includes('pasand hai')) {
      facts.push(msg.text);
    }

    // Emotional tone
    if (text.includes('😊') || text.includes('😂') || text.includes('happy') || text.includes('khushi')) {
      positiveCount++;
    }
    if (text.includes('😢') || text.includes('😔') || text.includes('sad') || text.includes('dukh')) {
      negativeCount++;
    }
  });

  // Determine overall emotional tone
  let emotionalTone = 'neutral';
  if (positiveCount > negativeCount * 2) {
    emotionalTone = 'positive';
  } else if (negativeCount > positiveCount * 2) {
    emotionalTone = 'negative';
  } else if (positiveCount > 0 || negativeCount > 0) {
    emotionalTone = 'mixed';
  }

  return {
    keyTopics: Array.from(topics).slice(0, 5),
    importantFacts: facts.slice(0, 5),
    emotionalTone,
  };
}

// Create and store a checkpoint
export async function createCheckpoint(
  userId: string,
  messages: any[],
  azureConfig: {
    apiKey: string;
    endpoint: string;
    deployment: string;
    apiVersion: string;
  }
): Promise<ConversationCheckpoint | null> {
  if (!memory) return null;

  try {
    const recentMessages = messages.slice(-50);

    if (recentMessages.length === 0) return null;

    // Create summary
    const summary = await createConversationSummary(recentMessages, azureConfig);

    // Extract data
    const { keyTopics, importantFacts, emotionalTone } = extractCheckpointData(recentMessages);

    // Get date range
    const startDate = recentMessages[0].date || new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const endDate = recentMessages[recentMessages.length - 1].date || startDate;

    // Create checkpoint object
    const checkpoint: ConversationCheckpoint = {
      id: `checkpoint-${Date.now()}`,
      userId,
      startMessageId: recentMessages[0].id,
      endMessageId: recentMessages[recentMessages.length - 1].id,
      messageCount: recentMessages.length,
      summary,
      keyTopics,
      importantFacts,
      emotionalTone,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      createdAt: new Date().toISOString(),
    };

    // Store in MemoryStack as a special memory type
    await memory.createMemory({
      messages: [{
        role: 'assistant',
        content: `Conversation Checkpoint (${checkpoint.messageCount} messages):\n\n${summary}\n\nTopics: ${keyTopics.join(', ')}\nTone: ${emotionalTone}`
      }],
      user_id: userId,
      metadata: {
        memory_type: 'conversation_checkpoint',
        checkpoint_id: checkpoint.id,
        message_count: checkpoint.messageCount,
        key_topics: keyTopics,
        emotional_tone: emotionalTone,
        date_range: checkpoint.dateRange,
        significance: 'high',
      },
    });

    console.log('📍 Created checkpoint:', {
      id: checkpoint.id,
      messages: checkpoint.messageCount,
      topics: keyTopics,
      tone: emotionalTone,
    });

    return checkpoint;
  } catch (error) {
    console.error('Failed to create checkpoint:', error);
    return null;
  }
}

// Get recent checkpoints for context
export async function getRecentCheckpoints(
  userId: string,
  limit: number = 3
): Promise<string[]> {
  if (!memory) return [];

  try {
    const results = await memory.searchMemories({
      query: 'conversation checkpoint summary',
      user_id: userId,
      limit,
      mode: 'hybrid',
      filters: {
        memory_type: 'conversation_checkpoint',
      },
    });

    if (!results.results || results.results.length === 0) {
      return [];
    }

    return results.results.map((mem: any) => mem.content);
  } catch (error) {
    console.error('Failed to get checkpoints:', error);
    return [];
  }
}

// Get checkpoint context for LLM
export async function getCheckpointContext(userId: string): Promise<string> {
  const checkpoints = await getRecentCheckpoints(userId, 2);

  if (checkpoints.length === 0) {
    return '';
  }

  return `\n\nPrevious conversation context:\n${checkpoints.join('\n\n')}`;
}
