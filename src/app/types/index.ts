// src/app/types/index.ts

export interface Activity {
  id: string;
  title: string;
  date: string;
}

export interface Member {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  members: Member[];
  joined?: boolean;
  nextActivity?: Activity;
  theme?: {
    colors: {
      primary: string;
      secondary: string;
    }
  }
}
