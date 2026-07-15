import React from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  onClick?: () => void;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  hoverable = false,
  onClick
}) => {
  const hoverClasses = hoverable
    ? 'hover:scale-[1.01] hover:border-violet-500/20 hover:shadow-glow transition-all duration-300 cursor-pointer'
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      onClick={onClick}
      className={`glass-panel rounded-2xl p-6 border border-white/5 shadow-2xl relative overflow-hidden ${hoverClasses} ${className}`}
    >
      {/* Subtle background glow effect */}
      <div className="absolute -top-24 -left-24 w-48 h-48 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};
export default GlassCard;
