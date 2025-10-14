import { motion } from "framer-motion";
import { Card } from "./card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  strength?: "light" | "medium" | "strong";
  animated?: boolean;
  glow?: boolean;
  className?: string;
  children?: ReactNode;
  [key: string]: any; // For rest props
}

export function GlassCard({
  className,
  strength = "medium",
  animated = false,
  glow = false,
  children,
  ...props
}: GlassCardProps) {
  const strengthClasses = {
    light: "backdrop-blur-lg bg-white/5 border-white/10",
    medium: "glass-card",
    strong: "glass-card-strong",
  };

  const cardContent = (
    <Card
      className={cn(
        strengthClasses[strength],
        glow && "forest-glow",
        "transition-all duration-300 hover:shadow-xl hover:border-primary/40",
        className
      )}
      {...props}
    >
      {children}
    </Card>
  );

  if (animated) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        className="h-full"
      >
        {cardContent}
      </motion.div>
    );
  }

  return cardContent;
}
