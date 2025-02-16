import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { calculateProgress } from './ffmpegProgress.js';

class VideoProcessor {
  constructor() {
    this.tempFiles = [];
  }

  async getAudioDuration(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          console.error('音声ファイル解析エラー:', err);
          return reject(new Error(`音声ファイルの解析に失敗しました: ${err.message}`));
        }
  
        if (!metadata || !metadata.format || !metadata.format.duration) {
          return reject(new Error('音声ファイルの長さを取得できませんでした'));
        }
  
        const duration = parseFloat(metadata.format.duration);
        console.log(`音声ファイルの長さ: ${duration}秒`);
        resolve(duration);
      });
    });
  }
  
  async getMediaInfo(filePath) {
    return new Promise((resolve, reject) => {
      // ffprobe に -count_frames オプションを渡すことで、nb_read_frames を取得
      ffmpeg.ffprobe(filePath, ['-count_frames'], (err, metadata) => {
        if (err) {
          console.error('FFprobeエラー詳細:', {
            error: err.message,
            code: err.code,
            filePath: filePath
          });
          return reject(new Error(`メディア情報の取得に失敗しました: ${err.message}`));
        }
  
        if (!metadata || !metadata.streams) {
          console.error('無効なメタデータ:', metadata);
          return reject(new Error('無効なメタデータ形式: ストリーム情報が見つかりません'));
        }
  
        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        const audioStream = metadata.streams.find(s => s.codec_type === 'audio');
  
        if (!videoStream && path.extname(filePath).toLowerCase() !== '.mp3') {
          console.warn('ビデオストリームが見つかりません。メタデータ:', metadata);
          return reject(new Error('有効なビデオストリームが見つかりません'));
        }
  
        try {
          // フレームレートは r_frame_rate 文字列を eval で計算
          const fps = videoStream?.r_frame_rate ? eval(videoStream.r_frame_rate) : null;
          const duration = parseFloat(metadata.format.duration) || 0;
          // nb_read_frames が取得できればそれを使用、なければ duration * fps で算出
          const frameCount = videoStream.nb_read_frames
            ? parseInt(videoStream.nb_read_frames)
            : (fps && duration ? Math.floor(fps * duration) : 0);
  
          const result = {
            duration, // 秒単位
            width: videoStream ? parseInt(videoStream.width) || 0 : 0,
            height: videoStream ? parseInt(videoStream.height) || 0 : 0,
            fps,
            frameCount,  // 総フレーム数
            video_codec: videoStream?.codec_name || 'none',
            audio_codec: audioStream?.codec_name || 'none'
          };
  
          console.log('取得したメディア情報:', result);
          resolve(result);
        } catch (error) {
          console.error('メディア情報解析エラー:', error);
          reject(new Error('メディア情報の解析に失敗しました'));
        }
      });
    });
  }

  async getVideoDuration(filePath) {
    const info = await this.getMediaInfo(filePath);
    return info.duration;
  }

  async createSubClip(inputPath, outputPath, targetFrameCount, progressCallback) {
    return new Promise(async (resolve, reject) => {
      try {
        // 【変更】秒数ではなく、フレーム数で処理するため、入力動画のフレーム数を取得
        const mediaInfo = await this.getMediaInfo(inputPath);
        const inputFrameCount = mediaInfo.frameCount;
        const loopCount = Math.ceil(targetFrameCount / inputFrameCount);
        
        console.log(`サブクリップ作成: 入力=${inputPath}, 出力=${outputPath}, 目標フレーム数=${targetFrameCount}, ループ回数=${loopCount}`);

        const command = ffmpeg()
          .input(inputPath)
          // 【変更】必要な分ループさせる
          .inputOptions([`-stream_loop ${loopCount - 1}`])
          .output(outputPath)
          .outputOptions([
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-crf', '23',
            // 【変更】秒数指定（-t）ではなく、フレーム数指定（-frames:v）に変更
            '-frames:v', targetFrameCount.toString(),
            '-pix_fmt', 'yuv420p'
          ])
          .on('progress', progress => {
            if (progressCallback) {
              // 【注意】calculateProgressも秒数→フレーム数対応に変更が必要
              const percent = calculateProgress(progress, targetFrameCount);
              progressCallback('subclip-creation', 0, 1, {
                currentFile: inputPath,
                progress: percent
              });
            }
          })
          .on('end', () => {
            console.log(`サブクリップ作成完了: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error(`サブクリップ作成エラー: ${err.message}`);
            reject(err);
          });

        command.run();
      } catch (error) {
        reject(error);
      }
    });
  }

  async createConcatenatedClip(inputPaths, outputPath, progressCallback) {
    return new Promise(async (resolve, reject) => {
      console.log(`結合クリップ作成: 入力数=${inputPaths.length}, 出力=${outputPath}`);

      // メディア情報の取得とログ出力
      const mediaInfos = [];
      for (const filePath of inputPaths) {
        try {
          const info = await this.getMediaInfo(filePath);
          console.log(`メディア情報: ${filePath}`, info);
          mediaInfos.push(info);
        } catch (error) {
          console.error(`メディア情報取得エラー: ${filePath}`, error);
          reject(error);
          return;
        }
      }

      // メディア情報の比較
      const firstInfo = mediaInfos[0];
      for (let i = 1; i < mediaInfos.length; i++) {
        const info = mediaInfos[i];
        if (info.width !== firstInfo.width || info.height !== firstInfo.height) {
          console.error(`解像度が一致しません: ${inputPaths[0]} (${firstInfo.width}x${firstInfo.height}) と ${inputPaths[i]} (${info.width}x${info.height})`);
          reject(new Error('解像度が一致しません'));
          return;
        }
        if (info.fps !== firstInfo.fps) {
          console.error(`フレームレートが一致しません: ${inputPaths[0]} (${firstInfo.fps}) と ${inputPaths[i]} (${info.fps})`);
          reject(new Error('フレームレートが一致しません'));
          return;
        }
      }

      const command = ffmpeg();
      inputPaths.forEach(filePath => command.input(filePath));

      const filterInputs = inputPaths.map((_, i) => `[${i}:v]`).join('');
      const filterComplex = `${filterInputs}concat=n=${inputPaths.length}:v=1:a=0[v]`;

      command
        .complexFilter(filterComplex)
        .outputOptions([
          '-map', '[v]',
          '-c:v', 'libx264',
          '-preset', 'medium',
          '-crf', '23',
          '-pix_fmt', 'yuv420p'
        ])
        .output(outputPath)
        .on('progress', progress => {
          if (progressCallback) {
            // 結合時は最初のクリップの長さを基準にする
            // ※必要に応じて進捗計算も見直してください
            const firstClipDuration = progress.duration || 30;
            const percent = calculateProgress(progress, firstClipDuration);
            progressCallback('clip-concatenation', 0, 1, {
              currentFile: outputPath,
              progress: percent,
              totalFiles: inputPaths.length
            });
          }
        })
        .on('end', () => {
          console.log(`結合クリップ作成完了: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error(`結合クリップ作成エラー: ${err.message}`);
          reject(err);
        });

      command.run();
    });
  }

  async createFinalVideo(videoPath, audioPath, outputPath, audioDuration, progressCallback) {
    return new Promise(async (resolve, reject) => {
        try {
            console.log(`最終動画作成: 動画=${videoPath}, 音声=${audioPath}, 出力=${outputPath}`);

            // 動画情報を取得して総フレーム数を計算
            const videoInfo = await this.getMediaInfo(videoPath);
            const totalFrames = Math.ceil(audioDuration * videoInfo.fps);
            const hasAudio = videoInfo.audio_codec !== 'none';

            console.log(`最終動画情報: フレームレート=${videoInfo.fps}fps, 総フレーム数=${totalFrames}`);

            const command = ffmpeg()
                .input(videoPath)
                .inputOptions(['-stream_loop -1'])
                .input(audioPath)
                .outputOptions([
                    '-c:v', 'libx264',
                    '-pix_fmt', 'yuv420p',
                    '-t', audioDuration.toString()
                ]);

            if (hasAudio) {
                command.outputOptions([
                    '-c:a', 'aac',
                    '-b:a', '192k'
                ]);
            }

            command
                .output(outputPath)
                .on('progress', progress => {
                    if (progressCallback) {
                        progressCallback('final-rendering', 0, 1, {
                            currentFile: outputPath,
                            progress: calculateProgress(progress, audioDuration),
                            audioDuration: audioDuration,
                            frames: progress.frames || 0,
                            totalFrames: totalFrames // 総フレーム数を追加
                        });
                    }
                })
                .on('end', () => {
                    console.log(`最終動画作成完了: ${outputPath}`);
                    resolve(outputPath);
                })
                .on('error', (err) => {
                    console.error(`最終動画作成エラー: ${err.message}`);
                    reject(err);
                });

            command.run();
        } catch (error) {
            console.error('最終動画作成中にエラーが発生しました:', error);
            reject(error);
        }
    });
  }

  async generateVideo({ musicPath, resources, outputPath, progressCallback }) {
    // 進行状況を更新する関数
    const updateProgress = (stage, current, total, details) => {
      if (progressCallback) {
        // 各段階の進行状況を計算
        let overallProgress;
        const stepProgress = details.progress / 100;

        switch (stage) {
          case 'subclip-creation':
            // サブクリップ作成: 0-20%
            const subclipWeight = 20 / resources.length; // 各サブクリップの重み
            overallProgress = (current * subclipWeight) + (stepProgress * subclipWeight);
            break;
          case 'clip-concatenation':
            // クリップ結合: 20-40%
            overallProgress = 20 + (stepProgress * 20);
            break;
          case 'final-rendering':
            // 最終レンダリング: 40-100%
            const totalFrames = details.audioDuration * 30; // 想定される総フレーム数（30fpsと仮定）
            const currentFrames = details.frames || 0;
            const frameProgress = Math.min(currentFrames / totalFrames, 1);
            overallProgress = 40 + (frameProgress * 60);
            break;
          default:
            overallProgress = 0;
        }
        
        progressCallback(stage, current, total, {
          ...details,
          progress: Math.min(Math.round(overallProgress), 100)
        });
      }
    };
    
    try {
      console.log('受信したパラメータ:', { musicPath, resources });
      
      // 基本的なパラメータの検証
      if (!musicPath || !resources || resources.length === 0) {
        throw new Error('音楽ファイルとリソースが必要です');
      }
  
      if (!fs.existsSync(musicPath)) {
        throw new Error(`音楽ファイルが見つかりません: ${musicPath}`);
      }

      // ファイル形式の検証
      const validAudioExts = ['.mp3', '.wav', '.m4a', '.aac'];
      const validImageExts = ['.jpg', '.jpeg', '.png', '.gif'];
      const validVideoExts = ['.mp4', '.mov', '.avi', '.mkv'];

      if (!validAudioExts.includes(path.extname(musicPath).toLowerCase())) {
        throw new Error('サポートされていない音声ファイル形式です');
      }

      // リソースの検証
      for (const resource of resources) {
        if (!fs.existsSync(resource.path)) {
          throw new Error(`リソースファイルが見つかりません: ${resource.path}`);
        }

        const ext = path.extname(resource.path).toLowerCase();
        if (resource.type === 'image' && !validImageExts.includes(ext)) {
          throw new Error(`サポートされていない画像ファイル形式です: ${resource.path}`);
        }
        if (resource.type === 'video' && !validVideoExts.includes(ext)) {
          throw new Error(`サポートされていない動画ファイル形式です: ${resource.path}`);
        }

        if (!Number.isFinite(resource.duration) || resource.duration <= 0) {
          throw new Error(`無効な継続時間（またはフレーム数）です: ${resource.duration}`);
        }
      }

      const audioDuration = await this.getAudioDuration(musicPath);
      console.log('音声の長さ（秒）:', audioDuration);

      // 1. サブクリップの作成
      const subClips = [];
      for (let i = 0; i < resources.length; i++) {
        const resource = resources[i];
        const tempPath = path.join(path.dirname(outputPath), `subclip_${i}.mp4`);
        this.tempFiles.push(tempPath);

        try {
          if (resource.type === 'video') {
            // 【変更】動画リソースは秒数ではなくフレーム数指定となる
            await this.createSubClip(
              resource.path,
              tempPath,
              resource.duration, // ※ここは「必要なフレーム数」として指定する
              (stage, current, total, details) => {
                updateProgress(stage, i, resources.length, details);
              }
            );
          } else {
            // 画像の場合は従来どおり秒数指定
            await new Promise((resolve, reject) => {
              ffmpeg()
                .input(resource.path)
                .inputOptions(['-loop 1'])
                .outputOptions([
                  '-t', resource.duration.toString(),
                  '-c:v', 'libx264',
                  '-pix_fmt', 'yuv420p',
                  '-preset', 'medium',
                  '-crf', '23'
                ])
                .output(tempPath)
                .on('progress', progress => {
                  const percent = calculateProgress(progress, resource.duration);
                  updateProgress('subclip-creation', i, resources.length, {
                    currentFile: resource.path,
                    progress: percent
                  });
                })
                .on('end', () => {
                  console.log(`画像クリップ作成完了: ${tempPath}`);
                  resolve(tempPath);
                })
                .on('error', (err) => {
                  console.error(`画像クリップ作成エラー: ${err.message}`);
                  reject(err);
                })
                .run();
            });
          }
          subClips.push(tempPath);
        } catch (error) {
          console.error(`リソース処理エラー: ${resource.path}`, error);
          throw new Error(`リソースの処理に失敗しました: ${resource.path}`);
        }
      }

      // 2. クリップの結合
      const concatenatedPath = path.join(path.dirname(outputPath), 'concatenated.mp4');
      this.tempFiles.push(concatenatedPath);
      
      await this.createConcatenatedClip(
        subClips,
        concatenatedPath,
        (stage, current, total, details) => {
          updateProgress(stage, current, total, details);
        }
      );

      // 3. 最終動画の作成
      await this.createFinalVideo(
        concatenatedPath,
        musicPath,
        outputPath,
        audioDuration,
        (stage, current, total, details) => {
          updateProgress(stage, current, total, details);
        }
      );
      // 最終レンダリング完了

      return { success: true, outputPath };
    } catch (error) {
      console.error('エラー発生:', error);
      throw new Error(`動画生成に失敗しました: ${error.message}`);
    } finally {
      try {
        this.cleanupTempFiles();
      } catch (cleanupError) {
        console.error('一時ファイルのクリーンアップエラー:', cleanupError);
      }
    }
  }

  cleanupTempFiles() {
    this.tempFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`一時ファイルを削除しました: ${file}`);
        }
      } catch (error) {
        console.error(`一時ファイルの削除に失敗しました: ${file}`, error);
      }
    });
    this.tempFiles = [];
  }

  async checkFileExists(filePath) {
    return fs.existsSync(filePath);
  }
}

export default VideoProcessor;
