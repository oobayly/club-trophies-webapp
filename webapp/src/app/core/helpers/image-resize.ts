import { TOptions, getBase64Strings } from "exif-rotate-js";

function resizeImageFiles(items: File[], options?: TOptions): Promise<File[]>
function resizeImageFiles(items: Blob[], options?: TOptions): Promise<Blob[]>
function resizeImageFiles(items: File, options?: TOptions): Promise<File>
function resizeImageFiles(items: Blob, options?: TOptions): Promise<Blob>
async function resizeImageFiles(items: File[] | Blob[] | File | Blob, options?: TOptions): Promise<File[] | Blob[] | File | Blob> {
  const isArray = Array.isArray(items);

  if (!Array.isArray(items)) {
    items = [items];
  }

  const base64 = await getBase64Strings(items, options);
  const resized: (File | Blob)[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const blob = await fetch(base64[i]).then((x) => x.blob());
    const { type } = item;

    if ("lastModified" in item) {
      const { name, lastModified } = item;

      resized.push(new File(
        [blob], name,
        {
          type,
          lastModified,
        }));
    } else {
      resized.push(blob);
    }
  }

  if (isArray) {
    return resized;
  } else {
    return resized[0];
  }
}

export {
  resizeImageFiles,
};
