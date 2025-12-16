import React, { useState, useEffect } from 'react';
import { ArrowLeft, Filter, Search, Plus, Users } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { KanbanColumn } from './KanbanColumn';
import { CardDetailPanel } from './CardDetailPanel';
import type { Board, Card, Stage } from '../types/api-contract';

interface BoardViewProps {
  boardId: string;
  onBack: () => void;
}

export function BoardView({ boardId, onBack }: BoardViewProps) {
  const [board, setBoard] = useState<Board | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock data - replace with real API call
  useEffect(() => {
    setTimeout(() => {
      const mockBoard: Board = {
        board_id: 'project:1',
        name: 'Finance SSC Month-End',
        owner: { partner_id: 1, email: 'maria@company.com', name: 'Maria Santos' },
        visibility: 'team',
        members: [
          { partner_id: 1, email: 'maria@company.com', name: 'Maria Santos', role: 'admin' },
          { partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz', role: 'contributor' },
          { partner_id: 3, email: 'ana@company.com', name: 'Ana Reyes', role: 'contributor' },
        ],
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
      };

      const mockCards: Card[] = [
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
          card_id: 'task:3',
          board_id: 'project:1',
          stage_id: 'stage:5',
          title: 'Submit BIR Form 2550M',
          description_md: 'Submit monthly VAT return to BIR',
          priority: '1',
          due_date: '2024-12-15',
          created_at: '2024-11-25T10:00:00Z',
          updated_at: '2024-12-15T08:00:00Z',
          owners: [{ partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz' }],
          watchers: [],
          tags: ['tag:3'],
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
      ];

      setBoard(mockBoard);
      setCards(mockCards);
      setLoading(false);
    }, 500);
  }, [boardId]);

  const handleCardMove = (cardId: string, newStageId: string) => {
    setCards((prev) =>
      prev.map((card) =>
        card.card_id === cardId ? { ...card, stage_id: newStageId } : card
      )
    );
  };

  if (loading || !board) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="size-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">Loading board...</p>
        </div>
      </div>
    );
  }

  const filteredCards = cards.filter(
    (card) =>
      !searchQuery ||
      card.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCard = selectedCardId
    ? cards.find((c) => c.card_id === selectedCardId)
    : null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="flex items-center gap-4 mb-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="p-2">
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold text-gray-900">{board.name}</h1>
          <div className="flex items-center gap-2">
            {board.members.slice(0, 3).map((member) => (
              <div
                key={member.partner_id}
                className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-medium"
                title={member.name}
              >
                {member.name.charAt(0)}
              </div>
            ))}
            {board.members.length > 3 && (
              <div className="size-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-medium">
                +{board.members.length - 3}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="size-4" />
            Filters
          </Button>
          <Button variant="outline" className="gap-2">
            <Users className="size-4" />
            Members
          </Button>
          <Button className="gap-2">
            <Plus className="size-4" />
            New Card
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {board.stages.map((stage) => {
            const stageCards = filteredCards.filter(
              (card) => card.stage_id === stage.stage_id
            );
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

      {/* Card Detail Panel */}
      {selectedCard && (
        <CardDetailPanel
          card={selectedCard}
          board={board}
          onClose={() => setSelectedCardId(null)}
          onUpdate={(updatedCard) => {
            setCards((prev) =>
              prev.map((c) => (c.card_id === updatedCard.card_id ? updatedCard : c))
            );
          }}
        />
      )}
    </div>
  );
}
