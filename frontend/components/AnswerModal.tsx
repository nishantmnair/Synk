import React, { useState } from 'react';

interface AnswerModalProps {
  prompt: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (answer: string) => void;
}

const AnswerModal: React.FC<AnswerModalProps> = ({ prompt, isOpen, onClose, onSubmit }) => {
  const [answer, setAnswer] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!answer.trim()) return;
    onSubmit(answer);
    setAnswer('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose}></div>
      <div className="relative bg-card border border-romantic/20 rounded-2xl w-full max-w-lg overflow-hidden shadow-xl">
        <div className="p-6 border-b border-subtle flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-romantic/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-romantic text-xl">favorite</span>
            </div>
            <h2 className="text-lg font-bold">Share Your Answer</h2>
          </div>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-secondary hover:text-primary transition-colors w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/5"
          >
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-romantic/5 border border-romantic/10 rounded-lg p-4">
            <p className="text-sm text-secondary italic leading-relaxed">
              "{prompt}"
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="answer" className="text-xs font-bold uppercase tracking-widest text-secondary">Your Answer</label>
            <textarea
              id="answer"
              autoFocus
              required
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Share your thoughts..."
              rows={4}
              className="w-full bg-white/5 border border-subtle rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-romantic/50 focus:border-romantic/50 transition-all placeholder:text-secondary/40 resize-none"
            />
            <p className="text-[10px] text-secondary">{answer.length} characters</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-subtle text-sm font-medium text-secondary hover:text-primary hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!answer.trim()}
              className="flex-1 px-4 py-2.5 rounded-lg bg-romantic text-white text-sm font-bold hover:bg-pink-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-romantic/20"
            >
              Share with Partner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnswerModal;
