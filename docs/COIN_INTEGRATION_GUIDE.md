# 🪙 COIN-IFIED MUSIC: Zora SDK Integration Guide v3.0 - Tuneport

## 🎵 ¿Qué hemos creado?

Hemos integrado **Zora SDK v0.2.7** en TUNEPORT para crear automáticamente un **token tradeable** por cada álbum/canción que se sube a la plataforma. Esto convierte cada lanzamiento musical en una **micro-economía** donde fans pueden invertir, tradear y participar del éxito del artista.

## ✨ Features Implementadas

### 🔄 Creación Automática de Tokens

- **Cada álbum genera su propio token**: `$ALBUM_SYMBOL`
- **Sin costo adicional**: Se crea automáticamente durante el flujo normal
- **Integración transparente**: Los artistas no necesitan hacer nada extra
- **Powered by Zora**: Liquidez instantánea en el ecosistema Zora
- **Auto-detección de red**: Mainnet/Testnet automático basado en hostname

### 💰 Economía de Tokens

- **Early supporters**: Los primeros listeners/compradores obtienen mejores precios
- **Colaboradores automáticos**: Los % de collaboración se aplican al token también
- **Trading real en mainnet**: Usando la nueva API `tradeCoin` de Zora v0.2.7
- **Trading simulado en testnet**: Para testing y desarrollo
- **Revenue sharing**: Los artistas ganan de cada transacción

### 🎛️ UI/UX Integrado

- **TradingInterface renovado**: Interfaz profesional con configuraciones avanzadas
- **Detección automática de red**: Indicadores visuales de mainnet/testnet
- **Slippage personalizable**: Control fino sobre tolerancia de precio
- **Stats en tiempo real**: Precio, market cap, holders, volumen 24h
- **Permits automáticos**: Manejo seguro de aprobaciones sin transacciones extra

## 🏗️ Arquitectura Técnica

### Nuevos Hooks Creados

#### `useZoraCoinCreation.tsx` ✅ COMPLETADO

Hook principal para crear tokens automáticamente usando Zora SDK v0.2.7.

```typescript
interface ZoraCoinParams {
  albumName: string;
  albumSymbol: string;
  albumImageUrl: string;
  artistAddress: Address;
  collaborators?: Array<{
    address: string;
    mintPercentage: number;
    royaltyPercentage: number;
    name: string;
  }>;
}
```

**Funciones principales:**

- `createAutomaticCoin()`: Crea el token usando Zora SDK v0.2.7
- Auto-detección de red (mainnet/testnet)
- IPFS real para metadata
- Estados de loading y errores

#### `useZoraCoinTrading.tsx` ✅ COMPLETADO

Hook para manejar el trading de tokens usando la nueva API `tradeCoin`.

```typescript
interface CoinTradingData {
  coinAddress: string;
  currentPrice: string;
  totalSupply: string;
  marketCap: string;
  holders: number;
  volume24h: string;
}
```

**Funciones principales:**

- `getCoinData()`: Obtiene datos del token
- `buyCoin(address, amount, slippage)`: Compra tokens con slippage configurable
- `sellCoin(address, amount, slippage)`: Vende tokens con permits automáticos
- `tradeTokens()`: Trading entre diferentes ERC20 tokens
- `isMainnet`: Indica si está en red principal o testnet

**Características avanzadas:**

- **Trading real en mainnet**: Usa `tradeCoin` de Zora SDK v0.2.7
- **Trading simulado en testnet**: Para desarrollo y testing
- **Permits automáticos**: Manejo seguro de aprobaciones para tokens ERC20
- **Slippage protection**: Protección configurable contra cambios de precio
- **Network detection**: Automático basado en hostname del providers.tsx

### Componente de UI

#### `TradingInterface.tsx` ✅ COMPLETADO

Interfaz completa de trading renovada con la nueva API.

**Features avanzadas:**

- 🌐 **Indicador de red**: Visual claro de mainnet (verde) vs testnet (amarillo)
- ⚙️ **Configuración avanzada**: Slippage personalizable para buy/sell
- 🔒 **Trading seguro**: Validates transactions y permits automáticos
- 📊 **Stats en tiempo real**: Market cap, holders, volumen, precio
- 🎯 **UX contextual**: Mensajes diferentes para mainnet vs testnet
- 📱 **SSR-safe**: Funciona correctamente en Next.js

