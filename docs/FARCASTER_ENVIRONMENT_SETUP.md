# Configuración de Variables de Entorno para Farcaster

## Variables Requeridas

Para que las funcionalidades de Farcaster funcionen correctamente, necesitas configurar las siguientes variables de entorno:

### `.env.local`

```bash
# API Configuration
API_ELEI=https://api.tuneport.xyz

# Privy Configuration (Opcional - solo si usas Privy para otras funciones)
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Farcaster Configuration - NUEVAS VARIABLES REQUERIDAS
NEYNAR_API_KEY=your_neynar_api_key_here

# OPCIONAL: Para desarrollo/hackathon - método fallback
FARCASTER_SIGNER_UUID=your_farcaster_signer_uuid_here

# Optional: For development
NEXT_PUBLIC_APP_ENV=development
```

## Instalación del SDK de Farcaster Mini Apps

Instala el SDK oficial de Farcaster Mini Apps:

```bash
npm install @farcaster/miniapp-sdk
```

## Cómo Obtener las Claves

### 1. Neynar API Key (OBLIGATORIO)

1. Ve a [Neynar Developer Dashboard](https://neynar.com/)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Obtén tu API Key desde el dashboard
5. Copia la clave y agrégala como `NEYNAR_API_KEY`

### 2. Configuración del Farcaster Provider

Actualiza tu `FarcasterProvider` para usar el SDK oficial:

```typescript
// src/components/FarcasterProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface FarcasterContextType {
  isSDKLoaded: boolean;
  context: any;
}

const FarcasterContext = createContext<FarcasterContextType>({
  isSDKLoaded: false,
  context: null,
});

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [context, setContext] = useState(null);

  useEffect(() => {
    // Cargar SDK de Farcaster Mini Apps
    const loadSDK = async () => {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");

        // Inicializar SDK
        await sdk.init();

        // Obtener contexto de la mini app
        const appContext = await sdk.context();

        setContext(appContext);
        setIsSDKLoaded(true);

        console.log("Farcaster SDK loaded successfully:", appContext);
      } catch (error) {
        console.error("Error loading Farcaster SDK:", error);
        setIsSDKLoaded(false);
      }
    };

    loadSDK();
  }, []);

  return (
    <FarcasterContext.Provider value={{ isSDKLoaded, context }}>
      {children}
    </FarcasterContext.Provider>
  );
}

export function useFarcasterMiniApp() {
  return useContext(FarcasterContext);
}
```

### 3. Método de Autenticación Recomendado

El SDK de Farcaster Mini Apps usa **Quick Auth** automáticamente. No necesitas configurar signers manualmente:

```typescript
// En tu componente
import { useFarcasterMiniApp } from "@Src/components/FarcasterProvider";

const { isSDKLoaded, context } = useFarcasterMiniApp();

// El contexto incluye información del usuario automáticamente
const userInfo = context?.user;
```

### 4. Método Fallback para Desarrollo/Hackathon

Si necesitas un método fallback para desarrollo rápido:

1. Ve a [Farcaster Developer Tools](https://warpcast.com/~/developers)
2. Crea un signer para tu aplicación
3. Obtén el UUID del signer
4. Úsalo como `FARCASTER_SIGNER_UUID` (solo para desarrollo)

## Funcionalidades Implementadas

- **Quick Auth**: Autenticación automática con el SDK oficial
- **ShareToFarcaster**: Crear casts desde la mini app con método fallback
- **CastContext**: Leer información de casts existentes
- **APIs de Farcaster**: Integración completa con Neynar

## Flujo de Autenticación

1. **Método Principal**: Quick Auth del SDK de Farcaster

   - Se obtiene automáticamente cuando la mini app se abre desde Farcaster
   - No requiere configuración manual

2. **Método Fallback**: Signer UUID estático
   - Se usa cuando Quick Auth no está disponible
   - Útil para desarrollo y testing

## Seguridad

⚠️ **IMPORTANTE**:

- Nunca expongas las API keys en el frontend
- El NEYNAR_API_KEY debe mantenerse privado en el servidor
- El SDK de Farcaster maneja la autenticación de forma segura
- FARCASTER_SIGNER_UUID es solo para desarrollo

## Testing en Hackathon

Para probar rápidamente en una hackathon:

1. Configura `NEYNAR_API_KEY` (obligatorio)
2. Opcionalmente configura `FARCASTER_SIGNER_UUID` para método fallback
3. Abre tu mini app desde Warpcast para probar Quick Auth
4. O usa el método fallback para desarrollo local

## Troubleshooting

### Error: "NEYNAR_API_KEY not configured"

- Verifica que la variable esté en tu `.env.local`
- Reinicia el servidor de desarrollo después de agregar la variable

### Error: "SDK no disponible"

- Asegúrate de haber instalado `@farcaster/miniapp-sdk`
- Verifica que el FarcasterProvider esté configurado correctamente
- Abre la mini app desde Warpcast para contexto completo

### Error: "Farcaster not available"

- La mini app debe abrirse desde Warpcast para funcionalidad completa
- En desarrollo local, se usará el método fallback automáticamente

### Error durante desarrollo local

- Configura `FARCASTER_SIGNER_UUID` para método fallback
- O usa un simulador de contexto de Farcaster para desarrollo
