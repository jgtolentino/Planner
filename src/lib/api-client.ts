/**
 * API Client (Mock Implementation)
 * 
 * This client validates that the contract supports all required operations.
 * In production, replace mock functions with real HTTP calls to Odoo REST endpoints.
 */

import type {
  Board,
  Card,
  Activity,
  ListBoardsResponse,
  GetBoardResponse,
  ListCardsResponse,
  CreateCardRequest,
  CreateCardResponse,
  UpdateCardRequest,
  UpdateCardResponse,
  CreateCommentRequest,
  CreateCommentResponse,
  GetCardActivityResponse,
} from '../types/api-contract';

import {
  mockBoard,
  mockCards,
  mockStages,
  getCardsByStage,
  getCardActivities,
  getCardById,
  mockDelay,
  mockPartners,
} from '../data/mock';

/**
 * List all boards (project.project)
 */
export async function listBoards(): Promise<ListBoardsResponse> {
  await mockDelay();
  return {
    boards: [mockBoard],
    total: 1,
    page: 0,
    limit: 20,
  };
}

/**
 * Get board detail with card counts
 */
export async function getBoard(boardId: string): Promise<GetBoardResponse> {
  await mockDelay();
  
  const cardCounts: Record<string, number> = {};
  mockStages.forEach((stage) => {
    cardCounts[stage.stage_id] = getCardsByStage(stage.stage_id).length;
  });

  return {
    ...mockBoard,
    card_counts: cardCounts,
  };
}

/**
 * List cards with filters and pagination
 */
export async function listCards(filters?: {
  stage?: string;
  tag?: string;
  owner?: string;
  q?: string;
}): Promise<ListCardsResponse> {
  await mockDelay();

  let filtered = [...mockCards];

  // Filter by stage
  if (filters?.stage) {
    filtered = filtered.filter((card) => card.stage_id === filters.stage);
  }

  // Filter by tag
  if (filters?.tag) {
    filtered = filtered.filter((card) => card.tags.includes(filters.tag!));
  }

  // Filter by owner email
  if (filters?.owner) {
    filtered = filtered.filter((card) =>
      card.owners.some((owner) => owner.email === filters.owner)
    );
  }

  // Search by title/description
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    filtered = filtered.filter(
      (card) =>
        card.title.toLowerCase().includes(q) ||
        card.description_md?.toLowerCase().includes(q)
    );
  }

  return {
    cards: filtered,
    total: filtered.length,
    page: 0,
    limit: 100,
  };
}

/**
 * Create a new card (project.task)
 */
export async function createCard(
  request: CreateCardRequest
): Promise<CreateCardResponse> {
  await mockDelay();

  const newCard: Card = {
    card_id: `task:${Date.now()}`,
    board_id: request.board_id,
    stage_id: request.stage_id,
    title: request.title,
    description_md: request.description_md,
    priority: request.priority || '1',
    due_date: request.due_date || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    owners: request.owners
      ? request.owners.map(
          (id) =>
            Object.values(mockPartners).find((p) => p.partner_id === id)!
        )
      : [],
    watchers: [],
    tags: request.tags || [],
    parent_id: request.parent_id || null,
    subtask_ids: [],
  };

  // In real implementation: POST to /api/cards
  mockCards.push(newCard);

  return { card: newCard };
}

/**
 * Update an existing card (PATCH project.task)
 */
export async function updateCard(
  request: UpdateCardRequest
): Promise<UpdateCardResponse> {
  await mockDelay();

  const card = getCardById(request.card_id);
  if (!card) {
    throw new Error(`Card ${request.card_id} not found`);
  }

  const updatedCard: Card = {
    ...card,
    ...(request.title && { title: request.title }),
    ...(request.description_md !== undefined && {
      description_md: request.description_md,
    }),
    ...(request.stage_id && { stage_id: request.stage_id }),
    ...(request.priority && { priority: request.priority }),
    ...(request.due_date !== undefined && { due_date: request.due_date }),
    ...(request.tags && { tags: request.tags }),
    ...(request.checklist && { checklist: request.checklist }),
    updated_at: new Date().toISOString(),
  };

  // In real implementation: PATCH to /api/cards/{id}
  const index = mockCards.findIndex((c) => c.card_id === request.card_id);
  if (index !== -1) {
    mockCards[index] = updatedCard;
  }

  return { card: updatedCard };
}

/**
 * Create a comment on a card (mail.message)
 */
export async function createComment(
  request: CreateCommentRequest
): Promise<CreateCommentResponse> {
  await mockDelay();

  const newActivity: Activity = {
    event_id: `msg:${Date.now()}`,
    type: 'comment',
    author: mockPartners.owner, // In production: use current user
    body_md: request.body_md,
    mentions: request.mentions?.map((email) => ({
      email,
      partner_id:
        Object.values(mockPartners).find((p) => p.email === email)
          ?.partner_id || 0,
    })),
    created_at: new Date().toISOString(),
  };

  // In real implementation: POST to /api/cards/{id}/comments
  // This creates mail.message linked to task and notifies followers

  return { activity: newActivity };
}

/**
 * Get card activity history (mail.message)
 */
export async function getCardActivity(
  cardId: string
): Promise<GetCardActivityResponse> {
  await mockDelay();

  const activities = getCardActivities(cardId);

  return {
    activities,
    total: activities.length,
    page: 0,
    limit: 50,
  };
}

/**
 * Validate schema compliance (for testing)
 * In production, run JSON Schema validation on CI
 */
export function validateBoard(board: Board): boolean {
  // Basic validation - in production use ajv or similar
  return !!(
    board.board_id &&
    board.name &&
    board.owner &&
    board.stages.length > 0 &&
    board.members.length > 0
  );
}

export function validateCard(card: Card): boolean {
  return !!(
    card.card_id &&
    card.board_id &&
    card.stage_id &&
    card.title &&
    card.priority
  );
}
