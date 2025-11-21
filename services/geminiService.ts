
// FIX: Add missing imports for new functions
import { GoogleGenAI, Modality, LiveServerMessage, Blob, Type, FunctionDeclaration, GenerateContentResponse, Tool } from "@google/genai";
import type { Attachment, ChatMessage, ModeID, ModelType, EssaySection, Settings, ViewID } from '../types';
import { MessageAuthor } from '../types';
import { generateSystemInstruction } from '../constants';

// ¡IMPORTANTE! Clave API interna para el uso de la aplicación.
const API_KEY = 'AIzaSyD7XyzwMKSHYnyLqU--z5fp20oM9_en1rc';

const MODEL_MAP: Record<ModelType, string> = {
    'sm-i1': 'gemini-2.5-flash',
    'sm-i3': 'gemini-2.5-pro',
    'sm-l3': 'gemini-2.5-pro',
    'sm-l3.9': 'gemini-2.5-pro',
};

const translateError = (error: any): Error => {
    console.error("Original Gemini Service Error:", error); // Keep original error for debugging
    const userFriendlyMessages = [
        "Parece que hay un problema de conexión. Por favor, inténtalo de nuevo más tarde.",
        "Estamos experimentando dificultades técnicas. El equipo ya está trabajando en ello.",
        "No se pudo completar la solicitud. Esto podría solucionarse en una próxima actualización.",
        "El servicio de IA no está respondiendo en este momento. Verifica tu conexión a internet."
    ];
    const randomIndex = Math.floor(Math.random() * userFriendlyMessages.length);
    return new Error(userFriendlyMessages[randomIndex]);
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

const applyWatermark = async (base64Data: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(base64Data);
                return;
            }
            ctx.drawImage(img, 0, 0);
            
            // Watermark configuration
            const fontSize = Math.max(24, Math.floor(img.width / 25));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; // White with some transparency
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; // Black shadow for visibility
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            // Text to draw
            const text = "SAM IA • SM-L1 Generated";
            const padding = fontSize;
            
            ctx.fillText(text, canvas.width - padding, canvas.height - padding);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (err) => {
             console.error("Error loading image for watermark", err);
             resolve(base64Data); // Fail safe return original
        };
        img.src = base64Data;
    });
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

// --- HERRAMIENTAS (TOOLS) DE LA APP PARA CONTROL POR VOZ ---

const appTools: Tool[] = [
    {
        functionDeclarations: [
            {
                name: 'set_input_text',
                description: 'Escribe texto en la caja de entrada del chat (dictado). Úsalo cuando el usuario te pida "escribir" algo pero no enviarlo todavía.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        text: { type: Type.STRING, description: 'El texto que se debe escribir en la caja de chat.' }
                    },
                    required: ['text']
                }
            },
            {
                name: 'send_message',
                description: 'Envía el mensaje actual que está en la caja de chat. Úsalo cuando el usuario diga "enviar" o confirme el mensaje escrito.',
                parameters: { type: Type.OBJECT, properties: {} }
            },
            {
                name: 'toggle_sidebar',
                description: 'Abre o cierra el menú lateral de la aplicación.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        isOpen: { type: Type.BOOLEAN, description: 'True para abrir, False para cerrar.' }
                    },
                    required: ['isOpen']
                }
            },
            {
                name: 'change_mode',
                description: 'Cambia el modo de operación de SAM. Requiere interactuar con el menú.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        mode: { 
                            type: Type.STRING, 
                            description: 'El ID del modo: "normal", "math", "canvasdev", "search", "image_generation", "architect", "voice".' 
                        }
                    },
                    required: ['mode']
                }
            },
            {
                name: 'navigate_to_view',
                description: 'Navega a una vista específica de la aplicación.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        view: { type: Type.STRING, description: 'El ID del vista: "chat", "canvas", "insights", "documentation", "usage", "canvas_dev_pro", "sam_studios", "voxel_toy_box", "logic_lab".' }
                    },
                    required: ['view']
                }
            },
            {
                name: 'toggle_settings',
                description: 'Abre o cierra el modal de configuración.',
                parameters: { 
                    type: Type.OBJECT, 
                    properties: {
                        isOpen: { type: Type.BOOLEAN, description: 'True para abrir, False para cerrar.' }
                    },
                    required: ['isOpen']
                }
            },
            {
                name: 'toggle_updates',
                description: 'Abre o cierra el modal de novedades/actualizaciones.',
                parameters: { 
                    type: Type.OBJECT, 
                    properties: {
                        isOpen: { type: Type.BOOLEAN, description: 'True para abrir, False para cerrar.' }
                    },
                    required: ['isOpen']
                }
            },
            {
                name: 'scroll_ui',
                description: 'Hace scroll en una sección específica.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        target: { type: Type.STRING, description: '"sidebar", "chat", "settings_content" o "settings_menu".' },
                        direction: { type: Type.STRING, description: '"up" o "down".' }
                    },
                    required: ['target', 'direction']
                }
            },
            {
                name: 'read_last_message',
                description: 'Lee el contenido del último mensaje del chat para entender el contexto o explicar algo que ya se dijo. Úsalo cuando el usuario diga "explica eso" o "qué quisiste decir".',
                parameters: { type: Type.OBJECT, properties: {} }
            },
            {
                name: 'visual_explain',
                description: 'Display a visual dashboard. Params: topic (string), points (array of objects with title and description).',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        topic: { type: Type.STRING },
                        points: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    description: { type: Type.STRING }
                                },
                                required: ['title', 'description']
                            }
                        }
                    },
                    required: ['topic', 'points']
                }
            },
            {
                name: 'close_visual_explanation',
                description: 'Cierra el modo de explicación visual y devuelve el orbe a la esquina.',
                parameters: { type: Type.OBJECT, properties: {} }
            }
        ]
    }
];

