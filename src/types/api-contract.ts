/**
 * API Contract — Notion-style Kanban on Odoo CE + OCA 18
 * 
 * This contract mirrors Odoo CE and OCA 18 data models exactly:
 * - Board → project.project
 * - Stage → project.task.type
 * - Card → project.task
 * - Activity → mail.message
 * - Partner → res.partner
 * - User → res.users
 * 
 * This is the single source of truth for all frontend implementations.
 * 
 * CONTRACT VERSION: This must match x-contract-version header in all API responses.
 */

export const CONTRACT_VERSION = '1.0.0';

// ============================================================================
// Core Identity & Partner (res.partner / res.users)
// ============================================================================

export interface Partner {
  /** Odoo res.partner.id */
  partner_id: number;
  /** Canonical email identity */
  email: string;
  /** Display name */
  name: string;
  /** Optional avatar URL */
  avatar_url?: string;
}

export interface User extends Partner {
  /** Odoo res.users.id (optional if partner is not a user) */
  user_id?: number;
}

// ============================================================================
// Workspace (res.company + database level)
// ============================================================================

export interface Workspace {
  /** Company/database identifier */
  workspace_id: string;
  /** Workspace name */
  name: string;
  /** Timezone for date/time display */
  timezone: string;
}

// ============================================================================
// Role & Permissions
// ============================================================================

export type Role = 'admin' | 'manager' | 'contributor' | 'viewer';

export interface BoardMember extends Partner {
  /** Member role in this board */
  role: Role;
}

export type Visibility = 'private' | 'team' | 'public';

// ============================================================================
// Stage (project.task.type)
// ============================================================================

export interface Stage {
  /** Odoo project.task.type.id */
  stage_id: string;
  /** Stage name */
  name: string;
  /** Display order (lower = earlier in sequence) */
  order: number;
  /** Optional WIP limit */
  wip_limit: number | null;
  /** Is this a folded/collapsed stage */
  fold?: boolean;
}

// ============================================================================
// Tag (project.tags)
// ============================================================================

export interface Tag {
  /** Odoo project.tags.id */
  tag_id: string;
  /** Tag name */
  name: string;
  /** Optional color (hex) */
  color?: string;
}

// ============================================================================
// Board (project.project)
// ============================================================================

export interface Board {
  /** Odoo project.project.id */
  board_id: string;
  /** Board name */
  name: string;
  /** Board owner/creator */
  owner: Partner;
  /** Visibility level */
  visibility: Visibility;
  /** Board members with roles */
  members: BoardMember[];
  /** Stages (Kanban columns) */
  stages: Stage[];
  /** Available tags for this board */
  tags: Tag[];
  /** Board description (optional) */
  description?: string;
  /** Created timestamp */
  created_at: string;
  /** Last updated timestamp */
  updated_at: string;
}

// ============================================================================
// Priority (project.task.priority)
// ============================================================================

export type Priority = '0' | '1' | '2' | '3'; // 0=low, 1=normal, 2=high, 3=urgent

// ============================================================================
// Checklist Item (OCA extension or custom)
// ============================================================================

export interface ChecklistItem {
  /** Unique identifier within task */
  id: string;
  /** Checklist item text */
  text: string;
  /** Completion status */
  done: boolean;
  /** Display order */
  order?: number;
}

// ============================================================================
// Task Dependency (OCA extension or custom)
// ============================================================================

export type DependencyType = 'blocks' | 'blocked_by' | 'relates_to';

export interface TaskDependency {
  /** Dependency type */
  type: DependencyType;
  /** Related task ID */
  task_id: string;
}

// ============================================================================
// Card (project.task)
// ============================================================================

