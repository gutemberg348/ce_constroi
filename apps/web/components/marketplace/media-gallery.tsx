"use client";

import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import { useMemo, useState } from "react";
import { PrivacyImage } from "@/components/privacy/privacy-image";

export type MediaGalleryItem = {
  src: string;
  alt: string;
  label?: string;
};

export function MediaGallery({ items, title }: { items: MediaGalleryItem[]; title: string }) {
  const gallery = useMemo(
    () => items.filter((item) => item.src).filter((item, index, all) => all.findIndex((candidate) => candidate.src === item.src) === index),
    [items]
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const selected = gallery[selectedIndex] ?? gallery[0];

  function select(index: number) {
    setSelectedIndex(index);
  }

  function previous() {
    setSelectedIndex((current) => (current <= 0 ? gallery.length - 1 : current - 1));
  }

  function next() {
    setSelectedIndex((current) => (current >= gallery.length - 1 ? 0 : current + 1));
  }

  if (!gallery.length) {
    return (
      <div className="flex h-72 items-center justify-center rounded-[8px] border border-[var(--line)] bg-[var(--panel)] text-[var(--muted)]">
        <Images size={26} />
      </div>
    );
  }

  return (
    <>
      <div className="min-w-0 overflow-hidden rounded-[8px] border border-[var(--line)] bg-[var(--panel)] p-2 sm:p-3">
        <button
          className="focus-ring group relative block w-full overflow-hidden rounded-[8px] bg-[#dfe4dc] text-left"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <PrivacyImage
            alt={selected.alt}
            className="block h-64 w-full object-cover transition duration-500 group-hover:scale-[1.02] sm:h-96 lg:h-[520px]"
            src={selected.src}
          />
          <span className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-[8px] bg-black/65 px-3 py-2 text-xs font-semibold text-white">
            <Images size={15} />
            Ver fotos ({selectedIndex + 1}/{gallery.length})
          </span>
        </button>

        {gallery.length > 1 ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-5">
            {gallery.map((item, index) => (
              <button
                aria-label={`Ver imagem ${index + 1} de ${title}`}
                className={`focus-ring overflow-hidden rounded-[8px] border bg-[#dfe4dc] text-left transition ${
                  index === selectedIndex ? "border-[var(--accent)] ring-2 ring-[color-mix(in_srgb,var(--accent)_28%,transparent)]" : "border-[var(--line)]"
                }`}
                key={`${item.src}-${index}`}
                onClick={() => select(index)}
                type="button"
              >
                <PrivacyImage alt={item.alt} className="block h-20 w-full object-cover sm:h-24" src={item.src} />
                <span className="block truncate px-2 py-1.5 text-xs font-semibold text-[var(--muted)]">
                  {item.label ?? `Foto ${index + 1}`}
                </span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/86 p-3 sm:p-6" role="dialog" aria-modal="true">
          <div className="relative grid max-h-full w-full max-w-6xl gap-3">
            <div className="flex items-center justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="break-words text-sm uppercase text-white/60">{title}</p>
                <h2 className="break-words text-lg font-semibold">{selected.label ?? `Foto ${selectedIndex + 1}`}</h2>
              </div>
              <button
                className="focus-ring inline-flex h-10 w-10 items-center justify-center rounded-[8px] bg-white/12 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative overflow-hidden rounded-[8px] bg-black">
              <PrivacyImage alt={selected.alt} className="block max-h-[76vh] w-full object-contain" src={selected.src} />
              {gallery.length > 1 ? (
                <>
                  <button
                    className="focus-ring absolute left-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[8px] bg-white/14 text-white hover:bg-white/24"
                    onClick={previous}
                    type="button"
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <button
                    className="focus-ring absolute right-3 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[8px] bg-white/14 text-white hover:bg-white/24"
                    onClick={next}
                    type="button"
                  >
                    <ChevronRight size={24} />
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
