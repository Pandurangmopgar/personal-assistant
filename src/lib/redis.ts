// Upstash Redis client for conversation persistence
import { Redis } from '@upstash/redis';

// Initialize Redis client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface Message {
  id: string;
  sender: 'me' | 'ira';
  type: 'text' | 'audio';
  text?: string;
  audioUrl?: string;
  audioDuration?: number;
  timestamp: string; // Display time like "5:51 pm"
  timestampMs?: number; // Actual timestamp in milliseconds
  date?: string; // Date like "February 23, 2026"
  dayOfWeek?: string; // Day like "Monday"
  status?: 'sent' | 'delivered' | 'read';
  isEmoji?: boolean;
  replyTo?: string;
}

// Save conversation to Redis
export async function saveConversation(
  userId: string,
  messages: Message[]
): Promise<void> {
  try {
    const key = `conversation:${userId}`;
    await redis.set(key, JSON.stringify(messages));
    console.log('💾 Saved conversation to Redis:', messages.length, 'messages');
  } catch (error) {
    console.error('Failed to save conversation:', error);
  }
}

// Load conversation from Redis
export async function loadConversation(userId: string): Promise<Message[]> {
  try {
    const key = `conversation:${userId}`;
    const data = await redis.get(key);
    
    if (!data) {
      console.log('📭 No conversation found in Redis');
      return [];
    }
    
    const messages = typeof data === 'string' ? JSON.parse(data) : data;
    console.log('📬 Loaded conversation from Redis:', messages.length, 'messages');
    return messages;
  } catch (error) {
    console.error('Failed to load conversation:', error);
    return [];
  }
}

// Append message to conversation
export async function appendMessage(
  userId: string,
  message: Message
): Promise<void> {
  try {
    const messages = await loadConversation(userId);
    messages.push(message);
    await saveConversation(userId, messages);
  } catch (error) {
    console.error('Failed to append message:', error);
  }
}

// Clear conversation
export async function clearConversation(userId: string): Promise<void> {
  try {
    const key = `conversation:${userId}`;
    await redis.del(key);
    console.log('🗑️ Cleared conversation from Redis');
  } catch (error) {
    console.error('Failed to clear conversation:', error);
  }
}
