import { motion } from 'framer-motion';
import { Globe2 } from 'lucide-react';

export function LoadingAnimation() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center w-full max-w-xl mx-auto">
      <motion.div
        animate={{
          scale: [1, 1.08, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 3.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        className="mb-6 text-blue-500"
      >
        <div className="relative">
          <div className="absolute inset-0 rounded-full blur-2xl bg-blue-200/40 scale-150" />
          <Globe2 size={64} strokeWidth={1.5} className="relative" />
        </div>
      </motion.div>

      <h2 className="text-2xl font-semibold text-slate-900 mb-3">
        Gathering travel intelligence
      </h2>

      <p className="text-slate-500 text-base leading-7 max-w-md mb-6">
        Preparing destination insights, culture highlights, attractions,
        and travel tips for your search.
      </p>

      <div className="w-full max-w-sm h-2 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500 rounded-full"
          animate={{ x: ['-100%', '100%'] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ width: '40%' }}
        />
      </div>

      <p className="text-sm text-slate-400 mt-4">
        This may take a few seconds
      </p>
    </div>
  );
}