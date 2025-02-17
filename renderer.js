
import { updateGenerateButtonState } from './utils/uiStateManager.js';

const dropZone = document.querySelector('.side-column');
const musicSelect = document.getElementById('musicSelect');
const musicFileList = document.getElementById('musicFileList');
const imageFileList = document.getElementById('imageFileList');
const videoFileList = document.getElementById('videoFileList');
const generateButton = document.getElementById('generateButton');
const resourceRows = document.getElementById('resourceRows');
const addResourceButton = document.getElementById('addResourceButton');

// DOM要素をuiStateManagerにエクスポート
export const uiStateElements = {
  resourceRows,
  musicSelect,
  generateButton
};

// 初期状態の設定
updateGenerateButtonState();

// 動画生成ボタンのクリックイベントリスナー
let progressContainer; // スコープを外側に移動

generateButton.addEventListener('click', async () => {
  const musicPath = musicSelect.value;
  const resources = [];
  
  try {
    // ボタンを無効化
    generateButton.disabled = true;
    generateButton.textContent = '生成中...';
    
    // 基本的なバリデーション
    if (!musicPath) {
      throw new Error('音楽ファイルが選択されていません');
    }

    // リソースの収集
    const rows = resourceRows.querySelectorAll('.resource-row');
    rows.forEach(row => {
      const select = row.querySelector('.resource-select');
      const durationInput = row.querySelector('input[type="number"]');
      const type = row.querySelector('.toggle-button.active').dataset.type;

      if (select.value && durationInput.value) {
        resources.push({
          path: select.value,
          type: type,
          duration: parseFloat(durationInput.value)
        });
      }
    });

    if (resources.length === 0) {
      throw new Error('リソースが選択されていません');
    }

    // プログレスコンテナの初期化
    let progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.remove();
    }
    progressContainer = initializeProgressContainer();
    generateButton.parentNode.insertBefore(progressContainer, generateButton.nextSibling);
    progressContainer.style.display = 'block';

    const progressBar = document.getElementById('progressBar');
    const progressStage = document.getElementById('progressStage');
    const progressPercent = document.getElementById('progressPercent');

    // 進行状況を更新する関数
    const updateProgress = (stage, current, total, details) => {
      console.log('Progress Update:', { stage, current, total, details });
      
      if (!details) return;

      // 進捗情報を取得
      const percent = details.progress || 0;
      
      // 進捗バーの更新
      if (progressBar) {
        progressBar.style.transition = 'none';
        requestAnimationFrame(() => {
          progressBar.style.width = `${percent}%`;
          requestAnimationFrame(() => {
            progressBar.style.transition = 'width 0.2s ease-in-out';
          });
        });
      }
      
      // メッセージの設定
      let message = '';
      const getFileName = (filePath) => {
        if (!filePath) return '';
        const parts = filePath.split(/[\/\\]/);
        return parts[parts.length - 1];
      };

      switch (stage) {
        case 'subclip-creation':
          const fileName = getFileName(details.currentFile);
          message = `サブクリップ作成中 (${current + 1}/${total})${fileName ? ': ' + fileName : ''}`;
          break;
        case 'clip-concatenation':
          message = `クリップ結合中${details.totalFiles ? ': ' + details.totalFiles + '個のクリップを処理中' : ''}`;
          break;
        case 'final-rendering':
          message = '最終動画レンダリング中';
          if (details.totalFrames && details.frames) {
            message += ` (${details.frames}/${details.totalFrames} フレーム)`;
          }
          break;
        default:
          message = '処理中...';
      }

      // UIの更新
      if (progressStage) progressStage.textContent = message;
      if (progressPercent) progressPercent.textContent = `${percent}%`;

      console.log(`Progress Bar Updated: ${percent}%, Stage: ${stage}, Message: ${message}`);
    };

    // 進捗更新用のユニークIDを生成
    const progressId = `progress-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    
    // 進捗更新用のイベントリスナーを設定
    const cleanupProgressListener = window.electronAPI.onProgressUpdate(progressId, (event, data) => {
      if (data.error) {
        progressBar.style.backgroundColor = '#ff4444';
        progressStage.textContent = 'エラー';
        progressPercent.textContent = data.error;
        throw new Error(data.error);
      }

      if (!data || !data.stage) {
        console.warn('Invalid progress data received');
        return;
      }

      updateProgress(data.stage, data.current, data.total, data.details);
    });

    // 動画生成を実行
    const result = await window.electronAPI.generateVideo({
      musicPath,
      resources,
      progressId
    }).catch(error => {
      progressBar.style.backgroundColor = '#ff4444';
      progressStage.textContent = 'エラー';
      progressPercent.textContent = error.message;
      throw error;
    });

    // 進捗リスナーをクリーンアップ
    cleanupProgressListener();
    
    // 進捗バーを完了状態に
    progressBar.style.backgroundColor = '#28a745';
    progressStage.textContent = '完了';
    progressPercent.textContent = '100%';

    if (result.success) {
      console.log('動画生成成功:', result.outputPath);
      showError('動画の生成が完了しました');
    } else {
      throw new Error(result.error || '動画の生成に失敗しました');
    }

  } catch (error) {
    console.error('動画生成エラー:', {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      musicPath: musicPath || 'undefined',
      resources: resources || []
    });
    
    let errorMessage = error.message;
    if (error.message.includes('ビデオストリーム')) {
      errorMessage = `ビデオストリームの処理に失敗しました。以下の点を確認してください：
      1. 動画ファイルが正しく選択されているか
      2. 動画ファイルが破損していないか
      3. 動画ファイルの形式がサポートされているか（MP4, WebM, MOV）
      4. 動画ファイルのコーデックがサポートされているか（H.264, VP8, VP9）`;
      
      try {
        const mediaInfo = await window.electronAPI.getMediaInfo(resources[0]?.path || '');
        errorMessage += `\n\nファイル情報:\n` +
          `フォーマット: ${mediaInfo.format || '不明'}\n` +
          `コーデック: ${mediaInfo.video_codec || '不明'}\n` +
          `解像度: ${mediaInfo.width || '不明'}x${mediaInfo.height || '不明'}\n` +
          `フレームレート: ${mediaInfo.fps || '不明'} fps`;
      } catch (infoError) {
        console.error('メディア情報取得エラー:', infoError);
      }
    }
    
    showError(errorMessage);

  } finally {
    // ボタンの状態をリセット
    generateButton.disabled = false;
    generateButton.textContent = '動画を生成';
    
    // プログレスコンテナを非表示にするが、削除はしない
    const progressContainer = document.querySelector('.progress-container');
    if (progressContainer) {
      progressContainer.style.display = 'none';
      
      // プログレスバーの状態をリセット
      const progressBar = progressContainer.querySelector('#progressBar');
      const progressStage = progressContainer.querySelector('#progressStage');
      const progressPercent = progressContainer.querySelector('#progressPercent');
      
      if (progressBar) progressBar.style.width = '0%';
      if (progressStage) progressStage.textContent = '処理中...';
      if (progressPercent) progressPercent.textContent = '0%';
    }
    
    updateGenerateButtonState();
  }
});

// 「リソース行を追加」ボタンのイベントリスナー
addResourceButton.addEventListener('click', () => {
  const row = createResourceRow();
  resourceRows.appendChild(row);
  updateResourceSelects();
  updateDeleteButtonsVisibility();
  updateGenerateButtonState();
});

// 削除ボタンの表示/非表示を更新
function updateDeleteButtonsVisibility() {
  const rows = resourceRows.querySelectorAll('.resource-row');
  rows.forEach(row => {
    const deleteButton = row.querySelector('.delete-row-button');
    if (deleteButton) {
      deleteButton.style.display = rows.length > 1 ? 'block' : 'none';
    }
  });
}

// プレビュー関連要素
const previewContainer = document.querySelector('.preview-content');
const previewTitle = document.getElementById('previewTitle');
const audioPlayer = document.getElementById('audioPlayer');
const imagePreview = document.querySelector('.media-element.image');
const videoPreview = document.querySelector('.media-element.video');

// 動画エラーハンドリング関数
function handleVideoError(error) {
  console.error('動画再生エラー:', error);
  showError(`動画の再生に失敗しました。\nファイル: ${lastSelectedMedia?.name || '不明'}`);
  if (videoPreview) {
    videoPreview.style.display = 'none';
  }
}

// 動画読み込み完了時の処理
function handleVideoLoaded() {
  console.log('動画読み込み完了:', lastSelectedMedia?.name);
  if (videoPreview) {
    videoPreview.style.display = 'block';
    videoPreview.play().catch((error) => {
      console.error('自動再生エラー:', error);
      videoPreview.controls = true;
    });
  }
}

// 動画再生準備完了時の処理
function handleVideoCanPlay() {
  console.log('動画再生準備完了:', lastSelectedMedia?.name);
  if (videoPreview) {
    videoPreview.style.display = 'block';
  }
}

// プレビュー表示初期化
function initPreview() {
  const mediaElements = document.querySelectorAll('.media-element');
  mediaElements.forEach(el => {
    el.classList.remove('active');
    if (el.tagName === 'VIDEO' && typeof el.pause === 'function') {
      el.pause();
      el.src = '';
    }
  });
  
  if (previewContainer) {
    previewContainer.classList.remove('active');
  }
}

// メディアプレビュー表示切り替え
function showMediaPreview(mediaType) {
  const mediaElements = document.querySelectorAll('.media-element');
  // video-details要素の取得を関数内で行う
  const videoDetails = document.querySelector('.video-details');
  
  mediaElements.forEach(el => {
      if (el.classList.contains(mediaType)) {
          el.style.display = 'block';
          el.classList.add('active');
      } else {
          el.style.display = 'none';
          el.classList.remove('active');
          if (el.tagName === 'VIDEO' && typeof el.pause === 'function') {
              el.pause();
          }
      }
  });
  
  // 動画の場合のみ詳細情報を表示
  if (videoDetails) {
      videoDetails.style.display = mediaType === 'video' ? 'block' : 'none';
  }
  
  if (previewContainer) {
      previewContainer.classList.add('active');
  }
}

// ファイルタイプを取得する関数
function getFileType(filePath) {
  const extension = filePath.split('.').pop().toLowerCase();
  
  if (['mp4', 'webm', 'mov'].includes(extension)) {
    return 'video';
  }
  if (['jpg', 'jpeg', 'png', 'gif'].includes(extension)) {
    return 'image';
  }
  return null;
}

// ファイルプレビュー表示
async function showFilePreview(file) {
  if (!file) return;

  try {
    // プレビュー領域を表示
    if (previewContainer) {
      previewContainer.classList.add('active');
      previewContainer.style.display = 'flex';
      updatePreviewTitle(file.name);
    }

    // ファイルパスの検証と正規化
    const filePath = file.path;
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('無効なファイルパスです');
    }

    // ファイルの存在確認
    const fileExists = await window.electronAPI.checkFileExists(filePath);
    if (!fileExists) {
      throw new Error('ファイルが見つかりません');
    }

    // ファイルタイプの検証
    const fileType = getFileType(filePath);
    if (!fileType) {
      throw new Error('サポートされていないファイル形式です');
    }

    // メディアタイプに応じた表示切り替え
    showMediaPreview(fileType);

    if (fileType === 'video') {
      const videoElement = document.querySelector('.media-element.video');
      if (!videoElement) {
        throw new Error('動画プレビュー要素が見つかりません');
      }

      // 動画メタデータを取得（オーディオストリームの有無は確認しない）
      const mediaInfo = await window.electronAPI.getMediaInfo(filePath).catch(error => {
        // オーディオストリームに関するエラーは無視
        if (error.message.includes('オーディオストリーム')) {
          return { video_codec: 'unknown' };
        }
        throw error;
      });

      // 動画情報の表示を更新
      const resolution = document.getElementById('resolution');
      const duration = document.getElementById('duration');
      const frameRate = document.getElementById('frameRate');
      const totalFrames = document.getElementById('totalFrames');

      if (resolution) resolution.textContent = `${mediaInfo.width || 0}×${mediaInfo.height || 0}`;
      if (duration) duration.textContent = `${(mediaInfo.duration || 0).toFixed(1)}s`;
      if (frameRate) frameRate.textContent = `${Math.round(mediaInfo.fps || 0)}`;
      if (totalFrames) totalFrames.textContent = `${mediaInfo.frameCount || 0}`;

      // video-details要素を表示
      const videoDetails = document.querySelector('.video-details');
      if (videoDetails) videoDetails.style.display = 'block';

      // ビデオコーデックのみチェック
      if (mediaInfo.video_codec && !['h264', 'vp8', 'vp9'].includes(mediaInfo.video_codec.toLowerCase())) {
        throw new Error(`サポートされていないコーデックです: ${mediaInfo.video_codec || '不明'}`);
      }

      // 動画プレビュー初期化
      videoElement.src = '';
      videoElement.controls = false;
      videoElement.playsInline = true;
      videoElement.preload = 'auto';
      videoElement.muted = true;
      
      // ファイルパスの正規化とエンコード
      let videoSrc = filePath;
      if (!videoSrc.startsWith('file://')) {
        videoSrc = `file://${encodeURI(videoSrc)}`;
      }
      
      // 既存のイベントリスナーをクリア
      videoElement.onerror = null;
      videoElement.onloadeddata = null;
      videoElement.oncanplay = null;
      videoElement.onplay = null;
      
      // 新しいイベントリスナーを設定
      videoElement.addEventListener('error', handleVideoError);
      videoElement.addEventListener('loadeddata', handleVideoLoaded);
      videoElement.addEventListener('canplay', handleVideoCanPlay);
      
      // 動画ソースを設定
      videoElement.src = videoSrc;
      videoElement.classList.add('active');
      videoElement.load();

      // 動画の読み込みと再生を試みる
      await videoElement.load();
      try {
        await videoElement.play();
      } catch (error) {
        console.log('自動再生に失敗しました。ユーザー操作を待ちます:', error);
        videoElement.controls = true;
        videoElement.classList.remove('active');
      }
    } else if (fileType === 'image') {
      const imgElement = document.querySelector('.media-element.image');
      if (!imgElement) {
        throw new Error('画像プレビュー要素が見つかりません');
      }

      // 画像プレビュー
      imgElement.src = filePath;
      
      // 画像読み込みエラーハンドリング
      imgElement.onerror = (error) => {
        console.error('画像読み込みエラー:', error);
        showError('画像の読み込みに失敗しました。ファイル形式を確認してください。');
      };
    } else {
      throw new Error('サポートされていないファイル形式です');
    }
  } catch (error) {
    console.error('プレビューエラー:', error);
    showError(error.message);
    initPreview();
  }
}

