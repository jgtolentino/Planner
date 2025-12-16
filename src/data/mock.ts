/**
 * Mock Data for API Contract Validation
 * 
 * This mock data conforms strictly to the Odoo CE + OCA 18 schema.
 * All IDs follow the Odoo pattern: "model:id"
 */

import type {
  Board,
  Card,
  Activity,
  Partner,
  Stage,
  Tag,
} from '../types/api-contract';

// ============================================================================
// Mock Partners (res.partner)
// ============================================================================

export const mockPartners: Record<string, Partner> = {
  owner: {
    partner_id: 1201,
    email: 'maria.santos@company.com',
    name: 'Maria Santos',
  },
  contributor1: {
    partner_id: 1202,
    email: 'juan.cruz@company.com',
    name: 'Juan Cruz',
  },
  contributor2: {
    partner_id: 1203,
    email: 'ana.reyes@company.com',
    name: 'Ana Reyes',
  },
  viewer: {
    partner_id: 1204,
    email: 'carlos.garcia@company.com',
    name: 'Carlos Garcia',
  },
};

// ============================================================================
// Mock Tags (project.tags)
// ============================================================================

export const mockTags: Tag[] = [
  { tag_id: 'tag:1', name: 'VAT', color: '#3b82f6' },
  { tag_id: 'tag:2', name: 'Payroll', color: '#10b981' },
  { tag_id: 'tag:3', name: 'Urgent', color: '#ef4444' },
  { tag_id: 'tag:4', name: 'BIR', color: '#f59e0b' },
];

// ============================================================================
// Mock Stages (project.task.type)
// ============================================================================

export const mockStages: Stage[] = [
  { stage_id: 'stage:10', name: 'Backlog', order: 10, wip_limit: null },
  { stage_id: 'stage:20', name: 'To Do', order: 20, wip_limit: null },
  { stage_id: 'stage:30', name: 'Doing', order: 30, wip_limit: 5 },
  { stage_id: 'stage:40', name: 'Review', order: 40, wip_limit: 3 },
  { stage_id: 'stage:50', name: 'Done', order: 50, wip_limit: null },
];

// ============================================================================
// Mock Board (project.project)
// ============================================================================

export const mockBoard: Board = {
  board_id: 'project:42',
  name: 'Finance SSC Month-End',
  owner: mockPartners.owner,
  visibility: 'team',
  members: [
    { ...mockPartners.owner, role: 'manager' },
    { ...mockPartners.contributor1, role: 'contributor' },
    { ...mockPartners.contributor2, role: 'contributor' },
    { ...mockPartners.viewer, role: 'viewer' },
  ],
  stages: mockStages,
  tags: mockTags,
  description: 'Month-end closing tasks for Finance Shared Services Center',
  created_at: '2025-12-01T08:00:00+08:00',
  updated_at: '2025-12-15T14:30:00+08:00',
};

// ============================================================================
// Mock Cards (project.task)
// ============================================================================

