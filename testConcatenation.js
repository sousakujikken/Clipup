import VideoProcessor from './utils/videoProcessor.js';

const videoProcessor = new VideoProcessor();

const inputPaths = [
  '/home/hiropip/development/tools/ComfyUI/output/new_bug/android_1.mp4',
  '/home/hiropip/development/tools/ComfyUI/output/new_bug/android_2.mp4'
];

const outputPath = '/home/hiropip/development/tools/ComfyUI/output/new_bug/test.mp4';

videoProcessor.createConcatenatedClip(inputPaths, outputPath)
  .then(result => {
    console.log('Concatenation successful:', result);
  })
  .catch(error => {
    console.error('Error during concatenation:', error);
  });
