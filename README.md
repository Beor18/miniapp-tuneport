# Tuneport Mini App - Farcaster

Una **miniapp** para Farcaster que se enfoca en las funcionalidades esenciales de música NFT.

## ✨ Funcionalidades

### 🔑 **Autenticación**

- Login con **Google, Twitter, Farcaster** y wallets
- Integración completa con **Privy**
- Soporte **multi-chain** (EVM + Solana)

### 👤 **Perfil**

- Perfiles de usuario en `/u/[nickname]`
- Colecciones NFT personales
- Playlists guardadas
- Estadísticas de usuario

### 🎵 **For You - Vista TikTok**

- Feed de canciones aleatorias tipo TikTok
- **Controles de reproducción**: play, pause, siguiente, anterior
- **Acciones disponibles**:
  - ❤️ **Like** - Sistema de likes globales
  - 🎁 **Mint** - Reclamar NFTs de música
  - 📝 **Add to Playlist** - Agregar a cola/playlist
  - 🔇 **Silenciar** - Control de volumen
  - 💰 **Trade Coins** - Trading de tokens de artistas

## 🏗️ Arquitectura Técnica

### **Frontend**

- **Next.js 14** App Router con internacionalización
- **TypeScript** + **Tailwind CSS**
- **Farcaster Mini App SDK** integrado
- **React Server Components** optimizado

### **Blockchain**

- **Solana** - NFTs con Candy Machine
- **Base/Ethereum** - ERC1155 NFTs
- **Zora Protocol** - Coin trading
- **Privy** - Multi-chain wallet management

### **Características**

- **Reproductor** flotante con controles completos
- **Sistema de likes** con estado global
- **Trading interface** para tokens de música
- **Mint modal** con selección de cantidad
- **Responsive design** mobile-first

## 🚀 Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build para producción
npm run build
```

## 🔧 Configuración

### Farcaster Mini App

- Manifest configurado en `public/.well-known/farcaster.json`
- Meta tags para embed correcto
- SDK de Farcaster integrado en providers

## 📱 Rutas Disponibles

- `/` - Página principal con navegación
- `/foryou` - Feed principal tipo TikTok
- `/u/[nickname]` - Perfiles de usuario
- `/album/[slug]` - Páginas de álbumes individuales

## 🎯 Enfoque de la miniapp

Esta versión está **optimizada para Farcaster** con:

1. **Onboarding rápido** - Login en un click
2. **Experiencia simplificada** - Solo lo esencial
3. **TikTok-style discovery** - Swipe, like, mint
4. **Mobile-first** - Diseño para móviles
5. **Web3 integrado** - NFTs y tokens sin fricción

---

**Estado**: ✅ Funcional en testnet  
**Próximo paso**: Migrar a producción y firmar manifest de Farcaster
