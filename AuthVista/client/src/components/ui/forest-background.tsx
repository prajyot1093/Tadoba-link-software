import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

export function ForestBackground({ children, blur = true }: { children: React.ReactNode; blur?: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create dew drops
    const createDewDrops = () => {
      if (!containerRef.current) return;

      const dropCount = 15;
      for (let i = 0; i < dropCount; i++) {
        const drop = document.createElement("div");
        drop.className = "dew-drop";
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDelay = `${Math.random() * 8}s`;
        drop.style.animationDuration = `${6 + Math.random() * 4}s`;
        containerRef.current.appendChild(drop);
      }
    };

    // Create floating leaves
    const createLeaves = () => {
      if (!containerRef.current) return;

      const leafCount = 8;
      for (let i = 0; i < leafCount; i++) {
        const leaf = document.createElement("div");
        leaf.className = "floating-leaf";
        leaf.style.left = `${Math.random() * 100}%`;
        leaf.style.animationDelay = `${Math.random() * 15}s`;
        leaf.style.animationDuration = `${12 + Math.random() * 8}s`;
        containerRef.current.appendChild(leaf);
      }
    };

    createDewDrops();
    createLeaves();

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated forest background */}
      <div className="forest-background" />

      {/* Mist overlay */}
      <div className="mist-overlay" />

      {/* Particle container */}
      <div ref={containerRef} className="fixed inset-0 pointer-events-none z-10" />

      {/* Content with optional blur effect */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className={`relative z-20 ${blur ? "backdrop-blur-sm" : ""}`}
      >
        {children}
      </motion.div>
    </div>
  );
}

export function ForestParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {/* Floating light particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/40 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 5,
          }}
        />
      ))}
    </div>
  );
}
