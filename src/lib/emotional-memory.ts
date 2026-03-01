// Emotional Memory Enhancement for MemoryStack
// Adds emotional intelligence and proactive recall capabilities

export interface EmotionalContext {
  user_emotion: 'happy' | 'sad' | 'excited' | 'nervous' | 'neutral' | 'frustrated' | 'confused' | 'grateful';
  emotional_intensity: number; // 0-1
  emotional_trigger?: string; // What caused the emotion
  ira_response_tone: 'supportive' | 'playful' | 'empathetic' | 'excited' | 'calm' | 'encouraging';
}

export interface RecallTriggers {
  keywords: string[]; // Direct word matches
  contexts: string[]; // Situational contexts
  temporal: string[]; // Time-based triggers
  environmental: string[]; // Weather, location, etc.
}

export interface EnhancedMemoryMetadata {
  emotional_context?: EmotionalContext;
  recall_triggers?: RecallTriggers;
  memory_significance?: 'critical' | 'high' | 'medium' | 'low';
  relationship_context?: string; // Who was involved
  sensory_details?: string[]; // Visual, auditory details
}

// Analyze emotional context from message
export function analyzeEmotionalContext(
  message: string,
  conversationHistory: any[]
): EmotionalContext {
  const lowerMessage = message.toLowerCase();
  
  // Emotion detection patterns
  const emotionPatterns = {
    happy: /happy|glad|excited|yay|awesome|great|love|wonderful|amazing/i,
    sad: /sad|upset|down|depressed|cry|hurt|disappointed|miss/i,
    excited: /excited|can't wait|omg|wow|amazing|awesome|yay/i,
    nervous: /nervous|worried|anxious|scared|afraid|tension/i,
    frustrated: /frustrated|annoyed|angry|mad|irritated|ugh/i,
    confused: /confused|don't understand|what|huh|unclear/i,
    grateful: /thank|grateful|appreciate|thanks|shukriya|dhanyavaad/i,
  };
  
  // Detect primary emotion
  let detectedEmotion: EmotionalContext['user_emotion'] = 'neutral';
  let maxMatches = 0;
  
  for (const [emotion, pattern] of Object.entries(emotionPatterns)) {
    const matches = message.match(pattern);
    if (matches && matches.length > maxMatches) {
      maxMatches = matches.length;
      detectedEmotion = emotion as EmotionalContext['user_emotion'];
    }
  }
  
  // Detect intensity from punctuation and caps
  const exclamationCount = (message.match(/!/g) || []).length;
  const capsRatio = (message.match(/[A-Z]/g) || []).length / message.length;
  const emojiCount = (message.match(/[\p{Emoji}]/gu) || []).length;
  
  const intensity = Math.min(1, (exclamationCount * 0.2 + capsRatio * 0.5 + emojiCount * 0.15));
  
  // Determine response tone
  const responseTone = determineResponseTone(detectedEmotion, intensity);
  
  return {
    user_emotion: detectedEmotion,
    emotional_intensity: intensity,
    ira_response_tone: responseTone,
  };
}

function determineResponseTone(
  emotion: EmotionalContext['user_emotion'],
  intensity: number
): EmotionalContext['ira_response_tone'] {
  const toneMap: Record<string, EmotionalContext['ira_response_tone']> = {
    happy: intensity > 0.5 ? 'excited' : 'playful',
    sad: 'supportive',
    excited: 'excited',
    nervous: 'calm',
    frustrated: 'supportive',
    confused: 'calm',
    grateful: 'playful',
    neutral: 'playful',
  };
  
  return toneMap[emotion] || 'playful';
}