export const mockCards: Card[] = [
  // Backlog
  {
    card_id: 'task:9001',
    board_id: 'project:42',
    stage_id: 'stage:10',
    title: 'Prepare December financial statements',
    description_md: 'Compile all financial statements for December closing:\n- Balance sheet\n- Income statement\n- Cash flow statement',
    priority: '1',
    due_date: '2025-12-31',
    created_at: '2025-12-10T09:00:00+08:00',
    updated_at: '2025-12-14T11:00:00+08:00',
    owners: [mockPartners.contributor2],
    watchers: [mockPartners.owner, mockPartners.contributor2],
    tags: [],
    parent_id: null,
    subtask_ids: [],
    sequence: 1,
  },
  // To Do
  {
    card_id: 'task:9002',
    board_id: 'project:42',
    stage_id: 'stage:20',
    title: 'Reconcile bank statements',
    description_md: 'Reconcile all bank accounts for month-end:\n- BDO Main Operating\n- BPI Payroll\n- Metrobank Reserve',
    priority: '2',
    due_date: '2025-12-20',
    created_at: '2025-12-12T10:00:00+08:00',
    updated_at: '2025-12-15T09:30:00+08:00',
    owners: [mockPartners.contributor1],
    watchers: [mockPartners.owner, mockPartners.contributor1],
    tags: ['tag:2'],
    parent_id: null,
    subtask_ids: [],
    checklist: [
      { id: 'c1', text: 'Download bank statements', done: true, order: 1 },
      { id: 'c2', text: 'Reconcile BDO', done: false, order: 2 },
      { id: 'c3', text: 'Reconcile BPI', done: false, order: 3 },
      { id: 'c4', text: 'Reconcile Metrobank', done: false, order: 4 },
    ],
    sequence: 1,
  },
  {
    card_id: 'task:9003',
    board_id: 'project:42',
    stage_id: 'stage:20',
    title: 'Review employee expense claims',
    description_md: 'Process and approve pending expense claims before month-end.',
    priority: '1',
    due_date: '2025-12-18',
    created_at: '2025-12-13T14:00:00+08:00',
    updated_at: '2025-12-15T10:00:00+08:00',
    owners: [mockPartners.contributor2],
    watchers: [mockPartners.contributor2],
    tags: ['tag:2'],
    parent_id: null,
    subtask_ids: [],
    sequence: 2,
  },
  // Doing
  {
    card_id: 'task:9004',
    board_id: 'project:42',
    stage_id: 'stage:30',
    title: 'Reconcile VAT input tax',
    description_md: 'Reconcile VAT input tax for December:\n- Validate supplier invoices\n- Check BIR Form 2307\n- Prepare summary report',
    priority: '3',
    due_date: '2025-12-18',
    created_at: '2025-12-11T08:30:00+08:00',
    updated_at: '2025-12-15T14:20:00+08:00',
    owners: [mockPartners.contributor1],
    watchers: [mockPartners.owner, mockPartners.contributor1],
    tags: ['tag:1', 'tag:3', 'tag:4'],
    parent_id: null,
    subtask_ids: ['task:9005', 'task:9006'],
    checklist: [
      { id: 'c1', text: 'Pull BIR reports', done: true, order: 1 },
      { id: 'c2', text: 'Validate supplier invoices', done: true, order: 2 },
      { id: 'c3', text: 'Cross-check 2307 forms', done: false, order: 3 },
      { id: 'c4', text: 'Prepare summary', done: false, order: 4 },
    ],
    sequence: 1,
  },
  {
    card_id: 'task:9005',
    board_id: 'project:42',
    stage_id: 'stage:30',
    title: 'Validate supplier invoices (subtask)',
    description_md: 'Check all supplier invoices have valid TINs and amounts match.',
    priority: '2',
    due_date: '2025-12-17',
    created_at: '2025-12-11T08:35:00+08:00',
    updated_at: '2025-12-15T13:00:00+08:00',
    owners: [mockPartners.contributor1],
    watchers: [mockPartners.contributor1],
    tags: ['tag:1'],
    parent_id: 'task:9004',
    subtask_ids: [],
    sequence: 2,
  },
  {
    card_id: 'task:9006',
    board_id: 'project:42',
    stage_id: 'stage:30',
    title: 'Cross-check Form 2307 (subtask)',
    description_md: 'Ensure all 2307 forms are filed and amounts reconciled.',
    priority: '2',
    due_date: '2025-12-18',
    created_at: '2025-12-11T08:36:00+08:00',
    updated_at: '2025-12-15T13:10:00+08:00',
    owners: [mockPartners.contributor1],
    watchers: [mockPartners.contributor1],
    tags: ['tag:1', 'tag:4'],
    parent_id: 'task:9004',
    subtask_ids: [],
    dependencies: [{ type: 'blocked_by', task_id: 'task:9005' }],
    sequence: 3,
  },
  // Review
  {
    card_id: 'task:9007',
    board_id: 'project:42',
    stage_id: 'stage:40',
    title: 'Process payroll for December',
    description_md: 'Calculate and process December payroll including:\n- Regular salaries\n- 13th month pay\n- Bonuses\n- Government remittances (SSS, PhilHealth, Pag-IBIG)',
    priority: '3',
    due_date: '2025-12-17',
    created_at: '2025-12-09T07:00:00+08:00',
    updated_at: '2025-12-15T11:45:00+08:00',
    owners: [mockPartners.contributor2],
    watchers: [mockPartners.owner, mockPartners.contributor2],
    tags: ['tag:2', 'tag:3'],
    parent_id: null,
    subtask_ids: [],
    sequence: 1,
  },
  // Done
  {
    card_id: 'task:9008',
    board_id: 'project:42',
    stage_id: 'stage:50',
    title: 'Submit BIR Form 2550M for November',
    description_md: 'Monthly VAT declaration submitted and payment made.',
    priority: '1',
    due_date: '2025-12-10',
    created_at: '2025-12-05T08:00:00+08:00',
    updated_at: '2025-12-10T16:00:00+08:00',
    owners: [mockPartners.contributor1],
    watchers: [mockPartners.owner, mockPartners.contributor1],
    tags: ['tag:1', 'tag:4'],
    parent_id: null,
    subtask_ids: [],
    sequence: 1,
  },
  {
    card_id: 'task:9009',
    board_id: 'project:42',
    stage_id: 'stage:50',
    title: 'Reconcile accounts payable',
    description_md: 'Completed AP reconciliation for November. All supplier statements matched.',
    priority: '1',
    due_date: '2025-12-08',
    created_at: '2025-12-03T09:00:00+08:00',
    updated_at: '2025-12-08T17:30:00+08:00',
    owners: [mockPartners.contributor2],
    watchers: [mockPartners.owner, mockPartners.contributor2],
    tags: [],
    parent_id: null,
    subtask_ids: [],
    sequence: 2,
  },
];

