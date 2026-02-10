import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task, TaskStatus, DailyConnection } from '../types';
import AnswerModal from './AnswerModal';
import { dailyConnectionApi } from '../services/djangoApi';

function timeBasedGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning!';
  if (h < 17) return 'Good afternoon!';
  return 'Good evening!';
}

interface TodayViewProps {
  tasks: Task[];
  onShareAnswer?: () => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info' | 'warning') => void;
}

const TodayView: React.FC<TodayViewProps> = ({ tasks, onShareAnswer, showToast }) => {
  const [prompt, setPrompt] = useState<string>('Loading your connection prompt...');
  const [dailyConnection, setDailyConnection] = useState<DailyConnection | null>(null);
  const [shared, setShared] = useState(false);
  const [loadingSkip, setLoadingSkip] = useState(false);
  const [answerModalOpen, setAnswerModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const todayDateString = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.date === todayDateString && t.status !== TaskStatus.COMPLETED);
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const todayDate = new Date().toLocaleDateString('en-US', dateOptions);

  const fetchDailyConnection = async () => {
    try {
      const connection = await dailyConnectionApi.getToday() as DailyConnection;
      setDailyConnection(connection);
      setPrompt(connection.prompt);
      // Check if current user has already answered
      const userAnswered = connection.answers && connection.answers.length > 0;
      setShared(userAnswered);
    } catch (error) {
      console.error('Error fetching daily connection:', error);
      showToast?.('Could not load daily connection', 'error');
      setPrompt('Take a moment to share something meaningful with your partner.');
    }
  };

  useEffect(() => {
    fetchDailyConnection();
  }, []);

  const handleShare = () => {
    setAnswerModalOpen(true);
  };

  const handleSubmitAnswer = async (answer: string) => {
    if (!dailyConnection || isSubmitting || !dailyConnection.id) return;
    
    try {
      setIsSubmitting(true);
      await dailyConnectionApi.submitAnswer(parseInt(String(dailyConnection.id), 10), answer);
      setShared(true);
      setAnswerModalOpen(false);
      onShareAnswer?.();
      showToast?.('Your answer has been shared with your partner!', 'success');
      // Navigate to inbox to see the response
      navigate('/inbox');
    } catch (error) {
      console.error('Error submitting answer:', error);
      showToast?.('Failed to share your answer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    if (loadingSkip) return;
    setLoadingSkip(true);
    setShared(false);
    await fetchDailyConnection();
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
              "{prompt}"
            </h2>
            <div className="flex justify-center gap-4 pt-2">
              <button
                onClick={handleShare}
                disabled={shared || isSubmitting}
                className="text-[11px] font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest disabled:opacity-50 disabled:cursor-default"
              >
                {isSubmitting ? 'Sharing…' : shared ? 'Shared' : 'Share Answer'}
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
                        <p className="text-[10px] text-secondary">{task.date ? new Date(task.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No date'}</p>
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
