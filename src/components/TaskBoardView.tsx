import React, { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { CardDetailPanel } from './CardDetailPanel';
import type { Card, Stage } from '../types/api-contract';

interface TaskBoardViewProps {
  tasks: Card[];
  onSelectBoard: (boardId: string) => void;
}

export function TaskBoardView({ tasks, onSelectBoard }: TaskBoardViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Group tasks by stage (cross-board view)
  const stages: Stage[] = [
    { stage_id: 'stage:1', name: 'Backlog', order: 10, wip_limit: null },
    { stage_id: 'stage:2', name: 'To Do', order: 20, wip_limit: null },
    { stage_id: 'stage:3', name: 'Doing', order: 30, wip_limit: null },
    { stage_id: 'stage:4', name: 'Review', order: 40, wip_limit: null },
    { stage_id: 'stage:5', name: 'Done', order: 50, wip_limit: null },
  ];

  const selectedCard = selectedCardId
    ? tasks.find((t) => t.card_id === selectedCardId)
    : null;

  const handleCardMove = (cardId: string, newStageId: string) => {
    // In production: POST /api/v1/cards/{id} with stage_id
    console.log('Move card', cardId, 'to stage', newStageId);
  };

  return (
    <>
      <div className="h-full overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {stages.map((stage) => {
            const stageCards = tasks.filter((card) => card.stage_id === stage.stage_id);
            return (
              <KanbanColumn
                key={stage.stage_id}
                stage={stage}
                cards={stageCards}
                tags={[
                  { tag_id: 'tag:1', name: 'Urgent', color: '#EF4444' },
                  { tag_id: 'tag:2', name: 'Finance', color: '#3B82F6' },
                  { tag_id: 'tag:3', name: 'Tax', color: '#8B5CF6' },
                ]}
                onCardClick={setSelectedCardId}
                onCardMove={handleCardMove}
              />
            );
          })}
        </div>
      </div>

      {/* Card Detail Panel */}
      {selectedCard && (
        <CardDetailPanel
          card={selectedCard}
          board={{
            board_id: selectedCard.board_id,
            name: 'My Tasks',
            owner: { partner_id: 1, email: 'maria@company.com', name: 'Maria Santos' },
            visibility: 'team',
            members: [],
            stages,
            tags: [
              { tag_id: 'tag:1', name: 'Urgent', color: '#EF4444' },
              { tag_id: 'tag:2', name: 'Finance', color: '#3B82F6' },
              { tag_id: 'tag:3', name: 'Tax', color: '#8B5CF6' },
            ],
            created_at: '2024-01-15T10:00:00Z',
            updated_at: '2024-12-15T14:32:00Z',
          }}
          onClose={() => setSelectedCardId(null)}
          onUpdate={(updatedCard) => {
            // Update handled by parent in production
          }}
        />
      )}
    </>
  );
}