// 最後に選択されたメディアファイル
let lastSelectedMedia = null;

// 音楽ファイル名表示要素
const audioPreviewTitle = document.getElementById('audioPreviewTitle');

// 音楽ファイル名を更新する関数
function updateMusicFileName(fileName) {
  if (audioPreviewTitle) {
    audioPreviewTitle.textContent = fileName ? `${fileName}` : '選択中のファイル';
  }
}

// 音楽ファイル選択時の処理
musicSelect.addEventListener('change', (event) => {
  const selectedFile = event.target.value;
  if (selectedFile) {
    audioPlayer.src = selectedFile;
    audioPlayer.load();
    const fileName = musicFiles.find(f => f.path === selectedFile)?.name || '';
    updateMusicFileName(fileName);
  } else {
    audioPlayer.src = '';
    updateMusicFileName('');
  }
});

// 音楽ファイル選択時の処理
musicFileList.addEventListener('click', async (event) => {
  const target = event.target.closest('li');
  if (target) {
    const fileName = target.textContent.replace('削除', '');
    const selectedFile = musicFiles.find(f => f.name === fileName);
    if (selectedFile) {
      audioPlayer.src = selectedFile.path;
      audioPlayer.load();
      lastSelectedMedia = selectedFile;
      updateMusicFileName(fileName);
    }
  }
});

