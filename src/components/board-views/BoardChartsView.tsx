import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Board, Card as TaskCard } from '../../types/api-contract';

interface BoardChartsViewProps {
  board: Board;
  cards: TaskCard[];
}

export function BoardChartsView({ board, cards }: BoardChartsViewProps) {
  // Calculate stats
  const cardsByStage = board.stages.map((stage) => ({
    name: stage.name,
    count: cards.filter((c) => c.stage_id === stage.stage_id).length,
  }));

  const cardsByPriority = [
    { name: 'Urgent', value: cards.filter((c) => c.priority === '3').length, color: '#EF4444' },
    { name: 'High', value: cards.filter((c) => c.priority === '2').length, color: '#F97316' },
    { name: 'Normal', value: cards.filter((c) => c.priority === '1').length, color: '#3B82F6' },
    { name: 'Low', value: cards.filter((c) => c.priority === '0').length, color: '#6B7280' },
  ].filter((p) => p.value > 0);

  const cardsByOwner = (() => {
    const ownerCounts: Record<string, number> = {};
    cards.forEach((card) => {
      card.owners.forEach((owner) => {
        ownerCounts[owner.name] = (ownerCounts[owner.name] || 0) + 1;
      });
    });
    return Object.entries(ownerCounts).map(([name, count]) => ({
      name,
      count,
    }));
  })();

  const completionStats = {
    completed: cards.filter((c) => c.stage_id === 'stage:5').length,
    inProgress: cards.filter((c) => c.stage_id !== 'stage:5' && c.stage_id !== 'stage:1').length,
    notStarted: cards.filter((c) => c.stage_id === 'stage:1').length,
  };

  const totalTasks = cards.length;
  const avgChecklistCompletion =
    cards.reduce((sum, card) => {
      const total = card.checklist?.length || 0;
      const done = card.checklist?.filter((i) => i.done).length || 0;
      return sum + (total > 0 ? done / total : 0);
    }, 0) / Math.max(cards.filter((c) => c.checklist && c.checklist.length > 0).length, 1);

  return (
    <div className="h-full overflow-y-auto p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Total Tasks</div>
            <div className="text-3xl font-semibold text-gray-900">{totalTasks}</div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Completed</div>
            <div className="text-3xl font-semibold text-green-600">
              {completionStats.completed}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {totalTasks > 0 ? Math.round((completionStats.completed / totalTasks) * 100) : 0}%
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">In Progress</div>
            <div className="text-3xl font-semibold text-blue-600">
              {completionStats.inProgress}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {totalTasks > 0 ? Math.round((completionStats.inProgress / totalTasks) * 100) : 0}%
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-gray-600 mb-1">Avg. Checklist</div>
            <div className="text-3xl font-semibold text-gray-900">
              {Math.round(avgChecklistCompletion * 100)}%
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tasks by Stage */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tasks by Stage</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardsByStage}>
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} />
                <YAxis stroke="#6B7280" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Priority Distribution */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Priority Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={cardsByPriority}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {cardsByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Tasks by Owner */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tasks by Assignee</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cardsByOwner} layout="vertical">
                <XAxis type="number" stroke="#6B7280" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#6B7280" fontSize={12} width={100} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                  }}
                />
                <Bar dataKey="count" fill="#8B5CF6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Status Overview */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Status Overview</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Completed</span>
                  <span className="text-sm font-medium text-gray-900">
                    {completionStats.completed} / {totalTasks}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-600 rounded-full"
                    style={{
                      width: `${
                        totalTasks > 0 ? (completionStats.completed / totalTasks) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">In Progress</span>
                  <span className="text-sm font-medium text-gray-900">
                    {completionStats.inProgress} / {totalTasks}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${
                        totalTasks > 0 ? (completionStats.inProgress / totalTasks) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700">Not Started</span>
                  <span className="text-sm font-medium text-gray-900">
                    {completionStats.notStarted} / {totalTasks}
                  </span>
                </div>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 rounded-full"
                    style={{
                      width: `${
                        totalTasks > 0 ? (completionStats.notStarted / totalTasks) * 100 : 0
                      }%`,
                    }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Completion Rate</span>
                  <span className="text-2xl font-semibold text-gray-900">
                    {totalTasks > 0 ? Math.round((completionStats.completed / totalTasks) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tags Usage */}
        {board.tags.length > 0 && (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Tag Usage</h3>
            <div className="flex flex-wrap gap-3">
              {board.tags.map((tag) => {
                const count = cards.filter((c) => c.tags.includes(tag.tag_id)).length;
                return (
                  <div key={tag.tag_id} className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}15` : undefined,
                        color: tag.color || undefined,
                      }}
                    >
                      {tag.name}
                    </Badge>
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
