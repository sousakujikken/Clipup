import path from 'path';
import fs from 'fs';

class FileHistory {
  constructor(app) {
    this.storageFile = path.join(app.getPath('userData'), 'fileHistory.json');
  }

  save(history) {
    try {
      fs.writeFileSync(this.storageFile, JSON.stringify(history, null, 2));
      console.log('ファイル履歴を保存しました');
    } catch (error) {
      console.error('ファイル履歴の保存に失敗しました:', error);
      throw error;
    }
  }

  load() {
    try {
      if (fs.existsSync(this.storageFile)) {
        const data = fs.readFileSync(this.storageFile, 'utf8');
        console.log('ファイル履歴を読み込みました');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('ファイル履歴の読み込みに失敗しました:', error);
      throw error;
    }
    return { musicFiles: [], imageFiles: [], videoFiles: [] };
  }
}

export default FileHistory;
