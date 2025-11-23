
import { GoogleGenAI, Modality, LiveServerMessage, Blob, Type, Tool, GenerateContentResponse } from "@google/genai";
import type { Attachment, ChatMessage, ModeID, ModelType, EssaySection, Settings, ViewID } from '../types';
import { MessageAuthor } from '../types';
import { generateSystemInstruction } from '../constants';
import { VoxelData } from '../typesVoxel';

// --- CONFIGURACIÓN DE CLAVES API (SISTEMA DE ALTA DISPONIBILIDAD) ---
const API_KEYS = [
    'AIzaSyBHdYTVWfwOc1gTn4y4SVYfnE54RBSWEN0', // PRIMARY (Index 0)
    'AIzaSyD7XyzwMKSHYnyLqU--z5fp20oM9_en1rc', // BACKUP 1
    'AIzaSyB0shyePxIHs0XYVLBNGEbWNYMso9RGcQg'  // BACKUP 2
];

const MODEL_MAP: Record<ModelType, string> = {
    'sm-i1': 'gemini-2.5-flash',
    'sm-i3': 'gemini-3-pro-preview',
    'sm-l3': 'gemini-3-pro-preview',
    'sm-l3.9': 'gemini-3-pro-preview',
};

// --- UTILIDADES DE SERVICIO ---

const translateError = (error: any): Error => {
    console.warn("Service Error Debug:", error);
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('quota')) return new Error("Tráfico alto. Reintentando con otro nodo...");
    if (msg.includes('503') || msg.includes('overloaded')) return new Error("Servidores saturados. Buscando ruta alternativa...");
    
    const userFriendlyMessages = [
        "Sam está recalibrando sus conexiones...",
        "La señal es débil, intentando reconectar...",
        "Un momento, procesando solicitud compleja...",
    ];
    return new Error(userFriendlyMessages[Math.floor(Math.random() * userFriendlyMessages.length)]);
};

/**
 * EJECUTOR MAESTRO CON ROTACIÓN DE CLAVES
 * Esta función envuelve cualquier llamada a la API.
 * NO ALEATORIO: Prueba en orden estricto (0 -> 1 -> 2) para priorizar la clave principal.
 */
async function executeWithKeyRotation<T>(operation: (ai: GoogleGenAI) => Promise<T>): Promise<T> {
    // Usamos el orden original para priorizar la clave principal (índice 0)
    const keys = API_KEYS;
    let lastError: any = null;

    for (let i = 0; i < keys.length; i++) {
        const apiKey = keys[i];
        try {
            const ai = new GoogleGenAI({ apiKey });
            // Intentamos la operación con la clave actual
            const result = await operation(ai);
            
            // Si estamos en una clave de respaldo (índice > 0), podríamos loguearlo
            if (i > 0) console.info(`Operación completada usando Backup Node #${i}`);
            
            return result;
        } catch (error: any) {
            console.warn(`Key Index ${i} (...${apiKey.slice(-4)}) failed. Switching to next key. Reason: ${error.message}`);
            lastError = error;
            // NO lanzamos el error, continuamos al siguiente ciclo del bucle
        }
    }

    // Si llegamos aquí, todas las claves fallaron
    console.error("All API keys exhausted.");
    throw lastError || new Error("Servicio no disponible temporalmente. Todas las líneas están ocupadas.");
}

const fileToGenerativePart = async (attachment: Attachment) => {
    const base64Data = attachment.data?.split(',')[1] ?? '';
    return {
        inlineData: {
            data: base64Data,
            mimeType: attachment.type,
        },
    };
};

const applyWatermark = async (base64Data: string): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) { resolve(base64Data); return; }
            ctx.drawImage(img, 0, 0);
            
            const fontSize = Math.max(24, Math.floor(img.width / 25));
            ctx.font = `bold ${fontSize}px sans-serif`;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'; 
            ctx.textAlign = 'right';
            ctx.textBaseline = 'bottom';
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'; 
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.fillText("SAM IA • SM-L1 Generated", canvas.width - fontSize, canvas.height - fontSize);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(base64Data);
        img.src = base64Data;
    });
};

