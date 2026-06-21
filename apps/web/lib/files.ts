export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Nao foi possivel ler o arquivo."));
    };

    reader.onerror = () => reject(reader.error ?? new Error("Nao foi possivel ler o arquivo."));
    reader.readAsDataURL(file);
  });
}

type ImageDataUrlOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: "image/jpeg" | "image/png" | "image/webp";
};

async function readOptimizedImageAsDataUrl(file: File, options: ImageDataUrlOptions) {
  const originalDataUrl = await readFileAsDataUrl(file);

  if (
    typeof window === "undefined" ||
    typeof document === "undefined" ||
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif"
  ) {
    return originalDataUrl;
  }

  return new Promise<string>((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      try {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;

        if (!width || !height) {
          resolve(originalDataUrl);
          return;
        }

        const maxWidth = options.maxWidth ?? width;
        const maxHeight = options.maxHeight ?? height;
        const scale = Math.min(1, maxWidth / width, maxHeight / height);
        const outputWidth = Math.max(1, Math.round(width * scale));
        const outputHeight = Math.max(1, Math.round(height * scale));
        const output = document.createElement("canvas");

        output.width = outputWidth;
        output.height = outputHeight;

        const outputContext = output.getContext("2d");

        if (!outputContext) {
          resolve(originalDataUrl);
          return;
        }

        if ((options.outputType ?? "image/jpeg") === "image/jpeg") {
          outputContext.fillStyle = "#ffffff";
          outputContext.fillRect(0, 0, outputWidth, outputHeight);
        }

        outputContext.drawImage(image, 0, 0, outputWidth, outputHeight);

        const optimizedDataUrl = output.toDataURL(options.outputType ?? "image/jpeg", options.quality ?? 0.82);
        resolve(optimizedDataUrl.length < originalDataUrl.length ? optimizedDataUrl : originalDataUrl);
      } catch {
        resolve(originalDataUrl);
      }
    };

    image.onerror = () => resolve(originalDataUrl);
    image.src = originalDataUrl;
  });
}

export async function formDataImageValue(formData: FormData, key: string, fallback = "", options?: ImageDataUrlOptions) {
  const value = formData.get(key);

  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    const text = value.trim();
    return text.length ? text : fallback;
  }

  if (value.size === 0) {
    return fallback;
  }

  if (options) {
    return readOptimizedImageAsDataUrl(value, options);
  }

  return readFileAsDataUrl(value);
}

async function readLogoFileAsDataUrl(file: File) {
  const dataUrl = await readFileAsDataUrl(file);

  if (typeof window === "undefined" || typeof document === "undefined") {
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      try {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;

        if (!width || !height) {
          resolve(dataUrl);
          return;
        }

        const source = document.createElement("canvas");
        source.width = width;
        source.height = height;

        const context = source.getContext("2d", { willReadFrequently: true });

        if (!context) {
          resolve(dataUrl);
          return;
        }

        context.drawImage(image, 0, 0);

        const pixels = context.getImageData(0, 0, width, height);
        const data = pixels.data;
        let hasTransparency = false;

        for (let index = 3; index < data.length; index += 4) {
          if (data[index] < 245) {
            hasTransparency = true;
            break;
          }
        }

        let top = height;
        let right = -1;
        let bottom = -1;
        let left = width;

        for (let y = 0; y < height; y += 1) {
          for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4;
            const red = data[index];
            const green = data[index + 1];
            const blue = data[index + 2];
            const alpha = data[index + 3];
            const isWhiteMargin = red > 246 && green > 246 && blue > 246;
            const isContent = hasTransparency ? alpha > 12 : alpha > 12 && !isWhiteMargin;

            if (!isContent) {
              continue;
            }

            top = Math.min(top, y);
            right = Math.max(right, x);
            bottom = Math.max(bottom, y);
            left = Math.min(left, x);
          }
        }

        if (right < left || bottom < top) {
          resolve(dataUrl);
          return;
        }

        const contentWidth = right - left + 1;
        const contentHeight = bottom - top + 1;
        const padding = Math.max(8, Math.round(Math.max(contentWidth, contentHeight) * 0.04));
        const cropX = Math.max(0, left - padding);
        const cropY = Math.max(0, top - padding);
        const cropWidth = Math.min(width - cropX, contentWidth + padding * 2);
        const cropHeight = Math.min(height - cropY, contentHeight + padding * 2);
        const scale = Math.min(1, 920 / cropWidth, 260 / cropHeight);
        const outputWidth = Math.max(1, Math.round(cropWidth * scale));
        const outputHeight = Math.max(1, Math.round(cropHeight * scale));
        const output = document.createElement("canvas");
        output.width = outputWidth;
        output.height = outputHeight;

        const outputContext = output.getContext("2d", { willReadFrequently: true });

        if (!outputContext) {
          resolve(dataUrl);
          return;
        }

        outputContext.drawImage(source, cropX, cropY, cropWidth, cropHeight, 0, 0, outputWidth, outputHeight);

        if (!hasTransparency) {
          const outputPixels = outputContext.getImageData(0, 0, outputWidth, outputHeight);
          const outputData = outputPixels.data;

          for (let index = 0; index < outputData.length; index += 4) {
            if (outputData[index] > 248 && outputData[index + 1] > 248 && outputData[index + 2] > 248) {
              outputData[index + 3] = 0;
            }
          }

          outputContext.putImageData(outputPixels, 0, 0);
        }

        resolve(output.toDataURL("image/png"));
      } catch {
        resolve(dataUrl);
      }
    };

    image.onerror = () => resolve(dataUrl);
    image.src = dataUrl;
  });
}

export async function formDataLogoImageValue(formData: FormData, key: string, fallback = "") {
  const value = formData.get(key);

  if (!value) {
    return fallback;
  }

  if (typeof value === "string") {
    const text = value.trim();
    return text.length ? text : fallback;
  }

  if (value.size === 0) {
    return fallback;
  }

  return readLogoFileAsDataUrl(value);
}
