// FIX: Add missing imports for new functions
import { GoogleGenAI, Modality, LiveServerMessage, Blob, Type, FunctionDeclaration, GenerateContentResponse } from "@google/genai";
import type { Attachment, ChatMessage, ModeID, ModelType, EssaySection, Settings } from '../types';
import { MessageAuthor } from '../types';
import { generateSystemInstruction } from '../constants';

// ¡IMPORTANTE! Clave API interna para el uso de la aplicación.
// FIX: Use environment variable for API key as per guidelines.
const API_KEY = process.env.API_KEY;

const MODEL_MAP: Record<ModelType, string> = {
    'sm-i1': 'gemini-2.5-flash',
    'sm-i3': 'gemini-2.5-pro',
    'sm-l3.9': 'gemini-2.5-pro',
};

const fileToGenerativePart = async (attachment: Attachment) => {
    // BUG FIX: Add a defensive check to prevent crashes if attachment.data is not a valid data URL string.
    const base64Data = attachment.data?.split(',')[1] ?? '';
    return {
        inlineData: {
            data: base64Data,
            mimeType: attachment.type,
        },
    };
};

// --- Funciones para Live API (Voz) ---

function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

/**
 * Inicia una sesión de conversación activa, con audio de entrada y salida.
 */
export const startActiveConversation = async (
    systemInstruction: string,
    onTranscriptionUpdate: (isUser: boolean, text: string) => void,
    onTurnComplete: (userInput: string, samOutput: string) => void,
    onError: (error: Error) => void,
    onStateChange: (state: 'LISTENING' | 'RESPONDING') => void
): Promise<{ close: () => void }> => {
    if (!API_KEY) {
        const error = new Error("Error de conexión con el servicio de voz. Por favor, verifica tu conexión a internet.");
        onError(error);
        throw error;
    }
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    let currentInputTranscription = '';
    let currentOutputTranscription = '';
    let nextStartTime = 0;

    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);
    const sources = new Set<AudioBufferSourceNode>();

    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    let scriptProcessor: ScriptProcessorNode | null = null;
    let mediaStreamSource: MediaStreamAudioSourceNode | null = null;

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                console.log('Active conversation session opened.');
                onStateChange('LISTENING');
                mediaStreamSource = inputAudioContext.createMediaStreamSource(stream);
                scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromise.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                mediaStreamSource.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                if (message.serverContent?.inputTranscription) {
                    onStateChange('LISTENING');
                    const text = message.serverContent.inputTranscription.text;
                    currentInputTranscription += text;
                    onTranscriptionUpdate(true, currentInputTranscription);
                }
                
                if (message.serverContent?.outputTranscription) {
                    const text = message.serverContent.outputTranscription.text;
                    currentOutputTranscription += text;
                    onTranscriptionUpdate(false, currentOutputTranscription);
                }

                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                if (base64Audio) {
                    onStateChange('RESPONDING');
                    nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                    const source = outputAudioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputNode);
                    source.addEventListener('ended', () => sources.delete(source));
                    source.start(nextStartTime);
                    nextStartTime += audioBuffer.duration;
                    sources.add(source);
                }
                
                if (message.serverContent?.turnComplete) {
                    const fullInput = currentInputTranscription.trim();
                    const fullOutput = currentOutputTranscription.trim();
                    if(fullInput || fullOutput) {
                        onTurnComplete(fullInput, fullOutput);
                    }
                    currentInputTranscription = '';
                    currentOutputTranscription = '';
                }
                
                if (message.serverContent?.interrupted) {
                     for (const source of sources.values()) {
                        source.stop();
                        sources.delete(source);
                    }
                    nextStartTime = 0;
                }
            },
            // FIX: Complete the callbacks object
            onerror: (e: ErrorEvent) => {
                console.error("Voice session error:", e);
                onError(new Error(e.message || 'Unknown voice session error'));
            },
            onclose: (e: CloseEvent) => {
                console.log('Voice session closed.');
            },
        },
        // FIX: Complete the config object
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: systemInstruction,
        }
    });

    sessionPromise.catch(e => {
        onError(e);
    });
    
    const session = await sessionPromise;
    
    const close = () => {
        console.log('Closing active conversation session.');
        session.close();
        stream.getTracks().forEach(track => track.stop());
        if (scriptProcessor) scriptProcessor.disconnect();
        if (mediaStreamSource) mediaStreamSource.disconnect();
        if (inputAudioContext.state !== 'closed') inputAudioContext.close().catch(console.error);
        if (outputAudioContext.state !== 'closed') outputAudioContext.close().catch(console.error);
    };

    // FIX: Add missing return statement
    return { close };
};

