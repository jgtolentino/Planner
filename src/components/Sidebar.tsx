import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Home, Settings, Plus } from 'lucide-react';
import { Button } from './ui/button';
import type { Board } from '../types/api-contract';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string | null) => void;
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  selectedBoardId,
  onSelectBoard,
}: SidebarProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with real API call
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
          onClick={onToggleCollapse}
          className="p-2"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectBoard(null)}
          className="p-2"
        >
          <Home className="size-4" />
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
          onClick={onToggleCollapse}
          className="p-2"
        >
          <ChevronLeft className="size-4" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-3">
        <Button
          variant={selectedBoardId === null ? 'secondary' : 'ghost'}
          className="w-full justify-start mb-2"
          onClick={() => onSelectBoard(null)}
        >
          <Home className="size-4 mr-2" />
          All Boards
        </Button>

        <div className="mt-6 mb-3 px-3 flex items-center justify-between">
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
            {boards.map((board) => (
              <button
                key={board.board_id}
                onClick={() => onSelectBoard(board.board_id)}
                className={`
                  w-full px-3 py-2 rounded text-left text-sm transition-colors
                  ${
                    selectedBoardId === board.board_id
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
              >
                <div className="truncate">{board.name}</div>
                <div className="text-xs text-gray-500 mt-0.5 truncate">
                  {board.owner.name}
                </div>
              </button>
            ))}
          </div>
        )}
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
