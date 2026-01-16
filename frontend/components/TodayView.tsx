
import React, { useState, useEffect } from 'react';
import { Task, TaskStatus } from '../types';
import { getDailyConnectionPrompt } from '../services/geminiService';

interface TodayViewProps {
  tasks: Task[];
}

const TodayView: React.FC<TodayViewProps> = ({ tasks }) => {
  const [prompt, setPrompt] = useState<string>("Loading your connection prompt...");
  const [mood, setMood] = useState<string>("✨ Feeling Great");
  
  const todayTasks = tasks.filter(t => t.status === TaskStatus.UPCOMING);
  const dateOptions: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  const todayDate = new Date().toLocaleDateString('en-US', dateOptions);

  useEffect(() => {
    const fetchPrompt = async () => {
      const p = await getDailyConnectionPrompt();
      setPrompt(p || "What is one thing you're grateful for about us today?");
    };
    fetchPrompt();
  }, []);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header Section */}
        <div className="text-center space-y-2">
          <p className="text-accent font-bold uppercase tracking-[0.2em] text-[10px]">Your Shared Space in Synk</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">{todayDate}</h1>
          <p className="text-secondary text-lg">Good morning!</p>
        </div>

        {/* Daily Connection Card */}
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
                onClick={() => alert('Your answer has been shared with your partner!')}
                className="text-[11px] font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest"
              >
                Share Answer
              </button>
              <span className="text-secondary/30">•</span>
              <button 
                onClick={() => {
                  const newPrompt = prompt("What is one thing you're grateful for about us today?");
                  if (newPrompt) setPrompt(newPrompt);
                }}
                className="text-[11px] font-bold text-secondary hover:text-primary transition-colors uppercase tracking-widest"
              >
                Skip
              </button>
            </div>
          </div>
        </div>

        {/* Focus & Mood Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Today's Focus */}
          <div className="bg-card border border-subtle rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">event_available</span>
                Today's Focus
              </h3>
              <span className="text-[10px] text-accent font-bold">{todayTasks.length} Events</span>
            </div>
            
            <div className="space-y-3">
              {todayTasks.length > 0 ? (
                todayTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-subtle group hover:border-accent/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-accent group-hover:animate-pulse"></div>
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
                  <button className="mt-2 text-[10px] text-accent font-bold uppercase hover:underline">Plan something</button>
                </div>
              )}
            </div>
          </div>

          {/* Mood Check-in */}
          <div className="bg-card border border-subtle rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-secondary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">mood</span>
              Your Mood Today
            </h3>
            
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                  <span className="material-symbols-outlined text-xl">sentiment_satisfied</span>
                </div>
                <div>
                  <p className="text-xs font-bold">Today's Vibe</p>
                  <p className="text-[11px] text-secondary">{mood}</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  const newMood = prompt('Update your mood:', mood);
                  if (newMood) setMood(newMood);
                }}
                className="text-[10px] bg-white/5 hover:bg-white/10 px-2 py-1 rounded border border-subtle transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>

        {/* Morning Pro-Tip Footer */}
        <div className="pt-4 flex justify-center">
           <div className="flex items-center gap-4 px-6 py-3 bg-white/[0.02] border border-subtle rounded-full">
              <span className="text-lg">💡</span>
              <p className="text-xs text-secondary leading-relaxed">
                <span className="text-primary font-medium">Pro-tip:</span> Today is a great day to send a random "I love you" text.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TodayView;