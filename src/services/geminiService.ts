import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { JournalEntry, Insight, RelationshipArchetype, UserPersona } from "../types";

// Always initialize with process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    const prompt = `Write a poetic letter from 'Future ${userName} & ${partnerName}' (5 years from now) based on these entries:\n${context}`;
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    }));
    return response.text || "The future is bright.";
  } catch (e) {
    return handleGeminiError(e, "A letter to your future self...");
  }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
  try {
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() =>
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Audio,
              },
            },
            { text: "Transcribe this audio accurately. Only return the text." },
          ]
        }
      })
    );
    return response.text || "";
  } catch (e) {
    return handleGeminiError(e, "");
  }
};

export const askBelluhAboutJournal = async (query: string, entries: JournalEntry[]): Promise<string> => {
  try {
    const context = entries.slice(0, 30).map(e => `[${e.authorName}]: ${e.content}`).join('\n');
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() =>
      ai.models.generateContent({
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
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() =>
      ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Summarize the growth of this relationship:\n${context}`
      })
    );
    return response.text || "You are growing together.";
  } catch (e) {
    return handleGeminiError(e, "A summary of your journey...");
  }
};

export const detectPatterns = async (entries: JournalEntry[]): Promise<Insight[]> => {
  try {
    const context = entries.slice(0, 15).map(e => e.content).join('\n');
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() =>
      ai.models.generateContent({
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
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return handleGeminiError(e, []);
  }
};

export const chatWithBelluh = async (message: string, history: { role: string, text: string }[], persona: UserPersona): Promise<string> => {
  try {
    // Note: Standard sendMessage doesn't support complex persona in simple call, using generateContent for flexibility
    const context = history.map(h => `${h.role === 'model' ? 'Belluh' : 'User'}: ${h.text}`).join('\n');
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() =>
      ai.models.generateContent({
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
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() =>
      ai.models.generateContent({
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
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() =>
      ai.models.generateContent({
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
    return JSON.parse(response.text || "{}");
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
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() =>
      ai.models.generateContent({
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
    // Explicitly type response to fix "property 'text' does not exist on type unknown"
    const response = await retryOperation<GenerateContentResponse>(() =>
      ai.models.generateContent({
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