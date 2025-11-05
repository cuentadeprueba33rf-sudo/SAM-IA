import type { ComponentType } from 'react';

export enum MessageAuthor {
  USER = 'user',
  SAM = 'sam',
  SYSTEM = 'system',
}

export interface Artifact {
  id: string;
  title: string;
  filepath: string;
  code: string;
  language: string;
}

export interface Attachment {
  name:string;
  type: string; // mime type
  data: string; // base64 data url
}

export interface ChatMessage {
  id: string;
  author: MessageAuthor;
  text: string;
  timestamp: number;
  mode?: ModeID;
  attachment?: Attachment;
  artifacts?: Artifact[];
  prelude?: string;
  groundingMetadata?: any[];
  generatingArtifact?: boolean;
  isSearching?: boolean;
  consoleLogs?: string[];
  fromAdmin?: boolean; // Flag for admin-sent messages
  essayContent?: Essay; // The entire essay object is now part of the message
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  ownerUid?: string; // To link chat to a user
  createdAt?: number; // Firestore timestamp as number
  isTemporary?: boolean; // For ephemeral chats on app load
}

export type ModeID = 'normal' | 'math' | 'canvasdev' | 'search' | 'image' | 'document' | 'guide' | 'photo_upload' | 'camera_capture' | 'image_generation' | 'essay';

export interface Mode {
  id: ModeID;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  actionType: 'mode_change' | 'file_upload' | 'capture' | 'modal';
  requires?: 'image' | 'document';
  accept?: string; // for file input
  capture?: 'user' | 'environment'; // for camera
  disabled?: boolean;
}

export type ModelType = 'sm-i1' | 'sm-i3';
export type Theme = 'light' | 'dark';
export type Personality = 'default' | 'amable' | 'directo' | 'divertido' | 'inteligente';

export interface Settings {
    theme: Theme;
    personality: Personality;
    profession: string;
}

export interface EssaySection {
    title: string;
    points: string[];
}
export interface Essay {
    topic: string;
    outline: EssaySection[];
    content: Record<string, string>;
    references: string[];
    status: 'outlining' | 'writing' | 'referencing' | 'complete';
    currentSection?: string;
}