export interface Card {
  /** Odoo project.task.id */
  card_id: string;
  /** Parent board ID */
  board_id: string;
  /** Current stage ID */
  stage_id: string;
  /** Task title */
  title: string;
  /** Task description (markdown) */
  description_md?: string;
  /** Priority level */
  priority: Priority;
  /** Due date (ISO 8601 date) */
  due_date: string | null;
  /** Created timestamp (ISO 8601) */
  created_at: string;
  /** Last updated timestamp (ISO 8601) */
  updated_at: string;
  /** Task owner(s) - CE: single user_id, OCA: multiple assignees */
  owners: Partner[];
  /** Followers/watchers (mail.followers) */
  watchers: Partner[];
  /** Task tags */
  tags: string[]; // Array of tag_id
  /** Parent task ID (for subtasks) */
  parent_id: string | null;
  /** Subtask IDs */
  subtask_ids: string[];
  /** Checklist items (OCA extension or custom) */
  checklist?: ChecklistItem[];
  /** Task dependencies (OCA extension or custom) */
  dependencies?: TaskDependency[];
  /** Display order within stage */
  sequence?: number;
}

// ============================================================================
// Activity / Comments (mail.message)
// ============================================================================

export type ActivityType = 'comment' | 'stage_change' | 'field_update' | 'assignment' | 'mention';

export interface Mention {
  /** Mentioned partner email */
  email: string;
  /** Mentioned partner ID */
  partner_id: number;
}

export interface Activity {
  /** Odoo mail.message.id */
  event_id: string;
  /** Activity type */
  type: ActivityType;
  /** Author of the activity */
  author: Partner;
  /** Activity body (markdown for comments) */
  body_md?: string;
  /** Mentions in this activity */
  mentions?: Mention[];
  /** Metadata for field updates */
  metadata?: {
    field_name?: string;
    old_value?: string;
    new_value?: string;
  };
  /** Created timestamp (ISO 8601) */
  created_at: string;
}

// ============================================================================
// API Request / Response Types
// ============================================================================

// List Boards
export interface ListBoardsRequest {
  /** Pagination: page number (0-based) */
  page?: number;
  /** Pagination: items per page */
  limit?: number;
}

export interface ListBoardsResponse {
  boards: Board[];
  total: number;
  page: number;
  limit: number;
}

// Get Board Detail
export interface GetBoardRequest {
  board_id: string;
}

export interface GetBoardResponse extends Board {
  /** Card count by stage */
  card_counts: Record<string, number>;
}

// List Cards with Filters
export interface ListCardsRequest {
  board_id: string;
  /** Filter by stage ID(s) */
  stage?: string | string[];
  /** Filter by tag ID(s) */
  tag?: string | string[];
  /** Filter by owner email or partner ID */
  owner?: string | number;
  /** Filter by due date range */
  due_from?: string;
  due_to?: string;
  /** Search query (title/description/comments) */
  q?: string;
  /** Pagination */
  page?: number;
  limit?: number;
}

export interface ListCardsResponse {
  cards: Card[];
  total: number;
  page: number;
  limit: number;
}

// Create Card
export interface CreateCardRequest {
  board_id: string;
  stage_id: string;
  title: string;
  description_md?: string;
  priority?: Priority;
  due_date?: string | null;
  owners?: number[]; // Array of partner_id
  tags?: string[]; // Array of tag_id
  parent_id?: string | null;
}

export interface CreateCardResponse {
  card: Card;
}

// Update Card
export interface UpdateCardRequest {
  card_id: string;
  /** Fields to update */
  title?: string;
  description_md?: string;
  stage_id?: string;
  priority?: Priority;
  due_date?: string | null;
  owners?: number[];
  tags?: string[];
  checklist?: ChecklistItem[];
}

export interface UpdateCardResponse {
  card: Card;
}

// Create Comment
export interface CreateCommentRequest {
  card_id: string;
  body_md: string;
  /** Emails to mention (creates followers + notifications) */
  mentions?: string[];
}

export interface CreateCommentResponse {
  activity: Activity;
}

// Get Card Activity
export interface GetCardActivityRequest {
  card_id: string;
  /** Filter by activity type */
  type?: ActivityType | ActivityType[];
  /** Pagination */
  page?: number;
  limit?: number;
}

export interface GetCardActivityResponse {
  activities: Activity[];
  total: number;
  page: number;
  limit: number;
}

// ============================================================================
// Error Response
// ============================================================================

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}