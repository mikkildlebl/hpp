const LOW_TIME_THRESHOLD_SECONDS = 5 * 60;

function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function Timer({ secondsLeft, paused, onClick }: { secondsLeft: number; paused: boolean; onClick: () => void }) {
  const low = secondsLeft <= LOW_TIME_THRESHOLD_SECONDS;
  return (
    <button
      type="button"
      onClick={onClick}
      title={paused ? 'Klicka för att återuppta' : 'Klicka för att pausa'}
      className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-semibold tabular-nums transition-colors ${
        paused
          ? 'border-[#3b82f6]/40 bg-[#3b82f6]/10 text-[#93c5fd]'
          : low
            ? 'border-red-400/40 bg-red-400/10 text-red-300'
            : 'border-text/15 text-text/80 hover:border-text/30'
      }`}>
      {paused ? 'Paus' : formatTime(secondsLeft)}
    </button>
  );
}
