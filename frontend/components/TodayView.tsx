import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, TaskStatus } from '../types';
import AnswerModal from './AnswerModal';

function timeBasedGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning!';
  if (h < 17) return 'Good afternoon!';
  return 'Good evening!';
}

interface TodayViewProps {
  tasks: Task[];
  vibe: string;
  onShareAnswer?: () => void;
}

const TodayView: React.FC<TodayViewProps> = ({ tasks, vibe, onShareAnswer }) => {
  const [prompt, setPrompt] = useState<string>('Loading your connection prompt...');
  const [shared, setShared] = useState(false);
  const [loadingSkip, setLoadingSkip] = useState(false);
  const [answerModalOpen, setAnswerModalOpen] = useState(false);

  const todayTasks = tasks.filter(t => t.status === TaskStatus.UPCOMING);
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const todayDate = new Date().toLocaleDateString('en-US', dateOptions);

  const fetchPrompt = async () => {
    setPrompt('Take a moment to share something meaningful with your partner.');
  };

  useEffect(() => {
    fetchPrompt();
  }, []);

  const handleShare = () => {
    setAnswerModalOpen(true);
  };

  const handleSubmitAnswer = (answer: string) => {
    onShareAnswer?.();
    // Here you could save the answer to the backend if needed
    console.log('Shared answer:', answer);
    setShared(true);
  };

  const handleSkip = async () => {
    if (loadingSkip) return;
    setLoadingSkip(true);
    setShared(false);
    await fetchPrompt();
    setLoadingSkip(false);
  };

  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <p className="text-accent font-bold uppercase tracking-[0.2em] text-[10px]">Your Shared Space in Synk</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{todayDate}</h1>
          <p className="text-secondary text-lg">{timeBasedGreeting()}</p>
        </div>

        <div className="bg-card/40 border border-romantic/20 rounded-2xl p-8 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="material-symbols-outlined text-6xl text-romantic">favorite</span>
          </div>
          <div className="relative z-10 space-y-4 text-center">
            <span className="inline-block px-3 py-1 bg-romantic/10 text-romantic rounded-full text-[10px] font-bold uppercase tracking-wider">
              Daily Connection
            </span>
            <h2 className="text-xl md:text-2xl font-medium leading-relaxed italic">
              &ldquo;{prompt}&rdquo;
            </h2>
            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={handleShare}
                disabled={shared}
                className="text-[11px] font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-default"
              >
                {shared ? 'Shared' : 'Share Answer'}
              </button>
              <span className="text-secondary/30">•</span>
              <button
                onClick={handleSkip}
                disabled={loadingSkip}
                className="text-[11px] font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest disabled:opacity-50"
              >
                {loadingSkip ? 'Loading…' : 'Skip'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">event_available</span>
                Today&apos;s Focus
              </h3>
              <span className="text-[10px] text-accent font-bold">{todayTasks.length} Events</span>
            </div>
            <div className="space-y-3">
              {todayTasks.length > 0 ? (
                todayTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-subtle group hover:border-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent"></div>
                      <div>
                        <p className="text-sm font-medium">{task.title}</p>
                        <p className="text-[10px] text-secondary">{task.time || 'All day'}</p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-lg">chevron_right</span>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center border border-dashed border-subtle rounded-xl">
                  <p className="text-xs text-secondary italic">No shared plans for today yet.</p>
                  <button
                    onClick={() => navigate('/board')}
                    className="mt-2 text-[10px] text-accent font-bold uppercase hover:underline"
                  >
                    Plan something
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-card border border-subtle rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">mood</span>
              Today&apos;s Vibe
            </h3>
            <div className="flex items-center gap-3 pt-2">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                <span className="material-symbols-outlined text-xl">sentiment_satisfied</span>
              </div>
              <p className="text-[11px] text-secondary line-clamp-2">{vibe}</p>
            </div>
          </div>
        </div>
      </div>

      <AnswerModal
        prompt={prompt}
        isOpen={answerModalOpen}
        onClose={() => setAnswerModalOpen(false)}
        onSubmit={handleSubmitAnswer}
      />
    </div>
  );
};

export default TodayView;