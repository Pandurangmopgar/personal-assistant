// Memory Signal Detection System
// Decides WHAT to store, WHEN to store, and HOW to recall

export interface ConversationContext {
  userMessage: string;
  assistantResponse: string;
  conversationHistory: Array<{ role: string; content: string }>;
  timestamp: Date;
  userId: string;
}

export interface EnvironmentalSignals {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: string;
  isWeekend: boolean;
  detectedContext: string[]; // ['weather', 'food', 'work', etc.]
}

export interface EmotionalSignals {
  userEmotion: 'happy' | 'sad' | 'excited' | 'nervous' | 'frustrated' | 'neutral' | 'playful';
  emotionalIntensity: number; // 0-1
  emotionalTrigger?: string;
  sentimentScore: number; // -1 to 1
}

export interface MemorySignal {
  shouldStore: boolean;
  memoryType: 'fact' | 'preference' | 'experience' | 'relationship' | 'goal' | 'habit' | 'emotion' | 'context';
  importance: number; // 0-1
  emotionalContext: EmotionalSignals;
  environmentalContext: EnvironmentalSignals;
  recallTriggers: string[]; // Keywords that should trigger this memory
  reasoning: string; // Why we're storing this
}

// ============================================================================
// SIGNAL DETECTION: What to Store & When
// ============================================================================

export class MemorySignalDetector {
  
  /**
   * Main entry point: Analyze conversation and decide what to store
   */
  async detectSignals(context: ConversationContext): Promise<MemorySignal[]> {
    const signals: MemorySignal[] = [];
    
    // 1. Extract facts (names, dates, preferences, etc.)
    const factSignals = this.detectFacts(context);
    signals.push(...factSignals);
    
    // 2. Detect emotional moments (important for human-like recall)
    const emotionalSignals = this.detectEmotionalMoments(context);
    signals.push(...emotionalSignals);
    
    // 3. Identify preferences and dislikes
    const preferenceSignals = this.detectPreferences(context);
    signals.push(...preferenceSignals);
    
    // 4. Capture experiences and stories
    const experienceSignals = this.detectExperiences(context);
    signals.push(...experienceSignals);
    
    // 5. Track goals and intentions
    const goalSignals = this.detectGoals(context);
    signals.push(...goalSignals);
    
    // 6. Recognize habits and patterns
    const habitSignals = this.detectHabits(context);
    signals.push(...habitSignals);
    
    return signals.filter(s => s.shouldStore);
  }
  
  // --------------------------------------------------------------------------
  // 1. FACT DETECTION
  // --------------------------------------------------------------------------
  
  private detectFacts(context: ConversationContext): MemorySignal[] {
    const signals: MemorySignal[] = [];
    const message = context.userMessage.toLowerCase();
    
    // Name detection
    const namePatterns = [
      /my name is (\w+)/i,
      /i'?m (\w+)/i,
      /call me (\w+)/i,
      /mera naam (\w+) hai/i,
    ];
    
    for (const pattern of namePatterns) {
      const match = context.userMessage.match(pattern);
      if (match) {
        signals.push({
          shouldStore: true,
          memoryType: 'fact',
          importance: 0.95, // Names are very important
          emotionalContext: this.analyzeEmotion(context),
          environmentalContext: this.getEnvironmentalContext(context),
          recallTriggers: ['name', 'who', 'introduce', 'naam'],
          reasoning: `User's name is ${match[1]}`,
        });
      }
    }
    
    // Birthday detection
    const birthdayPatterns = [
      /my birthday is (.+)/i,
      /born on (.+)/i,
      /mera birthday (.+) hai/i,
    ];
    
    for (const pattern of birthdayPatterns) {
      const match = context.userMessage.match(pattern);
      if (match) {
        signals.push({
          shouldStore: true,
          memoryType: 'fact',
          importance: 0.9,
          emotionalContext: this.analyzeEmotion(context),
          environmentalContext: this.getEnvironmentalContext(context),
          recallTriggers: ['birthday', 'celebrate', 'age', 'born'],
          reasoning: `User's birthday is ${match[1]}`,
        });
      }
    }
    
    // Location detection
    const locationPatterns = [
      /i live in (\w+)/i,
      /i'?m from (\w+)/i,
      /mai (\w+) se hu/i,
      /mai (\w+) mai rehta/i,
    ];
    
    for (const pattern of locationPatterns) {
      const match = context.userMessage.match(pattern);
      if (match) {
        signals.push({
          shouldStore: true,
          memoryType: 'fact',
          importance: 0.8,
          emotionalContext: this.analyzeEmotion(context),
          environmentalContext: this.getEnvironmentalContext(context),
          recallTriggers: ['location', 'where', 'city', 'place', 'kaha'],
          reasoning: `User lives in/from ${match[1]}`,
        });
      }
    }
    
    return signals;
  }
  
