import React from 'react';
import { motion } from 'framer-motion';

const X_URL = 'https://x.com/apexbankhq?s=21';

// Official X (Twitter) logo SVG
const XIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622Zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function XFloatingButton() {
  return (
    <div className="fixed bottom-20 left-4 lg:bottom-6 lg:left-6 z-50">
      <motion.a
        href={X_URL}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Follow Apex Bank on X"
        className="w-12 h-12 bg-black rounded-full shadow-lg flex items-center justify-center relative"
      >
        {/* Breathing glow on the X icon only */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ pointerEvents: 'none' }}
          animate={{
            boxShadow: [
              '0 0 0px 0px rgba(255,255,255,0)',
              '0 0 10px 3px rgba(255,255,255,0)',
            ],
          }}
        />
        <motion.div
          animate={{
            filter: [
              'drop-shadow(0 0 0px #C9A84C)',
              'drop-shadow(0 0 7px #C9A84C)',
              'drop-shadow(0 0 12px #d4a843)',
              'drop-shadow(0 0 7px #C9A84C)',
              'drop-shadow(0 0 0px #C9A84C)',
            ],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <XIcon className="w-5 h-5 text-primary" />
        </motion.div>
      </motion.a>
    </div>
  );
}