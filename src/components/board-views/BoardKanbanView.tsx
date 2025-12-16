import React, { useState } from 'react';
import { KanbanColumn } from '../KanbanColumn';
import { CardDetailPanel } from '../CardDetailPanel';
import type { Board, Card } from '../../types/api-contract';

interface BoardKanbanViewProps {
  board: Board;
  cards: Card[];
  onCardUpdate: (card: Card) => void;
}

export function BoardKanbanView({ board, cards, onCardUpdate }: BoardKanbanViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selectedCard = selectedCardId
    ? cards.find((c) => c.card_id === selectedCardId)
    : null;

  const handleCardMove = (cardId: string, newStageId: string) => {
    const card = cards.find((c) => c.card_id === cardId);
    if (card) {
      onCardUpdate({ ...card, stage_id: newStageId });
    }
  };

  return (
    <>
      <div className="h-full overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {board.stages.map((stage) => {
            const stageCards = cards.filter((card) => card.stage_id === stage.stage_id);
            return (
              <KanbanColumn
                key={stage.stage_id}
                stage={stage}
                cards={stageCards}
                tags={board.tags}
                onCardClick={setSelectedCardId}
                onCardMove={handleCardMove}
              />
            );
          })}
        </div>
      </div>

      {selectedCard && (
        <CardDetailPanel
          card={selectedCard}
          board={board}
          onClose={() => setSelectedCardId(null)}
          onUpdate={onCardUpdate}
        />
      )}
    </>
  );
}
