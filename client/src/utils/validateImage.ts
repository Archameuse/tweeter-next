/**
 *
 * @param file actual File
 * @param maxSize in KB
 * @returns
 */
export default async function validateImage(
  file: File,
  maxSize: number = 10,
): Promise<{ error?: string; localUrl?: string }> {
  if (file.size >= maxSize * 1024)
    return {
      error: `Image should be less than ${Math.ceil(maxSize)} KB. Current size is ${Math.ceil(file.size / 1024)} KB`,
    };

  const localUrl = URL.createObjectURL(file);

  const valid = await new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = localUrl;
  });
  if (!valid) {
    URL.revokeObjectURL(localUrl);
    return { error: "Failed to load image, file might be corrupted." };
  }
  return { localUrl };
}
