/**
 * Utility to compress images into JPEG format targeting a maximum file size (default 50KB).
 * Handles high-resolution camera photos, local files, or data URLs.
 */
export async function compressImageToJPEG(
  input: File | Blob | string,
  maxKb: number = 50
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.width;
        let height = img.height;
        const initialMaxDim = 800;

        // Scale down initial size if larger than 800px
        if (width > initialMaxDim || height > initialMaxDim) {
          if (width > height) {
            height = Math.round((height * initialMaxDim) / width);
            width = initialMaxDim;
          } else {
            width = Math.round((width * initialMaxDim) / height);
            height = initialMaxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Canvas 2D context not available'));
        }

        // Fill background with solid white for PNG transparency handling
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.82;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);

        const calculateKb = (str: string): number => {
          const base64Str = str.split(',')[1] || '';
          return Math.round(((base64Str.length * 3) / 4 / 1024) * 10) / 10;
        };

        let currentKb = calculateKb(dataUrl);
        let currentWidth = width;
        let currentHeight = height;
        let iterations = 0;

        // Iteratively reduce quality and/or scale dimensions until size <= maxKb
        while (currentKb > maxKb && iterations < 20) {
          iterations++;
          if (quality > 0.25) {
            quality -= 0.12;
          } else {
            // Quality is already low (25%), downscale image resolution by 15%
            currentWidth = Math.round(currentWidth * 0.85);
            currentHeight = Math.round(currentHeight * 0.85);
            if (currentWidth < 80 || currentHeight < 80) break;

            canvas.width = currentWidth;
            canvas.height = currentHeight;
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, currentWidth, currentHeight);
            ctx.drawImage(img, 0, 0, currentWidth, currentHeight);
          }

          dataUrl = canvas.toDataURL('image/jpeg', Math.max(0.08, quality));
          currentKb = calculateKb(dataUrl);
        }

        resolve({
          dataUrl,
          sizeKb: currentKb,
          width: currentWidth,
          height: currentHeight
        });
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = (err) => {
      reject(new Error('Failed to load image for compression'));
    };

    if (typeof input === 'string') {
      img.src = input;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => {
        img.src = e.target?.result as string;
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(input);
    }
  });
}
