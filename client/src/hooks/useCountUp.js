import { useState, useEffect } from 'react';

const useCountUp = (target, duration = 800) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (target === null || target === undefined) return;
    const str = String(target);
    const numeric = parseFloat(str.replace(/[^0-9.]/g, ''));
    if (isNaN(numeric) || numeric === 0) { setCount(target); return; }

    const suffix = str.replace(/[0-9.]/g, '');
    const isDecimal = str.includes('.');
    let current = 0;
    const increment = numeric / (duration / 16);

    const timer = setInterval(() => {
      current += increment;
      if (current >= numeric) {
        setCount(target);
        clearInterval(timer);
      } else {
        const val = isDecimal
          ? current.toFixed(1) + suffix
          : Math.floor(current) + suffix;
        setCount(val);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [target, duration]);

  return count;
};

export default useCountUp;
