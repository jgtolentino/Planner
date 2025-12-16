import React, { useState } from 'react';
import { AppSidebar } from './components/AppSidebar';
import { MyPlans } from './components/views/MyPlans';
import { MyTasks } from './components/views/MyTasks';
import { MyDay } from './components/views/MyDay';
import { BoardView } from './components/views/BoardView';

type View = 'my-plans' | 'my-tasks' | 'my-day' | 'board';

interface AppState {
  currentView: View;
  selectedBoardId: string | null;
}

export default function App() {
  const [state, setState] = useState<AppState>({
    currentView: 'my-tasks',
    selectedBoardId: null,
  });

  const navigateToView = (view: View, boardId?: string) => {
    setState({
      currentView: view,
      selectedBoardId: boardId || null,
    });
  };

  const renderView = () => {
    switch (state.currentView) {
      case 'my-plans':
        return <MyPlans onSelectBoard={(id) => navigateToView('board', id)} />;
      case 'my-tasks':
        return <MyTasks onSelectBoard={(id) => navigateToView('board', id)} />;
      case 'my-day':
        return <MyDay onSelectBoard={(id) => navigateToView('board', id)} />;
      case 'board':
        return state.selectedBoardId ? (
          <BoardView
            boardId={state.selectedBoardId}
            onBack={() => navigateToView('my-plans')}
          />
        ) : (
          <MyPlans onSelectBoard={(id) => navigateToView('board', id)} />
        );
      default:
        return <MyTasks onSelectBoard={(id) => navigateToView('board', id)} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <AppSidebar
        currentView={state.currentView}
        onNavigate={navigateToView}
        selectedBoardId={state.selectedBoardId}
      />
      <main className="flex-1 overflow-hidden">{renderView()}</main>
    </div>
  );
}
