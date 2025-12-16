import React, { useState, useEffect } from 'react';
import { Plus, Search, Grid3x3, List } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import type { Board } from '../types/api-contract';

interface BoardListProps {
  onSelectBoard: (boardId: string) => void;
}

export function BoardList({ onSelectBoard }: BoardListProps) {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with real API call
  useEffect(() => {
    setTimeout(() => {
      setBoards([
        {
          board_id: 'project:1',
          name: 'Finance SSC Month-End',
          owner: { partner_id: 1, email: 'maria@company.com', name: 'Maria Santos' },
          visibility: 'team',
          members: [
            { partner_id: 1, email: 'maria@company.com', name: 'Maria Santos', role: 'admin' },
            { partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz', role: 'contributor' },
          ],
          stages: [],
          tags: [],
          description: 'Monthly financial close process tracking',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-12-15T14:32:00Z',
        },
        {
          board_id: 'project:2',
          name: 'Q1 Product Launch',
          owner: { partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz' },
          visibility: 'team',
          members: [
            { partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz', role: 'admin' },
            { partner_id: 3, email: 'ana@company.com', name: 'Ana Reyes', role: 'contributor' },
          ],
          stages: [],
          tags: [],
          description: 'New feature release coordination',
          created_at: '2024-02-01T10:00:00Z',
          updated_at: '2024-12-14T09:15:00Z',
        },
        {
          board_id: 'project:3',
          name: 'IT Infrastructure',
          owner: { partner_id: 3, email: 'ana@company.com', name: 'Ana Reyes' },
          visibility: 'private',
          members: [
            { partner_id: 3, email: 'ana@company.com', name: 'Ana Reyes', role: 'admin' },
          ],
          stages: [],
          tags: [],
          created_at: '2024-03-10T10:00:00Z',
          updated_at: '2024-12-13T16:20:00Z',
        },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="h-full p-8">
        <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-8 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">Boards</h1>
          <Button className="gap-2">
            <Plus className="size-4" />
            New Board
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search boards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="p-2"
            >
              <Grid3x3 className="size-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="p-2"
            >
              <List className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Board Grid/List */}
      <div className="flex-1 overflow-y-auto p-8">
        {filteredBoards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Search className="size-8 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-1">No boards found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery ? 'Try a different search term' : 'Create your first board to get started'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBoards.map((board) => (
              <Card
                key={board.board_id}
                className="p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onSelectBoard(board.board_id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">{board.name}</h3>
                  <span
                    className={`
                    px-2 py-0.5 rounded text-xs font-medium
                    ${
                      board.visibility === 'private'
                        ? 'bg-gray-100 text-gray-700'
                        : board.visibility === 'team'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                    }
                  `}
                  >
                    {board.visibility}
                  </span>
                </div>

                {board.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {board.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                      {board.owner.name.charAt(0)}
                    </div>
                    <span className="text-gray-700">{board.owner.name}</span>
                  </div>
                  <span className="text-gray-500">
                    {board.members.length} member{board.members.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  Updated {formatDate(board.updated_at)}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBoards.map((board) => (
              <Card
                key={board.board_id}
                className="p-4 hover:shadow-sm transition-shadow cursor-pointer"
                onClick={() => onSelectBoard(board.board_id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{board.name}</h3>
                      <span
                        className={`
                        px-2 py-0.5 rounded text-xs font-medium
                        ${
                          board.visibility === 'private'
                            ? 'bg-gray-100 text-gray-700'
                            : board.visibility === 'team'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-green-100 text-green-700'
                        }
                      `}
                      >
                        {board.visibility}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{board.description || 'No description'}</p>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="size-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium">
                        {board.owner.name.charAt(0)}
                      </div>
                      <span className="text-gray-700">{board.owner.name}</span>
                    </div>
                    <span className="text-gray-500 w-24 text-right">
                      {board.members.length} member{board.members.length !== 1 ? 's' : ''}
                    </span>
                    <span className="text-gray-500 w-32 text-right">
                      {formatDate(board.updated_at)}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