// --- AUDIO UTILS ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
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
  for (let i = 0; i < l; i++) int16[i] = data[i] * 32768;
  return { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
}

// --- TOOLS ---
const appTools: Tool[] = [
    {
        functionDeclarations: [
            { name: 'set_input_text', description: 'Set input box text.', parameters: { type: Type.OBJECT, properties: { text: { type: Type.STRING } }, required: ['text'] } },
            { name: 'send_message', description: 'Send message.', parameters: { type: Type.OBJECT, properties: {} } },
            { name: 'toggle_sidebar', description: 'Toggle sidebar.', parameters: { type: Type.OBJECT, properties: { isOpen: { type: Type.BOOLEAN } }, required: ['isOpen'] } },
            { name: 'change_mode', description: 'Change mode.', parameters: { type: Type.OBJECT, properties: { mode: { type: Type.STRING } }, required: ['mode'] } },
            { name: 'navigate_to_view', description: 'Navigate view.', parameters: { type: Type.OBJECT, properties: { view: { type: Type.STRING } }, required: ['view'] } },
            { name: 'toggle_settings', description: 'Toggle settings.', parameters: { type: Type.OBJECT, properties: { isOpen: { type: Type.BOOLEAN } }, required: ['isOpen'] } },
            { name: 'toggle_updates', description: 'Toggle updates.', parameters: { type: Type.OBJECT, properties: { isOpen: { type: Type.BOOLEAN } }, required: ['isOpen'] } },
            { name: 'scroll_ui', description: 'Scroll UI.', parameters: { type: Type.OBJECT, properties: { target: { type: Type.STRING }, direction: { type: Type.STRING } }, required: ['target', 'direction'] } },
            { name: 'read_last_message', description: 'Read last message.', parameters: { type: Type.OBJECT, properties: {} } },
            { name: 'visual_explain', description: 'Visual explanation.', parameters: { type: Type.OBJECT, properties: { topic: { type: Type.STRING }, points: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ['title', 'description'] } } }, required: ['topic', 'points'] } },
            { name: 'close_visual_explanation', description: 'Close visual explanation.', parameters: { type: Type.OBJECT, properties: {} } }
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

// --- FUNCIONES EXPORTADAS (TODAS USAN ROTACIÓN DE CLAVES) ---

export const startActiveConversation = async (
    systemInstruction: string,
    onTranscriptionUpdate: (isUser: boolean, text: string) => void,
    onTurnComplete: (userInput: string, samOutput: string) => void,
    onError: (error: Error) => void,
    onStateChange: (state: 'LISTENING' | 'RESPONDING' | 'THINKING') => void,
    onVolumeChange: (volume: number) => void,
    toolExecutors: AppToolExecutors 
): Promise<{ close: () => void }> => {
    
    // Audio setup
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);
    const sources = new Set<AudioBufferSourceNode>();
    const analyser = outputAudioContext.createAnalyser();
    analyser.fftSize = 32;
    outputNode.connect(analyser);
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    let animationFrame: number;
    const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for(let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        onVolumeChange((sum / dataArray.length) / 255); 
        animationFrame = requestAnimationFrame(checkVolume);
    };
    checkVolume();

    const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    let scriptProcessor: ScriptProcessorNode | null = null;
    let mediaStreamSource: MediaStreamAudioSourceNode | null = null;

    const fullSystemInstruction = `${systemInstruction}
    IMPORTANT: You are SAM. Control UI with tools. \`visual_explain\` for complex topics (max 20 words desc).`;

    // PRIORITY LOOP FOR VOICE CONNECTION (No shuffle)
    const keys = API_KEYS;
    let sessionPromise: Promise<any> | null = null;

    for (let i = 0; i < keys.length; i++) {
        const apiKey = keys[i];
        try {
            const activeAi = new GoogleGenAI({ apiKey });
            
            const p = activeAi.live.connect({
                model: 'gemini-2.5-flash-native-audio-preview-09-2025',
                callbacks: {
                    onopen: () => {
                        onStateChange('LISTENING');
                        mediaStreamSource = inputAudioContext.createMediaStreamSource(stream);
                        scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
                        scriptProcessor.onaudioprocess = (e) => {
                            const inputData = e.inputBuffer.getChannelData(0);
                            p.then(s => s.sendRealtimeInput({ media: createBlob(inputData) }));
                        };
                        mediaStreamSource.connect(scriptProcessor);
                        scriptProcessor.connect(inputAudioContext.destination);
                    },
                    onmessage: async (msg: LiveServerMessage) => {
                        if (msg.serverContent?.inputTranscription) onTranscriptionUpdate(true, msg.serverContent.inputTranscription.text);
                        if (msg.serverContent?.outputTranscription) onTranscriptionUpdate(false, msg.serverContent.outputTranscription.text);
                        if (msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
                            onStateChange('RESPONDING');
                            const audioBuffer = await decodeAudioData(decode(msg.serverContent.modelTurn.parts[0].inlineData.data), outputAudioContext, 24000, 1);
                            const source = outputAudioContext.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(outputNode);
                            source.addEventListener('ended', () => {
                                sources.delete(source);
                                if(sources.size === 0) onStateChange('LISTENING');
                            });
                            source.start(outputAudioContext.currentTime);
                            sources.add(source);
                        }
                        if (msg.toolCall) {
                            onStateChange('THINKING');
                            const functionResponses: any[] = [];
                            for (const fc of msg.toolCall.functionCalls) {
                                let result: any = { result: "ok" };
                                try {
                                    switch (fc.name) {
                                        case 'set_input_text': toolExecutors.setInputText((fc.args as any).text); break;
                                        case 'send_message': toolExecutors.sendMessage(); break;
                                        case 'toggle_sidebar': toolExecutors.toggleSidebar((fc.args as any).isOpen); break;
                                        case 'change_mode': toolExecutors.changeMode((fc.args as any).mode); break;
                                        case 'navigate_to_view': toolExecutors.navigateToView((fc.args as any).view); break;
                                        case 'toggle_settings': toolExecutors.toggleSettings((fc.args as any).isOpen); break;
                                        case 'toggle_updates': toolExecutors.toggleUpdates((fc.args as any).isOpen); break;
                                        case 'read_last_message': result = { content: toolExecutors.readLastMessage() }; break;
                                        case 'visual_explain': toolExecutors.visualExplain((fc.args as any).topic, (fc.args as any).points); break;
                                        case 'close_visual_explanation': toolExecutors.closeVisualExplanation(); break;
                                        case 'scroll_ui': toolExecutors.scrollUi((fc.args as any).target, (fc.args as any).direction); break;
                                    }
                                } catch (e) { result = { error: "failed" }; }
                                functionResponses.push({ id: fc.id, name: fc.name, response: result });
                            }
                            p.then(s => s.sendToolResponse({ functionResponses }));
                        }
                        if (msg.serverContent?.interrupted) {
                            sources.forEach(s => { s.stop(); sources.delete(s); });
                            onStateChange('LISTENING');
                        }
                    },
                    onerror: (e) => onError(translateError(e)),
                    onclose: () => onStateChange('LISTENING')
                },
                config: {
                    responseModalities: [Modality.AUDIO],
                    speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
                    systemInstruction: fullSystemInstruction,
                    tools: appTools
                }
            });
            
            await p;
            sessionPromise = p;
            break; 
        } catch (e) {
            console.warn(`Voice connection failed with key index ${i}. Retrying...`);
        }
    }

    if (!sessionPromise) {
        const e = new Error("No se pudo conectar a la voz. Intente más tarde.");
        onError(e);
        throw e;
    }

    return {
        close: () => {
            sessionPromise?.then(s => s.close());
            cancelAnimationFrame(animationFrame);
            stream.getTracks().forEach(t => t.stop());
            if (scriptProcessor) scriptProcessor.disconnect();
            if (mediaStreamSource) mediaStreamSource.disconnect();
            inputAudioContext.close();
            outputAudioContext.close();
        }
    };
};

