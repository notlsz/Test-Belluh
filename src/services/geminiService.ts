import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";
import { JournalEntry, Insight, RelationshipArchetype, UserPersona, ChatMessage, Mood } from "../types";

// Initialize Gemini with the API Key from environment variables (polyfilled by Vite)
const apiKey = process.env.API_KEY || '';
if (!apiKey) {
  console.error("Gemini API Key is missing. Check Vercel Environment Variables.");
}

const ai = new GoogleGenAI({ apiKey });

// Helper to handle errors
const handleGeminiError = (error: any, fallback: any) => {
  console.error("Gemini API Error:", error);
  if (error?.status === 429 || error?.code === 429 || error?.message?.includes("429") || error?.message?.includes("quota")) {
      console.warn("Rate limit exceeded. Returning fallback to prevent crash.");
  }
  return fallback;
};

// Retry helper with exponential backoff
async function retryOperation<T>(operation: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const isRateLimit = error?.status === 429 || error?.code === 429 || error?.message?.includes("429") || error?.message?.includes("quota");
    
    if (retries > 0) {
      // If it's a rate limit, start with a longer delay and back off more aggressively
      const waitTime = isRateLimit ? delay * 2 : delay;
      console.warn(`Retrying operation... Attempts left: ${retries}. Waiting ${waitTime}ms. Error: ${error?.message}`);
      await new Promise(r => setTimeout(r, waitTime));
      // Increase delay for next attempt (exponential backoff)
      return retryOperation(operation, retries - 1, waitTime * 1.5); 
    }
    throw error;
  }
}

export const generateFutureLetter = async (entries: JournalEntry[], userName: string, partnerName: string): Promise<string> => {
    const context = entries.slice(0, 30).map(e => e.content).join('\n');
    try {
        const prompt = `
            Write a letter from "Future ${userName} & ${partnerName}" (5 years from now) to "Current ${userName} & ${partnerName}".
            Based on our journal entries, predict what we overcame and how we grew closer.
            
            TONE: Deeply personal, genuine, authentic, and emotional. Avoid sounding like a corporate AI. Use a literary, novel-like style.
            
            CRITICAL FORMATTING RULES:
            1. DO NOT use asterisks (*) for bolding or italics. Use plain text only.
            2. DO NOT use markdown headers (#).
            3. Use frequent paragraph breaks to create a spacious, poetic reading experience.
            4. Sign it exactly as:
            "With endless love,
            ${userName} & ${partnerName}
            December 2030"
            
            Names: ${userName} and ${partnerName}
            Entries to analyze: ${context}
        `;

        const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        }));

        // Post-processing cleanup just in case
        let text = response.text || "Letter unavailable.";
        text = text.replace(/\*\*/g, '').replace(/\*/g, ''); // Remove all asterisks
        return text;
    } catch (e) {
        return handleGeminiError(e, `Dear ${userName} & ${partnerName},\n\nThe future is unwritten, but it looks bright. Keep going.\n\nLove,\nUs (2030)`);
    }
};

export const transcribeAudio = async (base64Audio: string, mimeType: string): Promise<string> => {
    try {
        const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType, data: base64Audio } },
                    { text: "Transcribe this audio accurately. Only return the transcription text." }
                ]
            }
        }));
        return response.text || "";
    } catch (e) {
        return handleGeminiError(e, "");
    }
};

export const askBelluhAboutJournal = async (query: string, entries: JournalEntry[]): Promise<string> => {
    try {
        const context = entries.map(e => `[${e.timestamp.toLocaleDateString()}] ${e.authorName}: ${e.content}`).join('\n');
        const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are Belluh, an AI relationship coach. Answer the user's question based on their journal entries.
            
            Journal Context:
            ${context}
            
            User Question: ${query}
            
            Answer:`
        }));
        return response.text || "I couldn't find an answer in your journal.";
    } catch (e) {
        return handleGeminiError(e, "I'm having trouble accessing your memories right now.");
    }
};

export const generateRelationshipSummary = async (entries: JournalEntry[]): Promise<string> => {
    try {
        const context = entries.slice(0, 50).map(e => e.content).join('\n');
        const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Summarize the key themes, emotional trajectory, and growth of this relationship based on these entries. Be insightful and poetic.
            
            Entries:
            ${context}`
        }));
        return response.text || "Summary unavailable.";
    } catch (e) {
        return handleGeminiError(e, "Could not generate summary.");
    }
};

export const detectPatterns = async (entries: JournalEntry[]): Promise<Insight[]> => {
    try {
        const context = entries.slice(0, 20).map(e => `[${e.id}] ${e.content}`).join('\n');
        const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze these entries for relationship patterns. Return a JSON array of insights.
            Entries: ${context}`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            content: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['Weekly', 'Pattern', 'Suggestion', 'Growth', 'Pulse', 'Archetype', 'Spiral', 'Nostalgia'] },
                            relatedEntryIds: { type: Type.ARRAY, items: { type: Type.STRING } }
                        }
                    }
                }
            }
        }));
        
        if (response.text) {
             const patterns = JSON.parse(response.text);
             return patterns.map((p: any) => ({
                 ...p,
                 date: new Date(),
                 actionLabel: 'View Insight'
             }));
        }
        return [];
    } catch (e) {
        return handleGeminiError(e, []);
    }
};

export const chatWithBelluh = async (message: string, history: { role: 'user' | 'model', text: string }[], persona: UserPersona): Promise<string> => {
     try {
        const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are Belluh, an AI relationship coach.
            Persona Style: ${persona}
            User: ${message}`
        }));
        return response.text || "I'm listening.";
     } catch (e) {
         return handleGeminiError(e, "I'm having trouble connecting to Belluh.");
     }
}

export const generateDailyReflection = async (entryTexts: string[], persona: UserPersona): Promise<string> => {
     try {
         const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `Generate a short daily reflection based on these entries.
             Persona: ${persona}
             Entries: ${entryTexts.join('\n')}`
         }));
         return response.text || "Reflecting...";
     } catch (e) {
         return "Reflecting on your journey..."; // Fallback text
     }
}

export const getRelationshipArchetype = async (entryTexts: string[]): Promise<RelationshipArchetype> => {
    try {
        const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze these entries and determine the relationship archetype.
            Entries: ${entryTexts.slice(0, 10).join('\n')}`,
             config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        strength: { type: Type.STRING },
                        growthArea: { type: Type.STRING }
                    }
                }
            }
        }));
        if (response.text) return JSON.parse(response.text);
        return { name: "The Builders", description: "Building a life.", strength: "Consistency", growthArea: "Spontaneity" };
    } catch (e) {
        return { name: "The Builders", description: "Building a life.", strength: "Consistency", growthArea: "Spontaneity" };
    }
}

export const softenConflictMessage = async (text: string): Promise<string> => {
     try {
         const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `Rewrite this message to be softer and more compassionate, while keeping the core meaning.
             Message: ${text}`
         }));
         return response.text || text;
     } catch (e) {
         return text; // Return original text on fail
     }
}

export const detectPersonaFromEntries = async (entries: any[]): Promise<UserPersona> => {
     try {
         const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: `Analyze the writing style of these entries and match it to one of these personas: Kafka, Hemingway, Nietzsche, Fitzgerald, Camus, Woolf. Return only the persona name.
             Entries: ${entries.slice(0, 5).map(e => e.content).join('\n')}`
         }));
         const text = response.text?.trim();
         if (text && Object.values(UserPersona).includes(text as UserPersona)) {
             return text as UserPersona;
         }
         return UserPersona.Woolf;
     } catch (e) {
         return UserPersona.Woolf;
     }
}