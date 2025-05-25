export type PersonnelType = "DEV" | "BA" | "TESTER";

export interface Personnel {
  type: PersonnelType;
  value: number;
}

export interface SubTask {
  id: string;
  name: string;
  personnel: Personnel[];
}

export interface Task {
  id: string;
  name: string;
  subTasks: SubTask[];
  personnel: Personnel[];
}

export interface Story {
  id: string;
  name: string;
  tasks: Task[];
  personnel: Personnel[];
}

export interface Epic {
  id: string;
  name: string;
  stories: Story[];
  personnel: Personnel[];
}

export interface Estimate {
  id: string;
  projectName: string;
  startDate: string;
  epics: Epic[];
  createdAt: string;
  isDraft: boolean;
}

export interface EstimateDraft {
  id: string;
  name: string;
  timestamp: string;
  estimate: Estimate;
}