// 画像ファイル選択時の処理
imageFileList.addEventListener('click', async (event) => {
  const target = event.target.closest('li');
  if (target) {
    const fileName = target.textContent.replace('削除', '');
    const selectedFile = imageFiles.find(f => f.name === fileName);
    if (selectedFile) {
      await showFilePreview(selectedFile);
      lastSelectedMedia = selectedFile;
    }
  }
});

// 動画ファイル選択時の処理
videoFileList.addEventListener('click', async (event) => {
  const target = event.target.closest('li');
  if (target) {
    const fileName = target.textContent.replace('削除', '');
    const selectedFile = videoFiles.find(f => f.name === fileName);
    if (selectedFile) {
      await showFilePreview(selectedFile);
      lastSelectedMedia = selectedFile;
    }
  }
});

// プレビュータイトル更新
// エラーメッセージ表示関数
function showError(message) {
  const errorDiv = document.getElementById('errorMessage') || createErrorDiv();
  errorDiv.innerHTML = message.replace(/\n/g, '<br>'); // 改行を反映
  errorDiv.style.display = 'block';
  setTimeout(() => {
    errorDiv.style.display = 'none';
  }, 10000); // 表示時間を10秒に延長
}

function createErrorDiv() {
  const div = document.createElement('div');
  div.id = 'errorMessage';
  div.style.position = 'fixed';
  div.style.bottom = '20px';
  div.style.right = '20px';
  div.style.padding = '20px';
  div.style.backgroundColor = '#ff4444';
  div.style.color = 'white';
  div.style.borderRadius = '8px';
  div.style.zIndex = '1000';
  div.style.display = 'none';
  div.style.fontSize = '14px';
  div.style.lineHeight = '1.5';
  div.style.maxWidth = '400px';
  div.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  document.body.appendChild(div);
  return div;
}

