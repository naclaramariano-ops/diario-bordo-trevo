const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const OUTPUT_SIZE = 512;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Não foi possível abrir a imagem selecionada.'));
    };
    image.src = url;
  });
}

function canvasBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error('Não foi possível processar a imagem.')),
      'image/webp',
      quality,
    );
  });
}

/**
 * Recorta a região central em formato quadrado, redimensiona e comprime.
 * O arquivo enviado ao Supabase fica leve, previsível e compatível com mobile.
 */
export async function prepareAvatar(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Selecione uma imagem JPG, PNG ou WebP.');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('A imagem é muito grande. Selecione uma foto de até 20 MB.');
  }

  const image = await loadImage(file);
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  if (!sourceSize) throw new Error('A imagem selecionada é inválida.');

  const sourceX = Math.max(0, (image.naturalWidth - sourceSize) / 2);
  const sourceY = Math.max(0, (image.naturalHeight - sourceSize) / 2);
  const canvas = document.createElement('canvas');
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Seu navegador não conseguiu processar a imagem.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    OUTPUT_SIZE,
    OUTPUT_SIZE,
  );

  let blob = await canvasBlob(canvas, 0.84);
  if (blob.size > 1.8 * 1024 * 1024) blob = await canvasBlob(canvas, 0.68);
  return blob;
}
