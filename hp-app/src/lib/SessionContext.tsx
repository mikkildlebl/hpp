'use client';

import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { Question } from './types';

type SessionState = {
  questions: Question[];
  answers: Record<string, string>;
};

type SessionContextValue = {
  questions: Question[];
  answers: Record<string, string>;
  startSession: (questions: Question[]) => void;
  answerQuestion: (questionId: string, label: string) => void;
  score: { correct: number; total: number };
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ questions: [], answers: {} });

  const startSession = (questions: Question[]) => setState({ questions, answers: {} });

  const answerQuestion = (questionId: string, label: string) =>
    setState((prev) => ({ ...prev, answers: { ...prev.answers, [questionId]: label } }));

  const score = useMemo(() => {
    const total = state.questions.length;
    const correct = state.questions.filter((q) => state.answers[q.id] === q.correct_answer).length;
    return { correct, total };
  }, [state.questions, state.answers]);

  const value: SessionContextValue = {
    questions: state.questions,
    answers: state.answers,
    startSession,
    answerQuestion,
    score,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return ctx;
}