function updatePreviewTitle(fileName) {
  const previewTitle = document.getElementById('previewTitle');
  if (previewTitle) {
    previewTitle.textContent = `${fileName}`;
  }
}

// リソース選択時のプレビュー更新
document.addEventListener('click', async (event) => {
  if (event.target.classList.contains('resource-select')) {
    const selectedPath = event.target.value;
    if (selectedPath) {
      const selectedFile = [...imageFiles, ...videoFiles].find(f => f.path === selectedPath);
      if (selectedFile) {
        // リソース行の要素を取得
        const resourceRow = event.target.closest('.resource-row');
        const activeType = resourceRow.querySelector('.toggle-button.active').dataset.type;
        const durationInput = resourceRow.querySelector('.duration-input input');

        // 動画が選択された場合、総フレーム数を取得して設定
        if (activeType === 'video') {
          try {
            const mediaInfo = await window.electronAPI.getMediaInfo(selectedFile.path);
            if (mediaInfo.frameCount) {
              durationInput.value = mediaInfo.frameCount;
            }
          } catch (error) {
            console.error('動画情報の取得に失敗しました:', error);
          }
        } else {
          // 画像の場合はデフォルト値を5に設定
          durationInput.value = 5;
        }

        await showFilePreview(selectedFile);
        lastSelectedMedia = selectedFile;
        updateGenerateButtonState();
      }
    }
  }
});