export const streamGenerateContent = async (params: any) => {
    // PRIORITY LOOP FOR STREAM (No shuffle)
    const keys = API_KEYS;
    
    for (let i = 0; i < keys.length; i++) {
        const apiKey = keys[i];
        try {
            const ai = new GoogleGenAI({ apiKey });
            const model = MODEL_MAP[params.modelName as ModelType] || 'gemini-2.5-flash';
            
            const conversationHistory = params.history.map((msg: any) => ({
                role: msg.author === MessageAuthor.USER ? 'user' : 'model',
                parts: msg.attachment 
                    ? [{ text: msg.text }, { inlineData: { data: msg.attachment.data.split(',')[1], mimeType: msg.attachment.type } }] 
                    : [{ text: msg.text }]
            }));
            
            const userParts: any[] = [{ text: params.prompt }];
            if (params.attachment) userParts.push(await fileToGenerativePart(params.attachment));
            
            const req = {
                model,
                contents: [...conversationHistory, { role: 'user', parts: userParts }],
                config: {
                    systemInstruction: params.systemInstruction,
                    tools: (params.mode === 'search' || params.mode === 'architect') ? [{googleSearch: {}}] : undefined,
                    ...params.generationConfig
                }
            };

            const responseStream = await ai.models.generateContentStream(req);
            let fullText = "";
            let logs: string[] = [];
            let finalChunk: any = null;

            for await (const chunk of responseStream) {
                if (params.abortSignal.aborted) return;
                finalChunk = chunk;
                const text = chunk.text || "";
                if (text) {
                    fullText += text;
                    params.onUpdate(text);
                }
            }
            
            const grounding = finalChunk?.candidates?.[0]?.groundingMetadata?.groundingChunks;
            // PASS BACK WHETHER IT WAS A BACKUP KEY (Index > 0)
            const isBackup = i > 0;
            params.onComplete(fullText, grounding, logs, isBackup);
            return; 

        } catch (error: any) {
            if (params.abortSignal.aborted) return;
            console.warn(`Stream Key Index ${i} failed.`, error);
        }
    }
    params.onError(new Error("SAM no responde. Todas las claves fallaron."));
};

