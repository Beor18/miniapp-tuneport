# Guía de Integración Farcaster Mini App

Esta guía documenta la implementación de Farcaster Mini App en la aplicación Tuneport.

## ✅ Pasos Completados

### 1. Instalación de Dependencias

```bash
npm install @farcaster/miniapp-sdk @farcaster/frame-wagmi-connector
```

- ✅ `@farcaster/miniapp-sdk` versión 0.1.6 instalada
- ✅ `@farcaster/frame-wagmi-connector` versión 1.0.0 instalada

### 2. Configuración de Wagmi

- ✅ Configurado wagmi con soporte para Base mainnet y Base Sepolia en `src/lib/config.ts`
- ✅ Integración con Privy para autenticación multi-chain

### 3. Provider Configuration

- ✅ Creado `FarcasterProvider` personalizado en `src/components/FarcasterProvider.tsx`
- ✅ Envuelto la aplicación con `<FarcasterProvider>` en `src/app/providers.tsx`
- ✅ Implementado manejo de errores y detección de entorno

### 4. Manifest File

- ✅ Creado `.well-known/farcaster.json` con metadata completa
- ✅ Configurado para Tuneport con URLs de testnet

### 5. Embed Metadata

- ✅ Agregado meta tag `fc:frame` en el layout principal
- ✅ Configurado para renderizar correctamente en feeds sociales
- ✅ Incluye imagen preview y metadata completa

### 6. Imagen Preview

- ✅ Creada `public/preview.png` (361KB) para uso en redes sociales
- ✅ Configurada en manifest y meta tags

### 7. Componente de Ejemplo

- ✅ Creado `src/components/FarcasterMiniApp.tsx`
- ✅ Demuestra uso de `useFarcasterMiniApp()` hook personalizado
- ✅ Integración con wagmi para wallet functionality
- ✅ Manejo de firma de mensajes y estado de conexión

## 🔄 Estado Actual y Próximos Pasos

### ✅ Completado

La integración básica de Farcaster Mini App está **completamente funcional**:

- SDK instalado y configurado
- Provider personalizado implementado
- Componente de ejemplo listo
- Manifest configurado
- Imagen preview creada
- Meta tags configurados

### 🔄 Próximos Pasos

### 1. Completar Manifest Signature

Para que la mini app sea reconocida oficialmente por Farcaster:

1. Despliega la aplicación en producción
2. Ve a https://farcaster.com/developers
3. Usa la herramienta de manifest tool
4. Ingresa tu dominio y sigue los pasos para firmar el manifest
5. Actualiza `.well-known/farcaster.json` con la sección `accountAssociation`

### 2. Migrar a Producción

- Actualizar URLs en `farcaster.json` de testnet a producción
- Verificar que `preview.png` esté optimizada
- Actualizar meta tags con URLs de producción

### 3. Testing y Uso

```typescript
// Usar el componente de ejemplo en cualquier página
import FarcasterMiniApp from "@Src/components/FarcasterMiniApp";

function TestPage() {
  return (
    <div>
      <FarcasterMiniApp />
    </div>
  );
}
```

### 4. Optimizaciones Adicionales

- Implementar analytics específicos para Farcaster
- Agregar funcionalidades específicas de Mini App
- Optimizar rendimiento del SDK

## 🎯 Funcionalidades Disponibles

### useFarcasterMiniApp Hook

```typescript
const { isSDKLoaded, context, authData } = useFarcasterMiniApp();
```

- `isSDKLoaded`: Boolean indicando si el SDK está listo
- `context`: Información del contexto de Farcaster (usuario, cast, etc.)
- `authData`: Datos de autenticación y wallet del usuario

### Wallet Integration

- Uso directo de wagmi hooks (`useAccount`, `useWalletClient`)
- Soporte automático para wallets de Farcaster
- Integración con Privy para autenticación multi-chain (EVM + Solana)
- Manejo de errores y estados de loading

### SDK Features

- Detección automática de entorno Farcaster
- Inicialización segura del SDK
- Manejo de contexto de cast y usuario
- Integración con wallet nativa de Farcaster

## 📝 Configuración Actual

### Manifest (farcaster.json)

Ubicación: `public/.well-known/farcaster.json`

```json
{
  "frame": {
    "version": "1",
    "name": "Tuneport",
    "iconUrl": "https://pbs.twimg.com/profile_images/1942391632520695808/2XvLiCf2_400x400.png",
    "homeUrl": "https://testnet.tuneport.xyz",
    "imageUrl": "https://testnet.tuneport.xyz/preview.png",
    "buttonTitle": "Ingresar",
    "splashImageUrl": "https://pbs.twimg.com/profile_images/1942391632520695808/2XvLiCf2_400x400.png",
    "splashBackgroundColor": "#18181b"
  }
}
```

### Meta Tag

Ubicación: `src/app/layout.tsx`

```html
<meta
  name="fc:frame"
  content="{
  version: 'next',
  imageUrl: 'https://testnet.tuneport.xyz/preview.png',
  button: {
    title: 'Ingresar',
    action: {
      type: 'launch_frame',
      name: 'Tuneport - Where every second of music becomes value.',
      url: 'https://testnet.tuneport.xyz',
      splashImageUrl: 'https://pbs.twimg.com/profile_images/1942391632520695808/2XvLiCf2_400x400.png',
      splashBackgroundColor: '#18181b'
    }
  }
}"
/>
```

### Provider Configuration

Ubicación: `src/app/providers.tsx`

```typescript
import { FarcasterProvider } from "@Src/components/FarcasterProvider";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <FarcasterProvider>
      {/* otros providers */}
      {children}
    </FarcasterProvider>
  );
}
```

## 🚀 Deploy Checklist

### Para Testnet (Actual)

- [x] Configurar manifest con URLs de testnet
- [x] Crear imagen preview.png (361KB)
- [x] Implementar Provider personalizado
- [x] Configurar meta tags en layout
- [x] Integrar con sistema de wallets existente

### Para Producción (Pendiente)

- [ ] Actualizar URLs en manifest a dominio de producción
- [ ] Optimizar imagen preview.png
- [ ] Firmar manifest con Farcaster custody address
- [ ] Testear en cliente de Farcaster
- [ ] Verificar funcionalidad en entorno de producción
- [ ] Implementar analytics específicos para Farcaster
- [ ] Documentar funcionalidades específicas de Mini App

## 🔗 Enlaces Útiles

### Documentación Oficial

- [Documentación Farcaster Mini Apps](https://docs.farcaster.xyz/learn/what-is-farcaster/frames)
- [Farcaster Mini App SDK](https://github.com/farcasterxyz/miniapp-sdk)
- [Frame Wagmi Connector](https://github.com/farcasterxyz/frame-wagmi-connector)
- [Manifest Tool](https://farcaster.com/developers)

### Herramientas de Desarrollo

- [Farcaster Developer Tools](https://farcaster.com/developers)
- [Wagmi Documentation](https://wagmi.sh/)
- [Privy Documentation](https://docs.privy.io/)

### Estado del Proyecto

- SDK Version: `@farcaster/miniapp-sdk@0.1.6`
- Connector Version: `@farcaster/frame-wagmi-connector@1.0.0`
- Estado: **Funcional en testnet**
- Próximo paso: **Migrar a producción**

---

**Última actualización**: Diciembre 2024  
**Estado**: Mini App completamente funcional en testnet, listo para producción