const ACCEPTED_MUSIC_TYPES = ['.mp3', '.wav'];
const ACCEPTED_IMAGE_TYPES = ['.jpg', '.jpeg', '.png'];
const ACCEPTED_VIDEO_TYPES = ['.mp4', '.webm', '.mov'];
const MAX_HISTORY = 10;

// ファイル履歴の保存と読み込み
async function saveHistory() {
  try {
    await window.electronAPI.saveFileHistory({
      musicFiles,
      imageFiles,
      videoFiles
    });
  } catch (error) {
    console.error('ファイル履歴の保存に失敗しました:', error);
  }
}

async function loadHistory() {
  try {
    const history = await window.electronAPI.loadFileHistory();
    if (history) {
      musicFiles = history.musicFiles || [];
      imageFiles = history.imageFiles || [];
      videoFiles = history.videoFiles || [];
      updateMusicFileList();
      updateImageFileList();
      updateVideoFileList();
    }
  } catch (error) {
    console.error('ファイル履歴の読み込みに失敗しました:', error);
  }
}

let musicFiles = [];
let imageFiles = [];
let videoFiles = [];
let videoFormats = new Map(); // 動画のフォーマット情報を保存

// タブ切り替え機能
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      // すべてのタブを非アクティブに
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      
      // クリックされたタブをアクティブに
      button.classList.add('active');
      const targetTab = document.querySelector(button.dataset.target);
      if (targetTab) {
        targetTab.classList.add('active');
      }
    });
  });
  
  // 初期状態でリソースタブを表示
  const resourceTab = document.querySelector('.tab-button[data-target="#resource-tab"]');
  if (resourceTab) {
    resourceTab.click();
  }
}

