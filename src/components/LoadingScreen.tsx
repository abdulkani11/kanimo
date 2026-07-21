import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  onFinished: () => void;
  isTransition?: boolean;
}

export default function LoadingScreen({ onFinished, isTransition = false }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [fadeExit, setFadeExit] = useState(false);

  // Speed up loading progress for transitions vs initial app load
  useEffect(() => {
    const duration = isTransition ? 600 : 2000;
    const intervalTime = duration / 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isTransition]);

  // Handle completion and trigger fade exit
  useEffect(() => {
    if (progress === 100) {
      const delay = setTimeout(() => {
        setFadeExit(true);
        const finishTimeout = setTimeout(() => {
          onFinished();
        }, 500);
        return () => clearTimeout(finishTimeout);
      }, 200);
      return () => clearTimeout(delay);
    }
  }, [progress, onFinished]);

  return (
    <AnimatePresence>
      {!fadeExit && (
        <motion.div
          id="portal-loading-screen"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-tr from-[#f3f8fc] via-white to-[#e6f4fd] select-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        >
          {/* Subtle sky background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Top right ambient blue glow */}
            <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#d0eafc] rounded-full blur-[100px] opacity-70"></div>
            {/* Bottom left ambient cyan glow */}
            <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#e3f8ff] rounded-full blur-[100px] opacity-60"></div>
            
            {/* Elegant vector grid lines representing flight navigation */}
            <div className="absolute inset-0 opacity-[0.05] bg-[linear-gradient(to_right,#3b82f6_1px,transparent_1px),linear-gradient(to_bottom,#3b82f6_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
          </div>

          <div className="relative flex flex-col items-center max-w-md w-full px-6">
            
            {/* GDS Secure Node Tag */}
            {!isTransition && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.5 }}
                className="mb-8 bg-white/70 border border-blue-100 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm backdrop-blur-md"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
                <span className="text-[9px] font-bold text-blue-600 tracking-widest font-mono uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-500" />
                  NOBLE SECURE LINK ONLINE
                </span>
              </motion.div>
            )}

            {/* Central Badge Container */}
            <div className="relative w-64 h-64 flex items-center justify-center">
              
              {/* Glowing Ambient Background Ring behind badge */}
              <div className="absolute w-56 h-56 rounded-full bg-blue-200/30 blur-2xl animate-pulse"></div>

              {/* Segmented Loading Ring (Outer Ring) */}
              <motion.svg 
                viewBox="0 0 100 100" 
                className="absolute w-full h-full p-2 z-10 pointer-events-none"
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
              >
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563eb" />
                    <stop offset="50%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#67e8f9" />
                  </linearGradient>
                </defs>
                {/* Continuous ring segment with dasharray matching user image */}
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="url(#ringGradient)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeDasharray="180 50 10 20 10 20"
                />
              </motion.svg>

              {/* Glassmorphic Central Circle Badge */}
              <div className="w-48 h-48 rounded-full bg-white/95 border border-white/60 shadow-2xl backdrop-blur-xl relative overflow-hidden flex items-center justify-center">
                
                {/* Vector Clouds in Background */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* Left cloud */}
                  <motion.svg 
                    viewBox="0 0 100 60" 
                    className="absolute top-10 left-6 w-14 opacity-30 text-slate-300"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <path d="M20 50 C20 40, 30 30, 45 35 C50 25, 70 25, 75 35 C85 35, 90 42, 85 50 Z" fill="currentColor" />
                  </motion.svg>
                  {/* Right cloud */}
                  <motion.svg 
                    viewBox="0 0 100 60" 
                    className="absolute bottom-10 right-6 w-16 opacity-35 text-slate-300"
                    animate={{ x: [0, -3, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  >
                    <path d="M20 50 C20 40, 30 30, 45 35 C50 25, 70 25, 75 35 C85 35, 90 42, 85 50 Z" fill="currentColor" />
                  </motion.svg>
                </div>

                {/* Tiny Sparkles around badge interior */}
                <div className="absolute inset-0 pointer-events-none">
                  <motion.div 
                    className="absolute top-8 right-12 text-blue-300"
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </motion.div>
                  <motion.div 
                    className="absolute bottom-12 left-10 text-cyan-300"
                    animate={{ opacity: [0.1, 0.8, 0.1], scale: [0.7, 1.1, 0.7] }}
                    transition={{ duration: 2.4, repeat: Infinity, delay: 0.6 }}
                  >
                    <Sparkles className="w-3 h-3" />
                  </motion.div>
                </div>

                {/* Sleek Blue Airplane Logo with 3D shadow & Curving Flight Trail */}
                <motion.div
                  className="w-24 h-24 relative flex items-center justify-center"
                  animate={{
                    y: [0, -6, 0],
                    rotate: [-2, 2, -2]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_12px_16px_rgba(29,78,216,0.35)]">
                    {/* Sky blue flight trail curving from bottom-left to plane tail */}
                    <path 
                      d="M 15 85 C 30 75, 40 58, 48 48" 
                      fill="none" 
                      stroke="#93c5fd" 
                      strokeWidth="4" 
                      strokeLinecap="round" 
                    />
                    
                    {/* Sleek royal blue airplane in a modern semi-flat 3D design */}
                    {/* Angles up and to the right (-45deg default orientation) */}
                    <g transform="translate(50, 45) rotate(-45)">
                      {/* Left Wing Shadow */}
                      <path d="M 0 0 L -35 15 L -33 22 L 0 5 Z" fill="#1e3a8a" opacity="0.2" />
                      {/* Main Wings */}
                      <path d="M -35 15 L 35 15 L 0 -15 Z" fill="#2563eb" />
                      {/* Fuse Body */}
                      <path d="M 0 -35 C 3 -35, 5 -20, 5 35 C 5 39, -5 39, -5 35 C -5 -20, -3 -35, 0 -35 Z" fill="#1d4ed8" />
                      {/* Tail Fin Left / Right */}
                      <path d="M -12 30 L 12 30 L 0 20 Z" fill="#1e40af" />
                      {/* Nose Cone highlights */}
                      <path d="M 0 -35 C 2.5 -35, 4 -28, 0 -22 C -4 -28, -2.5 -35, 0 -35 Z" fill="#3b82f6" />
                    </g>
                  </svg>
                </motion.div>

              </div>
            </div>

            {/* Loading text and animated pulsing dots */}
            <div className="mt-8 text-center space-y-3">
              <span className="text-[11px] font-extrabold text-blue-900 tracking-[0.25em] uppercase block">
                Loading<span className="animate-pulse">...</span>
              </span>
              
              {/* Premium Pulsing Dots Row */}
              <div className="flex items-center justify-center gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2.5 h-2.5 rounded-full"
                    animate={{
                      scale: [1, 1.4, 1],
                      backgroundColor: ["#93c5fd", "#2563eb", "#93c5fd"],
                      boxShadow: [
                        "0 0 0 0 rgba(37, 99, 235, 0)",
                        "0 0 8px 2px rgba(37, 99, 235, 0.4)",
                        "0 0 0 0 rgba(37, 99, 235, 0)"
                      ]
                    }}
                    transition={{
                      delay: i * 0.15,
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
