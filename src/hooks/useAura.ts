import { useState, useCallback, useRef, useEffect } from 'react';
import { getGeminiLiveSession } from '../lib/gemini';
import { float32ToInt16, uint8ArrayToBase64, pcmToFloat32, base64ToUint8Array } from '../lib/audio-utils';

export interface Correction {
  id: string;
  mistake: string;
  correction: string;
  timestamp: number;
}

export interface PronunciationFeedback {
  id: string;
  phrase: string;
  accuracyScore: number;
  feedback: string;
  timestamp: number;
}

export const useAura = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [pronunciationFeedbacks, setPronunciationFeedbacks] = useState<PronunciationFeedback[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const audioInputProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const audioOutputQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);

  const playNextChunk = useCallback(() => {
    if (audioOutputQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const chunk = audioOutputQueueRef.current.shift()!;
    const buffer = audioContextRef.current.createBuffer(1, chunk.length, 24000); // Gemini Live usually outputs at 24kHz or similar
    buffer.copyToChannel(chunk, 0);

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => playNextChunk();
    source.start();
  }, []);

  const handleMessage = useCallback(async (message: any) => {
    // 1. Audio Output
    if (message.serverContent?.modelTurn?.parts) {
      for (const part of message.serverContent.modelTurn.parts) {
        if (part.inlineData?.data) {
          const uint8 = base64ToUint8Array(part.inlineData.data);
          const float32 = pcmToFloat32(uint8);
          audioOutputQueueRef.current.push(float32);
          if (!isPlayingRef.current) {
            playNextChunk();
          }
        }
      }
    }

    // 2. Interruption
    if (message.serverContent?.interrupted) {
      audioOutputQueueRef.current = [];
      // Ideally we'd stop the current source too, but for simplicity skip for now
    }

    // 3. Tool Calls (Corrections)
    if (message.toolCall) {
      for (const call of message.toolCall.functionCalls) {
        if (call.name === 'reportCorrection') {
          const { mistake, correction } = call.args;
          setCorrections(prev => [
            {
              id: Math.random().toString(36).substring(7),
              mistake,
              correction,
              timestamp: Date.now()
            },
            ...prev
          ]);
          
          // Send response back to model
          if (sessionRef.current) {
            sessionRef.current.sendToolResponse({
              functionResponses: [{
                name: 'reportCorrection',
                id: call.id,
                response: { success: true }
              }]
            });
          }
        }

        if (call.name === 'reportPronunciationFeedback') {
          const { phrase, accuracyScore, feedback } = call.args;
          setPronunciationFeedbacks(prev => [
            {
              id: Math.random().toString(36).substring(7),
              phrase,
              accuracyScore,
              feedback,
              timestamp: Date.now()
            },
            ...prev
          ]);

          if (sessionRef.current) {
            sessionRef.current.sendToolResponse({
              functionResponses: [{
                name: 'reportPronunciationFeedback',
                id: call.id,
                response: { success: true }
              }]
            });
          }
        }
      }
    }
  }, [playNextChunk]);

  const startChat = useCallback(async () => {
    try {
      setError(null);
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY not found");

      // Setup Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: 16000 });

      // Request Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Connect to Gemini
      const sessionPromise = getGeminiLiveSession(apiKey, {
        onopen: () => {
          setIsConnected(true);
          setIsListening(true);
          
          // Setup Audio Processor
          const source = audioContextRef.current!.createMediaStreamSource(stream);
          const processor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16Data = float32ToInt16(inputData);
            const base64 = uint8ArrayToBase64(new Uint8Array(int16Data.buffer));
            
            sessionRef.current?.sendRealtimeInput({
              audio: { data: base64, mimeType: 'audio/pcm;rate=16000' }
            });
          };

          source.connect(processor);
          processor.connect(audioContextRef.current!.destination);
          audioInputProcessorRef.current = processor;
        },
        onmessage: handleMessage,
        onclose: () => {
          setIsConnected(false);
          setIsListening(false);
        },
        onerror: (err: any) => {
          console.error("Live API Error:", err);
          setError("Connection error. Please try again.");
        }
      });

      const session = await sessionPromise;
      sessionRef.current = session;

    } catch (err: any) {
      console.error("Start Chat Error:", err);
      setError(err.message || "Failed to start chat.");
    }
  }, [handleMessage]);

  const stopChat = useCallback(() => {
    sessionRef.current?.close();
    audioInputProcessorRef.current?.disconnect();
    streamRef.current?.getTracks().forEach(track => track.stop());
    setIsConnected(false);
    setIsListening(false);
  }, []);

  const sendText = useCallback((text: string) => {
    if (sessionRef.current && isConnected) {
      sessionRef.current.sendRealtimeInput({
        text: text
      });
    }
  }, [isConnected]);

  const clearCorrections = useCallback(() => setCorrections([]), []);
  const clearPronunciationFeedbacks = useCallback(() => setPronunciationFeedbacks([]), []);

  return {
    isConnected,
    isListening,
    corrections,
    pronunciationFeedbacks,
    error,
    startChat,
    stopChat,
    sendText,
    clearCorrections,
    clearPronunciationFeedbacks
  };
};
