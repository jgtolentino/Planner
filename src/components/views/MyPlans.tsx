import React from 'react';
import { BoardList } from '../BoardList';

interface MyPlansProps {
  onSelectBoard: (boardId: string) => void;
}

export function MyPlans({ onSelectBoard }: MyPlansProps) {
  return <BoardList onSelectBoard={onSelectBoard} />;
}
