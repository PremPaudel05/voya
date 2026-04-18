import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import React from 'react';

type PresetType = 'blur' | 'shake' | 'scale' | 'fade' | 'slide';

type VariantDef = Record<string, Record<string, unknown>>;

type TextEffectProps = {
  children: string;
  per?: 'word' | 'char' | 'line';
  as?: keyof React.JSX.IntrinsicElements;
  variants?: { container?: Variants; item?: Variants };
  className?: string;
  preset?: PresetType;
  delay?: number;
  trigger?: boolean;
  onAnimationComplete?: () => void;
  segmentWrapperClassName?: string;
};

const defaultStaggerTimes: Record<'char' | 'word' | 'line', number> = {
  char: 0.03,
  word: 0.05,
  line: 0.1,
};

const defaultContainer: VariantDef = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } } as Record<string, unknown>,
  exit: { transition: { staggerChildren: 0.05, staggerDirection: -1 } } as Record<string, unknown>,
};

const defaultItem: VariantDef = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const presetVariants: Record<PresetType, { container: VariantDef; item: VariantDef }> = {
  blur: {
    container: defaultContainer,
    item: {
      hidden: { opacity: 0, filter: 'blur(12px)' },
      visible: { opacity: 1, filter: 'blur(0px)' },
      exit: { opacity: 0, filter: 'blur(12px)' },
    },
  },
  shake: {
    container: defaultContainer,
    item: {
      hidden: { x: 0 },
      visible: { x: [-5, 5, -5, 5, 0], transition: { duration: 0.5 } } as Record<string, unknown>,
      exit: { x: 0 },
    },
  },
  scale: {
    container: defaultContainer,
    item: {
      hidden: { opacity: 0, scale: 0 },
      visible: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 0 },
    },
  },
  fade: {
    container: defaultContainer,
    item: {
      hidden: { opacity: 0 },
      visible: { opacity: 1 },
      exit: { opacity: 0 },
    },
  },
  slide: {
    container: defaultContainer,
    item: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: 20 },
    },
  },
};

const AnimationComponent: React.FC<{
  segment: string;
  variants: VariantDef;
  per: 'line' | 'word' | 'char';
  segmentWrapperClassName?: string;
}> = React.memo(({ segment, variants, per, segmentWrapperClassName }) => {
  const content =
    per === 'line' ? (
      <motion.span variants={variants} className="block">
        {segment}
      </motion.span>
    ) : per === 'word' ? (
      <motion.span aria-hidden="true" variants={variants} className="inline-block whitespace-pre">
        {segment}
      </motion.span>
    ) : (
      <motion.span className="inline-block whitespace-pre">
        {segment.split('').map((char, i) => (
          <motion.span key={i} aria-hidden="true" variants={variants} className="inline-block whitespace-pre">
            {char}
          </motion.span>
        ))}
      </motion.span>
    );

  if (!segmentWrapperClassName) return content;
  return (
    <span className={cn(per === 'line' ? 'block' : 'inline-block', segmentWrapperClassName)}>
      {content}
    </span>
  );
});

AnimationComponent.displayName = 'AnimationComponent';

export function TextEffect({
  children,
  per = 'word',
  as = 'p',
  variants,
  className,
  preset,
  delay = 0,
  trigger = true,
  onAnimationComplete,
  segmentWrapperClassName,
}: TextEffectProps) {
  const segments =
    per === 'line'
      ? children.split('\n')
      : per === 'word'
      ? children.split(/(\s+)/)
      : children.split('');

  const MotionTag = motion[as as keyof typeof motion] as typeof motion.div;
  const selected = preset ? presetVariants[preset] : { container: defaultContainer, item: defaultItem };
  const containerBase = (variants?.container ?? selected.container) as VariantDef;
  const itemVariants = (variants?.item ?? selected.item) as VariantDef;
  const stagger = defaultStaggerTimes[per];

  const visibleTransition = (containerBase.visible as { transition?: Record<string, unknown> })?.transition ?? {};
  const delayedContainer: VariantDef = {
    hidden: containerBase.hidden,
    visible: {
      ...(containerBase.visible as Record<string, unknown>),
      transition: {
        ...visibleTransition,
        staggerChildren: (visibleTransition.staggerChildren as number | undefined) ?? stagger,
        delayChildren: delay,
      },
    },
    exit: containerBase.exit,
  };

  return (
    <AnimatePresence mode="popLayout">
      {trigger && (
        <MotionTag
          initial="hidden"
          animate="visible"
          exit="exit"
          aria-label={per === 'line' ? undefined : children}
          variants={delayedContainer}
          className={cn('whitespace-pre-wrap', className)}
          onAnimationComplete={onAnimationComplete}
        >
          {segments.map((segment, index) => (
            <AnimationComponent
              key={`${per}-${index}-${segment}`}
              segment={segment}
              variants={itemVariants}
              per={per}
              segmentWrapperClassName={segmentWrapperClassName}
            />
          ))}
        </MotionTag>
      )}
    </AnimatePresence>
  );
}
