# Guía para migrar de Reown AppKit a Privy

Este documento detalla el proceso de migración de Reown AppKit a Privy manteniendo compatibilidad de APIs para evitar cambios disruptivos en el código.

## 1. Instalación de dependencias

```sh
npm i @privy-io/react-auth @tanstack/react-query --legacy-peer-deps
```

## 2. Estructura de archivos

Hemos creado los siguientes archivos para facilitar la migración:

- `src/lib/privy/networks.ts` - Define las redes compatibles con Privy
- `src/lib/privy/hooks/usePrivyAccount.tsx` - Reemplazo para useAppKitAccount
- `src/lib/privy/hooks/usePrivyProvider.tsx` - Reemplazo para useAppKitProvider
- `src/lib/privy/hooks/usePrivyConnection.tsx` - Reemplazo para useAppKitConnection
- `src/lib/privy/index.ts` - Exporta todos los hooks y utilidades

## 3. Actualizar importaciones

Reemplazar todas las importaciones de Reown con importaciones del adaptador Privy:

```typescript
// De:
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";
import {
  useAppKitConnection,
  type Provider,
} from "@reown/appkit-adapter-solana/react";

// A:
import {
  useAppKitAccount,
  useAppKitProvider,
  useAppKitConnection,
} from "@Src/lib/privy";
import { type Provider } from "@Src/lib/privy/hooks/usePrivyProvider";
```

## 4. Configuración de `src/lib/config.ts`

El archivo de configuración ha sido modificado para usar Privy:

- Se agregó `privyAppId` que utiliza el mismo projectId existente
- Se agregó `solanaClusters` para la configuración de Solana en Privy
- Se modificaron `solanaWeb3JsAdapter` y `wagmiAdapter` para mantener compatibilidad

## 5. Configuración del Provider

En `src/app/providers.tsx`, hemos reemplazado la configuración de Reown AppKit con PrivyProvider:

```typescript
<PrivyProvider
  appId={privyAppId}
  config={{
    appearance: {
      theme: "light",
      accentColor: "#6701e6",
      logo: metadata.icons[0],
    },
    loginMethods: {
      email: false,
      google: true,
      twitter: true,
      discord: false,
      apple: false,
      github: false,
      facebook: false,
      farcaster: false,
    },
    embeddedWallets: {
      createOnLogin: "all",
      noPromptOnSignature: false,
    },
    defaultChain: {
      id: solanaDevnet.id,
      name: solanaDevnet.name,
    },
    supportedChains: networks
      .filter((network: any) => network.chainType === "evm")
      .map((network: any) => ({
        id: network.id,
        name: network.name,
      })),
    solanaClusters: solanaClusters,
  }}
>
  <QueryClientProvider client={queryClient}>
    <WagmiProvider config={wagmiAdapter.wagmiConfig as Config}>
      <AppWalletProvider>{children}</AppWalletProvider>
    </WagmiProvider>
  </QueryClientProvider>
</PrivyProvider>
```

## 6. Componente WalletConnector

El componente `WalletConnector` ha sido actualizado para usar Privy:

- Ahora usa nuestros hooks de compatibilidad
- Importa `usePrivy` directamente para funciones como login/logout
- Usa las APIs de Privy para las interacciones con la wallet

## 7. Modificar hooks específicos

Los hooks que interactúan con Solana han sido adaptados para usar Privy:

- `useHydraWallet.tsx` - Actualizado para usar nuestros hooks de compatibilidad
- `useCandyMachineMint.tsx` - Actualizado para usar nuestros hooks de compatibilidad

## 8. Verificar problemas específicos

Si encuentras problemas con hooks complejos como `useCandyMachineMint.tsx`, es posible que necesites ajustes adicionales debido a las diferencias entre Reown y Privy en cómo manejan:

- Firmas de transacciones
- Interacción con contratos
- Gestión de errores

## 9. Probar la aplicación

Prueba exhaustivamente todas las funcionalidades principales:

- Login/Logout
- Conexión de wallets
- Transacciones de Solana
- Creación de wallets
- Verificación de propiedad de NFTs
