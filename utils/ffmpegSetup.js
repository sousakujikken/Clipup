import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';

class FFmpegSetup {
  constructor() {
    this.ffmpegPath = process.env.FFMPEG_PATH || '/usr/bin/ffmpeg';
    this.ffprobePath = process.env.FFPROBE_PATH || '/usr/bin/ffprobe';
    this.minFFmpegVersion = '4.0'; // 最低必要なFFmpegバージョン
  }

  setup() {
    try {
      // パスの存在確認
      if (!fs.existsSync(this.ffmpegPath)) {
        throw new Error(`FFmpegが見つかりません: ${this.ffmpegPath}\n環境変数FFMPEG_PATHが設定されていないか、パスが間違っています`);
      }
      if (!fs.existsSync(this.ffprobePath)) {
        throw new Error(`FFprobeが見つかりません: ${this.ffprobePath}\n環境変数FFPROBE_PATHが設定されていないか、パスが間違っています`);
      }

      // 実行権限の確認
      try {
        fs.accessSync(this.ffmpegPath, fs.constants.X_OK);
        fs.accessSync(this.ffprobePath, fs.constants.X_OK);
      } catch (err) {
        throw new Error(`実行権限がありません: ${err.message}\n以下のコマンドで権限を付与してください:\nchmod +x ${this.ffmpegPath}\nchmod +x ${this.ffprobePath}`);
      }

      // パスの設定
      ffmpeg.setFfmpegPath(this.ffmpegPath);
      ffmpeg.setFfprobePath(this.ffprobePath);

      // バージョン確認
      return new Promise((resolve, reject) => {
        exec(`${this.ffmpegPath} -version`, (err, stdout, stderr) => {
          if (err) {
            console.error('FFmpegのバージョン確認に失敗しました:', err);
            reject(new Error('FFmpegの初期化に失敗しました'));
            return;
          }

          // バージョン情報の取得
          const versionMatch = stdout.match(/ffmpeg version (\d+\.\d+\.\d+)/);
          if (!versionMatch) {
            const errorMsg = 'FFmpegのバージョン情報を取得できませんでした';
            console.error(errorMsg);
            reject(new Error(errorMsg));
            return;
          }

          const version = versionMatch[1];
          if (this.compareVersions(version, this.minFFmpegVersion) < 0) {
            const errorMsg = `FFmpegのバージョンが古いです: ${version} (必要: ${this.minFFmpegVersion}+)`;
            console.error(errorMsg);
            reject(new Error(errorMsg));
            return;
          }

          console.log('FFmpegが正常に設定されました:', {
            ffmpegPath: this.ffmpegPath,
            ffprobePath: this.ffprobePath,
            version: version
          });
          resolve();
        });
      });
    } catch (error) {
      console.error('FFmpegの設定中にエラーが発生しました:', error);
      throw new Error(`FFmpegの設定に失敗しました: ${error.message}`);
    }
  }

  async checkRequirements() {
    try {
      await this.setup();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        installationGuide: `
          FFmpegのインストールが必要です。以下の手順でインストールしてください:
          1. ターミナルで以下を実行:
            sudo apt-get update
            sudo apt-get install ffmpeg
          2. インストール後、以下のコマンドでパスを確認:
            which ffmpeg
            which ffprobe
          3. 環境変数を設定:
            export FFMPEG_PATH=/usr/bin/ffmpeg
            export FFPROBE_PATH=/usr/bin/ffprobe
        `,
        recoverySteps: `
          問題が発生した場合の解決手順:
          1. パスの確認:
            echo $FFMPEG_PATH
            echo $FFPROBE_PATH
          2. 実行権限の確認:
            ls -l $FFMPEG_PATH
            ls -l $FFPROBE_PATH
          3. バージョンの確認:
            $FFMPEG_PATH -version
          4. 問題が解決しない場合、再インストール:
            sudo apt-get remove ffmpeg
            sudo apt-get install ffmpeg
        `
      };
    }
  }

  // バージョン比較用のユーティリティ関数
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }
    return 0;
  }
}

export default FFmpegSetup;