  // --------------------------------------------------------------------------
  // 2. EMOTIONAL MOMENT DETECTION
  // --------------------------------------------------------------------------
  
  private detectEmotionalMoments(context: ConversationContext): MemorySignal[] {
    const signals: MemorySignal[] = [];
    const message = context.userMessage.toLowerCase();
    
    // High emotional intensity indicators
    const emotionalPatterns = [
      { pattern: /nervous|scared|dar|ghabra/i, emotion: 'nervous' as const, intensity: 0.8 },
      { pattern: /excited|khushi|happy|yay/i, emotion: 'happy' as const, intensity: 0.8 },
      { pattern: /sad|dukh|upset|cry/i, emotion: 'sad' as const, intensity: 0.8 },
      { pattern: /frustrated|angry|gussa|irritate/i, emotion: 'frustrated' as const, intensity: 0.7 },
      { pattern: /love|pyaar|adore/i, emotion: 'happy' as const, intensity: 0.9 },
    ];
    
    for (const { pattern, emotion, intensity } of emotionalPatterns) {
      if (pattern.test(message)) {
        // Check if there's a specific event mentioned
        const hasEvent = /when|jab|woh din|that time|remember/.test(message);
        
        if (hasEvent) {
          signals.push({
            shouldStore: true,
            memoryType: 'emotion',
            importance: 0.85, // Emotional memories are important
            emotionalContext: {
              userEmotion: emotion,
              emotionalIntensity: intensity,
              emotionalTrigger: context.userMessage,
              sentimentScore: emotion === 'happy' ? 0.8 : emotion === 'sad' ? -0.8 : 0,
            },
            environmentalContext: this.getEnvironmentalContext(context),
            recallTriggers: [emotion, 'feeling', 'emotion', 'remember', 'yaad'],
            reasoning: `Emotional moment detected: ${emotion} with intensity ${intensity}`,
          });
        }
      }
    }
    
    return signals;
  }
  
  // --------------------------------------------------------------------------
  // 3. PREFERENCE DETECTION
  // --------------------------------------------------------------------------
  
  private detectPreferences(context: ConversationContext): MemorySignal[] {
    const signals: MemorySignal[] = [];
    const message = context.userMessage.toLowerCase();
    
    // Like/Love patterns
    const likePatterns = [
      /i like (.+)/i,
      /i love (.+)/i,
      /i enjoy (.+)/i,
      /i prefer (.+)/i,
      /mujhe (.+) pasand hai/i,
      /mai (.+) pasand karta/i,
    ];
    
    for (const pattern of likePatterns) {
      const match = context.userMessage.match(pattern);
      if (match) {
        signals.push({
          shouldStore: true,
          memoryType: 'preference',
          importance: 0.75,
          emotionalContext: this.analyzeEmotion(context),
          environmentalContext: this.getEnvironmentalContext(context),
          recallTriggers: ['like', 'prefer', 'favorite', 'pasand', 'recommendation'],
          reasoning: `User likes: ${match[1]}`,
        });
      }
    }
    
    // Dislike patterns
    const dislikePatterns = [
      /i don'?t like (.+)/i,
      /i hate (.+)/i,
      /i dislike (.+)/i,
      /mujhe (.+) pasand nahi/i,
      /mai (.+) nahi pasand karta/i,
    ];
    
    for (const pattern of dislikePatterns) {
      const match = context.userMessage.match(pattern);
      if (match) {
        signals.push({
          shouldStore: true,
          memoryType: 'preference',
          importance: 0.8, // Dislikes are slightly more important (avoid mistakes)
          emotionalContext: this.analyzeEmotion(context),
          environmentalContext: this.getEnvironmentalContext(context),
          recallTriggers: ['dislike', 'avoid', 'hate', 'nahi pasand'],
          reasoning: `User dislikes: ${match[1]}`,
        });
      }
    }
    
    return signals;
  }
  
  // --------------------------------------------------------------------------
  // 4. EXPERIENCE DETECTION
  // --------------------------------------------------------------------------
  
  private detectExperiences(context: ConversationContext): MemorySignal[] {
    const signals: MemorySignal[] = [];
    const message = context.userMessage.toLowerCase();
    
    // Past experiences
    const experiencePatterns = [
      /i went to (.+)/i,
      /i visited (.+)/i,
      /last time (.+)/i,
      /remember when (.+)/i,
      /yaad hai jab (.+)/i,
      /woh din jab (.+)/i,
    ];
    
    for (const pattern of experiencePatterns) {
      const match = context.userMessage.match(pattern);
      if (match) {
        signals.push({
          shouldStore: true,
          memoryType: 'experience',
          importance: 0.7,
          emotionalContext: this.analyzeEmotion(context),
          environmentalContext: this.getEnvironmentalContext(context),
          recallTriggers: ['remember', 'experience', 'story', 'yaad', 'woh din'],
          reasoning: `User shared experience: ${match[1]}`,
        });
      }
    }
    
    return signals;
  }
  
