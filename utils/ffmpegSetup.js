import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import { exec } from 'child_process';

class FFmpegSetup {
  constructor() {
    this.ffmpegPath = ffmpegStatic;
    this.ffprobePath = ffprobeStatic.path; // 修正
    this.minFFmpegVersion = '4.0';
  }

  setup() {
    return new Promise((resolve, reject) => {
      exec(`${JSON.stringify(this.ffmpegPath)} -version`, (err, stdout) => {
        if (err) {
          console.error('FFmpegのバージョン確認に失敗しました:', err);
          return reject(new Error('FFmpegの初期化に失敗しました'));
        }

        const versionMatch = stdout.match(/ffmpeg version (\d+\.\d+(?:\.\d+)?)/);
        if (!versionMatch) {
          return reject(new Error('FFmpegのバージョン情報を取得できませんでした'));
        }

        const version = versionMatch[1];
        if (this.compareVersions(version, this.minFFmpegVersion) < 0) {
          return reject(new Error(`FFmpegのバージョンが古いです: ${version} (必要: ${this.minFFmpegVersion}+)`));
        }

        console.log('FFmpegが正常に設定されました:', {
          ffmpegPath: this.ffmpegPath,
          ffprobePath: this.ffprobePath,
          version: version
        });

        resolve();
      });
    });
  }

  async checkRequirements() {
    try {
      await this.setup();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        installationGuide: 'FFmpegとFFprobeは既に静的バイナリとしてインストールされています。',
        recoverySteps: 'FFmpegとFFprobeは静的バイナリとして使用されているため、追加の手順は必要ありません。'
      };
    }
  }

  compareVersions(v1, v2) {
    return v1.localeCompare(v2, undefined, { numeric: true });
  }
}

export default FFmpegSetup;
