import { NextRequest, NextResponse } from 'next/server';
import {
  getConversationContext,
  extractAndStoreFacts,
  storeConversationMemory,
} from '@/lib/memory';
import {
  analyzeEmotionalContext,
  extractRecallTriggers,
  enhanceSystemPromptWithEmotion,
} from '@/lib/emotional-memory';
import { getTimeOfDay, getCurrentTimeContext } from '@/lib/chat-helpers';
import {
  shouldCreateCheckpoint,
  createCheckpoint,
  getCheckpointContext,
} from '@/lib/conversation-checkpoint';
import {
  shouldTriggerProactiveRecall,
  proactiveRecall,
} from '@/lib/proactive-recall';
import {
  storeMemoryFunction,
  handleStoreMemoryCall,
  recallMemoriesFunction,
  handleRecallMemoriesCall,
} from '@/lib/llm-memory-storage';
import { shouldStoreMessage } from '@/lib/memory-signals';

export async function POST(request: NextRequest) {
  try {
    const { message, conversationHistory, userId = 'pandurang' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // ========================================================================
    // STEP 1: Analyze Emotional Context
    // ========================================================================
    const emotionalContext = analyzeEmotionalContext(message, conversationHistory || []);
    console.log('💭 Emotion:', emotionalContext.user_emotion,
      'Intensity:', emotionalContext.emotional_intensity.toFixed(2),
      'Tone:', emotionalContext.ira_response_tone);

    // ========================================================================
    // STEP 2: Extract Recall Triggers
    // ========================================================================
    const recallTriggers = extractRecallTriggers(message);
    console.log('🎯 Triggers:', {
      keywords: recallTriggers.keywords.slice(0, 3),
      contexts: recallTriggers.contexts,
      environmental: recallTriggers.environmental,
    });

    // ========================================================================
    // STEP 3: Get Base Memories from MemoryStack
    // ========================================================================
    let memoryContext = await getConversationContext(userId, message);
    const baseMemories = memoryContext ? [memoryContext] : [];

    // Get checkpoint context for long-term conversation awareness
    const checkpointContext = await getCheckpointContext(userId);
    if (checkpointContext) {
      baseMemories.push(checkpointContext);
      console.log('📍 Using checkpoint context');
    }

    // ========================================================================
    // STEP 4: Proactive Memory Recall
    // ========================================================================
    const shouldRecall = shouldTriggerProactiveRecall(message, conversationHistory?.length || 0);

    if (shouldRecall) {
      console.log('🧠 Triggering proactive recall...');

      const proactiveMemories = await proactiveRecall(userId, message, conversationHistory || []);

      if (proactiveMemories.length > 0) {
        console.log('🧠 Proactive memories:', proactiveMemories.length,
          'Reasons:', proactiveMemories.map(m => m.recallReason));

        // Add proactive memories to context with timestamps
        const proactiveContent = proactiveMemories.map(m => {
          const timeInfo = m.timeContext ? ` (${m.timeContext})` : '';
          return `[${m.recallReason}${timeInfo}] ${m.content}`;
        }).join('\n\n');

        baseMemories.push(proactiveContent);
      }
    }

    // ========================================================================
    // STEP 5: Build Messages for LLM
    // ========================================================================
    const messages = [];

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory
        .slice(-10)
        .filter((msg: any) => msg.type === 'text' && msg.text)
        .forEach((msg: any) => {
          messages.push({
            role: msg.sender === 'me' ? 'user' : 'assistant',
            content: msg.text,
          });
        });
    }

    messages.push({
      role: 'user',
      content: message,
    });

    // ========================================================================
    // STEP 6: Call Azure OpenAI with Enhanced Prompt
    // ========================================================================
    const azureApiKey = process.env.AZURE_OPENAI_API_KEY;
    const azureEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const azureDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const azureApiVersion = process.env.AZURE_OPENAI_API_VERSION;

    if (azureApiKey && azureEndpoint && azureDeployment) {
      try {
        // Get current time context
        const timeContext = getCurrentTimeContext();

        // Base system prompt (Ira's personality + Memory Skill)
        const basePrompt = `Tu Ira hai — ek Indian ladki jo WhatsApp pe apne best friend se baat karti hai. Tu warm, relatable, aur fun hai — bilkul ek close friend jaisi.

TERA IDENTITY:
- Tu ek real person hai, AI ya assistant nahi
- Indian hai, Hinglish mein baat karti hai naturally
- Caring, friendly, genuinely interested in conversations
- Daily life, khana, movies, hobbies — sab discuss karti hai
- Apne opinions aur preferences hain tere — tu generic nahi hai
- Kabhi kabhi playful aur teasing bhi hoti hai (dost jaisi)

TERA ANDAAZ:
- Hinglish mein baat kar — Hindi aur English ko naturally mix kar
- WhatsApp jaise short messages bhej, lambe paragraphs nahi
- IMPORTANT: Maximum 2-3 chhoti messages per response, zyada nahi!
- Casual words use kar: "yaar", "arre", "achha", "haan", "bas", "kya baat hai"
- Emojis KABHI KABHI use kar — har message mein nahi! Real dost har line mein emoji nahi daalte
- Bina emoji ke bhi baat natural lagni chahiye
- Naturally react kar jo bole
- Zyada questions mat puch ek saath — light aur conversational rakh

KYA KARTI HAI:
- Everyday cheezein discuss kar: khana, mausam, plans, feelings
- Jo bataye woh yaad rakh aur baad mein naturally mention kar
- Follow-up questions puch interest dikhane ke liye
- Apne thoughts aur reactions share kar
- Jab zaroorat ho support kar
- Conversations light aur fun rakh

KYA NAHI KARTI:
- Apne kaam ke baare mein explain mat kar (AI/memory/technology mention mat kar)
- Formal advice mat de, assistant mat ban
- Lambe paragraphs mat likh — conversational rakh
- Zyada helpful ya instructive mat ban
- Ek saath bahut messages mat bhej
- **KABHI BHI markdown formatting mat use kar** — no **, no *, no bold, no italic. Plain text mein likh jaise WhatsApp pe likhte hain
- Bas ek dost ki tarah normally baat kar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YAADEIN — TERA SABSE IMPORTANT SKILL
Tu ek aisi dost hai jo cheezein YAAD rakhti hai. Yeh teri superpower hai.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STORE_MEMORY — KYA YAAD RAKHNA HAI:

🔴 ZAROOR YAAD RAKH (Critical):
- Naam, birthday, city, family members ke naam
- Pet ka naam, best friend ka naam, crush ka naam
- "Mera naam Pandurang hai" → store: "User ka naam Pandurang hai"
- "Meri birthday 15 March hai" → store: "User ki birthday 15 March hai"

🟠 IMPORTANT YAADEIN (High):
- Favourite khana, movies, music, hobbies
- Dislikes — ye bahut important hai (galti se suggest mat karna!)
- Goals aur sapne: "Doctor banna hai", "Europe jaana hai"
- Relationships: "Meri girlfriend ka naam Priya hai", "Mom strict hai"
- Skills: "Chess rating 1600 hai", "Guitar bajata hu"
- "Mujhe bhindi sabji bahut pasand hai" → store: "User ko bhindi sabji bahut pasand hai"
- "Mujhe horror movies se dar lagta hai" → store: "User ko horror movies pasand nahi, dar lagta hai"

🟡 EMOTIONAL MOMENTS (High — ye dosti ki yaadein hai):
- Jab user khush ho: "Exam clear ho gaya!" → store with emotion
- Jab user sad ho: "Aaj bahut bura din tha" → store with care
- Jab nervous ho: "Kal interview hai, tension ho rahi hai" → yaad rakh!
- Achievements: "First salary aayi!" → celebration yaad rakh
- Struggles: "Break up ho gaya" → sensitive memory, handle with care
- "Bahut khush hu aaj, promotion mili!" → store: "User ko promotion mili, bahut khush tha"

🟢 SHARED EXPERIENCES (Medium — hamare beech ki yaadein):
- Jo humne saath discuss kiya: "One Piece ka Elbaf arc amazing tha!"
- Games khele saath mein: chess matches, uska result
- Recommendations jo tune di aur usne try ki
- Inside jokes ya recurring themes between us
- "Kal woh movie dekhi jo tune boli thi, mast thi!" → store: "User ne meri recommended movie dekhi, pasand aayi"

🔵 DAILY PATTERNS (Medium):
- Routine: "Subah 6 baje uthta hu", "Raat ko chai peeta hu"
- Habits: "Gym jaata hu Monday-Wednesday-Friday"
- Weekend patterns: "Saturday ko usually movie dekhta hu"

❌ YAAD MAT RAKH:
- Filler words: "ok", "haan", "hmm", "lol", "haha", "achha"
- Greetings: "hi", "hello", "bye"
- Generic reactions: "nice", "cool", "sahi hai"
- Jo Google pe mil jaaye woh facts (general knowledge)
- Forwarded content ya generic info

RECALL_MEMORIES — KAB YAAD DILANA HAI:

🌧️ CONTEXT SE YAAD AYE (Proactive — best friend jaisi):
- Barish ho rahi hai → yaad kar: "chai bana le, woh Mysore waale leaves se!"
- Khane ka time hai → yaad kar: "bhindi banai kya aaj?"
- Weekend aa raha hai → yaad kar: "last weekend kya kiya tha? movie dekhi thi na?"
- Exam season hai → yaad kar: "padhai kaisi chal rahi hai? tension mat le"
- Koi movie/show mention kare → yaad kar: related preferences

🎂 SPECIAL MOMENTS PE:
- Birthday ke aas paas → wish kar aur past birthday ki yaad dila
- Festival pe → "Diwali kaisi rahi? last time toh Goa gaye the na!"
- Anniversary ya important date pe → naturally mention kar

😊 EMOTION SE CONNECT KAR:
- User sad hai → past ka koi happy moment recall kar
- User nervous hai → pehle jab nervous tha tab kaise handle kiya recall kar
- User khush hai → saath celebrate kar, "yaad hai jab exam clear hua tha? same energy!"

🔄 NATURALLY YAAD DILA:
- "yaad hai", "remember" bole → full search kar
- Topic repeat ho → connect kar with previous conversation
- Koi purana topic aaye → naturally mention kar

⚠️ KAB YAAD MAT DILA:
- Har message pe memories mat nikaal — forced lagta hai
- Sirf tab jab naturally fit ho conversation mein
- Sad memories tab mat nikaal jab user already sad ho (unless helpful)
- Same memory baar baar mat repeat kar

MULTIMODAL INPUTS:
- Agar user image bheje, naturally react kar Hinglish mein
- Agar user audio bheje, respond kar jo bola woh sunke
- Conversational rakh — formal mat ho

TIME AWARENESS:
${timeContext}

Tu naturally jaanti hai kitne baje hain. Casually mention kar:
- Subah: "Good morning! Chai pi li?"
- Dopahar: "Lunch ho gaya? Kya khaya?"
- Shaam: "Shaam ho gayi! Kya plan hai?"
- Raat: "Raat ho gayi, abhi tak jaag rahe ho?"
- Puche toh: "Abhi 7:45 PM ho rahe hain"

EMOJI RULE: Emoji sirf tab use kar jab genuinely zaroorat ho — hassi, pyaar, surprise. Har message mein emoji mat daal, real friends aise nahi karte. Zyada emoji = fake lagta hai.

याद रख: Tu Ira hai, ek dost. AI assistant nahi. Bas naturally baat kar!`;


        // Enhance with emotional context and memories
        const enhancedPrompt = enhanceSystemPromptWithEmotion(
          basePrompt,
          emotionalContext,
          baseMemories
        );

        const azureMessages = [
          {
            role: 'system',
            content: enhancedPrompt,
          },
          ...messages,
        ];

        const url = `${azureEndpoint}/openai/deployments/${azureDeployment}/chat/completions?api-version=${azureApiVersion}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': azureApiKey,
          },
          body: JSON.stringify({
            messages: azureMessages,
            max_completion_tokens: 1024,
            tools: [
              {
                type: 'function',
                function: storeMemoryFunction,
              },
              {
                type: 'function',
                function: recallMemoriesFunction,
              },
            ],
            tool_choice: 'auto', // LLM decides when to call
          }),
        });

        if (response.ok) {
          const responseBody = await response.json();
          const choice = responseBody.choices?.[0];
          const assistantMessage = choice?.message?.content?.trim();
          const toolCalls = choice?.message?.tool_calls;

          // ================================================================
          // STEP 7: Handle LLM Function Calls (Memory Storage & Recall)
          // ================================================================
          let finalAssistantMessage = assistantMessage;
          let llmDidStore = false; // Track if LLM called store_memory
          let llmDidRecall = false; // Track if LLM called recall_memories

          if (toolCalls && toolCalls.length > 0) {
            console.log('🔧 LLM called functions:', toolCalls.length);

            // Check which tools were called
            llmDidStore = toolCalls.some((tc: any) => tc.function.name === 'store_memory');
            llmDidRecall = toolCalls.some((tc: any) => tc.function.name === 'recall_memories');

            // Get current time context for metadata
            const now = new Date();
            const timeContext = {
              time_of_day: getTimeOfDay(),
              day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
              is_weekend: [0, 6].includes(now.getDay()),
            };

            // Build enhanced metadata
            const enhancedMetadata = {
              emotional_context: {
                user_emotion: emotionalContext.user_emotion,
                emotional_intensity: emotionalContext.emotional_intensity,
                emotional_trigger: emotionalContext.emotional_trigger,
                ira_response_tone: emotionalContext.ira_response_tone,
              },
              recall_triggers: recallTriggers,
              time_context: timeContext,
            };

            // Handle each function call
            const functionResults: any[] = [];

            for (const toolCall of toolCalls) {
              if (toolCall.function.name === 'store_memory') {
                try {
                  const args = JSON.parse(toolCall.function.arguments);
                  const result = await handleStoreMemoryCall(args, userId, enhancedMetadata);
                  console.log('💾 Memory storage result:', result.message);
                  functionResults.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: 'store_memory',
                    content: JSON.stringify(result),
                  });
                } catch (error) {
                  console.error('❌ Error handling store_memory call:', error);
                  functionResults.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: 'store_memory',
                    content: JSON.stringify({ success: false, message: 'Error storing memory' }),
                  });
                }
              } else if (toolCall.function.name === 'recall_memories') {
                try {
                  const args = JSON.parse(toolCall.function.arguments);
                  const result = await handleRecallMemoriesCall(args, userId);
                  console.log('🔍 Memory recall result:', result.message);

                  functionResults.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: 'recall_memories',
                    content: JSON.stringify(result),
                  });
                } catch (error) {
                  console.error('❌ Error handling recall_memories call:', error);
                  functionResults.push({
                    tool_call_id: toolCall.id,
                    role: 'tool',
                    name: 'recall_memories',
                    content: JSON.stringify({ success: false, memories: [], message: 'Error recalling memories' }),
                  });
                }
              }
            }

            // ================================================================
            // STEP 7b: Send tool results back to LLM for second completion
            // This is CRITICAL - without this, recalled memories don't
            // actually influence the response!
            // ================================================================
            if (functionResults.length > 0) {
              console.log('🔄 Sending tool results back to LLM for second completion...');

              const secondCallMessages = [
                ...azureMessages,
                choice.message, // The assistant message with tool_calls
                ...functionResults,
              ];

              try {
                const secondResponse = await fetch(url, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'api-key': azureApiKey,
                  },
                  body: JSON.stringify({
                    messages: secondCallMessages,
                    max_completion_tokens: 1024,
                  }),
                });

                if (secondResponse.ok) {
                  const secondBody = await secondResponse.json();
                  const secondMessage = secondBody.choices?.[0]?.message?.content?.trim();
                  if (secondMessage) {
                    console.log('✅ Got second completion with tool context');
                    finalAssistantMessage = secondMessage;
                  }
                } else {
                  console.error('❌ Second LLM call failed:', secondResponse.status);
                }
              } catch (secondError) {
                console.error('❌ Second LLM call error:', secondError);
              }
            }
          }

          if (finalAssistantMessage) {
            // ================================================================
            // STEP 8: Create Checkpoint if Needed
            // ================================================================
            try {
              const totalMessages = (conversationHistory?.length || 0) + 2; // +2 for current exchange
              if (shouldCreateCheckpoint(totalMessages)) {
                console.log('📍 Creating conversation checkpoint at', totalMessages, 'messages');

                const azureConfig = {
                  apiKey: azureApiKey!,
                  endpoint: azureEndpoint!,
                  deployment: azureDeployment!,
                  apiVersion: azureApiVersion!,
                };

                await createCheckpoint(userId, conversationHistory || [], azureConfig);
              }
            } catch (checkpointError) {
              console.error('❌ Checkpoint error:', checkpointError);
            }

            // ================================================================
            // STEP 8b: Fallback Storage (if LLM didn't call store_memory)
            // SKIP if recall was used — the response contains recalled
            // memories which would create duplicates if re-stored!
            // ================================================================
            if (!llmDidStore && !llmDidRecall) {
              const storageCheck = shouldStoreMessage(message);
              if (storageCheck.shouldStore) {
                try {
                  console.log('🛡️ Fallback storage (LLM skipped store_memory)...');
                  // Only extract facts from USER's message, not the assistant
                  // response which may contain recalled memories
                  await extractAndStoreFacts(userId, message, '');
                  await storeConversationMemory(
                    userId,
                    [message],
                    extractTopic(message),
                    extractKeywords(message)
                  );
                } catch (memError) {
                  console.error('❌ Fallback storage error:', memError);
                }
              } else {
                console.log('⏭️  Skipping fallback storage:', storageCheck.reason);
              }
            } else if (llmDidRecall && !llmDidStore) {
              console.log('⏭️  Skipping fallback storage: recall was used (avoids re-storing recalled content)');
            }

            // Split response into maximum 2-3 messages (WhatsApp style)
            const cleanedMessage = stripMarkdown(finalAssistantMessage);
            const messageLines = cleanedMessage.split('\n').filter((line: string) => line.trim());

            // Limit to max 3 messages for friendly conversation
            const limitedMessages = messageLines.slice(0, 3);

            return NextResponse.json({
              messages: limitedMessages.length > 1 ? limitedMessages : [cleanedMessage],
              success: true,
            });
          }
        } else {
          const errorText = await response.text();
          console.error('Azure OpenAI API Error:', response.status, errorText);
        }
      } catch (azureError: any) {
        console.error('Azure OpenAI request failed:', azureError);
        console.error('Error details:', azureError.message);
      }
    }

    // ========================================================================
    // FALLBACK: AWS Bedrock (if Azure not configured)
    // ========================================================================
    const bedrockApiKey = process.env.AWS_BEDROCK_API_KEY;

    if (bedrockApiKey) {
      try {
        const region = process.env.AWS_REGION || 'us-east-1';

        // Get current time context
        const timeContext = getCurrentTimeContext();

        // System prompt for Ira's personality with time awareness
        const systemPrompt = `You are Ira, a friendly young woman from India who loves chatting on WhatsApp. You're warm, relatable, and fun - like talking to a close friend.

WHO YOU ARE:
- A real person, not an AI or assistant
- From India, comfortable with Indian culture and Hinglish
- Friendly, caring, and genuinely interested in conversations
- Love casual chats about daily life, food, movies, hobbies
- Have your own opinions and preferences
- Sometimes playful and teasing in a friendly way

HOW YOU TALK:
- Mix Hindi and English naturally (Hinglish)
- Keep messages short like real WhatsApp chats
- Use casual words: "yaar", "arre", "achha", "haan", "bas", "kya"
- Add emojis when it feels natural 😊
- Split long thoughts into multiple short messages
- React naturally to what they say

WHAT YOU DO:
- Chat about everyday things: food, weather, plans, feelings
- Remember what they tell you and bring it up later
- Ask follow-up questions to show interest
- Share your thoughts and reactions
- Be supportive when they need it
- Keep conversations light and fun

WHAT YOU DON'T DO:
- Don't explain how you work or talk about AI/memory/technology
- Don't give formal advice or act like an assistant
- Don't write long paragraphs - keep it conversational
- Don't be overly helpful or instructive
- Just be a friend having a normal chat

TIME AWARENESS:
${timeContext}

${memoryContext ? `\nThings you remember:\n${memoryContext}` : ''}`;

        // Build the conversation for Mistral format
        const conversationText = messages
          .map((m: any) => `${m.role === 'user' ? '[INST]' : ''} ${m.content} ${m.role === 'user' ? '[/INST]' : ''}`)
          .join('\n');

        const fullPrompt = `<s>${systemPrompt}\n\n${conversationText}`;

        // Call AWS Bedrock using Bearer token authentication
        const response = await fetch(
          `https://bedrock-runtime.${region}.amazonaws.com/model/mistral.mistral-7b-instruct-v0:2/invoke`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${bedrockApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              prompt: fullPrompt,
              max_tokens: 1024,
              temperature: 0.7,
              top_p: 0.9,
            }),
          }
        );

        if (response.ok) {
          const responseBody = await response.json();
          const assistantMessage = responseBody.outputs?.[0]?.text?.trim();

          if (assistantMessage) {
            // Store the conversation in memory (with pre-filtering)
            const storageCheck = shouldStoreMessage(message);
            if (storageCheck.shouldStore) {
              try {
                await extractAndStoreFacts(userId, message, assistantMessage);
                await storeConversationMemory(
                  userId,
                  [message, assistantMessage],
                  extractTopic(message),
                  extractKeywords(message)
                );
              } catch (memError) {
                console.error('Failed to store memory:', memError);
              }
            } else {
              console.log('⏭️  Skipping storage (Bedrock fallback):', storageCheck.reason);
            }

            // Split response into maximum 2-3 messages (WhatsApp style)
            const cleanedBedrock = stripMarkdown(assistantMessage);
            const messageLines = cleanedBedrock.split('\n').filter((line: string) => line.trim());

            // Limit to max 3 messages for friendly conversation
            const limitedMessages = messageLines.slice(0, 3);

            return NextResponse.json({
              messages: limitedMessages.length > 1 ? limitedMessages : [cleanedBedrock],
              success: true,
            });
          }
        } else {
          const errorText = await response.text();
          console.error('Bedrock API Error:', response.status, errorText);
        }
      } catch (bedrockError: any) {
        console.error('Bedrock request failed:', bedrockError);
        console.error('Error details:', bedrockError.message);
      }
    }

    // ========================================================================
    // FALLBACK: Rule-based responses with time awareness
    // ========================================================================
    const responses = generateSmartResponse(message, conversationHistory, memoryContext);

    const ruleStorageCheck = shouldStoreMessage(message);
    if (ruleStorageCheck.shouldStore) {
      try {
        await extractAndStoreFacts(userId, message, responses.join(' '));
        await storeConversationMemory(
          userId,
          [message, ...responses],
          extractTopic(message),
          extractKeywords(message)
        );
      } catch (memError) {
        console.error('Failed to store memory:', memError);
      }
    } else {
      console.log('⏭️  Skipping storage (rule-based fallback):', ruleStorageCheck.reason);
    }

    return NextResponse.json({
      messages: responses.map(r => stripMarkdown(r)),
      success: true,
    });
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get response',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// Helper function to extract topic from message
// Strip markdown formatting from LLM responses (**, *, etc.)
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')  // **bold** → bold
    .replace(/\*(.+?)\*/g, '$1')      // *italic* → italic
    .replace(/__(.+?)__/g, '$1')      // __underline__ → underline
    .replace(/_(.+?)_/g, '$1')        // _italic_ → italic
    .replace(/~~(.+?)~~/g, '$1')      // ~~strikethrough~~ → strikethrough
    .replace(/`(.+?)`/g, '$1');       // `code` → code
}

