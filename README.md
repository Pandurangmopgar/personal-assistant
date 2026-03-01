# Personal Assistant with Long-term Memory

A conversational AI assistant with long-term memory capabilities, built with Next.js and MemoryStack.

## Features

- **Long-term Memory** - Remembers your preferences, conversations, and personal details
- **Context-Aware Responses** - Uses past interactions to provide personalized replies
- **Natural Conversations** - Chat naturally with an AI that understands context
- Real-time messaging interface
- Conversation persistence across sessions
- Proactive memory recall
- Emotional context awareness
- Multiple message types (text, audio, emoji)
- Typing indicators and message status

## Memory Capabilities

The assistant remembers:
- Personal information (name, birthday, preferences)
- Past conversations and topics discussed
- Your interests, hobbies, and goals
- Important facts and experiences you share
- Emotional context from previous interactions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm
- Azure OpenAI API key (or AWS Bedrock)

### Installation

1. Install dependencies:

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file:

```env
# Azure OpenAI (recommended)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
AZURE_OPENAI_DEPLOYMENT=your_deployment_name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# OR AWS Bedrock
AWS_BEDROCK_API_KEY=your_aws_bedrock_api_key
AWS_REGION=us-east-1

# For long-term memory
MEMORYSTACK_API_KEY=your_memorystack_api_key

# For conversation persistence
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

3. Run the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## How It Works

1. User sends a message
2. System retrieves relevant memories from MemoryStack
3. AI generates context-aware response using conversation history + memories
4. New important information is stored for future recall
5. Response is displayed with typing animation

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/           # AI chat endpoint
│   │   │   └── conversation/   # Conversation management
│   │   └── page.tsx
│   ├── components/
│   │   └── WhatsAppClone.tsx   # Main chat interface
│   ├── lib/
│   │   ├── memory.ts           # MemoryStack integration
│   │   ├── proactive-recall.ts # Memory retrieval
│   │   ├── emotional-memory.ts # Emotional context
│   │   └── redis.ts            # Conversation persistence
│   └── styles/
└── package.json
```

## Technologies

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Azure OpenAI / AWS Bedrock** - AI models
- **MemoryStack** - Long-term memory
- **Upstash Redis** - Conversation persistence
- **Tailwind CSS** - Styling

## Build for Production

```bash
npm run build
npm start
```

## License

MIT
