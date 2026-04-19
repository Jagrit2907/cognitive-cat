import { useState, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const CAT_STATES = {
  happy: {
    emoji: "😺",
    glowColor: "251 191 36",
    bgFrom: "#1c1107",
    bgTo: "#3b2108",
  },
  idle: {
    emoji: "🙀",
    glowColor: "148 163 184",
    bgFrom: "#080d14",
    bgTo: "#111827",
  },
  crying: {
    emoji: "😿",
    glowColor: "99 102 241",
    bgFrom: "#060614",
    bgTo: "#0f0e2e",
  },
};

// Throttle function
function throttle(fn, ms) {
  let lastAt = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastAt >= ms) {
      lastAt = now;
      fn(...args);
    }
  };
}

const emojiVariants = {
  enter: { scale: 0.4, opacity: 0, y: 20 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 20 },
  },
  exit: { scale: 0.4, opacity: 0, y: -20 },
};

export default function CognitiveCat() {
  const [state, setState] = useState("happy");
  const prefersReduced = useReducedMotion();
  const current = CAT_STATES[state] || CAT_STATES.idle;

  // 🔁 Fetch state from backend
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:8000/state");
        const data = await res.json();
        if (data.state && CAT_STATES[data.state]) {
          setState(data.state);
        }
      } catch { }
    }, 1000);

    return () => clearInterval(id);
  }, []);

  // 📡 Send activity to backend
  useEffect(() => {
    const post = throttle(() => {
      fetch("http://localhost:8000/activity", { method: "POST" });
    }, 500);

    const events = ["mousemove", "keydown", "scroll", "click"];
    events.forEach(e => window.addEventListener(e, post));

    return () => {
      events.forEach(e => window.removeEventListener(e, post));
    };
  }, []);

  const idleAnimation = prefersReduced
    ? {}
    : { scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] };

  const glow = current.glowColor;

  const containerStyle = {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: `radial-gradient(circle, ${current.bgTo}, ${current.bgFrom})`,
  };

  const emojiStyle = {
    fontSize: "10rem",
    filter: `drop-shadow(0 0 20px rgba(${glow} / 0.6))`,
  };

  return (
    <div style={containerStyle}>
      <AnimatePresence mode="wait">
        <motion.span
          key={state}
          variants={emojiVariants}
          initial="enter"
          animate="visible"
          exit="exit"
          style={emojiStyle}
        >
          <motion.span
            animate={idleAnimation}
            transition={{ duration: 3, repeat: Infinity }}
          >
            {current.emoji}
          </motion.span>
        </motion.span>
      </AnimatePresence>
    </div>
  );
}