"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MobileNav({
  navItems,
  active,
}: {
  navItems: readonly { href: string; label: string }[];
  active: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  return (
    <div ref={rootRef} className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label="Toggle navigation menu"
        className="flex h-[30px] w-[30px] items-center justify-center rounded-btn border border-border text-ink"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="h-[1.5px] w-4 bg-ink" />
          <span className="h-[1.5px] w-4 bg-ink" />
          <span className="h-[1.5px] w-4 bg-ink" />
        </span>
      </button>

      {open ? (
        <div className="absolute left-0 top-[38px] z-10 w-44 rounded-shell border border-border bg-paper py-1.5 shadow-shell">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 text-sm font-medium ${
                item.href === active ? "text-ink" : "text-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
