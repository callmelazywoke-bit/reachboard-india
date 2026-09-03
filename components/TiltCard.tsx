'use client';

import { useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  glow?: 'purple' | 'pink' | 'blue' | 'none';
  shine?: boolean;
}

export function TiltCard({ children, className, glow = 'none', shine = false }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [shinePos, setShinePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`);
    setShinePos({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setTransform('perspective(1000px) rotateX(0) rotateY(0) scale(1)');
    setShinePos({ x: 50, y: 50 });
  };

  const glowClass = {
    purple: 'glow-purple',
    pink: 'glow-pink',
    blue: 'glow-blue',
    none: '',
  }[glow];

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('tilt-card glass rounded-2xl', glowClass, className)}
      style={{ transform }}
    >
      {shine && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden"
          style={{
            background: `radial-gradient(circle at ${shinePos.x}% ${shinePos.y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`,
          }}
        />
      )}
      {children}
    </div>
  );
}
