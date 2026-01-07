import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { JournalEntry, Insight, RelationshipArchetype, UserPersona } from "../types";

// Helper to initialize AI client just-in-time to avoid race conditions with env vars
const getAI = () => {
  // Use process.env.API_KEY exclusively as per guidelines
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("Belluh AI Error: API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey: apiKey || '' });
};

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
    const prompt = `You are writing a letter from Future ${userName} & ${partnerName} (5 years from now) looking back at where they are today. Based on their current journal entries, extrapolate what their relationship will look like if they continue on this exact trajectory without change.

If the entries show:
- Strong communication, love, positivity, growth → Write about a thriving, deepening partnership
- Distance, less talking, arguments, doubt, coldness → Write about a relationship that drifted apart or ended, serving as a wake-up call
- Mixed signals or uncertainty → Write about a relationship at a crossroads

Make it deeply personal. Mimic their writing style. Be honest but compassionate. This should feel like a genuine letter from their future selves—a reality check or affirmation of where they're headed.

Do not use asterisks, hashtags, or markdown. Make it feel handwritten and authentic.

Entries:
${context}`;

    const response = await retryOperation<GenerateContentResponse>(() => 
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      })
    );
    return response.text || "The future is unwritten. What will you choose?";
  } catch (e) {
    return handleGeminiError(e, "A letter to your future selves...");
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    const aiPromise = retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
            { text: "Transcribe the following audio exactly as spoken. Return ONLY the verbatim transcript. Do not add any introductory or concluding remarks. Do not summarize. Do not use markdown formatting. Just the raw text of what was said." },
          ]
        }
      })
    );

    // Add 20-second timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Transcription timed out")), 20000)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]);
    return response.text || "";
  } catch (e) {
    return handleGeminiError(e, "");
  }
};

export const askBelluhAboutJournal = async (query: string, entries: JournalEntry[]): Promise<string> => {
  try {
    const context = entries.slice(0, 30).map(e => `[${e.authorName}]: ${e.content}`).join('\n');
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Context:\n${context}\n\nQuestion: ${query}`
      })
    );
    return response.text || "I'm not sure, but your bond seems strong.";
  } catch (e) {
    return handleGeminiError(e, "I'm listening...");
  }
};

export const generateRelationshipSummary = async (entries: JournalEntry[]): Promise<string> => {
  try {
    const context = entries.slice(0, 20).map(e => e.content).join('\n');
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide a concise, 2-3 sentence summary of the relationship's current state based on these entries. Be honest but compassionate. Focus on the core emotional trajectory (growing closer, drifting, conflict, or harmony). Keep it brief and glanceable. Do not use hashtags, asterisks, or markdown formatting. Just pure text.\n\nContext:\n${context}`
      })
    );
    return response.text || "You are walking through something together.";
  } catch (e) {
    return handleGeminiError(e, "A moment in your journey...");
  }
};

export const detectPatterns = async (entries: JournalEntry[]): Promise<Insight[]> => {
  try {
    // Require at least some context
    if (entries.length === 0) return [];

    const context = entries.slice(0, 15).map(e => e.content).join('\n');
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Identify patterns in these entries. Return as JSON array of objects with id, title, content, and type. \n\nEntries:\n${context}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
                type: { 
                  type: Type.STRING,
                  enum: ['Weekly', 'Pattern', 'Suggestion', 'Growth', 'Pulse', 'Archetype', 'Spiral', 'Nostalgia']
                },
              },
              required: ['id', 'title', 'content', 'type']
            }
          }
        }
      })
    );
    
    // Fix: Remove Markdown code blocks from JSON response if present
    const rawText = response.text || "[]";
    const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(cleanText);
  } catch (e) {
    console.error("Pattern detection failed:", e);
    return handleGeminiError(e, []);
  }
};

export const chatWithBelluh = async (message: string, history: { role: string, text: string }[], persona: UserPersona): Promise<string> => {
  try {
    const context = history.map(h => `${h.role === 'model' ? 'Belluh' : 'User'}: ${h.text}`).join('\n');
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Persona Style: ${persona}\n\nRecent History:\n${context}\n\nUser: ${message}\nBelluh:`
      })
    );
    return response.text || "Tell me more.";
  } catch (e) {
    return handleGeminiError(e, "I'm here for you.");
  }
};

export const generateDailyReflection = async (entryTexts: string[], persona: UserPersona): Promise<string> => {
  try {
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Reflection for persona ${persona} based on: ${entryTexts.join('\n')}`
      })
    );
    return response.text || "Reflecting on your day...";
  } catch (e) {
    return "A moment of reflection.";
  }
};

export const getRelationshipArchetype = async (entryTexts: string[]): Promise<RelationshipArchetype> => {
  try {
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Determine the archetype for this relationship based on these entries:\n\n${entryTexts.slice(0, 10).join('\n')}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
              strength: { type: Type.STRING },
              growthArea: { type: Type.STRING }
            },
            required: ['name', 'description', 'strength', 'growthArea']
          }
        }
      })
    );
    
    // Fix: Remove Markdown code blocks from JSON response if present
    const rawText = response.text || "{}";
    const cleanText = rawText.replace(/```json\n?|\n?```/g, '').trim();
    
    return JSON.parse(cleanText);
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
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Soften this message while keeping intent: ${text}`
      })
    );
    return response.text || text;
  } catch (e) {
    return text;
  }
};

export const detectPersonaFromEntries = async (entries: any[]): Promise<UserPersona> => {
  try {
    const response = await retryOperation<GenerateContentResponse>(() =>
      getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Match this writing style to ONE of: Kafka, Hemingway, Nietzsche, Fitzgerald, Camus, or Woolf. Return ONLY the name, nothing else.\n\n${entries
          .slice(0, 5)
          .map(e => e.content)
          .join('\n')}`
      })
    );
    const match = response.text?.trim();
    return (match as UserPersona) || UserPersona.Woolf;
  } catch (e) {
    return UserPersona.Woolf;
  }
};