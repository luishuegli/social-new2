/*
 * USAGE GUIDELINES for LiquidGlass Component:
 *
 * 1.  **Best Use Cases:** This effect is intended for primary container elements like modals, sidebars, media players, and control panels. It provides a visual layer for focused content.
 *
 * 2.  **Avoid Overuse:** Do not use this for small, interactive elements like individual buttons or text inputs. Its power comes from its use on larger surfaces.
 *
 * 3.  **Background Dependency:** The effect is most powerful when placed over a colorful, detailed, or textured background. It will have little to no effect on a solid, plain background.
 *
 * 4.  **Stacking:** Avoid stacking multiple Liquid Glass elements directly on top of each other, as this can dilute the effect and create visual noise.
 */

import React from 'react';

/**
 * A container component that applies the "Liquid Glass" effect.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The content to be rendered inside the glass container.
 * @param {string} [props.className] - Additional classes to be applied to the container.
 */
const LiquidGlass = ({ children, className = '' }) => {
  return (
    <div className={`liquid-glass ${className}`}>
      {children}
    </div>
  );
};

export default LiquidGlass; 