  // --------------------------------------------------------------------------
  // 5. GOAL DETECTION
  // --------------------------------------------------------------------------
  
  private detectGoals(context: ConversationContext): MemorySignal[] {
    const signals: MemorySignal[] = [];
    const message = context.userMessage.toLowerCase();
    
    const goalPatterns = [
      /i want to (.+)/i,
      /i'?m planning to (.+)/i,
      /i need to (.+)/i,
      /my goal is (.+)/i,
      /mai (.+) karna chahta/i,
      /mujhe (.+) karna hai/i,
    ];
    
    for (const pattern of goalPatterns) {
      const match = context.userMessage.match(pattern);
      if (match) {
        signals.push({
          shouldStore: true,
          memoryType: 'goal',
          importance: 0.8,
          emotionalContext: this.analyzeEmotion(context),
          environmentalContext: this.getEnvironmentalContext(context),
          recallTriggers: ['goal', 'plan', 'want', 'need', 'chahta', 'karna'],
          reasoning: `User's goal: ${match[1]}`,
        });
      }
    }
    
    return signals;
  }
  
  // --------------------------------------------------------------------------
  // 6. HABIT DETECTION
  // --------------------------------------------------------------------------
  
  private detectHabits(context: ConversationContext): MemorySignal[] {
    const signals: MemorySignal[] = [];
    const message = context.userMessage.toLowerCase();
    
    const habitPatterns = [
      /i usually (.+)/i,
      /i always (.+)/i,
      /every day i (.+)/i,
      /my routine (.+)/i,
      /mai hamesha (.+)/i,
      /roz mai (.+)/i,
    ];
    
    for (const pattern of habitPatterns) {
      const match = context.userMessage.match(pattern);
      if (match) {
        signals.push({
          shouldStore: true,
          memoryType: 'habit',
          importance: 0.7,
          emotionalContext: this.analyzeEmotion(context),
          environmentalContext: this.getEnvironmentalContext(context),
          recallTriggers: ['routine', 'habit', 'usually', 'always', 'hamesha', 'roz'],
          reasoning: `User's habit: ${match[1]}`,
        });
      }
    }
    
    return signals;
  }
  
  // --------------------------------------------------------------------------
  // HELPER: Emotion Analysis
  // --------------------------------------------------------------------------
  
  private analyzeEmotion(context: ConversationContext): EmotionalSignals {
    const message = context.userMessage.toLowerCase();
    
    // Emoji detection
    const hasHappyEmoji = /😊|😄|😁|🥰|❤️|💕/.test(context.userMessage);
    const hasSadEmoji = /😢|😭|🥺|😔/.test(context.userMessage);
    const hasExcitedEmoji = /🎉|🎊|✨|🔥/.test(context.userMessage);
    
    // Keyword-based emotion detection
    let emotion: EmotionalSignals['userEmotion'] = 'neutral';
    let intensity = 0.5;
    let sentiment = 0;
    
    if (hasHappyEmoji || /happy|khushi|excited|yay|great|awesome|amazing/.test(message)) {
      emotion = 'happy';
      intensity = 0.8;
      sentiment = 0.8;
    } else if (hasSadEmoji || /sad|dukh|upset|cry|disappointed/.test(message)) {
      emotion = 'sad';
      intensity = 0.7;
      sentiment = -0.7;
    } else if (hasExcitedEmoji || /excited|can'?t wait|omg|wow/.test(message)) {
      emotion = 'excited';
      intensity = 0.9;
      sentiment = 0.9;
    } else if (/nervous|scared|worried|dar|ghabra/.test(message)) {
      emotion = 'nervous';
      intensity = 0.7;
      sentiment = -0.5;
    } else if (/frustrated|angry|annoyed|gussa/.test(message)) {
      emotion = 'frustrated';
      intensity = 0.7;
      sentiment = -0.6;
    } else if (/haha|lol|😂|funny|mazak/.test(message)) {
      emotion = 'playful';
      intensity = 0.6;
      sentiment = 0.6;
    }
    
    return {
      userEmotion: emotion,
      emotionalIntensity: intensity,
      sentimentScore: sentiment,
    };
  }
  
  // --------------------------------------------------------------------------
  // HELPER: Environmental Context
  // --------------------------------------------------------------------------
  
