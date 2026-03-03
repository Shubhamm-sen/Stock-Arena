/// <reference types="vite/client" />
<<<<<<< HEAD

interface ImportMetaEnv {
    readonly VITE_API_URL: string
    readonly VITE_WS_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
=======
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
>>>>>>> d5b8bf2c8434404020954537c8d4c2476388e548
}
