"use client";

import { Input } from "@/components/ui/input";
import { money, toNumber } from "@/lib/format";
import { useEffect, useState, type ComponentProps } from "react";

function normalizeDigits(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits.replace(/^0+(?=\d)/, "");
}

function formatDigits(value: string) {
  if (!value) {
    return "";
  }

  return money(toNumber(value));
}

type CurrencyInputProps = Omit<ComponentProps<typeof Input>, "type" | "value" | "defaultValue" | "onChange"> & {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
};

export function CurrencyInput({ value, defaultValue, onValueChange, inputMode = "numeric", ...props }: CurrencyInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(() => normalizeDigits(defaultValue ?? ""));

  useEffect(() => {
    if (isControlled) {
      return;
    }

    const timer = window.setTimeout(() => {
      setInternalValue(normalizeDigits(defaultValue ?? ""));
    }, 0);

    return () => window.clearTimeout(timer);
  }, [defaultValue, isControlled]);

  const rawValue = isControlled ? normalizeDigits(value ?? "") : internalValue;

  return (
    <Input
      {...props}
      inputMode={inputMode}
      type="text"
      value={formatDigits(rawValue)}
      onChange={(event) => {
        const nextValue = normalizeDigits(event.target.value);

        if (!isControlled) {
          setInternalValue(nextValue);
        }

        onValueChange?.(nextValue);
      }}
    />
  );
}