  private getEnvironmentalContext(context: ConversationContext): EnvironmentalSignals {
    const hour = context.timestamp.getHours();
    const day = context.timestamp.getDay();
    const message = context.userMessage.toLowerCase();
    
    // Time of day
    let timeOfDay: EnvironmentalSignals['timeOfDay'];
    if (hour >= 5 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 21) timeOfDay = 'evening';
    else timeOfDay = 'night';
    
    // Detected contexts from message
    const detectedContext: string[] = [];
    
    if (/weather|rain|barish|sunny|cloud/.test(message)) detectedContext.push('weather');
    if (/food|khana|dinner|lunch|breakfast|chai|coffee/.test(message)) detectedContext.push('food');
    if (/work|office|job|meeting|kaam/.test(message)) detectedContext.push('work');
    if (/movie|film|watch|dekh|netflix/.test(message)) detectedContext.push('entertainment');
    if (/chess|game|play|khel/.test(message)) detectedContext.push('games');
    if (/friend|family|mom|dad|sister|brother/.test(message)) detectedContext.push('relationships');
    if (/travel|trip|visit|gaya|gayi/.test(message)) detectedContext.push('travel');
    
    return {
      timeOfDay,
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
      isWeekend: day === 0 || day === 6,
      detectedContext,
    };
  }
}

// ============================================================================
// RECALL SYSTEM: When and How to Surface Memories
// ============================================================================

export interface RecallContext {
  currentMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
  environmentalSignals: EnvironmentalSignals;
  emotionalSignals: EmotionalSignals;
}

export interface RecallStrategy {
  mode: 'hybrid' | 'temporal' | 'graph' | 'hierarchical' | 'ultimate';
  filters: Record<string, any>;
  boost: {
    emotional: boolean;
    temporal: boolean;
    importance: boolean;
  };
  limit: number;
}

export class MemoryRecallSystem {
  
  /**
   * Decide HOW to recall memories based on current context
   */
  determineRecallStrategy(context: RecallContext): RecallStrategy {
    const { currentMessage, emotionalSignals, environmentalSignals } = context;
    const message = currentMessage.toLowerCase();
    
    // 1. Explicit memory queries (user asking to remember)
    if (/remember|yaad|recall|batao|tell me about/.test(message)) {
      return {
        mode: 'ultimate', // Use all techniques
        filters: {},
        boost: {
          emotional: true,
          temporal: true,
          importance: true,
        },
        limit: 5,
      };
    }
    
    // 2. Emotional context (match emotional state)
    if (emotionalSignals.emotionalIntensity > 0.7) {
      return {
        mode: 'hybrid',
        filters: {
          emotional_context: {
            user_emotion: emotionalSignals.userEmotion,
          },
        },
        boost: {
          emotional: true,
          temporal: false,
          importance: true,
        },
        limit: 3,
      };
    }
    
    // 3. Environmental triggers (rain → chai memory)
    if (environmentalSignals.detectedContext.length > 0) {
      return {
        mode: 'graph', // Find connected memories
        filters: {
          keywords: environmentalSignals.detectedContext,
        },
        boost: {
          emotional: true,
          temporal: false,
          importance: false,
        },
        limit: 3,
      };
    }
    
    // 4. Temporal context (time-based recall)
    if (/today|yesterday|last week|pehle|abhi/.test(message)) {
      return {
        mode: 'temporal',
        filters: {},
        boost: {
          emotional: false,
          temporal: true,
          importance: false,
        },
        limit: 5,
      };
    }
    
    // 5. Default: Semantic search
    return {
      mode: 'hybrid',
      filters: {},
      boost: {
        emotional: false,
        temporal: false,
        importance: true,
      },
      limit: 3,
    };
  }
  
  /**
   * Check if we should proactively surface a memory
   */
  shouldProactivelySurface(
    memory: any,
    context: RecallContext
  ): { should: boolean; reason: string } {
    const { environmentalSignals, emotionalSignals } = context;
    
    // Check environmental triggers
    if (memory.recall_triggers) {
      for (const trigger of memory.recall_triggers) {
        if (environmentalSignals.detectedContext.includes(trigger)) {
          return {
            should: true,
            reason: `Environmental trigger: ${trigger}`,
          };
        }
      }
    }
    
    // Check emotional resonance
    if (memory.emotional_context?.user_emotion === emotionalSignals.userEmotion) {
      if (emotionalSignals.emotionalIntensity > 0.6) {
        return {
          should: true,
          reason: `Emotional resonance: ${emotionalSignals.userEmotion}`,
        };
      }
    }
    
    // Check temporal patterns (e.g., morning routine)
    if (memory.memory_type === 'habit') {
      const memoryTime = memory.environmental_context?.timeOfDay;
      if (memoryTime === environmentalSignals.timeOfDay) {
        return {
          should: true,
          reason: `Temporal pattern: ${memoryTime}`,
        };
      }
    }
    
    return { should: false, reason: '' };
  }
}

// Export singleton instances
export const signalDetector = new MemorySignalDetector();
export const recallSystem = new MemoryRecallSystem();