// 起動時にファイル履歴を読み込み、UIを更新
window.addEventListener('DOMContentLoaded', async () => {
  // タブ機能を初期化
  setupTabs();
  try {
    await loadHistory();
    updateMusicFileList();
    updateImageFileList();
    updateVideoFileList();
    updateGenerateButtonState();
    
    // 初期表示行のセットアップ
    const initialRow = document.querySelector('.resource-row');
    if (initialRow) {
      // タイプ切り替えボタンのイベントリスナー設定
      const toggleButtons = initialRow.querySelectorAll('.toggle-button');
      toggleButtons.forEach(button => {
        button.addEventListener('click', () => {
          initialRow.querySelectorAll('.toggle-button').forEach(btn => {
            btn.classList.remove('active');
          });
          button.classList.add('active');
          const select = initialRow.querySelector('.resource-select');
          select.value = '';
          const files = button.dataset.type === 'image' ? imageFiles : videoFiles;
          select.innerHTML = '<option value="">ファイルを選択</option>';
          files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = file.name;
            select.appendChild(option);
          });
        });
      });

      // 削除ボタンのイベントリスナー設定
      const deleteButton = initialRow.querySelector('.delete-row-button');
      if (deleteButton) {
        deleteButton.addEventListener('click', () => {
          initialRow.remove();
          updateDeleteButtonsVisibility();
          updateGenerateButtonState();
        });
      }

      // ファイル選択のイベントリスナー設定
      const select = initialRow.querySelector('.resource-select');
      if (select) {
        select.addEventListener('change', updateGenerateButtonState);
      }
    }
  } catch (error) {
    console.error('起動時のファイル履歴読み込みエラー:', error);
    showError('ファイル履歴の読み込みに失敗しました');
  }
});

// ドラッグ&ドロップイベントの処理
// ドラッグ&ドロップイベントの処理
const sideColumn = document.querySelector('.side-column');

sideColumn.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sideColumn.classList.add('dragover');
});

['dragleave', 'dragend'].forEach(type => {
    sideColumn.addEventListener(type, (e) => {
        e.preventDefault();
        e.stopPropagation();
        sideColumn.classList.remove('dragover');
    });
});

sideColumn.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    sideColumn.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
});

// ファイルの処理
function processFiles(files) {
    files.forEach(file => {
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (ACCEPTED_MUSIC_TYPES.includes(extension)) {
            addMusicFile(file);
        } else if (ACCEPTED_IMAGE_TYPES.includes(extension)) {
            addImageFile(file);
        } else if (ACCEPTED_VIDEO_TYPES.includes(extension)) {
            addVideoFile(file);
        }
    });
}

// 音楽ファイルの追加
function addMusicFile(file) {
    if (!musicFiles.find(f => f.path === file.path)) {
        musicFiles.unshift({ path: file.path, name: file.name });
        if (musicFiles.length > MAX_HISTORY) {
            musicFiles.pop();
        }
        updateMusicFileList();
        saveHistory();
    }
}

// 画像ファイルの追加
function addImageFile(file) {
    if (!imageFiles.find(f => f.path === file.path)) {
        imageFiles.unshift({ path: file.path, name: file.name });
        if (imageFiles.length > MAX_HISTORY) {
            imageFiles.pop();
        }
        updateImageFileList();
        saveHistory();
    }
}

// 動画ファイルの追加
async function addVideoFile(file) {
    if (!videoFiles.find(f => f.path === file.path)) {
        try {
            const info = await window.electronAPI.getMediaInfo(file.path);
            videoFormats.set(file.path, {
                width: info.width,
                height: info.height,
                fps: info.fps
            });
            videoFiles.unshift({ path: file.path, name: file.name });
            if (videoFiles.length > MAX_HISTORY) {
                videoFiles.pop();
            }
            updateVideoFileList();
            saveHistory();
        } catch (error) {
            console.error('動画情報の取得に失敗しました:', error);
            alert('動画情報の取得に失敗しました: ' + error.message);
        }
    }
}

