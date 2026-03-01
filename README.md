# WhatsApp Clone with AI Memory - Next.js

A WhatsApp-style chat interface with conversational AI that remembers your conversations using MemoryStack.

## Features

- **Natural Conversations** - Chat naturally with context-aware AI
- **Long-term Memory** - Remembers your preferences and past conversations
- **Personalized Responses** - Context-aware replies based on your history
- Real-time messaging with conversation history
- Multiple message sending (WhatsApp style)
- Audio message recording
- Emoji picker with contextual emojis
- Message replies
- Typing indicators
- Message status (sent, delivered, read)
- Responsive design

## Memory Features

The AI assistant can remember:
- Your personal information (name, birthday, etc.)
- Your interests and hobbies
- Past conversations and topics
- Your preferences and favorites
- Important facts you share

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm, yarn, or pnpm
- Azure OpenAI API key (or AWS Bedrock)

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Azure OpenAI (recommended)
AZURE_OPENAI_API_KEY=your_azure_openai_api_key
AZURE_OPENAI_ENDPOINT=your_azure_endpoint
AZURE_OPENAI_DEPLOYMENT=your_deployment_name
AZURE_OPENAI_API_VERSION=2024-02-15-preview

# OR AWS Bedrock
AWS_BEDROCK_API_KEY=your_aws_bedrock_api_key
AWS_REGION=us-east-1

# Optional: For long-term memory features
MEMORYSTACK_API_KEY=your_memorystack_api_key

# Optional: For conversation persistence
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
```

For detailed setup guides:
- MemoryStack: [MEMORYSTACK_SETUP.md](./MEMORYSTACK_SETUP.md)
- AWS Bedrock: [AWS_BEDROCK_SETUP.md](./AWS_BEDROCK_SETUP.md)

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How It Works

The app uses AI models (Azure OpenAI or AWS Bedrock) to generate conversational responses. When you send a message:

1. Your message is sent to the Next.js API route (`/api/chat`)
2. The API includes conversation context and retrieved memories
3. The AI processes the conversation and generates a response
4. The response appears in the chat interface with typing animation

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/           # AI chat endpoint
│   │   │   └── conversation/   # Conversation management
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   └── WhatsAppClone.tsx   # Main chat component
│   ├── lib/
│   │   ├── memory.ts           # MemoryStack integration
│   │   ├── proactive-recall.ts # Memory retrieval
│   │   ├── emotional-memory.ts # Emotional context
│   │   └── redis.ts            # Conversation persistence
│   └── styles/
│       └── globals.css
├── .env.local                  # Environment variables (create this)
└── package.json
```

## Technologies Used

- **Next.js 15** - React framework with API routes
- **React 19** - UI library
- **TypeScript** - Type safety
- **Azure OpenAI / AWS Bedrock** - AI models
- **MemoryStack** - Long-term memory
- **Upstash Redis** - Conversation persistence
- **Tailwind CSS** - Styling
- **Motion** - Animations
- **Lucide React** - Icons

## Build for Production

```bash
npm run build
npm start
```

## License

MIT
