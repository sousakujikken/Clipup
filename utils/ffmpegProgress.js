// FFmpegの進捗情報を解析・正規化するユーティリティ
export function calculateProgress(progress, totalDuration) {
  console.log('Progress Info:', {
    timemark: progress.timemark,
    percent: progress.percent,
    frames: progress.frames,
    currentFps: progress.currentFps,
    targetDuration: totalDuration
  });

  let percent = 0;

  // フレーム数ベースでの進捗計算
  if (progress.frames && progress.currentFps && totalDuration) {
    const expectedFrames = progress.currentFps * totalDuration;
    percent = (progress.frames / expectedFrames) * 100;
  } 
  // 時間ベースでの進捗計算
  else if (progress.timemark && totalDuration) {
    const currentTime = parseTimemarkToSeconds(progress.timemark);
    percent = (currentTime / totalDuration) * 100;
  }
  // フォールバック: FFmpegが提供する進捗情報を使用
  else {
    percent = progress.percent || 0;
  }

  // 進捗が100%を超えないようにする
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