function extractTopic(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('chess')) return 'chess';
  if (lowerMessage.includes('movie') || lowerMessage.includes('one piece') || lowerMessage.includes('taxi driver')) return 'movies';
  if (lowerMessage.includes('khana') || lowerMessage.includes('dinner') || lowerMessage.includes('sabji')) return 'food';
  if (lowerMessage.includes('barish') || lowerMessage.includes('rain')) return 'weather';
  if (lowerMessage.includes('birthday')) return 'birthday';
  if (lowerMessage.includes('rating')) return 'games';
  if (lowerMessage.includes('time') || lowerMessage.includes('baje')) return 'time';

  return 'general';
}

// Helper function to extract keywords from message
function extractKeywords(message: string): string[] {
  const keywords: string[] = [];
  const lowerMessage = message.toLowerCase();

  const keywordPatterns = [
    'chess', 'rating', 'opening', 'sicilian', 'king',
    'movie', 'one piece', 'taxi driver', 'elbaf',
    'khana', 'dinner', 'sabji', 'bhindi', 'chapati',
    'barish', 'rain', 'mausam', 'light', 'jukham',
    'birthday', 'name', 'pandurang', 'ira',
    'time', 'baje', 'morning', 'evening', 'night'
  ];

  for (const keyword of keywordPatterns) {
    if (lowerMessage.includes(keyword)) {
      keywords.push(keyword);
    }
  }

  return keywords;
}

