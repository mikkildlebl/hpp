type Props = {
  correct: number;
  total: number;
};

export function ScoreSummary({ correct, total }: Props) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-5xl leading-[52px] font-semibold">
        {correct} / {total}
      </p>
      <p className="text-[32px] leading-[44px] font-semibold">{pct}% rätt</p>
    </div>
  );
}
