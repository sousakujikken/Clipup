import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import FileHistory from './utils/fileHistory.js';
import FFmpegSetup from './utils/ffmpegSetup.js';
import VideoProcessor from './utils/videoProcessor.js';

const fileHistory = new FileHistory(app);
const ffmpegSetup = new FFmpegSetup();
const videoProcessor = new VideoProcessor();

async function createWindow() {
  try {
    await ffmpegSetup.setup();
    console.log('FFmpeg setup completed successfully');
    
    const mainWindow = new BrowserWindow({
      width: 1600,
      height: 1200,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(new URL('.', import.meta.url).pathname, 'preload.js'),
        webSecurity: false
      }
    });

    mainWindow.loadFile('index.html');
    return mainWindow;
  } catch (error) {
    console.error('Window creation failed:', error);
    dialog.showErrorBox('Error', `ウィンドウの作成に失敗しました: ${error.message}`);
    app.quit();
    return null;
  }
}

let mainWindow;

app.whenReady().then(async () => {
  mainWindow = await createWindow();
  if (!mainWindow) return;

  ipcMain.handle('load-file-history', async () => {
    return fileHistory.load();
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) {
      mainWindow = createWindow();
    }
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.on('save-file-history', (event, history) => {
  fileHistory.save(history);
});

// メディア情報取得ハンドラー
ipcMain.handle('get-media-info', async (event, filePath) => {
  try {
    return await videoProcessor.getMediaInfo(filePath);
  } catch (error) {
    console.error('メディア情報取得エラー:', error);
    throw error;
  }
});

// 動画生成ハンドラー
ipcMain.handle('check-file-exists', async (event, filePath) => {
  return videoProcessor.checkFileExists(filePath);
});

// 進行状況IDとコールバックのマップ
const progressCallbacks = new Map();

ipcMain.handle('generate-video', async (event, params) => {
  try {
    const outputPath = await dialog.showSaveDialog({
      title: '動画の保存',
      defaultPath: `output-${Date.now()}.mp4`,
      filters: [{ name: '動画ファイル', extensions: ['mp4'] }]
    });

    if (outputPath.canceled || !outputPath.filePath) {
      return { success: false, error: '保存がキャンセルされました' };
    }

    // 進行状況コールバックを登録
    const progressCallback = (stage, current, total, details) => {
      try {
        mainWindow.webContents.send(`progress-update-${params.progressId}`, {
          stage,
          current,
          total,
          details
        });
      } catch (error) {
        console.error('進行状況更新エラー:', error);
      }
    };

    progressCallbacks.set(params.progressId, progressCallback);

    const result = await videoProcessor.generateVideo({
      ...params,
      outputPath: outputPath.filePath,
      progressCallback
    });

    // 進行状況コールバックをクリーンアップ
    progressCallbacks.delete(params.progressId);

    return result;
  } catch (error) {
    console.error('動画生成エラー:', error);
    return { 
      success: false, 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    };
  }
});

// 進行状況リスナーのクリーンアップ
ipcMain.on('cleanup-progress-listener', (event, progressId) => {
  if (progressCallbacks.has(progressId)) {
    progressCallbacks.delete(progressId);
  }
});
