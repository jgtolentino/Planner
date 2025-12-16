import React, { useState } from 'react';
import { Calendar, CheckSquare, AlertCircle, ExternalLink } from 'lucide-react';
import { Badge } from './ui/badge';
import { CardDetailPanel } from './CardDetailPanel';
import type { Card } from '../types/api-contract';

interface TaskGridViewProps {
  tasks: Card[];
  onSelectBoard: (boardId: string) => void;
}

export function TaskGridView({ tasks, onSelectBoard }: TaskGridViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const selectedCard = selectedCardId
    ? tasks.find((t) => t.card_id === selectedCardId)
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

  // Mock board names - in production, fetch from boards list
  const getBoardName = (boardId: string) => {
    const boardNames: Record<string, string> = {
      'project:1': 'Finance SSC',
      'project:2': 'Q1 Product Launch',
      'project:3': 'IT Infrastructure',
    };
    return boardNames[boardId] || boardId;
  };

  const getStageLabel = (stageId: string) => {
    const stageNames: Record<string, string> = {
      'stage:1': 'Backlog',
      'stage:2': 'To Do',
      'stage:3': 'Doing',
      'stage:4': 'Review',
      'stage:5': 'Done',
    };
    return stageNames[stageId] || stageId;
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
                Board
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
                Progress
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tasks.map((task) => {
              const priority = getPriorityLabel(task.priority);
              const dueDate = task.due_date ? formatDueDate(task.due_date) : null;
              const completedChecklist = task.checklist?.filter((i) => i.done).length || 0;
              const totalChecklist = task.checklist?.length || 0;

              return (
                <tr
                  key={task.card_id}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedCardId(task.card_id)}
                >
                  {/* Task */}
                  <td className="px-6 py-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{task.title}</div>
                        {task.description_md && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                            {task.description_md}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Board */}
                  <td className="px-6 py-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectBoard(task.board_id);
                      }}
                      className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                    >
                      {getBoardName(task.board_id)}
                      <ExternalLink className="size-3" />
                    </button>
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

      {/* Card Detail Panel */}
      {selectedCard && (
        <CardDetailPanel
          card={selectedCard}
          board={{
            board_id: selectedCard.board_id,
            name: getBoardName(selectedCard.board_id),
            owner: { partner_id: 1, email: 'maria@company.com', name: 'Maria Santos' },
            visibility: 'team',
            members: [],
            stages: [
              { stage_id: 'stage:1', name: 'Backlog', order: 10, wip_limit: null },
              { stage_id: 'stage:2', name: 'To Do', order: 20, wip_limit: 5 },
              { stage_id: 'stage:3', name: 'Doing', order: 30, wip_limit: 3 },
              { stage_id: 'stage:4', name: 'Review', order: 40, wip_limit: null },
              { stage_id: 'stage:5', name: 'Done', order: 50, wip_limit: null },
            ],
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
