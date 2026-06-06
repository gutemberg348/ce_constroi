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

export async function formDataImageValue(formData: FormData, key: string, fallback = "") {
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

  return readFileAsDataUrl(value);
}