**Configuraciones de slippage:**

- Compras: 5% por defecto (configurable)
- Ventas: 15% por defecto (más alto para price impact)

### Integración en el Flujo Existente

#### Modificaciones en `useCreateERC1155Collection.tsx`

```typescript
// NUEVO: Después de crear la colección exitosamente
const coinAddress = await createAutomaticCoin({
  albumName: params.name,
  albumSymbol: params.symbol,
  albumImageUrl: imageUrl,
  artistAddress: evmAddress,
  collaborators: params.collaborators,
});

// Se guarda la dirección del token en la base de datos
{
  // ... datos existentes ...
  coin_address: coinAddress || undefined,
}
```

#### Actualización de Tipos

```typescript
// src/app/actions/submitBaseCollectionToServer.actions.ts
type BaseCollectionData = {
  // ... propiedades existentes ...
  coin_address?: string; // NUEVO: Dirección del token
};
```

#### UI Mejorada en `BaseAlbumNewForm.tsx`

- **Card informativa**: Explica la tokenización automática
- **Estados de loading**: Muestra progreso de creación de NFT + Token
- **Badges visuales**: Indica que el álbum tendrá su propio token

## 🚀 Flujo Completo

### 1. Artista crea álbum

```
Usuario llena formulario →
Sube imagen a IPFS →
Crea metadata →
Crea colección ERC1155 →
🆕 CREA TOKEN AUTOMÁTICAMENTE (v0.2.7) →
Guarda coin_address en base de datos
```

### 2. Token listo para trading

```
Token $ALBUM_SYMBOL creado →
Disponible en Zora (mainnet) / Simulado (testnet) →
Fans pueden comprar/vender con slippage protection →
Permits automáticos para seguridad →
Artista recibe fees →
Colaboradores reciben %
```

### 3. Fan experience

```
Ve álbum en TUNEPORT →
Ve TradingInterface con network indicator →
Puede configurar slippage y parámetros avanzados →
Trading real (mainnet) o simulado (testnet) →
Participa en el éxito del artista →
Puede vender tokens cuando suba el precio
```

## 💡 Casos de Uso Disruptivos

### 🎯 Early Listener Mining

Los primeros en escuchar obtienen tokens a mejor precio, creando incentivo para descubrir música nueva.

### 🤝 Colaboración Tokenizada

Los remixes y colaboraciones pueden incluir % automático del token original.

### 📈 Investment in Music

Los fans pueden "invertir" en artistas comprando sus tokens antes de que sean famosos.

### 🎁 Token Gating

Los holders de tokens pueden acceder a contenido exclusivo, concerts, merchandise, etc.

## 🔧 Configuración

### Dependencias Agregadas

```bash
pnpm add @zoralabs/coins-sdk@^0.2.7
```

### Variables de Entorno

Las existentes de Base/Privy funcionan perfectamente. El sistema usa la misma lógica de detección de red que `providers.tsx`:

- `app.tuneport.xyz` | `tuneport.xyz` → Base Mainnet
- `testnet.tuneport.xyz` | `localhost` → Base Sepolia

### Base de Datos ⚠️ PENDIENTE

Se necesita agregar el campo `coin_address` a los modelos:

- ✅ collections (principal)
- ⚠️ nfts (por compatibilidad)
- ⚠️ playlists (futuras features)

## 🎨 Próximos Features

### 🎵 Listen-to-Earn

- Ganar tokens por tiempo de escucha
- Rewards por descubrir música nueva
- Leaderboards de early listeners

### 🔄 Remix Economy

- Pagos automáticos de royalties en tokens
- % del token original para remixes
- Collaborative ownership

### 🎪 Token Gating

- Acceso VIP para holders
- Merchandise exclusivo
- Concert tickets con descuento

### 📊 Analytics Avanzados

- Dashboard de performance de tokens
- Predicciones de precio
- Social sentiment analysis

## 🎉 Resultado

**ANTES**:

