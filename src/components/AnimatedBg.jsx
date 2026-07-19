import { motion } from 'framer-motion';

export default function AnimatedBg() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Floating DNA-like particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute bg-white/5 rounded-full blur-xl"
          initial={{ x: Math.random() * 800, y: Math.random() * 800, scale: 0 }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.5, 1],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 10 + Math.random() * 10, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 100 + Math.random() * 200, height: 100 + Math.random() * 200 }}
        />
      ))}
      {/* Background Gradient Shift */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-purple-900"
        animate={{ opacity: [0.8, 1, 0.8] }}
        transition={{ duration: 10, repeat: Infinity }}
      />
    </div>
  );
}
