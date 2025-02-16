// FFmpegの進捗情報を解析・正規化するユーティリティ
export function calculateProgress(progress, totalFrames) {
  console.log('Progress Info:', {
    timemark: progress.timemark,
    percent: progress.percent,
    frames: progress.frames,
    currentFps: progress.currentFps,
    totalFrames: totalFrames
  });

  let percent = 0;

  // フレーム数ベースでの進捗計算
  if (progress.frames && totalFrames) {
    percent = (progress.frames / totalFrames) * 100;
  } 
  // 時間ベースでの進捗計算
  else if (progress.timemark && totalFrames) {
    const currentTime = parseTimemarkToSeconds(progress.timemark);
    const fps = totalFrames / currentTime; // 総フレーム数と経過時間からfpsを推定
    const currentFrame = currentTime * fps;
    percent = (currentFrame / totalFrames) * 100;
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