// ============================================================================
// Mock Activities (mail.message)
// ============================================================================

export const mockActivities: Record<string, Activity[]> = {
  'task:9004': [
    {
      event_id: 'msg:771',
      type: 'comment',
      author: mockPartners.owner,
      body_md: 'Please confirm totals by EOD @juan.cruz@company.com',
      mentions: [
        { email: 'juan.cruz@company.com', partner_id: 1202 },
      ],
      created_at: '2025-12-15T10:20:00+08:00',
    },
    {
      event_id: 'msg:770',
      type: 'stage_change',
      author: mockPartners.contributor1,
      metadata: {
        field_name: 'stage_id',
        old_value: 'To Do',
        new_value: 'Doing',
      },
      created_at: '2025-12-15T09:00:00+08:00',
    },
    {
      event_id: 'msg:769',
      type: 'comment',
      author: mockPartners.contributor1,
      body_md: 'Started work on VAT reconciliation. First two checklist items complete.',
      created_at: '2025-12-15T08:45:00+08:00',
    },
    {
      event_id: 'msg:768',
      type: 'field_update',
      author: mockPartners.owner,
      metadata: {
        field_name: 'priority',
        old_value: '2',
        new_value: '3',
      },
      created_at: '2025-12-14T16:30:00+08:00',
    },
    {
      event_id: 'msg:767',
      type: 'assignment',
      author: mockPartners.owner,
      body_md: 'Assigned to Juan Cruz',
      metadata: {
        field_name: 'user_id',
        new_value: 'juan.cruz@company.com',
      },
      created_at: '2025-12-11T08:30:00+08:00',
    },
  ],
  'task:9007': [
    {
      event_id: 'msg:780',
      type: 'comment',
      author: mockPartners.contributor2,
      body_md: 'Payroll calculations complete. Ready for final review @maria.santos@company.com',
      mentions: [
        { email: 'maria.santos@company.com', partner_id: 1201 },
      ],
      created_at: '2025-12-15T11:45:00+08:00',
    },
    {
      event_id: 'msg:779',
      type: 'stage_change',
      author: mockPartners.contributor2,
      metadata: {
        field_name: 'stage_id',
        old_value: 'Doing',
        new_value: 'Review',
      },
      created_at: '2025-12-15T11:30:00+08:00',
    },
  ],
};

// ============================================================================
// Helper: Get cards by stage
// ============================================================================

export function getCardsByStage(stageId: string): Card[] {
  return mockCards.filter((card) => card.stage_id === stageId);
}

// ============================================================================
// Helper: Get card activities
// ============================================================================

export function getCardActivities(cardId: string): Activity[] {
  return mockActivities[cardId] || [];
}

// ============================================================================
// Helper: Get card by ID
// ============================================================================

export function getCardById(cardId: string): Card | undefined {
  return mockCards.find((card) => card.card_id === cardId);
}

// ============================================================================
// Mock API Delay (simulate network)
// ============================================================================

export function mockDelay(ms: number = 300): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
