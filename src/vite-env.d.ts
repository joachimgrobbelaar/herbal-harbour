/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'gsap' {
  const gsap: any;
  export default gsap;
}

declare module 'gsap/ScrollTrigger' {
  export const ScrollTrigger: any;
  const plugin: any;
  export default plugin;
}

declare module 'lenis' {
  export default class Lenis {
    constructor(options?: any);
    on(event: string, callback: any): void;
    raf(time: number): void;
    destroy(): void;
  }
}