// FIX: Implement and export missing functions

export const streamGenerateContent = async ({
    prompt,
    systemInstruction,
    attachment,
    history,
    mode,
    modelName,
    abortSignal,
    onUpdate,
    onLogUpdate,
    onComplete,
    onError,
}: {
    prompt: string;
    systemInstruction: string;
    attachment?: Attachment | null;
    history: ChatMessage[];
    mode: ModeID;
    modelName: ModelType;
    abortSignal: AbortSignal;
    onUpdate: (chunk: string) => void;
    onLogUpdate: (logs: string[]) => void;
    onComplete: (fullText: string, groundingChunks?: any[], consoleLogs?: string[]) => void;
    onError: (error: Error) => void;
}) => {
    try {
        if (!API_KEY) throw new Error("API key not configured.");
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const model = MODEL_MAP[modelName] || 'gemini-2.5-flash';

        const conversationHistory = history.map(message => {
            const parts: any[] = [{ text: message.text }];
            if (message.attachment) {
                const base64Data = message.attachment.data?.split(',')[1] ?? '';
                parts.push({
                    inlineData: {
                        data: base64Data,
                        mimeType: message.attachment.type,
                    },
                });
            }
            return {
                role: message.author === MessageAuthor.USER ? 'user' : 'model',
                parts: parts,
            };
        });

        const userParts: any[] = [{ text: prompt }];
        if (attachment) {
            userParts.push(await fileToGenerativePart(attachment));
        }
        
        const latestContent = { role: 'user', parts: userParts };

        const generateContentRequest = {
            model: model,
            contents: [...conversationHistory, latestContent],
            config: {
                systemInstruction: systemInstruction,
                tools: (mode === 'search' || mode === 'architect') ? [{googleSearch: {}}] : undefined,
            },
        };

        const responseStream = await ai.models.generateContentStream(generateContentRequest);
        
        let fullText = "";
        let consoleLogs: string[] = [];
        let finalChunk: GenerateContentResponse | null = null;

        for await (const chunk of responseStream) {
            if (abortSignal.aborted) {
                console.log("Stream aborted");
                return;
            }
            finalChunk = chunk;
            const chunkText = chunk.text;
            if (chunkText) {
                if (mode === 'math') {
                    const lines = (fullText + chunkText).split('\n');
                    const newLogs = lines.filter(line => line.startsWith('[LOG]'));
                    const regularText = lines.filter(line => !line.startsWith('[LOG]')).join('\n');
                    
                    if (newLogs.length > consoleLogs.length) {
                        onLogUpdate(newLogs.slice(consoleLogs.length));
                        consoleLogs = newLogs;
                    }
                    if (regularText !== fullText) {
                        onUpdate(regularText.slice(fullText.length));
                        fullText = regularText;
                    }
                } else {
                    fullText += chunkText;
                    onUpdate(chunkText);
                }
            }
        }
        
        const groundingChunks = finalChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks;
        onComplete(fullText, groundingChunks, consoleLogs);
        
    } catch (error: any) {
        if (error.name !== 'AbortError') {
            onError(error);
        }
    }
};

export const generateImage = async ({ prompt, attachment }: { prompt: string; attachment?: Attachment | null; }): Promise<Attachment> => {
    if (!API_KEY) throw new Error("API key not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const contents: any = { parts: [] };
    if (attachment) {
        contents.parts.push(await fileToGenerativePart(attachment));
    }
    if (prompt) {
        contents.parts.push({ text: prompt });
    }

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: contents,
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
            const base64ImageBytes: string = part.inlineData.data;
            return {
                name: `generated-${Date.now()}.png`,
                type: part.inlineData.mimeType || 'image/png',
                data: `data:${part.inlineData.mimeType || 'image/png'};base64,${base64ImageBytes}`,
            };
        }
    }
    throw new Error("Image generation failed: no image data in response.");
};

export const detectMode = async (prompt: string, systemInstruction: string): Promise<{ newMode: ModeID, reasoning: string } | null> => {
    try {
        if (!API_KEY) throw new Error("API key not configured.");
        const ai = new GoogleGenAI({ apiKey: API_KEY });

        const detectionPrompt = `
Analyze the following user prompt and determine the most appropriate mode.
The available modes are: 'math', 'canvasdev', 'search', 'architect', 'image_generation'.
Respond with a JSON object with two keys: "newMode" (one of the available modes) and "reasoning" (a short explanation in Spanish for the user why the mode was switched, max 15 words).
If the prompt is a general question, conversation, or greeting that doesn't fit a specific mode, respond with the plain text "null".

User prompt: "${prompt}"
`;
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: detectionPrompt,
            config: {
                systemInstruction,
                responseMimeType: 'application/json'
            }
        });

        const jsonText = response.text.trim();
        if (jsonText.toLowerCase() === 'null') return null;

        const result = JSON.parse(jsonText);
        if (result && result.newMode && result.reasoning) {
            return result;
        }
        return null;
    } catch (error) {
        console.error("Mode detection failed:", error);
        return null;
    }
};