// Wrappers usando executeWithKeyRotation

export const generateImage = async ({ prompt, attachment, modelName }: any) => {
    return executeWithKeyRotation(async (ai) => {
        const isPremium = modelName === 'sm-l3';
        if (isPremium) {
            try {
                const response = await ai.models.generateImages({
                    model: 'imagen-4.0-generate-001',
                    prompt,
                    config: { numberOfImages: 1, outputMimeType: 'image/jpeg', aspectRatio: '1:1' },
                });
                return {
                    name: `gen-${Date.now()}.jpg`,
                    type: 'image/jpeg',
                    data: `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`,
                };
            } catch (e) { console.warn("Imagen fallback"); }
        }

        const contents: any = { parts: [{ text: prompt }] };
        if (attachment) contents.parts.push(await fileToGenerativePart(attachment));

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents,
        });

        const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if (part) {
            let url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            if (!isPremium) url = await applyWatermark(url);
            return { name: `gen-${Date.now()}.png`, type: part.inlineData.mimeType, data: url };
        }
        throw new Error("No image data");
    });
};

export const generatePhotosamImage = async ({ prompt, style, mainImage, ingredients }: any) => {
    return executeWithKeyRotation(async (ai) => {
        const parts: any[] = [];
        if (mainImage) parts.push(await fileToGenerativePart(mainImage));
        for (const ing of ingredients) { if (ing) parts.push(await fileToGenerativePart(ing)); }
        
        let text = `Generate/Edit image. Prompt: ${prompt}. Style: ${style}.`;
        parts.push({ text });

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts },
        });
        
        const part = response.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
        if(part) {
            let url = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            url = await applyWatermark(url);
            return { name: `ps-${Date.now()}.png`, type: part.inlineData.mimeType, data: url };
        }
        throw new Error("No image");
    });
};

export const detectMode = async (prompt: string, systemInstruction: string) => {
    return executeWithKeyRotation(async (ai) => {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze prompt: "${prompt}". Modes: math, canvasdev, search, architect, image_generation. Return JSON { "newMode": string, "reasoning": string } or "null".`,
            config: { systemInstruction, responseMimeType: 'application/json' }
        });
        const txt = response.text?.trim();
        return (txt && txt !== "null") ? JSON.parse(txt) : null;
    });
};

export const improvePrompt = async (p: string) => {
    return executeWithKeyRotation(async (ai) => {
        const r = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Improve prompt for code gen: "${p}". Output only prompt.`,
        });
        return r.text || '';
    });
};