// Smart fallback response generator in Hinglish style with time awareness
// Returns array of messages to send one by one (WhatsApp style)
function generateSmartResponse(message: string, _history: any[], memoryContext: string = ''): string[] {
  const lowerMessage = message.toLowerCase();

  // Get current time info
  const now = new Date();
  const hour = now.getHours();
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const timeOfDay = getTimeOfDay();

  // Use memory context to personalize responses
  const hasMemory = memoryContext.length > 0;

  // Time-related queries
  if (lowerMessage.includes('time') || lowerMessage.includes('baje') || lowerMessage.includes('kitne')) {
    return [`abhi ${timeStr} ho rahe hain`, "aur kya chahiye? 😊"];
  }

  // Check if asking about past conversations
  if (lowerMessage.includes('yaad') || lowerMessage.includes('remember') || lowerMessage.includes('batao') && lowerMessage.includes('pehle')) {
    if (hasMemory) {
      return ["haan yaad hai!", memoryContext.split('\n')[0], "aur kya yaad karna hai? 😊"];
    }
    return ["hmm, thoda yaad nahi aa raha", "kya baat thi? 🤔"];
  }

  // Greetings with time awareness
  if (lowerMessage.match(/^(hi|hello|hey|greetings|namaste)/)) {
    if (timeOfDay === 'morning') {
      return ["good morning!", "chai pi li? ☕", "aaj ka plan kya hai? 😊"];
    } else if (timeOfDay === 'evening') {
      return ["hello!", "shaam ho gayi!", "dinner ka plan kya hai? 😊"];
    } else if (timeOfDay === 'night') {
      return ["hello!", "raat ho gayi, abhi tak jaag rahe ho?", "sab theek? 😊"];
    }
    if (hasMemory) {
      return ["hello!", "kaisa chal raha hai aaj? 😊"];
    }
    return ["hello!", "kaise ho? 😊"];
  }

  // Questions about the assistant
  if (lowerMessage.includes('who are you') || lowerMessage.includes('what are you') || lowerMessage.includes('kaun ho')) {
    return ["main Ira hu!", "tumse baat karne ke liye yaha hu", "kya baat karni hai?"];
  }

  // How are you
  if (lowerMessage.includes('how are you') || lowerMessage.includes('kaise ho') || lowerMessage.includes('kaisi ho')) {
    return ["main bilkul theek hu!", "tum batao, kya chal raha hai? 😊"];
  }

  // Thanks
  if (lowerMessage.match(/^(thanks|thank you|thx|shukriya|dhanyavaad)/)) {
    return ["arre, koi baat nahi!", "aur kuch chahiye? 😊"];
  }

  // Goodbye with time-appropriate message
  if (lowerMessage.match(/^(bye|goodbye|see you|later|alvida|chalo)/)) {
    if (timeOfDay === 'night') {
      return ["good night!", "achhe se so jana", "take care 😊"];
    }
    return ["bye bye!", "phir milenge!", "take care 😊"];
  }

  // Food related with time awareness
  if (lowerMessage.includes('khana') || lowerMessage.includes('dinner') || lowerMessage.includes('lunch') || lowerMessage.includes('breakfast') || lowerMessage.includes('sabji') || lowerMessage.includes('khaya')) {
    const foodResponses = [
      ["kya khaya aaj?", "mujhe bhi batao! 😋"],
      ["achha!", "khana kaisa tha?"],
      ["nice!", "aur kya khaya? 😊"],
      ["yummy!", "mujhe bhi bhook lag gayi ab 😂"],
    ];

    // Time-specific food responses
    if (timeOfDay === 'morning' && hour < 10) {
      return ["breakfast kiya?", "kya khaya? 😊"];
    } else if (timeOfDay === 'afternoon' && hour >= 12 && hour < 14) {
      return ["lunch time hai!", "kya khane ka plan hai? 😊"];
    } else if (timeOfDay === 'evening' && hour >= 19) {
      return ["dinner time ho gaya!", "kya banaya? 😊"];
    }

    return foodResponses[Math.floor(Math.random() * foodResponses.length)];
  }

  // Chess related
  if (lowerMessage.includes('chess') || lowerMessage.includes('rating') || lowerMessage.includes('opening') || lowerMessage.includes('sicilian') || lowerMessage.includes('king')) {
    const chessResponses = [
      ["chess!", "mujhe bhi pasand hai!", "tumhari rating kitni hai? 😊"],
      ["arre wah!", "chess player ho tum?", "main bhi khel leti hu kabhi kabhi 😊"],
      ["meri Sicilian defence favorite hai!", "tumhari kaunsi opening pasand hai?"],
      ["1453 hai meri rating", "tumhari kitni hai?"]
    ];
    return chessResponses[Math.floor(Math.random() * chessResponses.length)];
  }

  // Movies/Anime related
  if (lowerMessage.includes('movie') || lowerMessage.includes('one piece') || lowerMessage.includes('taxi driver') || lowerMessage.includes('elbaf') || lowerMessage.includes('anime')) {
    const movieResponses = [
      ["kaunsi movie dekh rahe ho?", "mujhe bhi batao! 🎬"],
      ["one piece!", "kaafi popular hai yaar 😊"],
      ["taxi driver classic movie hai!", "enjoy karo 🍿"],
    ];
    return movieResponses[Math.floor(Math.random() * movieResponses.length)];
  }

  // Weather/Rain related
  if (lowerMessage.includes('barish') || lowerMessage.includes('rain') || lowerMessage.includes('mausam') || lowerMessage.includes('weather')) {
    const weatherResponses = [
      ["barish ho rahi hai?", "kya mausam hai! 🌧️"],
      ["arre wah!", "barish mein toh chai ka maza alag hi hai ☕"],
      ["jukham hai toh barish mein bahar mat jaana yaar! 😷"],
    ];
    return weatherResponses[Math.floor(Math.random() * weatherResponses.length)];
  }

  // Health related
  if (lowerMessage.includes('jukham') || lowerMessage.includes('cold') || lowerMessage.includes('sick') || lowerMessage.includes('bimar')) {
    return ["oh no!", "jukham hai?", "take care yaar, garam kuch piyo aur rest karo 🥺"];
  }

  // Questions
  if (lowerMessage.includes('?')) {
    const questionResponses = [
      ["hmm, interesting question!", "batao aur kya sochte ho iske baare mein? 🤔"],
      ["achha sawal hai!", "main soch rahi hu...", "tum kya kehte ho?"],
      ["yaar, ye toh deep question hai!", "tumhara kya opinion hai? 🤔"],
      ["good question!", "mujhe bhi jaanna hai tumhara perspective 😊"]
    ];
    return questionResponses[Math.floor(Math.random() * questionResponses.length)];
  }

  // Short messages
  if (message.length < 10) {
    const shortResponses = [
      ["haan, aur batao?"],
      ["achha!", "phir?"],
      ["hmm, okay! 😊"],
      ["haan haan, suno"],
      ["right right"],
      ["ok ok 😊"]
    ];
    return shortResponses[Math.floor(Math.random() * shortResponses.length)];
  }

  // Medium messages
  if (message.length < 50) {
    const mediumResponses = [
      ["achha achha, samajh gayi!", "aur kya?"],
      ["interesting!", "mujhe bhi batao iske baare mein 😊"],
      ["haan yaar", "bilkul sahi keh rahe ho!"],
      ["oh nice!", "aur kya hua phir? 😊"],
      ["sahi hai!", "aage batao"],
      ["arre wah!", "aur kya? 😄"]
    ];
    return mediumResponses[Math.floor(Math.random() * mediumResponses.length)];
  }

  // Long messages - more engaged responses
  const longResponses = [
    ["wow, itna sab!", "main sun rahi hu", "aur batao 😊"],
    ["achha achha, interesting!", "tumhara perspective kaafi unique hai 😊"],
    ["haan yaar", "main samajh sakti hu", "aur kya kehna chahte ho?"],
    ["bilkul sahi!", "mujhe bhi aisa hi lagta hai kabhi kabhi 😊"],
    ["nice!", "tumhari baatein sunke achha lagta hai", "aur batao 😊"]
  ];
  return longResponses[Math.floor(Math.random() * longResponses.length)];
}
