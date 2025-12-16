import React, { useState, useEffect } from 'react';
import { Search, Filter, LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select } from '../ui/select';
import { TaskGridView } from '../TaskGridView';
import { TaskBoardView } from '../TaskBoardView';
import type { Card } from '../../types/api-contract';

interface MyTasksProps {
  onSelectBoard: (boardId: string) => void;
}

type ViewMode = 'grid' | 'board';
type FilterStatus = 'all' | 'active' | 'completed';
type FilterAssignee = 'all' | 'me' | 'unassigned';

export function MyTasks({ onSelectBoard }: MyTasksProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [tasks, setTasks] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [filterAssignee, setFilterAssignee] = useState<FilterAssignee>('me');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - replace with GET /api/v1/cards?assignee=me
  useEffect(() => {
    setTimeout(() => {
      setTasks([
        {
          card_id: 'task:1',
          board_id: 'project:1',
          stage_id: 'stage:3',
          title: 'Reconcile VAT input tax',
          description_md: 'Reconcile VAT input tax for December filing',
          priority: '2',
          due_date: '2024-12-20',
          created_at: '2024-12-01T10:00:00Z',
          updated_at: '2024-12-15T09:30:00Z',
          owners: [{ partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz' }],
          watchers: [],
          tags: ['tag:1', 'tag:3'],
          parent_id: null,
          subtask_ids: [],
          checklist: [
            { id: '1', text: 'Gather input invoices', done: true, order: 1 },
            { id: '2', text: 'Match with PO system', done: false, order: 2 },
          ],
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
        {
          card_id: 'task:4',
          board_id: 'project:1',
          stage_id: 'stage:2',
          title: 'Review Q4 expense reports',
          priority: '1',
          due_date: '2024-12-22',
          created_at: '2024-12-05T10:00:00Z',
          updated_at: '2024-12-10T11:15:00Z',
          owners: [{ partner_id: 1, email: 'maria@company.com', name: 'Maria Santos' }],
          watchers: [],
          tags: ['tag:2'],
          parent_id: null,
          subtask_ids: [],
        },
        {
          card_id: 'task:5',
          board_id: 'project:1',
          stage_id: 'stage:2',
          title: 'Update depreciation schedule',
          priority: '1',
          due_date: null,
          created_at: '2024-12-08T10:00:00Z',
          updated_at: '2024-12-08T10:00:00Z',
          owners: [{ partner_id: 3, email: 'ana@company.com', name: 'Ana Reyes' }],
          watchers: [],
          tags: [],
          parent_id: null,
          subtask_ids: [],
        },
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
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredTasks = tasks.filter((task) => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    // Status filter (using stage as proxy)
    if (filterStatus === 'completed' && task.stage_id !== 'stage:5') {
      return false;
    }
    if (filterStatus === 'active' && task.stage_id === 'stage:5') {
      return false;
    }

    // Assignee filter (simplified - in production, check against current user)
    if (filterAssignee === 'unassigned' && task.owners.length > 0) {
      return false;
    }

    return true;
  });

  const taskCounts = {
    total: filteredTasks.length,
    overdue: filteredTasks.filter(
      (t) => t.due_date && new Date(t.due_date) < new Date()
    ).length,
    dueToday: filteredTasks.filter(
      (t) =>
        t.due_date &&
        new Date(t.due_date).toDateString() === new Date().toDateString()
    ).length,
    dueSoon: filteredTasks.filter((t) => {
      if (!t.due_date) return false;
      const diffDays =
        (new Date(t.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= 7;
    }).length,
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">My Tasks</h1>

        {/* Stats */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Total:</span>
            <Badge variant="secondary">{taskCounts.total}</Badge>
          </div>
          {taskCounts.overdue > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Overdue:</span>
              <Badge variant="destructive">{taskCounts.overdue}</Badge>
            </div>
          )}
          {taskCounts.dueToday > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Due today:</span>
              <Badge className="bg-orange-100 text-orange-700">
                {taskCounts.dueToday}
              </Badge>
            </div>
          )}
          {taskCounts.dueSoon > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Due this week:</span>
              <Badge variant="secondary">{taskCounts.dueSoon}</Badge>
            </div>
          )}
        </div>

        {/* Search & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>

          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
            >
              <List className="size-4" />
            </Button>
            <Button
              variant={viewMode === 'board' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('board')}
              className="p-2"
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        {showFilters && (
          <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="all">All</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Assigned to:</span>
              <select
                value={filterAssignee}
                onChange={(e) => setFilterAssignee(e.target.value as FilterAssignee)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white"
              >
                <option value="all">Anyone</option>
                <option value="me">Me</option>
                <option value="unassigned">Unassigned</option>
              </select>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterStatus('all');
                setFilterAssignee('me');
              }}
              className="ml-auto text-xs"
            >
              Clear filters
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="size-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No tasks found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery
                ? 'Try adjusting your search or filters'
                : 'All caught up! No tasks assigned to you.'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <TaskGridView tasks={filteredTasks} onSelectBoard={onSelectBoard} />
        ) : (
          <TaskBoardView tasks={filteredTasks} onSelectBoard={onSelectBoard} />
        )}
      </div>
    </div>
  );
}