export const generateCanvasDevCode = async (p: string) => {
    return executeWithKeyRotation(async (ai) => {
        const r = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: p,
            config: { systemInstruction: generateSystemInstruction('canvasdev', { theme: 'dark', personality: 'default', profession: '', defaultModel: 'sm-i3', quickMode: false, stThemeEnabled: false }) }
        });
        const match = r.text?.match(/```(?:\w+)?\n([\s\S]*?)```/);
        return match ? match[1].trim() : r.text || '';
    });
};

export const generateEssayOutline = async (p: any) => executeWithKeyRotation(async (ai) => {
    const r = await ai.models.generateContent({
        model: MODEL_MAP[p.modelName as ModelType] || 'gemini-2.5-flash',
        contents: p.prompt,
        config: { systemInstruction: p.systemInstruction, responseMimeType: 'application/json' }
    });
    return JSON.parse(r.text || '{}').outline;
});

export const streamEssaySection = async (p: any) => {
    const keys = API_KEYS; // No shuffle
    for (let i = 0; i < keys.length; i++) {
        const apiKey = keys[i];
        try {
            const ai = new GoogleGenAI({ apiKey });
            const stream = await ai.models.generateContentStream({
                model: MODEL_MAP[p.modelName as ModelType] || 'gemini-2.5-flash',
                contents: p.prompt,
                config: { systemInstruction: p.systemInstruction }
            });
            for await (const chunk of stream) {
                if (p.abortSignal.aborted) return;
                p.onUpdate(chunk.text || '');
            }
            return;
        } catch (e) { if(p.abortSignal.aborted) return; }
    }
    throw new Error("Failed to generate section.");
};

export const generateEssayReferences = async (p: any) => executeWithKeyRotation(async (ai) => {
    const r = await ai.models.generateContent({
        model: MODEL_MAP[p.modelName as ModelType] || 'gemini-2.5-flash',
        contents: p.prompt,
        config: { systemInstruction: p.systemInstruction, responseMimeType: 'application/json' }
    });
    return JSON.parse(r.text || '{}').references;
});

export const generateStoryTurn = async (world: string, history: any[], userAction: string) => executeWithKeyRotation(async (ai) => {
    const prompt = `History: ${history.map(h=>`${h.role}: ${h.text}`).join('\n')}\nAction: ${userAction}`;
    const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { systemInstruction: `GM for Echo Realms (${world}). JSON: {narrative, choices, visualPrompt}`, responseMimeType: 'application/json' }
    });
    return JSON.parse(r.text || '{}');
});

export const generateTimeTravelData = async (year: number, location: string) => executeWithKeyRotation(async (ai) => {
    const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `ChronoLense: ${location}, ${year}. JSON: {headline, description, visualPrompt}`,
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(r.text || '{}');
});

export const detectObjectsInFrame = async (base64: string) => executeWithKeyRotation(async (ai) => {
    const r = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: base64 } }, { text: 'Detect objects. JSON Array: [{label, box_2d:[ymin,xmin,ymax,xmax](0-1000)}]' }] },
        config: { responseMimeType: 'application/json' }
    });
    return JSON.parse(r.text || '[]');
});

export const generateVoxelData = async (prompt: string, mode: string, colors: string[]) => executeWithKeyRotation(async (ai) => {
    const context = mode === 'morph' ? `Rebuild with: ${colors.join(', ')}` : `Create new.`;
    const r = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `${context} Voxel Task: "${prompt}". JSON Array {x,y,z,color}`,
        config: { responseMimeType: 'application/json' }
    });
    const raw = JSON.parse(r.text || '[]');
    return raw.map((v: any) => ({
        x: v.x, y: v.y, z: v.z,
        color: parseInt((v.color.startsWith('#') ? v.color.substring(1) : v.color), 16) || 0xCCCCCC
    }));
});