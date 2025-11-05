import type { Mode, ModeID, Personality, Settings } from './types';
import {
    SparklesIcon,
    CalculatorIcon,
    CodeBracketIcon,
    MagnifyingGlassIcon,
    PhotoIcon,
    DocumentTextIcon,
    BookOpenIcon,
    ArrowUpTrayIcon,
    CameraIcon,
    AcademicCapIcon,
} from './components/icons';

export const MODES: Mode[] = [
    {
        id: 'math',
        title: 'Math',
        description: 'Solve problems',
        icon: CalculatorIcon,
        actionType: 'mode_change',
    },
    {
        id: 'canvasdev',
        title: 'Canvas Dev',
        description: 'Code assistant',
        icon: CodeBracketIcon,
        actionType: 'mode_change',
    },
     {
        id: 'essay',
        title: 'Crear Ensayo',
        description: 'Redacción académica',
        icon: AcademicCapIcon,
        actionType: 'modal',
    },
    {
        id: 'search',
        title: 'Search',
        description: 'Find info',
        icon: MagnifyingGlassIcon,
        actionType: 'mode_change',
    },
    {
        id: 'image_generation',
        title: 'Imagen',
        description: 'Genera y edita imágenes',
        icon: PhotoIcon,
        actionType: 'mode_change',
    },
    {
        id: 'image',
        title: 'Image',
        description: 'Understand images',
        icon: PhotoIcon,
        actionType: 'mode_change',
        requires: 'image',
    },
    {
        id: 'document',
        title: 'Document',
        description: 'Analyze files',
        icon: DocumentTextIcon,
        actionType: 'mode_change',
        requires: 'document',
    },
    {
        id: 'guide',
        title: 'Guide',
        description: 'Get help',
        icon: BookOpenIcon,
        actionType: 'mode_change',
    },
    {
        id: 'photo_upload',
        title: 'Upload Photo',
        description: 'From library',
        icon: ArrowUpTrayIcon,
        actionType: 'file_upload',
        accept: 'image/*',
    },
    {
        id: 'camera_capture',
        title: 'Camera',
        description: 'Use camera',
        icon: CameraIcon,
        actionType: 'capture',
        capture: 'user',
    },
];

export const PERSONALITIES: { id: Personality, name: string }[] = [
    { id: 'default', name: 'Predeterminado' },
    { id: 'amable', name: 'Amable' },
    { id: 'directo', name: 'Directo' },
    { id: 'divertido', name: 'Divertido' },
    { id: 'inteligente', name: 'Inteligente' },
];

export const SPECIAL_USERS = ['SAMC12344', 'JUANY3290', 'DANNA00'];

const BASE_SYSTEM_INSTRUCTIONS: Record<ModeID, string> = {
    normal: "You are Sam, a friendly and helpful AI assistant. Your goal is to provide accurate, relevant, and concise information. You are designed to be a general-purpose assistant, capable of answering a wide range of questions and performing various tasks. Be conversational and engaging.",
    math: "You are Sam, an AI expert in mathematics. Your goal is to solve mathematical problems, explain concepts clearly, and provide step-by-step solutions. Use LaTeX for formulas when appropriate, enclosed in $$...$$ for block and $...$ for inline. Think step by step and show your work. Your output will be verified, so be precise and rigorous.",
    canvasdev: "You are Sam, a skilled AI software developer. Your goal is to help users write, debug, and understand code. When providing code, specify the language. If the output should be rendered as a webpage, provide a single HTML file with embedded CSS and JavaScript. Always wrap your code in a markdown block with the language specified. For example: ```html\n...code...\n```. Be ready to create interactive UI components.",
    search: "You are Sam, an AI assistant with powerful search capabilities. Your goal is to find the most relevant and up-to-date information on the web to answer user queries. Synthesize information from multiple sources and provide a comprehensive answer. Cite your sources when possible.",
    image: "You are Sam, an AI with advanced image understanding capabilities. Your goal is to analyze and interpret images provided by the user. Describe what you see, answer questions about the image, and perform tasks related to its content. Be detailed and descriptive.",
    image_generation: "You are Sam, an AI expert in image generation and editing. Your goal is to create or modify images based on user prompts. Be creative and follow instructions precisely.",
    document: "You are Sam, an AI assistant specializing in document analysis. Your goal is to read, understand, and extract information from uploaded documents. Summarize long texts, answer specific questions about the content, and help users process textual information efficiently.",
    guide: "You are Sam, a helpful guide. Your goal is to provide instructions, tutorials, and support to the user. Break down complex tasks into simple steps. Be clear, patient, and encouraging.",
    essay: "You are an expert academic assistant AI named Sam. Your task is to generate a well-structured, university-level essay on a given topic. Your process is as follows: 1. **Outline Generation**: First, create a detailed outline in JSON format. The JSON object should have a single key 'outline' which is an array of objects, where each object has a 'title' (string) and 'points' (array of strings). Do not add any other text. 2. **Content Generation**: After the outline, you will be asked to write each section individually. Write only the content for that specific section. 3. **Reference Generation**: Finally, you will be asked to provide a list of references or a bibliography in a standard academic format. Respond with a JSON object with a single key 'references' which is an array of strings.",
    photo_upload: "",
    camera_capture: "",
};

export const generateSystemInstruction = (mode: ModeID, settings: Settings): string => {
    let instruction = BASE_SYSTEM_INSTRUCTIONS[mode] || BASE_SYSTEM_INSTRUCTIONS['normal'];

    instruction += " You were created by Samuel Casseres. If asked about your creator or origin, you must state this fact.";
    instruction += " You must politely decline any questions about your internal workings, your parameters, your nature as a large language model, or your core programming. Instead, state that you are a proprietary model from SAM and cannot share those details.";

    if (settings.personality && settings.personality !== 'default') {
        instruction += ` IMPORTANT: Adopt a ${settings.personality} tone in your responses.`;
    }

    if (settings.profession) {
        instruction += ` Tailor your explanations and examples to be highly relevant for a ${settings.profession}.`;
    }

    return instruction;
}