// 音楽ファイルリストの更新
function updateMusicFileList() {
    musicFileList.innerHTML = '';
    musicSelect.innerHTML = '<option value="">音楽ファイルを選択</option>';
    
    musicFiles.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file.name;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = '削除';
        removeButton.onclick = () => removeMusicFile(file);
        
        li.appendChild(removeButton);
        musicFileList.appendChild(li);
        
        const option = document.createElement('option');
        option.value = file.path;
        option.textContent = file.name;
        musicSelect.appendChild(option);
    });

    // 音楽プレビュー更新
musicSelect.addEventListener('change', (e) => {
    const selectedFile = musicFiles.find(f => f.path === e.target.value);
    if (selectedFile) {
        audioPlayer.src = selectedFile.path;
        audioPlayer.style.display = 'block';
        audioPlayer.load();
        musicSelect.value = selectedFile.path; // 選択状態を明示的に更新
    } else {
        audioPlayer.src = '';
        audioPlayer.style.display = 'none';
        musicSelect.value = ''; // 選択状態をクリア
    }
    updateGenerateButtonState();
});

    updateGenerateButtonState();
}

// 画像ファイルリストの更新
function updateImageFileList() {
    imageFileList.innerHTML = '';
    
    imageFiles.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file.name;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = '削除';
        removeButton.onclick = () => removeImageFile(file);
        
        li.appendChild(removeButton);
        imageFileList.appendChild(li);
    });

    // 画像プレビュー更新
    imageFileList.addEventListener('click', (e) => {
        const target = e.target.closest('li');
        if (target) {
            const fileName = target.textContent.replace('削除', '');
            const selectedFile = imageFiles.find(f => f.name === fileName);
            if (selectedFile) {
                imagePreview.src = selectedFile.path;
                imagePreview.style.display = 'block';
                videoPreview.style.display = 'none';
                lastSelectedMedia = selectedFile;
            }
        }
    });

    updateResourceSelects();
}

// 動画ファイルリストの更新
function updateVideoFileList() {
    videoFileList.innerHTML = '';
    
    videoFiles.forEach(file => {
        const li = document.createElement('li');
        li.textContent = file.name;
        
        const removeButton = document.createElement('button');
        removeButton.textContent = '削除';
        removeButton.onclick = () => removeVideoFile(file);
        
        li.appendChild(removeButton);
        videoFileList.appendChild(li);
    });

    // 動画プレビュー更新
    videoFileList.addEventListener('click', (e) => {
        const target = e.target.closest('li');
        if (target) {
            const fileName = target.textContent.replace('削除', '');
            const selectedFile = videoFiles.find(f => f.name === fileName);
            if (selectedFile) {
                videoPreview.src = selectedFile.path;
                videoPreview.style.display = 'block';
                imagePreview.style.display = 'none';
                if (videoPreview && typeof videoPreview.load === 'function') {
                  videoPreview.load();
                }
            }
        }
    });

    updateResourceSelects();
}

// リソース選択の更新
function updateResourceSelects() {
    const rows = resourceRows.querySelectorAll('.resource-row');
    rows.forEach(row => {
        const select = row.querySelector('.resource-select');
        const currentValue = select.value;
        const type = row.querySelector('.toggle-button.active').dataset.type;
        
        select.innerHTML = '<option value="">ファイルを選択</option>';
        
        const files = type === 'image' ? imageFiles : videoFiles;
        files.forEach(file => {
            const option = document.createElement('option');
            option.value = file.path;
            option.textContent = file.name;
            select.appendChild(option);
        });

        // 以前の選択を復元
        if (currentValue) {
            select.value = currentValue;
        }
    });

    updateGenerateButtonState();
}

// ファイルの削除
function removeMusicFile(file) {
    musicFiles = musicFiles.filter(f => f.path !== file.path);
    updateMusicFileList();
    saveHistory();
}

function removeImageFile(file) {
    imageFiles = imageFiles.filter(f => f.path !== file.path);
    updateImageFileList();
    saveHistory();
}

