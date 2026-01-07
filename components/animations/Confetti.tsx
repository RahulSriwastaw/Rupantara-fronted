"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

export function Confetti({ show }: { show: boolean }) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    delay: number;
    color: string;
  }>>([]);

  useEffect(() => {
    if (show) {
      const colors = [
        "bg-purple-500",
        "bg-pink-500",
        "bg-blue-500",
        "bg-yellow-500",
        "bg-green-500",
      ];
      
      const newParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: -10,
        delay: Math.random() * 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
      }));

      setParticles(newParticles);

      setTimeout(() => {
        setParticles([]);
      }, 3000);
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className={`absolute ${particle.color} w-2 h-2 rounded-full`}
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animation: `confetti-fall ${2 + Math.random()}s ease-out ${particle.delay}s forwards`,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

