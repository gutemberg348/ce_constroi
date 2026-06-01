type NumericValue =
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

function toNumber(value: NumericValue) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  if (Array.isArray(value.d) && typeof value.e === "number") {
    const digits = value.d.join("");
    const parsed = Number(`${value.s === -1 ? "-" : ""}${digits}`) * Math.pow(10, value.e - digits.length + 1);
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
