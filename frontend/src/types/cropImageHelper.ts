export interface Area {
  x: number;
  y: number;
  width: number;
  height: number;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.setAttribute("crossOrigin", "anonymous");
    image.src = url;
  });

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  fileName = "cropped-image.webp",
  rotation = 0,
): Promise<File> {
  const image = await createImage(imageSrc);
  const radians = (rotation * Math.PI) / 180;
  const sin = Math.abs(Math.sin(radians));
  const cos = Math.abs(Math.cos(radians));
  const rotatedWidth = image.width * cos + image.height * sin;
  const rotatedHeight = image.width * sin + image.height * cos;
  const rotatedCanvas = document.createElement("canvas");
  const rotatedContext = rotatedCanvas.getContext("2d");

  if (!rotatedContext) {
    throw new Error("Could not create canvas context");
  }

  rotatedCanvas.width = rotatedWidth;
  rotatedCanvas.height = rotatedHeight;
  rotatedContext.translate(rotatedWidth / 2, rotatedHeight / 2);
  rotatedContext.rotate(radians);
  rotatedContext.drawImage(image, -image.width / 2, -image.height / 2);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create canvas context");
  }

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    rotatedCanvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          return reject(new Error("Canvas crop failed"));
        }
        const file = new File([blob], fileName, { type: "image/webp" });
        resolve(file);
      },
      "image/webp",
      0.9
    );
  });
}