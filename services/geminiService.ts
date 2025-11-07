import { GoogleGenAI, Modality, LiveServerMessage, Blob } from "@google/genai";
import type { Attachment, ChatMessage, ModeID } from '../types';
import { MessageAuthor } from '../types';

const fileToGenerativePart = async (attachment: Attachment) => {
    return {
        inlineData: {
            data: attachment.data.split(',')[1], // remove base64 prefix
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

export const startVoiceSession = async (
    systemInstruction: string,
    onTranscriptionUpdate: (isUser: boolean, text: string) => void,
    onTurnComplete: (userInput: string, samOutput: string) => void,
    onError: (error: Error) => void
) => {
    // FIX: Use process.env.API_KEY instead of hardcoded key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let currentInputTranscription = '';
    let currentOutputTranscription = '';
    let nextStartTime = 0;
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);
    const sources = new Set<AudioBufferSourceNode>();

    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
            onopen: () => {
                console.log('Voice session opened.');
                const source = inputAudioContext.createMediaStreamSource(stream);
                const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                    const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                    const pcmBlob = createBlob(inputData);
                    sessionPromise.then((session) => {
                        session.sendRealtimeInput({ media: pcmBlob });
                    });
                };
                source.connect(scriptProcessor);
                scriptProcessor.connect(inputAudioContext.destination);
            },
            onmessage: async (message: LiveServerMessage) => {
                // Handle Transcription
                if (message.serverContent?.outputTranscription) {
                    const text = message.serverContent.outputTranscription.text;
                    currentOutputTranscription += text;
                    onTranscriptionUpdate(false, currentOutputTranscription);
                } else if (message.serverContent?.inputTranscription) {
                    const text = message.serverContent.inputTranscription.text;
                    currentInputTranscription += text;
                    onTranscriptionUpdate(true, currentInputTranscription);
                }

                if (message.serverContent?.turnComplete) {
                    const fullInput = currentInputTranscription;
                    const fullOutput = currentOutputTranscription;
                    onTurnComplete(fullInput, fullOutput);
                    currentInputTranscription = '';
                    currentOutputTranscription = '';
                }

                // Handle Audio Output
                const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                if (base64Audio) {
                    nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
                    const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
                    const source = outputAudioContext.createBufferSource();
                    source.buffer = audioBuffer;
                    source.connect(outputNode);
                    source.addEventListener('ended', () => {
                        sources.delete(source);
                    });
                    source.start(nextStartTime);
                    nextStartTime += audioBuffer.duration;
                    sources.add(source);
                }
                
                if (message.serverContent?.interrupted) {
                     for (const source of sources.values()) {
                        source.stop();
                        sources.delete(source);
                    }
                    nextStartTime = 0;
                }
            },
            onerror: (e: ErrorEvent) => {
                console.error('Voice session error:', e);
                onError(new Error("Hubo un error en la sesión de voz."));
            },
            onclose: (e: CloseEvent) => {
                console.log('Voice session closed.');
                stream.getTracks().forEach(track => track.stop());
                if (inputAudioContext.state !== 'closed') {
                    inputAudioContext.close();
                }
                if (outputAudioContext.state !== 'closed') {
                    outputAudioContext.close();
                }
            },
        },
        config: {
            responseModalities: [Modality.AUDIO],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            systemInstruction: systemInstruction,
        },
    });

    return sessionPromise;
};


// --- Fin de funciones para Live API ---


export const generateImage = async ({
    prompt,
    attachment,
}: {
    prompt: string;
    attachment?: Attachment;
}): Promise<Attachment> => {
    // FIX: Use process.env.API_KEY instead of hardcoded key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const parts: any[] = [{ text: prompt }];
        if (attachment) {
            const imagePart = await fileToGenerativePart(attachment);
            parts.unshift(imagePart);
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                return {
                    name: 'generated-image.png',
                    type: mimeType,
                    data: `data:${mimeType};base64,${base64ImageBytes}`,
                };
            }
        }
        throw new Error("No se generó ninguna imagen.");

    } catch (error) {
        console.error("Error al generar la imagen:", error);
        if (error instanceof Error) {
            throw new Error("No se pudo generar la imagen. " + error.message);
        }
        throw new Error("Ocurrió un error desconocido al generar la imagen.");
    }
};


interface StreamGenerateContentParams {
    prompt: string;
    systemInstruction: string;
    attachment?: Attachment;
    history: ChatMessage[];
    mode: ModeID;
    modelName: string;
    onUpdate: (chunk: string) => void;
    onComplete: (fullText: string, groundingChunks?: any[]) => void;
    onError: (error: Error) => void;
    abortSignal: AbortSignal;
}

export const streamGenerateContent = async ({
    prompt,
    systemInstruction,
    attachment,
    history,
    mode,
    modelName,
    onUpdate,
    onComplete,
    onError,
    abortSignal,
}: StreamGenerateContentParams) => {
    // FIX: Use process.env.API_KEY instead of hardcoded key.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const contents = await Promise.all(history
            .filter(msg => msg.author === MessageAuthor.USER || msg.author === MessageAuthor.SAM)
            .map(async (msg) => {
                const parts: any[] = [{ text: msg.text }];
                if (msg.attachment) {
                    const filePart = await fileToGenerativePart(msg.attachment);
                    parts.unshift(filePart);
                }
                return {
                    role: msg.author === MessageAuthor.USER ? 'user' : 'model',
                    parts: parts,
                };
            }));
        
        const currentUserParts: any[] = [{ text: prompt }];
        if (attachment) {
            const imagePart = await fileToGenerativePart(attachment);
            currentUserParts.unshift(imagePart);
        }
        contents.push({ role: 'user', parts: currentUserParts });

        const config: any = {
            systemInstruction: systemInstruction,
        };

        if (mode === 'search') {
            config.tools = [{googleSearch: {}}];
        }

        const resultStream = await ai.models.generateContentStream({
            model: modelName,
            contents: contents,
            config,
        });

        if (abortSignal.aborted) return;
        
        let fullText = "";
        const rawGroundingChunks: any[] = [];
        
        for await (const chunk of resultStream) {
            if (abortSignal.aborted) {
                console.log("Stream reading aborted.");
                return;
            }
            
            const chunkText = chunk.text;
            if(chunkText) {
                fullText += chunkText;
                onUpdate(chunkText);
            }
            if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
                rawGroundingChunks.push(...chunk.candidates[0].groundingMetadata.groundingChunks);
            }
        }
        
        if (!abortSignal.aborted) {
            // Sanitize grounding chunks to prevent circular structure errors when saving to localStorage.
            const sanitizedGroundingChunks = rawGroundingChunks
                .map(chunk => {
                    if (chunk.web) {
                        return {
                            web: {
                                uri: chunk.web.uri,
                                title: chunk.web.title,
                            },
                        };
                    }
                    return null;
                })
                .filter(Boolean); // remove nulls

            onComplete(fullText, sanitizedGroundingChunks.length > 0 ? sanitizedGroundingChunks : undefined);
        }

    } catch (error) {
        console.error("Error generating content:", error);
        if (error instanceof Error && error.name !== 'AbortError' && !abortSignal.aborted) {
            const customError = new Error("Error de conexión. Por favor, revisa tu conexión a internet e inténtalo de nuevo.");
            onError(customError);
        }
    }
};