function removeVideoFile(file) {
    videoFiles = videoFiles.filter(f => f.path !== file.path);
    updateVideoFileList();
    saveHistory();
}

// リソース行の作成関数も更新
function createResourceRow() {
  const row = document.createElement('div');
  row.className = 'resource-row';
  
  // タイプ切り替えボタン
  const typeToggle = document.createElement('div');
  typeToggle.className = 'resource-type-toggle';
  
  const imageButton = document.createElement('button');
  imageButton.className = 'toggle-button active';
  imageButton.dataset.type = 'image';
  imageButton.textContent = '静止画';
  
  const videoButton = document.createElement('button');
  videoButton.className = 'toggle-button';
  videoButton.dataset.type = 'video';
  videoButton.textContent = '動画';
  
  typeToggle.appendChild(imageButton);
  typeToggle.appendChild(videoButton);
  
  // ファイル選択
  const select = document.createElement('select');
  select.className = 'resource-select';
  select.innerHTML = '<option value="">ファイルを選択</option>';
  imageFiles.forEach(file => {
      const option = document.createElement('option');
      option.value = file.path;
      option.textContent = file.name;
      select.appendChild(option);
  });
  
  // 継続時間入力
  const durationDiv = document.createElement('div');
  durationDiv.className = 'duration-input';
  
  const durationLabel = document.createElement('label');
  durationLabel.textContent = '継続時間(秒):';
  
  const durationInput = document.createElement('input');
  durationInput.type = 'number';
  durationInput.value = '5'; // 画像の場合のデフォルト値
  durationInput.min = '1';
  durationInput.step = '1';
  
  durationDiv.appendChild(durationLabel);
  durationDiv.appendChild(durationInput);
  
  // 削除ボタン
  const deleteButton = document.createElement('button');
  deleteButton.className = 'delete-row-button';
  deleteButton.textContent = '削除';
  
  // イベントリスナーの設定
  [imageButton, videoButton].forEach(button => {
      button.addEventListener('click', async () => {
          typeToggle.querySelectorAll('.toggle-button').forEach(btn => {
              btn.classList.remove('active');
          });
          button.classList.add('active');
          
          // 選択をリセット
          select.value = '';
          const files = button.dataset.type === 'image' ? imageFiles : videoFiles;
          select.innerHTML = '<option value="">ファイルを選択</option>';
          files.forEach(file => {
              const option = document.createElement('option');
              option.value = file.path;
              option.textContent = file.name;
              select.appendChild(option);
          });

          // ラベルとデフォルト値を更新
          if (button.dataset.type === 'image') {
              durationLabel.textContent = '継続時間(秒):';
              durationInput.value = '5';
          } else {
              durationLabel.textContent = '継続フレーム数:';
              durationInput.value = '1';
          }
      });
  });
  
  deleteButton.addEventListener('click', () => {
      row.remove();
      updateDeleteButtonsVisibility();
      updateGenerateButtonState();
  });
  
  select.addEventListener('change', updateGenerateButtonState);
  
  // 要素の追加
  row.appendChild(typeToggle);
  row.appendChild(select);
  row.appendChild(durationDiv);
  row.appendChild(deleteButton);
  
  return row;
}

// progressContainer の初期化処理を関数として分離
function initializeProgressContainer() {
  const container = document.createElement('div');
  container.className = 'progress-container';
  container.style.display = 'none';
  
  const progressInfo = document.createElement('div');
  progressInfo.className = 'progress-info';
  
  const progressStage = document.createElement('span');
  progressStage.id = 'progressStage';
  progressStage.textContent = '処理中...';
  
  const progressPercent = document.createElement('span');
  progressPercent.id = 'progressPercent';
  progressPercent.textContent = '0%';
  
  progressInfo.appendChild(progressStage);
  progressInfo.appendChild(progressPercent);
  
  const progressBarContainer = document.createElement('div');
  progressBarContainer.className = 'progress-bar';
  
  const progressBarFill = document.createElement('div');
  progressBarFill.id = 'progressBar';
  progressBarFill.className = 'progress-bar-fill';
  
  progressBarContainer.appendChild(progressBarFill);
  
  container.appendChild(progressInfo);
  container.appendChild(progressBarContainer);
  
  return container;
}