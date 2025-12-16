import React from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Button } from './ui/button';
import { TaskCard } from './TaskCard';
import type { Stage, Card, Tag } from '../types/api-contract';

interface KanbanColumnProps {
  stage: Stage;
  cards: Card[];
  tags: Tag[];
  onCardClick: (cardId: string) => void;
  onCardMove: (cardId: string, newStageId: string) => void;
}

export function KanbanColumn({
  stage,
  cards,
  tags,
  onCardClick,
  onCardMove,
}: KanbanColumnProps) {
  const [dragOver, setDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const cardId = e.dataTransfer.getData('cardId');
    if (cardId) {
      onCardMove(cardId, stage.stage_id);
    }
  };

  const wipWarning = stage.wip_limit && cards.length >= stage.wip_limit;

  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      {/* Column Header */}
      <div className="flex items-center justify-between px-3 py-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span
            className={`
              px-2 py-0.5 rounded text-xs font-medium
              ${wipWarning ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}
            `}
          >
            {cards.length}
            {stage.wip_limit && ` / ${stage.wip_limit}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            <Plus className="size-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-1 h-auto">
            <MoreHorizontal className="size-4" />
          </Button>
        </div>
      </div>

      {/* Cards */}
      <div
        className={`
          flex-1 overflow-y-auto space-y-3 px-2 py-2 rounded-lg transition-colors
          ${dragOver ? 'bg-blue-50' : 'bg-transparent'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
              <Plus className="size-6 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No cards</p>
          </div>
        ) : (
          cards.map((card) => (
            <TaskCard
              key={card.card_id}
              card={card}
              tags={tags}
              onClick={() => onCardClick(card.card_id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
