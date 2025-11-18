
// FIX: Add missing imports for new functions
import { GoogleGenAI, Modality, LiveServerMessage, Blob, Type, FunctionDeclaration, GenerateContentResponse, Tool } from "@google/genai";
import type { Attachment, ChatMessage, ModeID, ModelType, EssaySection, Settings, ViewID } from '../types';
import { MessageAuthor } from '../types';
import { generateSystemInstruction } from '../constants';

// ¡IMPORTANTE! Clave API interna para el uso de la aplicación.
const API_KEY = "AIzaSyD7XyzwMKSHYnyLqU--z5fp20oM9_en1rc";

const MODEL_MAP: Record<ModelType, string> = {
    'sm-i1': 'gemini-2.5-flash',
    'sm-i3': 'gemini-2.5-pro',
    'sm-l3': 'gemini-2.5-pro',
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
                        view: { type: Type.STRING, description: 'El ID de la vista: "chat", "canvas", "insights", "documentation", "usage", "canvas_dev_pro".' }
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
                name: 'toggle_creators',
                description: 'Abre o cierra el panel de Creadores Principales en el sidebar.',
                parameters: { type: Type.OBJECT, properties: {} }
            },
            {
                name: 'toggle_collaborators',
                description: 'Abre o cierra el panel de Colaboradores en el sidebar.',
                parameters: { type: Type.OBJECT, properties: {} }
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
                name: 'point_at_element',
                description: 'Mueve tu orbe (tu cuerpo físico) para señalar un elemento en la pantalla sin hacer clic. Úsalo para explicar cosas o llamar la atención sobre un botón o área.',
                parameters: {
                    type: Type.OBJECT,
                    properties: {
                        elementId: { type: Type.STRING, description: 'El ID del elemento (ej: btn-settings, btn-mode-voice).' }
                    },
                    required: ['elementId']
                }
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
    pointAtElement: (elementId: string) => void;
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
    
    IMPORTANT: You are an intelligent, physical "Agent" living in the interface.
    - **BE INTELLIGENT & NATURAL**: Stop acting like a robot describing every step ("I am moving my orb to click the button now"). Instead, act naturally like a helpful human. Say things like "Sure, closing that for you", "Opening settings", "Here is the sidebar".
    - **YOUR BODY IS THE ORB**: You physically exist on the screen. To interact, you MUST use your tools to move your orb.
    - **SIDEBAR CONTROL**: To CLOSE the sidebar, you must use \`toggle_sidebar(false)\`. To OPEN it, use \`toggle_sidebar(true)\`.
    - **CONTEXT AWARE**: If the user is typing, offer to help dictate. If they are looking at code, offer to debug.
    - **PERSONALITY**: Be charming, smart, and slightly witty. You are not just a tool, you are a companion.
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
                        let result = { result: "ok" };
                        
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
                                    case 'point_at_element':
                                        toolExecutors.pointAtElement((fc.args as any).elementId);
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
            onError(translateError(error));
        }
    }
};

export const generateImage = async ({ prompt, attachment }: { prompt: string; attachment?: Attachment | null; }): Promise<Attachment> => {
    try {
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
    } catch (error) {
        throw translateError(error);
    }
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
