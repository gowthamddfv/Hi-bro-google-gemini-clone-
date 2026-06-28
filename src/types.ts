export type Role = 'user' | 'model';

export interface Attachment {
  id: string;
  type: 'image' | 'file';
  name: string;
  data: string;
  mimeType: string;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  attachments?: Attachment[];
}

export interface ChatSession {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
}

export type ModelType = 'gemini-2.5-flash' | 'gemini-2.0-flash';

export type AppTheme = 'default' | 'blue' | 'green' | 'yellow' | 'red';
export type ChatStyle = 'claude' | 'chatgpt' | 'gemini';