- Artista sube música → Fans la escuchan → Solo revenue por NFT sales

**DESPUÉS**:

- Artista sube música → Se crea token automáticamente → Fans pueden escuchar Y invertir → Trading real con permits y slippage protection → Economía completa alrededor de cada canción → Artista gana por música + tokens + colaboración tokenizada

### 🔥 ¿Por qué esto es DISRUPTIVO?

1. **Primera plataforma** que tokeniza automáticamente cada lanzamiento musical
2. **Zero friction**: Los artistas no necesitan entender crypto
3. **Trading profesional**: Slippage protection, permits automáticos, network detection
4. **Fan investment**: Los fans pueden "apostar" por sus artistas favoritos
5. **Collaborative economy**: Los % se manejan automáticamente en blockchain
6. **Viral mechanics**: Incentiva descubrir música nueva para early access a tokens

---

## 🚧 TODOs para Completar

### Backend ✅ COMPLETADO

- [x] Agregar campo `coin_address` al modelo de collections
- [x] Agregar campo `coin_address` al modelo de nfts
- [x] Agregar campo `coin_address` al modelo de playlists
- [x] Crear migración para actualizar base de datos existente
- [ ] API endpoints para obtener datos de tokens
- [ ] Webhooks para actualizar precios

### Frontend ✅ COMPLETADO

- [x] Integrar nueva API tradeCoin v0.2.7
- [x] TradingInterface con network detection
- [x] Slippage configurable y advanced settings
- [x] Permits automáticos para seguridad
- [x] SSR-safe clipboard y navigation

### Zora SDK ✅ COMPLETADO

- [x] Actualizar a versión 0.2.7
- [x] Implementar funciones reales de trading
- [x] Conectar con permits automáticos
- [x] Slippage protection
- [x] Network detection automático

### 🔒 Security & UX:

- ✅ **Permits**: Aprobaciones seguras sin transacciones extra
- ✅ **Slippage**: Protección configurable contra price impact
- ✅ **Validation**: Validación de transacciones antes de ejecutar
- ✅ **SSR-safe**: Compatible con Next.js server-side rendering
- ✅ **Error handling**: Manejo robusto de errores con feedback contextual

### 🎪 Features Avanzadas:

1. **Real-time Network Detection**: Indicadores visuales claros
2. **Advanced Trading Controls**: Slippage, permits, validation
3. **Contextual UX**: Mensajes diferentes para mainnet vs testnet
4. **Professional Trading Interface**: Equivalent to DeFi platforms

---

## 🗄️ Backend Implementation (elei-marketplace)

### 📊 Modelos de Base de Datos Actualizados

Hemos agregado el campo `coin_address` a los tres modelos principales para soportar completamente la tokenización:

#### 🏛️ Collections Model (`collections.ts`)

```typescript
export interface ICollection {
  // ... campos existentes ...
  coin_address?: string; // 🪙 NUEVO: Dirección del token asociado (Zora Coins)
  // ... resto de campos ...
}

// Schema actualizado con índice para búsquedas optimizadas
coin_address: {
  type: String,
  required: false,
  index: true, // Índice para búsquedas rápidas por coin_address
}
```

#### 🎵 NFTs Model (`nfts.ts`)

```typescript
export interface INft {
  // ... campos existentes ...
  coin_address?: string; // 🪙 NUEVO: Dirección del token asociado - heredado de collection o específico del NFT
  // ... resto de campos ...
}
```

#### 📝 Playlists Model (`Playlist.ts`)

```typescript
export interface IPlaylist {
  // ... campos existentes ...
  coin_address?: string; // 🪙 NUEVO: Para playlists tokenizadas en el futuro
  // ... resto de campos ...
}
```

### 🔗 Flujo de Integración

```typescript
// Frontend (copa-america) crea token y collection:
const coinAddress = await createAutomaticCoin({ ...params });

// Envía datos al backend (elei-marketplace):
const collectionData = {
  // ... datos existentes ...
  coin_address: coinAddress, // 🆕 Nueva dirección del token
};

// Backend guarda en MongoDB:
await CollectionModel.create(collectionData);
```

### 🎯 Casos de Uso del Backend

