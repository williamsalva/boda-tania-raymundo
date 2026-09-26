"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

export function Revelar({
  children,
  className = "",
  retraso = 0,
  style,
}: {
  children: ReactNode;
  className?: string;
  retraso?: number;
  style?: CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entrada]) => {
        if (entrada.isIntersecting) {
          el.classList.add("visible");
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`revelar ${className}`} style={{ ...style, transitionDelay: `${retraso}ms` }}>
      {children}
    </div>
  );
}
