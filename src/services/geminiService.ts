import { GoogleGenerativeAI } from "@google/generative-ai";
import { JournalEntry, Insight, RelationshipArchetype, UserPersona } from "../types";

// Initialize with Vite env variable
const apiKey = import.meta.env?.VITE_GOOGLE_API_KEY;
if (!apiKey) {
  throw new Error("Missing VITE_GOOGLE_API_KEY. Set VITE_GOOGLE_API_KEY in Vercel env vars.");
}
const genAI = new GoogleGenerativeAI(apiKey);

// Helper to handle errors gracefully
const handleGeminiError = (error: any, fallback: any) => {
  console.error("Gemini API Error:", error);
  return fallback;
};

// Retry helper with exponential backoff for rate limits
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes("429");
    if (retries > 0) {
      const waitTime = isRateLimit ? delay * 2 : delay;
      await new Promise(r => setTimeout(r, waitTime));
      return retryOperation(operation, retries - 1, waitTime * 1.5);
    }
    throw error;
  }
}

export const generateFutureLetter = async (entries: JournalEntry[], userName: string, partnerName: string): Promise<string> => {
  const context = entries.slice(0, 20).map(e => e.content).join('\n');
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = `Write a poetic letter from 'Future ${userName} & ${partnerName}' (5 years from now) based on these entries:\n${context}`;
    const result = await retryOperation(() => model.generateContent(prompt));
    return result.response.text() || "The future is bright.";
  } catch (e) {
    return handleGeminiError(e, "A letter to your future self...");
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await retryOperation(() =>
      model.generateContent([
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Audio,
          },
        },
        "Transcribe this audio accurately. Only return the text.",
      ])
    );
    return result.response.text() || "";
  } catch (e) {
    return handleGeminiError(e, "");
  }
};

export const askBelluhAboutJournal = async (query: string, entries: JournalEntry[]): Promise<string> => {
  try {
    const context = entries.slice(0, 30).map(e => `[${e.authorName}]: ${e.content}`).join('\n');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await retryOperation(() =>
      model.generateContent(`Context:\n${context}\n\nQuestion: ${query}`)
    );
    return result.response.text() || "I'm not sure, but your bond seems strong.";
  } catch (e) {
    return handleGeminiError(e, "I'm listening...");
  }
};

export const generateRelationshipSummary = async (entries: JournalEntry[]): Promise<string> => {
  try {
    const context = entries.slice(0, 20).map(e => e.content).join('\n');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await retryOperation(() =>
      model.generateContent(`Summarize the growth of this relationship:\n${context}`)
    );
    return result.response.text() || "You are growing together.";
  } catch (e) {
    return handleGeminiError(e, "A summary of your journey...");
  }
};

export const detectPatterns = async (entries: JournalEntry[]): Promise<Insight[]> => {
  try {
    const context = entries.slice(0, 15).map(e => e.content).join('\n');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await retryOperation(() =>
      model.generateContent([
        `Identify patterns in these entries. Return as JSON array of objects with id, title, content, and type. JSON only, no markdown.`,
        `\n${context}`,
      ])
    );
    return JSON.parse(result.response.text() || "[]");
  } catch (e) {
    return handleGeminiError(e, []);
  }
};

export const chatWithBelluh = async (message: string, _history: any[], persona: UserPersona): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await retryOperation(() =>
      model.generateContent(`Persona: ${persona}. User: ${message}`)
    );
    return result.response.text() || "Tell me more.";
  } catch (e) {
    return handleGeminiError(e, "I'm here for you.");
  }
};

export const generateDailyReflection = async (entryTexts: string[], persona: UserPersona): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await retryOperation(() =>
      model.generateContent(`Reflection for persona ${persona} based on: ${entryTexts.join('\n')}`)
    );
    return result.response.text() || "Reflecting on your day...";
  } catch (e) {
    return "A moment of reflection.";
  }
};

export const getRelationshipArchetype = async (entryTexts: string[]): Promise<RelationshipArchetype> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await retryOperation(() =>
      model.generateContent([
        `Determine the archetype for this relationship. Return ONLY valid JSON with properties: name, description, strength, growthArea. No markdown, no explanation.`,
        `\n${entryTexts.slice(0, 10).join('\n')}`,
      ])
    );
    return JSON.parse(result.response.text() || "{}");
  } catch (e) {
    return {
      name: "Partners",
      description: "Walking together",
      strength: "Resilience",
      growthArea: "Communication",
    };
  }
};

export const softenConflictMessage = async (text: string): Promise<string> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await retryOperation(() =>
      model.generateContent(`Soften this message while keeping intent: ${text}`)
    );
    return result.response.text() || text;
  } catch (e) {
    return text;
  }
};

export const detectPersonaFromEntries = async (entries: any[]): Promise<UserPersona> => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await retryOperation(() =>
      model.generateContent(
        `Match this writing style to ONE of: Kafka, Hemingway, Nietzsche, Fitzgerald, Camus, or Woolf. Return ONLY the name, nothing else.\n\n${entries
          .slice(0, 5)
          .map(e => e.content)
          .join('\n')}`
      )
    );
    const match = result.response.text()?.trim();
    return (match as UserPersona) || UserPersona.Woolf;
  } catch (e) {
    return UserPersona.Woolf;
  }
};
