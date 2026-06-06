export type NumericValue =
  | number
  | string
  | undefined
  | null
  | {
      s?: number;
      e?: number;
      d?: number[];
      toString?: () => string;
    };

export function toNumber(value: NumericValue) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (Array.isArray(value.d) && typeof value.e === "number") {
    const [firstChunk, ...chunks] = value.d;
    const digits = `${firstChunk ?? 0}${chunks.map((chunk) => String(chunk).padStart(7, "0")).join("")}`;
    const decimalIndex = value.e + 1;
    const normalized =
      decimalIndex <= 0
        ? `0.${"0".repeat(Math.abs(decimalIndex))}${digits}`
        : decimalIndex >= digits.length
          ? `${digits}${"0".repeat(decimalIndex - digits.length)}`
          : `${digits.slice(0, decimalIndex)}.${digits.slice(decimalIndex)}`;
    const parsed = Number(`${value.s === -1 ? "-" : ""}${normalized}`);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  const parsed = Number(value.toString?.());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function money(value: NumericValue) {
  const amount = toNumber(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0
  }).format(amount);
}

export function area(value: NumericValue) {
  return `${new Intl.NumberFormat("pt-BR").format(toNumber(value))} m2`;
}
