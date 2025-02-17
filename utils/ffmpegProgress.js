export function calculateProgress(progress, totalFrames, stage = '') {
  let percent = 0;

  if (progress.frames && totalFrames) {
    percent = (progress.frames / totalFrames) * 100;
  }

  return Math.min(Math.round(percent), 100);
}

// タイムマーク（HH:MM:SS.mm）を秒に変換
function parseTimemarkToSeconds(timemark) {
  if (!timemark) return 0;
  
  const parts = timemark.split(':').map(parseFloat);
  if (parts.length !== 3) return 0;
  
  // HH:MM:SS.mm → 秒に変換
  return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
}
