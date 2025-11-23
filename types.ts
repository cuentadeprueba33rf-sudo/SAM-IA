
import type { ComponentType } from 'react';

export enum MessageAuthor {
  USER = 'user',
  SAM = 'sam',
  SYSTEM = 'system',
}

export interface Attachment {
  name:string;
  type: string; // mime type
  data: string; // base64 data url
}

export interface Artifact {
  id: string;
  title: string;
  language: string;
  content: string;
}

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  text: string;
  timestamp: number;
  mode?: ModeID;
  attachment?: Attachment;
  prelude?: string;
  groundingMetadata?: any[];
  generatingArtifact?: boolean;
  isSearching?: boolean;
  consoleLogs?: string[];
  fromAdmin?: boolean; // Flag for admin-sent messages
  essayContent?: Essay; // The entire essay object is now part of the message
  artifacts?: Artifact[];
  isBackup?: boolean; // Indicates if the message was generated using a backup API key
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  ownerUid?: string; // To link chat to a user
  createdAt?: number; // Firestore timestamp as number
  isTemporary?: boolean; // For ephemeral chats on app load
}

export type ModeID = 'normal' | 'math' | 'search' | 'image' | 'document' | 'architect' | 'photo_upload' | 'camera_capture' | 'image_generation' | 'essay' | 'voice';

export interface Mode {
  id: ModeID;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  actionType: 'mode_change' | 'file_upload' | 'capture' | 'modal' | 'voice_input';
  requires?: 'image' | 'document';
  accept?: string; // for file input
  capture?: 'user' | 'environment'; // for camera
  disabled?: boolean;
}

export type ModelType = 'sm-i1' | 'sm-i3' | 'sm-l3' | 'sm-l3.9';
export type Theme = 'light' | 'dark';
export type Personality = 'default' | 'amable' | 'directo' | 'divertido' | 'inteligente';

export interface Settings {
    theme: Theme;
    personality: Personality;
    profession: string;
    defaultModel: ModelType;
    quickMode: boolean;
    stThemeEnabled: boolean;
}

export interface EssaySection {
    id: string;
    title: string;
    points: string[];
}

export type AcademicLevel = 'high_school' | 'university' | 'masters';
export type EssayTone = 'formal' | 'persuasive' | 'analytical' | 'expository';

export interface Essay {
    topic: string;
    academicLevel: AcademicLevel;
    tone: EssayTone;
    wordCountTarget: number;
    outline: EssaySection[];
    content: Record<string, string>; // Maps section.id to its content
    references: string[];
    // New status values for the interactive flow
    status: 'briefing' | 'outlining' | 'editing_outline' | 'writing' | 'referencing' | 'complete' | 'error';
    currentSectionId?: string; // Tracks the ID of the section being written
}

export type ViewID = 'chat' | 'insights' | 'documentation' | 'usage' | 'photosam' | 'sam_studios' | 'canvas' | 'voxel_toy_box' | 'logic_lab' | 'echo_realms' | 'chrono_lense' | 'reality_scanner';

export interface Insight {
    id: string;
    icon: ComponentType<{ className?: string }>;
    title: string;
    description: string;
    actions: { 
        label: string; 
        type: 'navigate' | 'new_chat_with_prompt'; 
        data: ViewID | { title: string; prompt: string };
    }[];
}

export interface UsageTracker {
    date: string; // YYYY-MM-DD
    count: number;
    hasAttachment: boolean;
}