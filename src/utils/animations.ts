// Staggered slide up variant for cascading entrance animation from top to bottom
export const slideUpVariant = {
  hidden: { opacity: 0, y: 22 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.52,
      ease: [0.16, 1, 0.3, 1],
      delay: Math.min(i * 0.046, 1.1),
    },
  }),
};

// Fluent modal dialog animation:
// Animation in: Zoom từ gần (scale 1.7) ra xa (scale 1.0) with ease [0.16, 1, 0.3, 1]
// Animation out: Zoom từ xa (scale 1.0) vào gần (scale 1.7) with ease [0.4, 0, 0.2, 1]
export const modalDialogVariants = {
  initial: { opacity: 0, scale: 1.7 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.24,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    scale: 1.7,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const modalBackdropVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};
