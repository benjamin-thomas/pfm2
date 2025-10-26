/// <reference types="vite/client" />

// TypeScript ambient module declarations for CSS Modules
//
// This file teaches TypeScript how to handle CSS Module imports.
// Without this, TypeScript throws "Cannot find module '*.module.css'" errors.
//
// How CSS Modules work:
// 1. You write: import styles from './Component.module.css'
// 2. Vite transforms CSS classes into scoped names (e.g., .button → .Component_button_a1b2c3)
// 3. Vite returns a JS object mapping original class names to scoped names:
//    { button: "Component_button_a1b2c3", title: "Component_title_d4e5f6" }
// 4. You use it: <div className={styles.button}>
//
// The declaration below tells TypeScript:
// "When you import a *.module.css file, treat it as a default export
//  that is an object with string keys and string values"

declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { [key: string]: string };
  export default classes;
}
