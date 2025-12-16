import React, { useState, useEffect } from 'react';
import { Sun, Plus, Calendar, CheckSquare } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TaskCard } from '../TaskCard';
import { CardDetailPanel } from '../CardDetailPanel';
import type { Card } from '../../types/api-contract';

interface MyDayProps {
  onSelectBoard: (boardId: string) => void;
}

export function MyDay({ onSelectBoard }: MyDayProps) {
  const [tasks, setTasks] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // Mock data - replace with GET /api/v1/cards?assignee=me&due=today|overdue
  useEffect(() => {
    setTimeout(() => {
      const today = new Date().toISOString().split('T')[0];
      setTasks([
        {
          card_id: 'task:6',
          board_id: 'project:2',
          stage_id: 'stage:1',
          title: 'Design product landing page',
          priority: '3',
          due_date: '2024-12-16',
          created_at: '2024-12-10T10:00:00Z',
          updated_at: '2024-12-15T08:00:00Z',
          owners: [{ partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz' }],
          watchers: [],
          tags: [],
          parent_id: null,
          subtask_ids: [],
        },
        {
          card_id: 'task:2',
          board_id: 'project:1',
          stage_id: 'stage:4',
          title: 'Process payroll for December',
          description_md: 'Complete payroll processing and generate reports',
          priority: '2',
          due_date: '2024-12-18',
          created_at: '2024-12-02T10:00:00Z',
          updated_at: '2024-12-14T16:20:00Z',
          owners: [{ partner_id: 3, email: 'ana@company.com', name: 'Ana Reyes' }],
          watchers: [],
          tags: ['tag:2'],
          parent_id: null,
          subtask_ids: [],
        },
      ]);
      setLoading(false);
    }, 400);
  }, []);

  const selectedCard = selectedCardId
    ? tasks.find((t) => t.card_id === selectedCardId)
    : null;

  const currentDate = new Date();
  const dateString = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const overdueTasks = tasks.filter(
    (t) => t.due_date && new Date(t.due_date) < currentDate
  );
  const todayTasks = tasks.filter(
    (t) =>
      t.due_date &&
      new Date(t.due_date).toDateString() === currentDate.toDateString()
  );
  const upcomingTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    return dueDate > currentDate;
  });

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading your day...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <div className="border-b border-gray-200 px-8 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Sun className="size-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">My Day</h1>
              <p className="text-sm text-gray-600">{dateString}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Total tasks:</span>
              <Badge variant="secondary">{tasks.length}</Badge>
            </div>
            {overdueTasks.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Overdue:</span>
                <Badge variant="destructive">{overdueTasks.length}</Badge>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {tasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="size-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                <Sun className="size-8 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">
                Your day is clear!
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                No tasks due today. Add tasks to plan your day.
              </p>
              <Button className="gap-2">
                <Plus className="size-4" />
                Add Task
              </Button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Overdue Section */}
              {overdueTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-semibold text-red-700">Overdue</h2>
                    <Badge variant="destructive" className="text-xs">
                      {overdueTasks.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {overdueTasks.map((task) => (
                      <TaskCard
                        key={task.card_id}
                        card={task}
                        tags={[
                          { tag_id: 'tag:1', name: 'Urgent', color: '#EF4444' },
                          { tag_id: 'tag:2', name: 'Finance', color: '#3B82F6' },
                          { tag_id: 'tag:3', name: 'Tax', color: '#8B5CF6' },
                        ]}
                        onClick={() => setSelectedCardId(task.card_id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Today Section */}
              {todayTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-semibold text-gray-900">Due Today</h2>
                    <Badge variant="secondary" className="text-xs">
                      {todayTasks.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {todayTasks.map((task) => (
                      <TaskCard
                        key={task.card_id}
                        card={task}
                        tags={[
                          { tag_id: 'tag:1', name: 'Urgent', color: '#EF4444' },
                          { tag_id: 'tag:2', name: 'Finance', color: '#3B82F6' },
                          { tag_id: 'tag:3', name: 'Tax', color: '#8B5CF6' },
                        ]}
                        onClick={() => setSelectedCardId(task.card_id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Upcoming Section */}
              {upcomingTasks.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <h2 className="font-semibold text-gray-900">Upcoming</h2>
                    <Badge variant="secondary" className="text-xs">
                      {upcomingTasks.length}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    {upcomingTasks.map((task) => (
                      <TaskCard
                        key={task.card_id}
                        card={task}
                        tags={[
                          { tag_id: 'tag:1', name: 'Urgent', color: '#EF4444' },
                          { tag_id: 'tag:2', name: 'Finance', color: '#3B82F6' },
                          { tag_id: 'tag:3', name: 'Tax', color: '#8B5CF6' },
                        ]}
                        onClick={() => setSelectedCardId(task.card_id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Add Task Button */}
              <Button variant="outline" className="w-full gap-2">
                <Plus className="size-4" />
                Add Task to My Day
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Card Detail Panel */}
      {selectedCard && (
        <CardDetailPanel
          card={selectedCard}
          board={{
            board_id: selectedCard.board_id,
            name: 'My Day',
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
            setTasks((prev) =>
              prev.map((t) => (t.card_id === updatedCard.card_id ? updatedCard : t))
            );
          }}
        />
      )}
    </>
  );
}