export interface AppToolExecutors {
    setInputText: (text: string) => void;
    sendMessage: () => void;
    toggleSidebar: (isOpen: boolean) => void;
    changeMode: (mode: ModeID) => void;
    navigateToView: (view: ViewID) => void;
    toggleSettings: (isOpen: boolean) => void;
    toggleUpdates: (isOpen: boolean) => void;
    toggleCreators: () => void;
    toggleCollaborators: () => void;
    scrollUi: (target: string, direction: 'up' | 'down') => void;
    readLastMessage: () => string;
    visualExplain: (topic: string, points: {title: string, description: string}[]) => void;
    closeVisualExplanation: () => void;
}


/**
 * Inicia una sesión de conversación activa, con audio de entrada y salida + Herramientas.
 */
export const startActiveConversation = async (
    systemInstruction: string,
    onTranscriptionUpdate: (isUser: boolean, text: string) => void,
    onTurnComplete: (userInput: string, samOutput: string) => void,
    onError: (error: Error) => void,
    onStateChange: (state: 'LISTENING' | 'RESPONDING' | 'THINKING') => void,
    onVolumeChange: (volume: number) => void,
    toolExecutors: AppToolExecutors 
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

    // Function to play a subtle "ping" when SAM finishes speaking
    const playListeningCue = () => {
        try {
            const oscillator = outputAudioContext.createOscillator();
            const gainNode = outputAudioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(outputAudioContext.destination);
            
            // Soft sine wave "ding"
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, outputAudioContext.currentTime); // Start at 800Hz
            oscillator.frequency.exponentialRampToValueAtTime(400, outputAudioContext.currentTime + 0.15); // Drop fast
            
            // Volume envelope
            gainNode.gain.setValueAtTime(0.05, outputAudioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, outputAudioContext.currentTime + 0.15);
            
            oscillator.start();
            oscillator.stop(outputAudioContext.currentTime + 0.2);
        } catch (e) {
            // Ignore audio cues if context is suspended or error
        }
    };

    // Analyser for volume visualization
    const analyser = outputAudioContext.createAnalyser();
    analyser.fftSize = 32;
    outputNode.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Loop to check volume
    let animationFrame: number;
    const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const avg = sum / dataArray.length;
        onVolumeChange(avg / 255); // Normalize 0-1
        animationFrame = requestAnimationFrame(checkVolume);
    };
    checkVolume();


    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    let scriptProcessor: ScriptProcessorNode | null = null;
    let mediaStreamSource: MediaStreamAudioSourceNode | null = null;

    // Updated instruction to be aware of tools
    const fullSystemInstruction = `${systemInstruction}
    
    IMPORTANT: You are SAM, an intelligent voice assistant fully integrated into this application.
    - **NATURAL CONTROL**: You can control the UI directly using your tools. No need to explain how you do it, just do it naturally.
    - **CONTEXT AWARE**: Use \`read_last_message\` if the user asks to explain the previous chat response or says "explain that".
    - **VISUAL EXPLANATION**: If the user asks for an explanation, a summary, or to "explain visually", use \`visual_explain\` to move to the center and show a dashboard. 
    - **CRITICAL**: When using \`visual_explain\`, keep the \`description\` for each point SHORT (max 20 words). Long descriptions cause connection errors.
    - **SIDEBAR CONTROL**: To CLOSE the sidebar, use \`toggle_sidebar(false)\`. To OPEN it, use \`toggle_sidebar(true)\`.
    - **PERSONALITY**: Be charming, smart, and helpful. You are the central brain of the app.
    `;

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
                    source.addEventListener('ended', () => {
                        sources.delete(source);
                        if (sources.size === 0) {
                            onStateChange('LISTENING');
                            playListeningCue(); // Play cue when finished speaking
                        }
                    });
                    source.start(nextStartTime);
                    nextStartTime += audioBuffer.duration;
                    sources.add(source);
                }

                // --- HANDLE TOOL CALLS ---
                if (message.toolCall) {
                    onStateChange('THINKING');
                    const functionResponses: any[] = [];
                    
                    for (const fc of message.toolCall.functionCalls) {
                        console.log("Executing tool:", fc.name, fc.args);
                        let result: any = { result: "ok" };
                        
                        try {
                            // Wrap in async to handle the UI delays
                            await (async () => {
                                switch (fc.name) {
                                    case 'set_input_text':
                                        toolExecutors.setInputText((fc.args as any).text);
                                        break;
                                    case 'send_message':
                                        toolExecutors.sendMessage();
                                        break;
                                    case 'toggle_sidebar':
                                        toolExecutors.toggleSidebar((fc.args as any).isOpen);
                                        break;
                                    case 'change_mode':
                                        toolExecutors.changeMode((fc.args as any).mode);
                                        break;
                                    case 'navigate_to_view':
                                        toolExecutors.navigateToView((fc.args as any).view);
                                        break;
                                    case 'toggle_settings':
                                        toolExecutors.toggleSettings((fc.args as any).isOpen);
                                        break;
                                    case 'toggle_updates':
                                        toolExecutors.toggleUpdates((fc.args as any).isOpen);
                                        break;
                                    case 'toggle_creators':
                                        toolExecutors.toggleCreators();
                                        break;
                                    case 'toggle_collaborators':
                                        toolExecutors.toggleCollaborators();
                                        break;
                                    case 'scroll_ui':
                                        toolExecutors.scrollUi((fc.args as any).target, (fc.args as any).direction);
                                        break;
                                    case 'read_last_message':
                                        const lastMsg = toolExecutors.readLastMessage();
                                        result = { last_message_content: lastMsg };
                                        break;
                                    case 'visual_explain':
                                        toolExecutors.visualExplain((fc.args as any).topic, (fc.args as any).points);
                                        break;
                                    case 'close_visual_explanation':
                                        toolExecutors.closeVisualExplanation();
                                        break;
                                    default:
                                        console.warn("Unknown tool call:", fc.name);
                                        result = { result: "error: tool not found" };
                                }
                            })();
                        } catch (e) {
                            console.error("Error executing tool:", e);
                            result = { result: "error executing tool" };
                        }

                        functionResponses.push({
                            id: fc.id,
                            name: fc.name,
                            response: result
                        });
                    }

                    // Send response back to model
                    sessionPromise.then(session => {
                        session.sendToolResponse({ functionResponses });
                    });
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
                    onStateChange('LISTENING');
                }
            },
            onerror: (e: ErrorEvent) => {
                onError(translateError(e));
            },
            onclose: (e: CloseEvent) => {
                console.log('Voice session closed.');
                onStateChange('LISTENING'); // Reset state
            },
        },
        config: {
            responseModalities: [Modality.AUDIO],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: fullSystemInstruction,
            tools: appTools // Inject tools here
        }
    });

    sessionPromise.catch(e => {
        onError(translateError(e));
    });
    
    const session = await sessionPromise;
    
    const close = () => {
        console.log('Closing active conversation session.');
        session.close();
        cancelAnimationFrame(animationFrame);
        stream.getTracks().forEach(track => track.stop());
        if (scriptProcessor) scriptProcessor.disconnect();
        if (mediaStreamSource) mediaStreamSource.disconnect();
        if (inputAudioContext.state !== 'closed') inputAudioContext.close().catch(console.error);
        if (outputAudioContext.state !== 'closed') outputAudioContext.close().catch(console.error);
    };

    return { close };
};

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
    generationConfig,
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
    generationConfig?: {
        temperature?: number;
        topK?: number;
        topP?: number;
        maxOutputTokens?: number;
    };
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
                ...generationConfig // Spread the optional generation config here
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
            onError(translateError(error));
        }
    }
};

