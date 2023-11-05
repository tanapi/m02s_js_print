const WIDTH = 576;

// 画像ファイルを読み込んでcanvasに描画
function loadImage() {
  const files = document.getElementById("img_file").files;
  const reader = new FileReader;
  reader.addEventListener('load', function (evt) {
    const _src = evt.target.result;
    const cvs = document.querySelector('canvas');
    const ctx = cvs.getContext('2d');
    ctx.clearRect(0, 0, cvs.width, cvs.height);

    let gImage = new Image();
    gImage.src = _src;
    gImage.addEventListener('load', function () {
      cvs.width = WIDTH; // M02Sの解像度に合わせる
      cvs.height = WIDTH * gImage.height / gImage.width;
      ctx.drawImage(gImage, 0, 0, cvs.width, cvs.height);
    }, false);
  }, false);
  reader.readAsDataURL(files[0]);
}

// 画像をグレイスケール化
function toGrayscale(array, width, height) {
  let outputArray = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      for (let dy = 0; dy < 4; ++dy) {
        for (let dx = 0; dx < 4; ++dx) {
          const r = array[((y + dy) * width + (x + dx)) * 4 + 0];
          const g = array[((y + dy) * width + (x + dx)) * 4 + 1];
          const b = array[((y + dy) * width + (x + dx)) * 4 + 2];
          const gray = (r + g + b) / 3 | 0;
          outputArray[(y + dy) * width + (x + dx)] = gray;
        }
      }
    }
  }
  return outputArray;
}

// 画像を誤差拡散で2値化
function errorDiffusion1CH(u8array, width, height) {
  let errorDiffusionBuffer = new Int16Array(width * height); // 誤差拡散法で元画像+処理誤差を一旦保持するバッファ Uint8だとオーバーフローする
  let outputData = new Uint8Array(width * height);
  for (let i = 0; i < width * height; ++i) errorDiffusionBuffer[i] = u8array[i];

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let outputValue;
      let errorValue;
      const currentPositionValue = errorDiffusionBuffer[y * width + x];
      if (currentPositionValue >= 128) {
        outputValue = 255;
        errorValue = currentPositionValue - 255;
      } else {
        outputValue = 0;
        errorValue = currentPositionValue;
      }

      if (x < width - 1) {
        errorDiffusionBuffer[y * width + x + 1] += 5 * errorValue / 16 | 0;
      }
      if (0 < x && y < height - 1) {
        errorDiffusionBuffer[(y + 1) * width + x - 1] += 3 * errorValue / 16 | 0;
      }
      if (y < height - 1) {
        errorDiffusionBuffer[(y + 1) * width + x] += 5 * errorValue / 16 | 0;
      }
      if (x < width - 1 && y < height - 1) {
        errorDiffusionBuffer[(y + 1) * width + x + 1] += 3 * errorValue / 16 | 0;
      }
      outputData[y * width + x] = outputValue;
    }
  }
  return outputData;
}