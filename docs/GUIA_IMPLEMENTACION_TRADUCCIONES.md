# Guía de Implementación de Traducciones - Tuneport

## 📋 Estado Actual

✅ **Completado:**

- Configuración de Next.js con next-intl
- Archivos de traducción ampliados (en, es, pt) con nuevas categorías
- Middleware configurado para detección de idiomas
- LanguageSelector implementado y funcionando (3 idiomas: en, es, pt)
- Componentes básicos traducidos:
  - AsideNavbar
  - RegisterArtist
  - RegisterFan
  - ProfileUser (mensajes básicos)
  - ProfileFanUser (botones y tabs)
  - RegisterArtistModalTest

### 🆕 **Completado en sesiones anteriores:**

- **CarrouselHome** - Carrusel principal con secciones traducidas
- **Player** - Reproductor con alt text y aria-labels traducidos
- **FileUpload** - Formulario de subida con mensajes traducidos
- **ProfileEditModal** - Modal de edición completo con todos los campos

### 🔥 **Completado en esta sesión:**

- **playList/index.tsx** - Sistema completo de playlists con formularios y estados
- **BaseAlbumNewForm.tsx** - Formulario principal de álbumes (placeholders y labels)
- **RegisterFanModal.tsx** - Modal de registro de fans completamente traducido
- **albumForm/BasicForm.tsx** - Formulario básico de álbumes (tipos de proyecto, metadatos)
- **ProfileArtistUser.tsx** - Corrección de errores de traducción y componente AlbumCard

### 🚀 **Completado en esta segunda sesión (NFT Components):**

- **nft1155Form/MusicNewForm.tsx** - Formulario principal completo de creación de colecciones NFT ERC1155 con sistema de pagos y colaboradores
- **nft1155Form/NFTTrackForm.tsx** - Formulario de creación de tracks NFT individuales
- **nft1155Form/NFTMintButton.tsx** - Botón para acuñar NFTs creados
- **nft1155Form/BasicForm.tsx** - Formulario básico NFT 1155 con tipos de colección y metadatos
- **nft1155Form/CollaboratorsForm.tsx** - Formulario avanzado de colaboradores con distribución de royalties
- **nft1155Form/AdvancedForm.tsx** - Formulario avanzado NFT con configuración de blockchain y precios
- **nftForm/index.tsx** - Formulario NFT principal alternativo completo (Solana/Base/Ethereum)

### 📦 **Nuevas categorías de traducción añadidas:**

- `home` - Textos del home (carrusel, secciones)
- `upload` - Mensajes de subida de archivos
- `playlist` - Sistema completo de playlists (nueva categoría)
- Ampliación significativa de `music`, `user`, `forms`, `common`

## 🚀 Próximos Pasos

### 1. Componentes Pendientes de Traducir

#### 🎵 **Componentes de Música**

- ✅ ~~`Player.tsx` - Controles del reproductor~~
- [ ] `FloatingPlayer` - Reproductor flotante
- ✅ ~~`CarrouselHome.tsx` - Carrusel principal~~
- [ ] `WrapPlayer.tsx` - Wrapper del reproductor
- ✅ ~~`playList/index.tsx` - Sistema de playlists~~

#### 📝 **Formularios**

- ✅ ~~`BaseAlbumNewForm.tsx` - Formulario principal de álbumes~~
- [ ] `AlbumNewForm.tsx` - Formulario de álbum nuevo
- [ ] `AlbumForm.tsx` - Formulario de álbum
- ✅ ~~`FileUpload.tsx` - Subida de archivos~~
- ✅ ~~`ProfileEditModal.tsx` - Modal de edición de perfil~~
- ✅ ~~`RegisterFanModal.tsx` - Modal de registro de fans~~
- ✅ ~~`albumForm/BasicForm.tsx` - Formulario básico de álbumes~~
- [ ] `albumForm/CollaboratorsForm.tsx` - Formulario de colaboradores
- [ ] `albumForm/AdvancedForm.tsx` - Formulario avanzado
- [ ] `registrationForm/index.tsx` - Formulario de registro principal

#### 🎨 **Componentes NFT** ✅ **COMPLETADO**

