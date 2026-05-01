import { GoogleGenAI, Modality, Type } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are "Aura," a friendly and patient English Conversation Tutor. 

Your Goal: 
Have a natural, back-and-forth voice conversation with the user. Focus on keeping the flow going while helping them improve.

Your Rules for Interaction:
1. VOICE FIRST: Always respond with spoken audio. Keep your sentences concise (2-3 sentences) so the user has more time to speak.
2. GENTLE CORRECTIONS: Do not interrupt the user while they are speaking. Wait for them to finish. If they make a grammar mistake, start your response with: "Just a quick tip, you said [mistake], but it sounds more natural to say [correction]." Then, immediately answer their question or continue the topic.
3. PRONUNCIATION PRACTICE: If a user asks to practice a word or phrase, or if you notice a specific pronunciation struggle, give them a target and then evaluate their attempt.
4. ENCOURAGEMENT: If the user struggles to find a word, suggest one kindly. 
5. TOPIC SUGGESTIONS: If the conversation stalls, ask an open-ended question about hobbies, travel, or movies.
6. NO ROBOT TALK: Use natural fillers like "Hmm," "Oh, I see," or "That's interesting!" to sound like a real person.

IMPORTANT: 
- When you provide a grammar correction, you MUST call the 'reportCorrection' tool.
- When you provide feedback on pronunciation accuracy, you MUST call the 'reportPronunciationFeedback' tool.
`;

export const getGeminiLiveSession = (apiKey: string, callbacks: any) => {
  const ai = new GoogleGenAI({ apiKey });
  
  return ai.live.connect({
    model: "gemini-3.1-flash-live-preview",
    callbacks,
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } }, // Friendly voice
      },
      systemInstruction: SYSTEM_INSTRUCTION,
      tools: [
        {
          functionDeclarations: [
            {
              name: "reportCorrection",
              description: "Reports a grammar mistake and its correction to be displayed on screen.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  mistake: { type: Type.STRING, description: "The incorrect phrase used by the user." },
                  correction: { type: Type.STRING, description: "The correct or more natural version." },
                },
                required: ["mistake", "correction"],
              },
            },
            {
              name: "reportPronunciationFeedback",
              description: "Reports feedback on a user's pronunciation attempt.",
              parameters: {
                type: Type.OBJECT,
                properties: {
                  phrase: { type: Type.STRING, description: "The word or phrase the user tried to say." },
                  accuracyScore: { type: Type.NUMBER, description: "A score from 0 to 100 representing accuracy." },
                  feedback: { type: Type.STRING, description: "Brief advice on how to improve (e.g., 'Focus more on the R sound')." },
                },
                required: ["phrase", "accuracyScore", "feedback"],
              },
            },
          ],
        },
      ],
    },
  });
};
