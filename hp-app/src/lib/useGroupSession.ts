import { useEffect, useState } from 'react';

import { useSession } from '@/lib/SessionContext';
import { Question } from '@/lib/types';

type Group = { questions: Question[] };

// LAS (passages) and DTK (diagrams) sessions share the same shape: fetch a
// batch of groups, answer every question in the current group at once, then
// step to the next group. This hook owns that shared state machine so each
// session component only has to render its own group.
export function useGroupSession<G extends Group>(fetchGroups: () => Promise<G[]>) {
  const { startSession, answerQuestion, answers, score } = useSession();
  const [groups, setGroups] = useState<G[] | null>(null);
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetchGroups().then((gs) => {
      startSession(gs.flatMap((g) => g.questions));
      setGroups(gs);
      setIndex(0);
      setSelections({});
      setSubmitted(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const group = groups?.[index] ?? null;
  const isLast = groups ? index === groups.length - 1 : false;
  const allSelected = group ? group.questions.every((q) => selections[q.id]) : false;

  const select = (questionId: string, label: string) => setSelections((prev) => ({ ...prev, [questionId]: label }));

  const submit = () => {
    if (!group || !allSelected) return;
    group.questions.forEach((q) => answerQuestion(q.id, selections[q.id]));
    setSubmitted(true);
  };

  const advance = (onFinish: () => void) => {
    if (!groups) return;
    if (isLast) {
      onFinish();
      return;
    }
    setIndex((i) => i + 1);
    setSelections({});
    setSubmitted(false);
  };

  return { groups, group, index, isLast, selections, submitted, allSelected, answers, score, select, submit, advance };
}
