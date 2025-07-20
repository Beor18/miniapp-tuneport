# Configuración de Variables de Entorno para Farcaster

## Variables Requeridas

Para que las funcionalidades de Farcaster funcionen correctamente, necesitas configurar las siguientes variables de entorno:

### `.env.local`

```bash
# API Configuration
API_ELEI=https://api.tuneport.xyz

# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id

# Farcaster Configuration - NUEVAS VARIABLES REQUERIDAS
NEYNAR_API_KEY=your_neynar_api_key_here
FARCASTER_SIGNER_UUID=your_farcaster_signer_uuid_here

# Optional: For development
NEXT_PUBLIC_APP_ENV=development
```

## Cómo Obtener las Claves

### 1. Neynar API Key

1. Ve a [Neynar Developer Dashboard](https://neynar.com/)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Obtén tu API Key desde el dashboard
5. Copia la clave y agrégala como `NEYNAR_API_KEY`

### 2. Farcaster Signer UUID

El Signer UUID se obtiene cuando un usuario autoriza tu aplicación para crear casts en su nombre. Hay dos formas de implementar esto:

#### Opción A: Usar Farcaster Mini App SDK (Recomendado)

```typescript
// En tu componente
import { useFarcasterMiniApp } from "@Src/components/FarcasterProvider";

const { context } = useFarcasterMiniApp();

// El signer UUID estará disponible en el contexto
const signerUuid = context?.user?.signerUuid;
```

#### Opción B: Configurar manualmente para desarrollo

1. Ve a [Farcaster Developer Tools](https://warpcast.com/~/developers)
2. Crea un signer para tu aplicación
3. Obtén el UUID del signer
4. Úsalo como `FARCASTER_SIGNER_UUID` (solo para desarrollo)

## Funcionalidades que requieren estas variables

- **ShareToFarcaster**: Crear casts desde la mini app
- **CastContext**: Leer información de casts existentes
- **APIs de Farcaster**: Todas las integraciones sociales

## Seguridad

⚠️ **IMPORTANTE**:

- Nunca expongas las API keys en el frontend
- Usa `NEXT_PUBLIC_` solo para variables que pueden ser públicas
- Las claves de Neynar y Signer UUID deben mantenerse privadas en el servidor

## Testing

Para probar las funcionalidades sin configurar todas las APIs:

1. Configura solo `NEYNAR_API_KEY`
2. Las funcionalidades de lectura funcionarán
3. Para crear casts, necesitarás también `FARCASTER_SIGNER_UUID`

## Troubleshooting

### Error: "NEYNAR_API_KEY not configured"

- Verifica que la variable esté en tu `.env.local`
- Reinicia el servidor de desarrollo después de agregar la variable

### Error: "Signer UUID no configurado"

- Asegúrate de que `FARCASTER_SIGNER_UUID` esté configurado
- O implementa la obtención dinámica desde el contexto de usuario

### Error: "Token de autenticación requerido"

- El usuario debe estar autenticado con Farcaster
- Verifica que la integración de Privy con Farcaster esté funcionando
