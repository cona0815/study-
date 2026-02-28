import { ReactNode } from "react";

export interface Row {
  id: number | string;
  topic: string;
  note: boolean;
  memo: string;
  link: string;
  dueDate: string;
  practice1: boolean;
  correct1: boolean;
  score1: string;
  score1Date: string;
  practice2: boolean;
  correct2: boolean;
  score2: string;
  score2Date: string;
  practice3: boolean;
  correct3: boolean;
  score3: string;
  score3Date: string;
  // Augmented properties for flat lists
  _gradeId?: string;
  _gradeName?: string;
  _subjectId?: string;
  _subjectName?: string;
  // Optional for updates
  suggestedDate2?: string;
  suggestedDate3?: string;
}

export interface Subject {
  id: string;
  name: string;
  color?: string;
  rows: Row[];
}

export interface Grade {
  id: string;
  name: string;
  color?: string;
  subjects: Subject[];
}

export interface IslandLevel {
  level: number;
  minExp: number;
  title: string;
  icon: string;
}

export interface Reward {
  id: string;
  name: string;
  cost: number;
  icon: string;
}

export interface AppSettings {
  passingScore: number;
  expMemo: number;
  expPractice: number;
  expCorrect: number;
  expScoreEntry: number;
  expPass: number;
  expPomodoro: number;
  coinMemo: number;      // New
  coinPractice: number;  // New
  coinCorrect: number;   // New
  coinScoreEntry: number;// New
  coinPass: number;      // New
  coinPomodoro: number;  // New
  islandLevels: IslandLevel[];
  rewards: Reward[]; // New field
  appTitle?: string;
  appSubtitle?: string;
  gasUrl?: string;
  geminiApiKey?: string;
  autoCloudSave?: boolean;
}

export interface LibraryItem {
  id: number;
  title: string;
  url: string;
  category: string;
}

export interface UserData {
  exp: number;
  coins: number; // New field
  logs: Record<string, number>;
}

export interface StatusInfo {
  text: string;
  color: string;
  icon: ReactNode;
}

export type TimerMode = 'focus' | 'short' | 'long' | 'custom';

export interface DialogState {
  show: boolean;
  type: 'alert' | 'confirm';
  message: string;
  onConfirm: (() => void) | null;
  onCancel: (() => void) | null;
}

export interface AudioTrack {
    id: string;
    name: string;
    url: string;
}