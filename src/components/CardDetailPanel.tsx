import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Tag as TagIcon,
  User,
  CheckSquare,
  MessageSquare,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Send,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import type { Card, Board, Activity } from '../types/api-contract';

interface CardDetailPanelProps {
  card: Card;
  board: Board;
  onClose: () => void;
  onUpdate: (card: Card) => void;
}

export function CardDetailPanel({ card, board, onClose, onUpdate }: CardDetailPanelProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description_md || '');
  const [commentText, setCommentText] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);

  // Mock activity data
  useEffect(() => {
    setTimeout(() => {
      setActivities([
        {
          event_id: 'msg:1',
          type: 'comment',
          author: { partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz' },
          body_md: 'Please confirm totals by EOD @maria@company.com',
          mentions: [{ email: 'maria@company.com', partner_id: 1 }],
          created_at: '2024-12-15T09:30:00Z',
        },
        {
          event_id: 'msg:2',
          type: 'stage_change',
          author: { partner_id: 2, email: 'juan@company.com', name: 'Juan Cruz' },
          metadata: {
            field_name: 'stage_id',
            old_value: 'To Do',
            new_value: 'Doing',
          },
          created_at: '2024-12-14T14:20:00Z',
        },
        {
          event_id: 'msg:3',
          type: 'assignment',
          author: { partner_id: 1, email: 'maria@company.com', name: 'Maria Santos' },
          metadata: {
            field_name: 'user_id',
            new_value: 'Juan Cruz',
          },
          created_at: '2024-12-01T10:15:00Z',
        },
      ]);
      setLoadingActivities(false);
    }, 300);
  }, []);

  const handleTitleBlur = () => {
    if (title !== card.title && title.trim()) {
      onUpdate({ ...card, title });
    }
  };

  const handleDescriptionBlur = () => {
    if (description !== card.description_md) {
      onUpdate({ ...card, description_md: description });
    }
  };

  const handleChecklistToggle = (itemId: string) => {
    const updatedChecklist = card.checklist?.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    onUpdate({ ...card, checklist: updatedChecklist });
  };

  const handleCommentSubmit = () => {
    if (!commentText.trim()) return;
    // Add comment logic here
    setCommentText('');
  };

  const cardTags = card.tags
    .map((tagId) => board.tags.find((t) => t.tag_id === tagId))
    .filter((t): t is NonNullable<typeof t> => t !== undefined);

  const getPriorityLabel = () => {
    switch (card.priority) {
      case '3':
        return 'Urgent';
      case '2':
        return 'High';
      case '1':
        return 'Normal';
      default:
        return 'Low';
    }
  };

  const formatActivityTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)} minutes ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
    return date.toLocaleDateString();
  };

  const renderActivityContent = (activity: Activity) => {
    switch (activity.type) {
      case 'comment':
        return (
          <div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{activity.body_md}</p>
            {activity.mentions && activity.mentions.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                <User className="size-3" />
                <span>
                  Mentioned: {activity.mentions.map((m) => m.email).join(', ')}
                </span>
              </div>
            )}
          </div>
        );
      case 'stage_change':
        return (
          <p className="text-sm text-gray-600">
            moved this card from <strong>{activity.metadata?.old_value}</strong> to{' '}
            <strong>{activity.metadata?.new_value}</strong>
          </p>
        );
      case 'assignment':
        return (
          <p className="text-sm text-gray-600">
            assigned <strong>{activity.metadata?.new_value}</strong> to this card
          </p>
        );
      default:
        return <p className="text-sm text-gray-600">performed an action</p>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/20">
      <div className="w-full max-w-2xl h-full bg-white shadow-xl flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Card Details</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="p-2">
            <X className="size-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Title */}
            <div>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleBlur}
                className="text-xl font-semibold border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Card title"
              />
            </div>

            {/* Metadata Row */}
            <div className="flex flex-wrap gap-4 text-sm">
              {/* Stage */}
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Stage:</span>
                <Badge variant="secondary">
                  {board.stages.find((s) => s.stage_id === card.stage_id)?.name}
                </Badge>
              </div>

              {/* Priority */}
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-gray-500" />
                <span className="text-gray-500">Priority:</span>
                <Badge
                  variant={card.priority === '3' || card.priority === '2' ? 'destructive' : 'secondary'}
                >
                  {getPriorityLabel()}
                </Badge>
              </div>

              {/* Due Date */}
              {card.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-gray-500" />
                  <span className="text-gray-500">Due:</span>
                  <span className="text-gray-900">
                    {new Date(card.due_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            {/* Tags */}
            {cardTags.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TagIcon className="size-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Tags</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cardTags.map((tag) => (
                    <Badge
                      key={tag.tag_id}
                      variant="secondary"
                      style={{
                        backgroundColor: tag.color ? `${tag.color}15` : undefined,
                        color: tag.color || undefined,
                      }}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Assignees */}
            {card.owners.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <User className="size-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Assigned to</span>
                </div>
                <div className="flex items-center gap-2">
                  {card.owners.map((owner) => (
                    <div key={owner.partner_id} className="flex items-center gap-2">
                      <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                        {owner.name.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-700">{owner.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">Description</span>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={handleDescriptionBlur}
                placeholder="Add a description..."
                className="min-h-24"
              />
            </div>

            {/* Checklist */}
            {card.checklist && card.checklist.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckSquare className="size-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Checklist</span>
                  <span className="text-xs text-gray-500">
                    {card.checklist.filter((item) => item.done).length} /{' '}
                    {card.checklist.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {card.checklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      <Checkbox
                        checked={item.done}
                        onCheckedChange={() => handleChecklistToggle(item.id)}
                      />
                      <span
                        className={`text-sm ${
                          item.done ? 'line-through text-gray-500' : 'text-gray-700'
                        }`}
                      >
                        {item.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activity Feed */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="size-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">Activity</span>
              </div>

              {/* Comment Input */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    M
                  </div>
                  <div className="flex-1">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment... Use @email to mention someone"
                      className="mb-2"
                    />
                    <Button size="sm" onClick={handleCommentSubmit} disabled={!commentText.trim()}>
                      <Send className="size-3 mr-2" />
                      Post Comment
                    </Button>
                  </div>
                </div>
              </div>

              {/* Activity List */}
              {loadingActivities ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <div className="size-8 rounded-full bg-gray-200 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                        <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.event_id} className="flex gap-3">
                      <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {activity.author.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {activity.author.name}
                          </span>
                          <span className="text-xs text-gray-500">
                            {formatActivityTime(activity.created_at)}
                          </span>
                        </div>
                        {renderActivityContent(activity)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