// Extract recall triggers from message
export function extractRecallTriggers(message: string): RecallTriggers {
  const lowerMessage = message.toLowerCase();
  
  // Environmental triggers
  const environmental: string[] = [];
  if (/rain|barish|baarish/i.test(message)) environmental.push('rain', 'weather');
  if (/sun|sunny|dhoop/i.test(message)) environmental.push('sunny', 'weather');
  if (/cold|thand|winter/i.test(message)) environmental.push('cold', 'weather');
  if (/hot|garmi|summer/i.test(message)) environmental.push('hot', 'weather');
  
  // Temporal triggers
  const temporal: string[] = [];
  if (/morning|subah/i.test(message)) temporal.push('morning');
  if (/evening|shaam/i.test(message)) temporal.push('evening');
  if (/night|raat/i.test(message)) temporal.push('night');
  if (/birthday|janamdin/i.test(message)) temporal.push('birthday', 'celebration');
  if (/weekend|saturday|sunday/i.test(message)) temporal.push('weekend');
  
  // Context triggers
  const contexts: string[] = [];
  if (/food|khana|dinner|lunch|breakfast|chai|coffee/i.test(message)) contexts.push('food');
  if (/movie|film|watch|dekh/i.test(message)) contexts.push('entertainment', 'movies');
  if (/chess|game|play|khel/i.test(message)) contexts.push('games', 'chess');
  if (/work|office|job|kaam/i.test(message)) contexts.push('work');
  if (/friend|dost|family|family/i.test(message)) contexts.push('relationships');
  if (/travel|trip|ghumna|vacation/i.test(message)) contexts.push('travel');
  
  // Extract keywords (important nouns and verbs)
  const keywords = extractKeywords(message);
  
  return {
    keywords,
    contexts,
    temporal,
    environmental,
  };
}

function extractKeywords(message: string): string[] {
  // Simple keyword extraction - remove common words
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their',
    'hai', 'ho', 'tha', 'thi', 'ka', 'ki', 'ke', 'ko', 'se', 'mai', 'mein',
  ]);
  
  const words = message.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
  
  return [...new Set(words)].slice(0, 10); // Top 10 unique keywords
}

// Calculate memory significance
export function calculateMemorySignificance(
  emotionalContext: EmotionalContext,
  recallTriggers: RecallTriggers,
  messageLength: number
): 'critical' | 'high' | 'medium' | 'low' {
  let score = 0;
  
  // Emotional intensity contributes
  score += emotionalContext.emotional_intensity * 30;
  
  // Strong emotions are more significant
  if (['sad', 'excited', 'nervous'].includes(emotionalContext.user_emotion)) {
    score += 20;
  }
  
  // More triggers = more significant
  const totalTriggers = 
    recallTriggers.keywords.length +
    recallTriggers.contexts.length +
    recallTriggers.temporal.length +
    recallTriggers.environmental.length;
  score += Math.min(30, totalTriggers * 3);
  
  // Longer messages tend to be more significant
  score += Math.min(20, messageLength / 20);
  
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// Enhance system prompt with emotional context
export function enhanceSystemPromptWithEmotion(
  basePrompt: string,
  emotionalContext: EmotionalContext,
  relevantMemories: string[]
): string {
  const toneGuidance = {
    supportive: "Be extra supportive and understanding. Show empathy and care.",
    playful: "Be light-hearted and playful. Use humor and casual expressions.",
    empathetic: "Show deep empathy. Acknowledge their feelings and validate their emotions.",
    excited: "Match their excitement! Be enthusiastic and energetic.",
    calm: "Be calm and reassuring. Help them feel at ease.",
    encouraging: "Be encouraging and motivating. Help them feel confident.",
  };
  
  const emotionGuidance = {
    happy: "The user seems happy! Share in their joy.",
    sad: "The user seems sad. Be gentle and supportive.",
    excited: "The user is excited! Match their energy.",
    nervous: "The user seems nervous. Be reassuring and calm.",
    frustrated: "The user seems frustrated. Be patient and understanding.",
    confused: "The user seems confused. Be clear and helpful.",
    grateful: "The user is grateful. Acknowledge it warmly.",
    neutral: "The user's emotion is neutral. Be naturally friendly.",
  };
  
  let enhancedPrompt = basePrompt;
  
  // Add emotional guidance
  enhancedPrompt += `\n\nCurrent emotional context:
- User emotion: ${emotionalContext.user_emotion}
- Intensity: ${(emotionalContext.emotional_intensity * 100).toFixed(0)}%
- Response tone: ${emotionalContext.ira_response_tone}

${emotionGuidance[emotionalContext.user_emotion]}
${toneGuidance[emotionalContext.ira_response_tone]}`;
  
  // Add relevant memories if available
  if (relevantMemories.length > 0) {
    enhancedPrompt += `\n\nRelevant memories to reference naturally:
${relevantMemories.map((mem, i) => `${i + 1}. ${mem}`).join('\n')}

Use these memories naturally in conversation when appropriate. Don't force them.`;
  }
  
  return enhancedPrompt;
}