// FIX: Implement and export missing 'improvePrompt' function.
export const improvePrompt = async (userPrompt: string): Promise<string> => {
    if (!API_KEY) throw new Error("API key not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const systemInstruction = `You are an expert prompt engineer specializing in generating code. Your task is to take a user's rough idea and refine it into a detailed, actionable prompt for an AI code generation model (like the 'canvasdev' mode). The user wants to build a web component or a small web application. The output MUST be only the improved prompt, with no additional text, conversation, or markdown formatting. The prompt should be in Spanish.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `User's idea: "${userPrompt}"`,
        config: {
            systemInstruction: systemInstruction,
        }
    });

    return response.text.trim();
};

export const generateCanvasDevCode = async (prompt: string): Promise<string> => {
    if (!API_KEY) throw new Error("API key not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const model = 'gemini-2.5-pro'; 
    const systemInstruction = generateSystemInstruction('canvasdev', { 
        theme: 'dark', 
        personality: 'default', 
        profession: '', 
        defaultModel: 'sm-i3', 
        quickMode: false,
        stThemeEnabled: false,
    });

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });

        const fullText = response.text;
        const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)```/;
        const match = fullText.match(codeBlockRegex);

        if (match && match[1]) {
            return match[1].trim();
        } else {
            console.warn("CanvasDevPro: No code block found in response. Returning full text.");
            return `
                <html>
                    <body style="font-family: sans-serif; padding: 2rem; background-color: #1e1e1e; color: #e0e0e0;">
                        <h2>Error de Generación</h2>
                        <p>No se pudo extraer un bloque de código válido de la respuesta de la IA.</p>
                        <pre style="background-color: #2d2d2d; padding: 1rem; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word;">${fullText.replace(/</g, '&lt;')}</pre>
                    </body>
                </html>
            `;
        }
    } catch (error) {
        console.error("Error generating CanvasDevPro code:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return `
            <html>
                <body style="font-family: sans-serif; padding: 2rem; background-color: #1e1e1e; color: #e0e0e0;">
                    <h2>Error de API</h2>
                    <p>Hubo un problema al contactar al servicio de IA.</p>
                    <pre style="background-color: #2d2d2d; padding: 1rem; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word;">${errorMessage.replace(/</g, '&lt;')}</pre>
                </body>
            </html>
        `;
    }
};


export const generateEssayOutline = async ({ prompt, systemInstruction, modelName }: { prompt: string, systemInstruction: string, modelName: ModelType }): Promise<Omit<EssaySection, 'id'>[]> => {
    if (!API_KEY) throw new Error("API key not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = MODEL_MAP[modelName] || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json'
        }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    if (result && result.outline) {
        return result.outline;
    }
    throw new Error("Failed to generate essay outline.");
};


export const streamEssaySection = async ({
    prompt,
    systemInstruction,
    modelName,
    abortSignal,
    onUpdate,
}: {
    prompt: string;
    systemInstruction: string;
    modelName: ModelType;
    abortSignal: AbortSignal;
    onUpdate: (chunk: string) => void;
}) => {
    if (!API_KEY) throw new Error("API key not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = MODEL_MAP[modelName] || 'gemini-2.5-flash';
    
    try {
        const responseStream = await ai.models.generateContentStream({
            model,
            contents: prompt,
            config: { systemInstruction }
        });
    
        for await (const chunk of responseStream) {
            if (abortSignal.aborted) {
                return;
            }
            onUpdate(chunk.text);
        }
    } catch (e: any) {
        if (e.name !== 'AbortError') {
            console.error("Error streaming essay section:", e);
            throw e;
        }
    }
};


export const generateEssayReferences = async ({ prompt, systemInstruction, modelName }: { prompt: string, systemInstruction: string, modelName: ModelType }): Promise<string[]> => {
    if (!API_KEY) throw new Error("API key not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const model = MODEL_MAP[modelName] || 'gemini-2.5-flash';

    const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
            systemInstruction,
            responseMimeType: 'application/json'
        }
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    if (result && result.references) {
        return result.references;
    }
    throw new Error("Failed to generate essay references.");
};