export const generateImage = async ({ prompt, attachment, modelName }: { prompt: string; attachment?: Attachment | null; modelName: ModelType }): Promise<Attachment> => {
    if (!API_KEY) throw new Error("API key not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    // CORRECTED LOGIC: Only SM-L3 (the one with purple icon) is premium and gets no watermark.
    const isPremium = modelName === 'sm-l3';

    // Try premium generation first if selected
    if (isPremium) {
        try {
             const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt,
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: '1:1',
                },
            });
            const base64ImageBytes = response.generatedImages[0].image.imageBytes;
            // NO WATERMARK FOR SM-L3
            return {
                name: `generated-imagen-${Date.now()}.jpg`,
                type: 'image/jpeg',
                data: `data:image/jpeg;base64,${base64ImageBytes}`,
            };
        } catch (e) {
             console.warn("Imagen generation failed, falling back to Flash Image", e);
             // Fall through to standard generation, but still no watermark if it was supposed to be premium
        }
    }

    // Standard Generation (Gemini 2.5 Flash Image)
    const contents: any = { parts: [] };
    if (attachment) {
        contents.parts.push(await fileToGenerativePart(attachment));
    }
    if (prompt) {
        contents.parts.push({ text: prompt });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: contents,
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                let mimeType = part.inlineData.mimeType || 'image/png';
                let dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;

                // Apply Watermark ONLY if NOT premium (e.g., SM-I1, SM-I3)
                if (!isPremium) {
                    dataUrl = await applyWatermark(dataUrl);
                }

                return {
                    name: `generated-${Date.now()}.${mimeType.split('/')[1]}`,
                    type: mimeType,
                    data: dataUrl,
                };
            }
        }
        throw new Error("Image generation failed: no image data in response.");
    } catch (error) {
        throw translateError(error);
    }
};

