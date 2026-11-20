import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+<>/';
const FRAME_MS = 45; // how often the scrambled characters change

/**
 * Text that "decrypts" when it scrolls into view, and again on hover: characters
 * cycle through random glyphs and lock in from left to right, like the intro's
 * decoding greeting. Use it with a monospace font so the width never changes.
 *
 * Screen readers get the real text through aria-label; with reduced motion the
 * text is simply shown.
 */
const DecodeText = ({ as = 'span', text, className, duration = 900 }) => {
  const Tag = as;
  const textRef = useRef(null);

  useEffect(() => {
    const node = textRef.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    const show = (value) => {
      if (node.firstChild) node.firstChild.nodeValue = value; // keep React's text node
      else node.textContent = value;
    };

    let raf = 0;
    const decode = () => {
      cancelAnimationFrame(raf);
      const start = performance.now();
      let lastFrame = -Infinity;
      const tick = (now) => {
        const elapsed = now - start;
        if (elapsed >= duration) {
          show(text);
          return;
        }
        if (elapsed - lastFrame >= FRAME_MS) {
          lastFrame = elapsed;
          let out = '';
          for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            // the first quarter is pure noise, then characters lock in left to right
            const lockAt = duration * (0.25 + 0.75 * (i / text.length));
            out += elapsed >= lockAt || ch === ' ' || ch === '_'
              ? ch
              : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
          }
          show(out);
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        decode();
        observer.disconnect();
      }
    }, { threshold: 0.6 });
    observer.observe(node);
    node.addEventListener('pointerenter', decode);

    return () => {
      observer.disconnect();
      node.removeEventListener('pointerenter', decode);
      cancelAnimationFrame(raf);
      show(text);
    };
  }, [text, duration]);

  return (
    <Tag className={className} aria-label={text}>
      <span ref={textRef} aria-hidden="true">{text}</span>
    </Tag>
  );
};

DecodeText.propTypes = {
  as: PropTypes.elementType,
  text: PropTypes.string.isRequired,
  className: PropTypes.string,
  duration: PropTypes.number,
};

export default DecodeText;
