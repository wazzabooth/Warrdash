// ViewportScale.jsx
// Scales the entire dashboard to fit the viewport, maintaining proportions
// like a TV/kiosk display. Toggle in Dashboard Settings → Style.
import { useEffect } from 'react';
import { useConfig } from './App.jsx';

export default function ViewportScale() {
  const { config } = useConfig();
  const appearance = config?.appearance || {};
  const enabled = appearance.viewportScale === true || appearance.viewportScale === 'true';
  const targetWidth = parseInt(appearance.scaleTargetWidth || '1920');

  useEffect(() => {
    const styleId = 'warrdash-viewport-scale';
    const existing = document.getElementById(styleId);
    if (existing) existing.remove();

    if (!enabled) {
      // Remove any inline scaling
      const root = document.getElementById('root');
      if (root) {
        root.style.transform = '';
        root.style.transformOrigin = '';
        root.style.width = '';
        root.style.minHeight = '';
        root.style.position = '';
      }
      document.body.style.overflow = '';
      return;
    }

    const apply = () => {
      const scale = Math.min(window.innerWidth / targetWidth, 1); // never scale UP
      const root = document.getElementById('root');
      if (!root) return;

      if (scale >= 1) {
        // At or above target width — no scaling needed
        root.style.transform = '';
        root.style.transformOrigin = '';
        root.style.width = '';
        root.style.minHeight = '';
        root.style.position = '';
        document.body.style.overflow = '';
        document.body.style.height = '';
      } else {
        // Scale down to fit
        const inverseScale = 1 / scale;
        root.style.transform = `scale(${scale})`;
        root.style.transformOrigin = 'top left';
        root.style.width = `${targetWidth}px`;
        root.style.minHeight = `${window.innerHeight * inverseScale}px`;
        root.style.position = 'absolute';
        root.style.top = '0';
        root.style.left = '0';
        document.body.style.overflow = 'hidden';
        document.body.style.height = `${window.innerHeight}px`;
      }
    };

    apply();
    window.addEventListener('resize', apply);
    return () => {
      window.removeEventListener('resize', apply);
      // Clean up on unmount
      const root = document.getElementById('root');
      if (root) {
        root.style.transform = '';
        root.style.transformOrigin = '';
        root.style.width = '';
        root.style.minHeight = '';
        root.style.position = '';
      }
      document.body.style.overflow = '';
      document.body.style.height = '';
    };
  }, [enabled, targetWidth]);

  return null;
}