export const generatePhotosamImage = async ({
    prompt,
    style,
    mainImage,
    ingredients
}: {
    prompt: string;
    style: string;
    mainImage: Attachment | null;
    ingredients: (Attachment | null)[];
}): Promise<Attachment> => {
    // Implementation using gemini-2.5-flash-image or imagen
    // Since it involves editing/mixing, flash-image is appropriate as per guidelines for "General Image Generation and Editing Tasks".
    // Guidelines say: Edit Images -> gemini-2.5-flash-image.
    // Prompt should combine style, user prompt, and handle images.
    
    if (!API_KEY) throw new Error("API key not configured.");
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const parts: any[] = [];
    
    // Add main image
    if (mainImage) {
        parts.push(await fileToGenerativePart(mainImage));
    }
    
    // Add ingredients
    for (const ing of ingredients) {
        if (ing) {
             parts.push(await fileToGenerativePart(ing));
        }
    }
    
    // Construct prompt
    let fullPrompt = `Generate an image based on the following instructions: ${prompt}. Style: ${style}.`;
    if (mainImage) {
        fullPrompt = `Edit the first image provided based on this instruction: ${prompt}. Style: ${style}.`;
        if (ingredients.some(i => i !== null)) {
            fullPrompt += " Use the other provided images as visual references/ingredients.";
        }
    } else if (ingredients.some(i => i !== null)) {
        fullPrompt += " Use the provided images as reference.";
    }
    
    parts.push({ text: fullPrompt });

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        const part = response.candidates?.[0]?.content?.parts?.[0];
         if (part && part.inlineData) {
            let mimeType = part.inlineData.mimeType || 'image/png';
            let dataUrl = `data:${mimeType};base64,${part.inlineData.data}`;
            
             // Watermark if needed (reusing logic from existing service if accessible, or just return)
             dataUrl = await applyWatermark(dataUrl);

            return {
                name: `photosam-${Date.now()}.${mimeType.split('/')[1]}`,
                type: mimeType,
                data: dataUrl,
            };
        }
        throw new Error("No image generated.");
    } catch (error) {
         throw translateError(error);
    }
}

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
        console.error("Mode detection failed:", translateError(error).message);
        return null;
    }
};

