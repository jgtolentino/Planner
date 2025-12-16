import React, { useState } from 'react';
import { Calendar, CheckSquare, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { CardDetailPanel } from '../CardDetailPanel';
import type { Board, Card } from '../../types/api-contract';

interface BoardGridViewProps {
  board: Board;
  cards: Card[];
  onCardUpdate: (card: Card) => void;
}

export function BoardGridView({ board, cards, onCardUpdate }: BoardGridViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selectedCard = selectedCardId
    ? cards.find((c) => c.card_id === selectedCardId)
    : null;

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case '3':
        return { label: 'Urgent', color: 'bg-red-100 text-red-700' };
      case '2':
        return { label: 'High', color: 'bg-orange-100 text-orange-700' };
      case '1':
        return { label: 'Normal', color: 'bg-blue-100 text-blue-700' };
      default:
        return { label: 'Low', color: 'bg-gray-100 text-gray-600' };
    }
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isOverdue = date < now;
    const isDueToday = date.toDateString() === now.toDateString();

    return {
      text: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      className: isOverdue
        ? 'text-red-600 font-medium'
        : isDueToday
        ? 'text-orange-600 font-medium'
        : 'text-gray-700',
    };
  };

  const getStageLabel = (stageId: string) => {
    return board.stages.find((s) => s.stage_id === stageId)?.name || stageId;
  };

  const getTagNames = (tagIds: string[]) => {
    return tagIds.map((id) => board.tags.find((t) => t.tag_id === id)).filter((t) => t);
  };

  return (
    <>
      <div className="overflow-x-auto h-full">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Task
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Stage
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Assignee
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Tags
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cards.map((task) => {
              const priority = getPriorityLabel(task.priority);
              const dueDate = task.due_date ? formatDueDate(task.due_date) : null;
              const completedChecklist = task.checklist?.filter((i) => i.done).length || 0;
              const totalChecklist = task.checklist?.length || 0;
              const tags = getTagNames(task.tags);

              return (
                <tr
                  key={task.card_id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCardId(task.card_id)}
                >
                  {/* Task */}
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{task.title}</div>
                    {task.description_md && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                        {task.description_md}
                      </p>
                    )}
                  </td>

                  {/* Stage */}
                  <td className="px-6 py-4">
                    <Badge variant="secondary" className="text-xs">
                      {getStageLabel(task.stage_id)}
                    </Badge>
                  </td>

                  {/* Priority */}
                  <td className="px-6 py-4">
                    <Badge className={`text-xs ${priority.color}`}>
                      {priority.label}
                    </Badge>
                  </td>

                  {/* Due Date */}
                  <td className="px-6 py-4">
                    {dueDate ? (
                      <div className={`flex items-center gap-1 text-sm ${dueDate.className}`}>
                        <Calendar className="size-3" />
                        <span>{dueDate.text}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">–</span>
                    )}
                  </td>

                  {/* Assignee */}
                  <td className="px-6 py-4">
                    {task.owners.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                          {task.owners[0].name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-700">
                          {task.owners[0].name}
                        </span>
                        {task.owners.length > 1 && (
                          <span className="text-xs text-gray-500">
                            +{task.owners.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>

                  {/* Tags */}
                  <td className="px-6 py-4">
                    {tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag!.tag_id}
                            variant="secondary"
                            className="text-xs"
                            style={{
                              backgroundColor: tag!.color ? `${tag!.color}15` : undefined,
                              color: tag!.color || undefined,
                            }}
                          >
                            {tag!.name}
                          </Badge>
                        ))}
                        {tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{tags.length - 2}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">–</span>
                    )}
                  </td>

                  {/* Progress */}
                  <td className="px-6 py-4">
                    {totalChecklist > 0 ? (
                      <div className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {completedChecklist}/{totalChecklist}
                        </span>
                        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{
                              width: `${(completedChecklist / totalChecklist) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">–</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
