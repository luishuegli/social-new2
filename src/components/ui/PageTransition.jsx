// src/components/ui/PageTransition.jsx
"use client";

import { motion } from 'framer-motion';

const pageVariants = {
  initial: {
    opacity: 0,
    x: '5%', // Start slightly to the right
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: '-5%', // Exit slightly to the left
  },
};

const pageTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 40,
};

export default function PageTransition({ children }) {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {children}
    </motion.div>
  );
} 