export const improvePrompt = async (userPrompt: string): Promise<string> => {
    try {
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
    } catch (error) {
        throw translateError(error);
    }
};

export const generateCanvasDevCode = async (prompt: string): Promise<string> => {
    if (!API_KEY) {
        throw new Error("API key not configured.");
    }
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
                        <h2>Error de Formato</h2>
                        <p>La respuesta de la IA no tuvo el formato esperado. Esto puede ser un problema temporal.</p>
                        <pre style="background-color: #2d2d2d; padding: 1rem; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word;">${fullText.replace(/</g, '&lt;')}</pre>
                    </body>
                </html>
            `;
        }
    } catch (error) {
        const translatedError = translateError(error);
        return `
            <html>
                <body style="font-family: sans-serif; padding: 2rem; background-color: #1e1e1e; color: #e0e0e0;">
                    <h2>Error al Generar</h2>
                    <p>${translatedError.message}</p>
                </body>
            </html>
        `;
    }
};


export const generateEssayOutline = async ({ prompt, systemInstruction, modelName }: { prompt: string, systemInstruction: string, modelName: ModelType }): Promise<Omit<EssaySection, 'id'>[]> => {
    try {
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
    } catch (error) {
        throw translateError(error);
    }
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
    try {
        if (!API_KEY) throw new Error("API key not configured.");
        const ai = new GoogleGenAI({ apiKey: API_KEY });
        const model = MODEL_MAP[modelName] || 'gemini-2.5-flash';
        
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
            throw translateError(e);
        }
    }
};


export const generateEssayReferences = async ({ prompt, systemInstruction, modelName }: { prompt: string, systemInstruction: string, modelName: ModelType }): Promise<string[]> => {
    try {
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
    } catch (error) {
        throw translateError(error);
    }
};

export const generateStoryTurn = async (
    world: string,
    history: { role: string, text: string }[],
    userAction: string
): Promise<{ narrative: string, choices: string[], visualPrompt: string }> => {
    if (!API_KEY) throw new Error("API Key Missing");
    const ai = new GoogleGenAI({ apiKey: API_KEY });

    const context = `
        You are the Game Master of a text-based RPG called "Echo Realms".
        Genre: ${world}.
        Your goal is to generate the next turn of the story based on the user's action.
        
        Output Format: JSON only.
        Structure:
        {
            "narrative": "The detailed story text (approx 60-80 words). Immersive and descriptive.",
            "choices": ["Action A", "Action B", "Action C"],
            "visualPrompt": "A concise, artistic description of the current scene for an image generator. No text in image. High quality, ${world} style."
        }
    `;

    // Build history for prompt
    const fullPrompt = `
        History: ${history.map(h => `${h.role}: ${h.text}`).join('\n')}
        User Action: ${userAction}
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt,
        config: {
            systemInstruction: context,
            responseMimeType: 'application/json'
        }
    });

    return JSON.parse(response.text || '{}');
};
