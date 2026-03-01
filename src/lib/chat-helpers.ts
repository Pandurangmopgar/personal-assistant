// Helper functions for chat API

export function getTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
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
  
  // Format: "Wednesday, February 26, 2026, 3:45 PM"
  const dateStr = now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const timeStr = now.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  
  const hour = now.getHours();
  const timeOfDay = getTimeOfDay();
  const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' });
  const isWeekend = [0, 6].includes(now.getDay());
  
  // Build context string
  let context = `Current time: ${dateStr}, ${timeStr}\n`;
  context += `Time of day: ${timeOfDay}\n`;
  context += `Day: ${dayOfWeek}${isWeekend ? ' (weekend)' : ' (weekday)'}\n`;
  
  // Add contextual information
  if (timeOfDay === 'morning') {
    context += `Context: It's morning time. People usually have breakfast, start their day, go to work/school.`;
  } else if (timeOfDay === 'afternoon') {
    context += `Context: It's afternoon. People are usually at work/school, having lunch, or in the middle of their day.`;
  } else if (timeOfDay === 'evening') {
    context += `Context: It's evening. People are usually finishing work, having dinner, relaxing, or spending time with family.`;
  } else {
    context += `Context: It's night time. People are usually winding down, having dinner, watching TV, or preparing for bed.`;
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
