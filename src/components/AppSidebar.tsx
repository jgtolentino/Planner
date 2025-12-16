import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CheckSquare,
  Calendar,
  Folder,
  Settings,
  Plus,
  Pin,
} from 'lucide-react';
import { Button } from './ui/button';
import type { Board } from '../types/api-contract';

interface AppSidebarProps {
  currentView: 'my-plans' | 'my-tasks' | 'my-day' | 'board';
  onNavigate: (view: 'my-plans' | 'my-tasks' | 'my-day' | 'board', boardId?: string) => void;
  selectedBoardId: string | null;
}

export function AppSidebar({ currentView, onNavigate, selectedBoardId }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with GET /api/v1/boards
  useEffect(() => {
    setTimeout(() => {
      setBoards([
        {
          board_id: 'project:1',
          name: 'Finance SSC Month-End',
          owner: { partner_id: 1, email: 'maria@company.com', name: 'Maria Santos' },
          visibility: 'team',
          members: [],
          stages: [],
          tags: [],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-12-15T10:00:00Z',
        },
        {
          board_id: 'project:2',
          name: 'Q1 Product Launch',
          owner: { partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz' },
          visibility: 'team',
          members: [],
          stages: [],
          tags: [],
          created_at: '2024-02-01T10:00:00Z',
          updated_at: '2024-12-14T10:00:00Z',
        },
        {
          board_id: 'project:3',
          name: 'IT Infrastructure',
          owner: { partner_id: 3, email: 'ana@company.com', name: 'Ana Reyes' },
          visibility: 'private',
          members: [],
          stages: [],
          tags: [],
          created_at: '2024-03-10T10:00:00Z',
          updated_at: '2024-12-13T16:20:00Z',
        },
      ]);
      setLoading(false);
    }, 300);
  }, []);

  if (collapsed) {
    return (
      <aside className="w-16 border-r border-gray-200 bg-white flex flex-col items-center py-4 gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(false)}
          className="p-2"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant={currentView === 'my-tasks' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onNavigate('my-tasks')}
          className="p-2"
          title="My Tasks"
        >
          <CheckSquare className="size-4" />
        </Button>
        <Button
          variant={currentView === 'my-day' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onNavigate('my-day')}
          className="p-2"
          title="My Day"
        >
          <Calendar className="size-4" />
        </Button>
        <Button
          variant={currentView === 'my-plans' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => onNavigate('my-plans')}
          className="p-2"
          title="My Plans"
        >
          <Folder className="size-4" />
        </Button>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded bg-blue-600 flex items-center justify-center text-white">
            <span className="text-sm font-semibold">TK</span>
          </div>
          <span className="font-semibold text-gray-900">Taskboard</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(true)}
          className="p-2"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        {/* Global Views */}
        <div className="space-y-1 mb-6">
          <Button
            variant={currentView === 'my-tasks' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onNavigate('my-tasks')}
          >
            <CheckSquare className="size-4 mr-2" />
            My Tasks
          </Button>
          <Button
            variant={currentView === 'my-day' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onNavigate('my-day')}
          >
            <Calendar className="size-4 mr-2" />
            My Day
          </Button>
          <Button
            variant={currentView === 'my-plans' ? 'secondary' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onNavigate('my-plans')}
          >
            <Folder className="size-4 mr-2" />
            My Plans
          </Button>
        </div>

        {/* Boards Section */}
        <div>
          <div className="px-3 py-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Boards
            </span>
            <Button variant="ghost" size="sm" className="p-1 h-auto">
              <Plus className="size-3" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {boards.slice(0, 2).map((board) => (
                <button
                  key={board.board_id}
                  onClick={() => onNavigate('board', board.board_id)}
                  className={`
                    w-full px-3 py-2 rounded text-left text-sm transition-colors flex items-center gap-2
                    ${
                      currentView === 'board' && selectedBoardId === board.board_id
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Pin className="size-3 text-gray-400" />
                  <span className="truncate flex-1">{board.name}</span>
                </button>
              ))}

              {boards.length > 2 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-xs text-gray-500 mt-1"
                  onClick={() => onNavigate('my-plans')}
                >
                  View all boards ({boards.length})
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200">
        <Button variant="ghost" className="w-full justify-start">
          <Settings className="size-4 mr-2" />
          Settings
        </Button>
      </div>
    </aside>
  );
}
