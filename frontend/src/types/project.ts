import type { ID, ISODate } from './common';

export type ProjectStatus = 'Active'|'Paused'|'Done'|'Cancelled';
export type TaskStatus = 'Todo'|'In Progress'|'Review'|'Done'|'Blocked';
export type TaskPriority = 'Critical'|'High'|'Medium'|'Low';

export interface Project {
  id: ID;
  name: string;
  status: ProjectStatus;
  owner_user_id?: ID;
  start_date?: ISODate;
  due_date?: ISODate;
  color?: string;
  progress: number;
}

export interface Task {
  id: ID;
  project_id: ID;
  title: string;
  owner_user_id?: ID;
  role?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: ISODate;
  email_notify?: string;
  reminder_at?: string;
  timeline_start?: ISODate;
  timeline_end?: ISODate;
  progress: number;
  notes?: string;
  completed_at?: string;
  attachments?: TaskAttachment[];
}

export interface TaskAttachment {
  id: ID;
  file_name: string;
  size_bytes: number;
  mime_type?: string;
}