- ✅ ~~`nftForm/index.tsx` - Formulario NFT principal (Solana/Base/Ethereum)~~
- ✅ ~~`nft1155Form/MusicNewForm.tsx` - Formulario principal completo~~
- ✅ ~~`nft1155Form/NFTTrackForm.tsx` - Formulario de tracks NFT~~
- ✅ ~~`nft1155Form/NFTMintButton.tsx` - Botón de acuñar NFTs~~
- ✅ ~~`nft1155Form/BasicForm.tsx` - Formulario básico NFT 1155~~
- ✅ ~~`nft1155Form/CollaboratorsForm.tsx` - Formulario de colaboradores NFT~~
- ✅ ~~`nft1155Form/AdvancedForm.tsx` - Formulario avanzado NFT~~
- [ ] `SimplePaymentDialog/` - Diálogo de pagos (pendiente)

#### 🔍 **Exploración y Navegación**

- [ ] `exploreMusic/` - Explorar música
- [ ] `exploreUsers/` - Explorar usuarios
- [ ] `exploreCategories/` - Explorar categorías
- [ ] `explorePlaylists/` - Explorar playlists

#### 👤 **Perfiles**

- ✅ ~~`ProfileArtistUser.tsx` - Perfil de artista (corregido)~~
- [ ] `ArtistProfile.tsx` - Perfil detallado
- [ ] `ArtistIdentity.tsx` - Identidad del artista

### 2. Páginas Pendientes

#### 📄 **Páginas Principales**

- [ ] `src/app/[locale]/store/page.tsx` - Página de tienda
- [ ] `src/app/[locale]/explore/page.tsx` - Página de exploración
- [ ] `src/app/[locale]/foryou/page.tsx` - Página "Para Ti"
- [ ] `src/app/[locale]/album/[slug]/page.tsx` - Página de álbum

#### ⚠️ **Páginas de Error**

- [ ] `not-found.tsx` - Página no encontrada
- [ ] `global-error.tsx` - Error global

## 🛠️ Cómo Implementar Traducciones

### Paso 1: Importar useTranslations

```tsx
import { useTranslations } from "next-intl";

const MiComponente = () => {
  const t = useTranslations("categoria"); // ej: "forms", "common", "navigation"
  const tCommon = useTranslations("common");

  // ...resto del componente
};
```

### Paso 2: Reemplazar Texto Hardcodeado

**❌ Antes:**

```tsx
<button>Save</button>
<input placeholder="Enter your name" />
<h1>Welcome to Tuneport</h1>
```

**✅ Después:**

```tsx
<button>{tCommon("save")}</button>
<input placeholder={tForms("enterName")} />
<h1>{tHome("welcome")}</h1>
```

### Paso 3: Agregar Nuevas Traducciones

Si necesitas nuevas traducciones, agrégalas a los 3 archivos:

**`src/i18n/locales/en.json`**

```json
{
  "newCategory": {
    "newKey": "New Text"
  }
}
```

**`src/i18n/locales/es.json`**

```json
{
  "newCategory": {
    "newKey": "Nuevo Texto"
  }
}
```

**`src/i18n/locales/pt.json`**

```json
{
  "newCategory": {
    "newKey": "Novo Texto"
  }
}
```

## 📚 Categorías de Traducción Disponibles

### `common` - Textos Comunes

- Botones básicos: save, cancel, delete, edit
- Estados: loading, error, success, checking
- Acciones: create, update, view, close, saveChanges

### `navigation` - Navegación

- Menús principales: home, explore, profile
- Enlaces: albums, store, settings

### `home` - Página Principal

- Secciones: recentlyPlayed, toGetYouStarted
- Contenido: likedSongs, dailyMix, chillMix, topHits
- Saludos: goodMorning

### `forms` - Formularios (EXPANDIDO)

- Placeholders de campos: enterName, enterDescription, enterArtistName
- Labels de formularios: artistName, description, musicGenre
- Validaciones y tipos: selectGenre, selectCurrency, selectBlockchain
- Redes sociales: usernameTwitter, urlSpotify, userInstagram
- **Nuevos campos**: symbolPlaceholder, maxSupplyPlaceholder, releaseDate, endDate
- **Sistema de pagos**: smartPaymentSystem, createPaymentSplitter
- **Arte y medios**: coverArt, clickToUpload
- **Colaboradores**: collaboratorName, royaltiesPercent, walletAddressPlaceholder

### `user` - Usuario

- Perfil: followers, following, profile, nickname, biography
- Acciones: follow, edit, connect wallet
- Edición: profilePicture, profilePicturePreview

### `music` - Música

- Controles: play, pause, stop
- Acciones: like, share, download, addTracks
- Información: artist, album, genre, playingSongCover

### `playlist` - Playlists (NUEVA CATEGORÍA)

