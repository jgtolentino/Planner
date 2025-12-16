import React from 'react';
import { Calendar, CheckSquare, MessageSquare, AlertCircle } from 'lucide-react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import type { Card as TaskCard, Tag } from '../types/api-contract';

interface TaskCardProps {
  card: TaskCard;
  tags: Tag[];
  onClick: () => void;
}

export function TaskCard({ card, tags, onClick }: TaskCardProps) {
  const [dragging, setDragging] = React.useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('cardId', card.card_id);
    setDragging(true);
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  const cardTags = card.tags
    .map((tagId) => tags.find((t) => t.tag_id === tagId))
    .filter((t): t is Tag => t !== undefined);

  const getPriorityConfig = () => {
    switch (card.priority) {
      case '3':
        return { label: 'Urgent', color: 'bg-red-100 text-red-700 border-red-200' };
      case '2':
        return { label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' };
      case '1':
        return { label: 'Normal', color: 'bg-blue-100 text-blue-700 border-blue-200' };
      default:
        return { label: 'Low', color: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
  };

  const isDueSoon = () => {
    if (!card.due_date) return false;
    const dueDate = new Date(card.due_date);
    const now = new Date();
    const diffInDays = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    return diffInDays <= 3 && diffInDays >= 0;
  };

  const isOverdue = () => {
    if (!card.due_date) return false;
    return new Date(card.due_date) < new Date();
  };

  const completedChecklist = card.checklist?.filter((item) => item.done).length || 0;
  const totalChecklist = card.checklist?.length || 0;

  return (
    <Card
      className={`
        p-3 cursor-pointer hover:shadow-md transition-all
        ${dragging ? 'opacity-50' : 'opacity-100'}
      `}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onClick}
    >
      {/* Priority Indicator */}
      {card.priority !== '0' && (
        <div className="flex items-center gap-1 mb-2">
          <div
            className={`
              flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border
              ${getPriorityConfig().color}
            `}
          >
            <AlertCircle className="size-3" />
            {getPriorityConfig().label}
          </div>
        </div>
      )}

      {/* Title */}
      <h4 className="font-medium text-gray-900 mb-2">{card.title}</h4>

      {/* Tags */}
      {cardTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {cardTags.map((tag) => (
            <Badge
              key={tag.tag_id}
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: tag.color ? `${tag.color}15` : undefined,
                color: tag.color || undefined,
                borderColor: tag.color ? `${tag.color}40` : undefined,
              }}
            >
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          {/* Due Date */}
          {card.due_date && (
            <div
              className={`
                flex items-center gap-1
                ${isOverdue() ? 'text-red-600 font-medium' : ''}
                ${isDueSoon() ? 'text-orange-600 font-medium' : ''}
              `}
            >
              <Calendar className="size-3" />
              <span>
                {new Date(card.due_date).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Checklist Progress */}
          {totalChecklist > 0 && (
            <div className="flex items-center gap-1">
              <CheckSquare className="size-3" />
              <span>
                {completedChecklist}/{totalChecklist}
              </span>
            </div>
          )}

          {/* Comments (placeholder) */}
          <div className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            <span>0</span>
          </div>
        </div>

        {/* Assignee */}
        {card.owners.length > 0 && (
          <div className="flex items-center -space-x-1">
            {card.owners.slice(0, 2).map((owner) => (
              <div
                key={owner.partner_id}
                className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                title={owner.name}
              >
                {owner.name.charAt(0)}
              </div>
            ))}
            {card.owners.length > 2 && (
              <div className="size-6 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium border-2 border-white">
                +{card.owners.length - 2}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