1. **Buscar por token**: `Collection.find({ coin_address: "0x..." })`
2. **Collections tokenizadas**: `Collection.find({ coin_address: { $ne: null } })`
3. **NFTs con tokens**: `Nft.find({ coin_address: { $exists: true } })`
4. **Analytics**: Estadísticas de tokenización por artista/género
5. **Trading data**: Información para widgets de trading

### 🚀 Próximas Features Backend

- **API endpoints**: `/api/tokens/:address/data`
- **Webhooks**: Actualización automática de precios desde Zora
- **Analytics**: Dashboard de performance de tokens
- **Tokenized playlists**: Economía de playlists colaborativas

**¡Esta integración convierte TUNEPORT en la primera plataforma de música con trading profesional de tokens, usando la última tecnología de Zora SDK v0.2.7! 🚀🎵💰**

---

## ✅ Actualizaciones Implementadas (v3.0)

### 🔧 Zora SDK v0.2.7 Integration:

- ✅ **Nueva API tradeCoin**: Implementación completa de la nueva API de trading
- ✅ **Permits automáticos**: Manejo seguro de aprobaciones para tokens ERC20
- ✅ **Slippage protection**: Control configurable de tolerancia de precio
- ✅ **Network auto-detection**: Mainnet vs testnet automático
- ✅ **Real vs Simulated**: Trading real en mainnet, simulado en testnet

### 🎯 TradingInterface Renovado:

```typescript
// Nueva funcionalidad:
const {
  coinData,
  isTrading,
  isMainnet,           // 🆕 Detección automática de red
  buyCoin,             // 🆕 Con slippage configurable
  sellCoin,            // 🆕 Con permits automáticos
  tradeTokens          // 🆕 Trading entre ERC20 tokens
} = useZoraCoinTrading();

// Configuración avanzada:
- Slippage personalizable (5% buy, 15% sell por defecto)
- Network indicator visual
- Advanced settings toggle
- SSR-safe operations
```

### 🌐 Multi-Network Support:

```typescript
// Auto-detección basada en hostname (misma lógica que providers.tsx):
// app.tuneport.xyz | tuneport.xyz → Base Mainnet (trading real)
// testnet.tuneport.xyz | localhost → Base Sepolia (trading simulado)

// Hook completamente automático:
const { buyCoin } = useZoraCoinTrading(); // ✅ Sin configuración manual
```

### 🗄️ Backend Database Integration:

- ✅ **Modelos actualizados**: `coin_address` agregado a Collections, NFTs y Playlists
- ✅ **Migración completa**: Script para actualizar base de datos existente
- ✅ **Índices optimizados**: Para búsquedas rápidas por dirección de token
- ✅ **Backward compatibility**: Sin afectar datos existentes

### 📈 Estado Actual del Proyecto:

| Componente               | Estado       | Descripción                           |
| ------------------------ | ------------ | ------------------------------------- |
| 🎵 **Token Creation**    | ✅ COMPLETO  | Auto-creación con Zora SDK v0.2.7     |
| 💱 **Trading Interface** | ✅ COMPLETO  | UI profesional con slippage y permits |
| 🌐 **Network Detection** | ✅ COMPLETO  | Auto-detección mainnet/testnet        |
| 🗄️ **Database Models**   | ✅ COMPLETO  | coin_address en todos los modelos     |
| 🔄 **Migration Scripts** | ✅ COMPLETO  | Actualización de BD existente         |
| 📊 **API Endpoints**     | ⚠️ PENDIENTE | Para datos de tokens                  |
| 🔔 **Webhooks**          | ⚠️ PENDIENTE | Actualización de precios              |

### 🎪 Ready to Launch Features:

1. **🪙 Automatic Tokenization**: Cada álbum obtiene su token automáticamente
2. **💰 Professional Trading**: Interface completa con slippage y permits
3. **🌐 Multi-Network**: Funciona en mainnet y testnet automáticamente
4. **🔒 Security First**: Validates, permits y error handling robusto
5. **📱 Mobile Ready**: SSR-safe y responsive design
6. **⚡ Performance**: Índices optimizados y búsquedas rápidas

---