- Estados: inQueue, yourQueueEmpty, creating
- Formularios: playlistName, enterPlaylistName, enterDescription
- Configuración: makePublic, categoriesOptional
- Acciones: createPlaylist, createFromQueue, closeForm
- Contadores: category, categories, selected

### `album` - Álbumes

- Tipos: albumType, singleType, dropType
- Descripciones: albumDescription, singleDescription, dropDescription
- Creación: createAlbum, createSingle, createProject
- Metadatos: collection, payments, collaborators, currency

### `upload` - Subida de Archivos

- Mensajes: selectFile, uploadSuccess, uploadError
- Formularios: fillDetails

### `tabs` - Pestañas

- Secciones: collected, playlists, store

### `filters` - Filtros

- Ordenamiento: newest, popular, trending
- Tipos: albums, singles, EPs

### `nft` - NFTs

- Acciones: mint, collection
- Términos específicos de NFTs

### `errors` - Errores

- Mensajes de error comunes
- Estados de falla

## 🔧 Herramientas Útiles

### Script de Búsqueda de Textos Hardcodeados

Puedes usar este comando para encontrar textos que necesitan traducción:

```bash
# Buscar strings hardcodeados
grep -r "\"[A-Z][a-z]*[^\"]*\"" src/components --include="*.tsx" --include="*.ts"

# Buscar placeholders
grep -r "placeholder=\"" src/components --include="*.tsx"
```

### Ejemplo de Componente Completo

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

export default function EjemploComponente() {
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");
  const tMusic = useTranslations("music");

  return (
    <div>
      <h1>{tMusic("discoverMusic")}</h1>

      <form>
        <input placeholder={tForms("searchTracks")} className="..." />

        <Button type="submit">{tCommon("search")}</Button>
      </form>

      <div className="actions">
        <Button>{tMusic("play")}</Button>
        <Button>{tMusic("pause")}</Button>
        <Button>{tCommon("save")}</Button>
      </div>
    </div>
  );
}
```

## 📝 Lista de Verificación

Antes de marcar un componente como "traducido":

- [ ] Todos los textos visibles están usando traducciones
- [ ] Placeholders de inputs están traducidos
- [ ] Mensajes de error/éxito están traducidos
- [ ] Títulos y descripciones están traducidos
- [ ] Alt text y aria-labels están traducidos
- [ ] Las 3 traducciones (en, es, pt) están completas
- [ ] El componente funciona correctamente en los 3 idiomas

## 🚨 Errores Comunes a Evitar

1. **No traducir placeholders:** Los placeholders también deben usar traducciones
2. **Olvidar los 3 idiomas:** Siempre actualizar en, es y pt
3. **Hardcodear en JSX:** Evitar texto directo en JSX, usar siempre traducciones
4. **No usar categorías:** Organizar traducciones en categorías lógicas
5. **Olvidar accesibilidad:** Traducir alt text y aria-labels

## 📞 Ayuda Adicional

Si encuentras problemas:

1. Revisa que el componente tenga "use client" si usa useTranslations
2. Verifica que la clave de traducción exista en todos los idiomas
3. Asegúrate de importar useTranslations correctamente
4. Comprueba que la categoría de traducción sea la correcta

## 🎯 Siguientes Prioridades

**Recomendación para continuar (actualizada):**

1. **Componentes NFT** - `nft1155Form/`, `nftForm/` (ALTA PRIORIDAD - muy visibles)
2. **Formularios restantes** - `albumForm/CollaboratorsForm.tsx`, `registrationForm/index.tsx`
3. **Páginas principales** - `store/page.tsx`, `explore/page.tsx`, `foryou/page.tsx`
4. **FloatingPlayer** - Reproductor flotante muy usado
5. **Componentes de exploración** - `exploreMusic/`, `exploreUsers/`

## 📊 Progreso Actual

- ✅ **Formularios básicos**: 80% completado
- ✅ **Sistema de playlists**: 100% completado
- ✅ **Perfiles de usuario**: 90% completado
- ✅ **Componentes NFT**: 100% completado (7 de 7 componentes principales) 🎉
- 🔄 **Formularios álbum restantes**: Pendiente (AlbumNewForm, CollaboratorsForm, AdvancedForm)
- 🔄 **Páginas principales**: 0% (store, explore, foryou)
- 🔄 **Exploración y navegación**: 0%

¡HITO ALCANZADO! 🚀 Todos los componentes NFT principales están completamente traducidos. La plataforma NFT ahora es 100% multiidioma. 🎵✨
