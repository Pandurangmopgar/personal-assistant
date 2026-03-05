// Helper functions for chat API

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  // Force IST — Vercel servers run in US timezone
  const hour = parseInt(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata', hour: 'numeric', hour12: false }));
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

export function formatMemoriesForPrompt(memories: string[]): string {
  if (memories.length === 0) return '';

  return `\n\nRelevant memories about the user:\n${memories.map((m, i) => `${i + 1}. ${m}`).join('\n')}\n\nUse these memories naturally in conversation when appropriate.`;
}

export function getCurrentTimeContext(): string {
  const now = new Date();

  // IMPORTANT: Force IST (India Standard Time) since user is in India
  // Vercel servers run in US timezone, so new Date() gives wrong time
  const istOptions = { timeZone: 'Asia/Kolkata' };

  const dateStr = now.toLocaleDateString('en-US', {
    ...istOptions,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const timeStr = now.toLocaleTimeString('en-US', {
    ...istOptions,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  // Get IST hour for time-of-day calculation
  const istHour = parseInt(now.toLocaleString('en-US', { ...istOptions, hour: 'numeric', hour12: false }));
  const timeOfDay = istHour >= 5 && istHour < 12 ? 'morning'
    : istHour >= 12 && istHour < 17 ? 'afternoon'
      : istHour >= 17 && istHour < 21 ? 'evening'
        : 'night';

  const dayOfWeek = now.toLocaleDateString('en-US', { ...istOptions, weekday: 'long' });
  const dayNum = parseInt(now.toLocaleDateString('en-US', { ...istOptions, weekday: 'narrow' }).charAt(0));
  // Check weekend using IST day
  const istDay = new Date(now.toLocaleString('en-US', istOptions)).getDay();
  const isWeekend = [0, 6].includes(istDay);

  // Build context string
  let context = `Current time (IST): ${dateStr}, ${timeStr}\n`;
  context += `Time of day: ${timeOfDay}\n`;
  context += `Day: ${dayOfWeek}${isWeekend ? ' (weekend)' : ' (weekday)'}\n`;

  // Add contextual information
  if (timeOfDay === 'morning') {
    context += `Context: Subah ka time hai. Log chai/breakfast kar rahe hain, kaam/school ja rahe hain.`;
  } else if (timeOfDay === 'afternoon') {
    context += `Context: Dopahar hai. Log kaam pe hain, lunch kar rahe hain.`;
  } else if (timeOfDay === 'evening') {
    context += `Context: Shaam ho gayi. Log ghar aa rahe hain, dinner, relax.`;
  } else {
    context += `Context: Raat ho gayi hai. Log dinner kar chuke hain, TV dekh rahe hain, sone ki tayyari.`;
  }

  return context;
}

export function getTimeAwareGreeting(): string {
  const timeOfDay = getTimeOfDay();
  const greetings = {
    morning: ['Good morning', 'Subah ho gayi', 'Morning'],
    afternoon: ['Good afternoon', 'Namaste', 'Hey'],
    evening: ['Good evening', 'Shaam ho gayi', 'Evening'],
    night: ['Good night', 'Raat ho gayi', 'Hey'],
  };

  const options = greetings[timeOfDay];
  return options[Math.floor(Math.random() * options.length)];
}
