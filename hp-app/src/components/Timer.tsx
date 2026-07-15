const LOW_TIME_THRESHOLD_SECONDS = 5 * 60;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function Timer({ secondsLeft }: { secondsLeft: number }) {
  const low = secondsLeft <= LOW_TIME_THRESHOLD_SECONDS;
  return (
    <span
      className={`rounded-full border px-4 py-2 text-sm font-semibold tabular-nums ${
        low ? 'border-red-400/40 bg-red-400/10 text-red-300' : 'border-text/15 text-text/80'
      }`}>
      {formatTime(secondsLeft)}
    </span>
  );
}
