type Props = {
  correct: number;
  total: number;
};

export function ScoreSummary({ correct, total }: Props) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="text-sm font-semibold tracking-wide text-white/50 uppercase">Resultat</p>
      <p className="bg-gradient-to-r from-[#93c5fd] via-[#60a5fa] to-[#3b82f6] bg-clip-text text-6xl leading-[1.1] font-semibold text-transparent sm:text-7xl">
        {correct} / {total}
      </p>
      <p className="text-xl font-semibold text-white/70">{pct}% rätt</p>
    </div>
  );
}
