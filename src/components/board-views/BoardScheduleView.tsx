import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { TaskCard } from '../TaskCard';
import { CardDetailPanel } from '../CardDetailPanel';
import type { Board, Card } from '../../types/api-contract';

interface BoardScheduleViewProps {
  board: Board;
  cards: Card[];
  onCardUpdate: (card: Card) => void;
}

export function BoardScheduleView({ board, cards, onCardUpdate }: BoardScheduleViewProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  const selectedCard = selectedCardId
    ? cards.find((c) => c.card_id === selectedCardId)
    : null;

  // Group cards by date
  const cardsByDate: Record<string, Card[]> = {};
  const unscheduledCards: Card[] = [];

  cards.forEach((card) => {
    if (card.due_date) {
      const dateKey = card.due_date.split('T')[0];
      if (!cardsByDate[dateKey]) {
        cardsByDate[dateKey] = [];
      }
      cardsByDate[dateKey].push(card);
    } else {
      unscheduledCards.push(card);
    }
  });

  // Generate calendar days
  const getDaysInMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const days = getDaysInMonth();
  const monthName = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <>
      <div className="h-full flex overflow-hidden">
        {/* Calendar */}
        <div className="flex-1 flex flex-col">
          {/* Calendar Header */}
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-gray-900">{monthName}</h2>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('prev')}
                  className="p-2"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-3"
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth('next')}
                  className="p-2"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-1 border border-gray-200 rounded-lg p-1">
              <Button
                variant={viewMode === 'month' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('month')}
                className="px-3"
              >
                Month
              </Button>
              <Button
                variant={viewMode === 'week' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('week')}
                className="px-3"
              >
                Week
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-semibold text-gray-600 uppercase py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-2 auto-rows-fr">
              {days.map((date, index) => {
                const dateKey = date ? formatDateKey(date) : '';
                const tasksForDay = dateKey ? cardsByDate[dateKey] || [] : [];
                const today = isToday(date);

                return (
                  <div
                    key={index}
                    className={`
                      min-h-24 border border-gray-200 rounded-lg p-2
                      ${!date ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}
                      ${today ? 'border-blue-600 border-2' : ''}
                    `}
                  >
                    {date && (
                      <>
                        <div
                          className={`
                            text-sm font-medium mb-2
                            ${today ? 'text-blue-600' : 'text-gray-900'}
                          `}
                        >
                          {date.getDate()}
                        </div>
                        <div className="space-y-1">
                          {tasksForDay.slice(0, 2).map((task) => (
                            <button
                              key={task.card_id}
                              onClick={() => setSelectedCardId(task.card_id)}
                              className="w-full text-left px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded text-xs text-blue-900 truncate transition-colors"
                            >
                              {task.title}
                            </button>
                          ))}
                          {tasksForDay.length > 2 && (
                            <div className="text-xs text-gray-500 px-2">
                              +{tasksForDay.length - 2} more
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Unscheduled Tasks Sidebar */}
        <div className="w-80 border-l border-gray-200 bg-gray-50 overflow-y-auto p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Unscheduled</h3>
            <Badge variant="secondary">{unscheduledCards.length}</Badge>
          </div>

          {unscheduledCards.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="size-12 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">All tasks scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {unscheduledCards.map((card) => (
                <TaskCard
                  key={card.card_id}
                  card={card}
                  tags={board.tags}
                  onClick={() => setSelectedCardId(card.card_id)}
                />
              ))}
            </div>
          )}
        </div>
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
