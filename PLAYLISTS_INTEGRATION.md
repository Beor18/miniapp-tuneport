# 🎵 Integrated Playlist System - Documentation

## 📋 Overview

A complete playlist system has been successfully integrated that combines:

- **Temporary queue** - Existing local functionality
- **Persistent playlists** - New backend-powered functionality

## 🏗️ Implemented Architecture

### **Backend (API)**

```
elei-marketplace/src/pages/api/playlists/
├── create.ts                     # POST - Create playlist
├── [playlistId].ts              # GET - Get specific playlist
├── delete/[playlistId].ts       # DELETE - Delete playlist
├── update/[playlistId].ts       # PUT - Update playlist
├── manage-nfts/[playlistId].ts  # POST - Add/remove NFTs
├── search.ts                    # GET - Search public playlists
└── getUserPlaylists/[userId].ts # GET - User's playlists
```

### **Frontend (React)**

```
copa-america/src/
├── lib/
│   ├── actions/playlists.ts     # Server actions
│   └── hooks/usePlaylists.ts    # Custom hook
├── components/
│   ├── PlaylistManager/         # Saved playlists manager
│   ├── FloatingPlayer/          # Integrated player
│   │   ├── PlayerBar.tsx        # Main player bar
│   │   ├── PlayerBarMobile.tsx  # Mobile player
│   │   └── index.tsx
│   ├── playList/                # Existing temporary queue
│   └── PlaylistCarousel/        # Playlist carousel display
├── contexts/
│   └── PlayerContext.tsx        # Player state management
└── app/
    └── api/                     # Local API routes (proxy to elei-marketplace)
```

## 🎯 Features

### **Dual System**

1. **Temporary Queue** (existing)

   - Stored in context state
   - Acts as current playback queue
   - Drag & drop for reordering
   - Add/remove songs on-the-fly
   - Managed by `PlayerContext`

2. **Persistent Playlists** (new)
   - Saved in MongoDB
   - Full CRUD operations
   - Public/Private settings
   - Search and filters
   - Share between users

### **Advanced Features**

- ✅ **Create from current queue** - Convert queue to persistent playlist
- ✅ **Load playlist to queue** - Play saved playlists
- ✅ **Add queue to existing playlist** - Combine temporary with persistent
- ✅ **Advanced search** - By name, tags, user
- ✅ **Security validations** - Only owner can edit
- ✅ **Optimized UI/UX** - Animations, loading states, error handling

## 🎮 User Interface

### **Updated PlayerBar**

```tsx
// PlayerBar now includes playlist management:
<Button onClick={() => setShowPlaylistManager(true)}>
  <ListMusic /> {/* Saved Playlists */}
</Button>

<Button onClick={() => setShowPlaylist(true)}>
  <ListMusicIcon /> In Queue ({userPlaylist.length})
</Button>
```

### **PlaylistManager Component**

- **Side panel** that slides from the right
- **Create playlists** empty or from current queue
- **View all playlists** for the user
- **Quick actions**: play, add queue, delete
- **Dynamic form** with validations

## 🔌 How to Use

### **1. Create Playlist from Queue**

```tsx
// User adds songs to temporary queue
addToPlaylist(track);

// Then can save it as persistent playlist
const result = await createNewPlaylist({
  name: "My Playlist",
  description: "Optional description",
  userId: "user123",
  nfts: userPlaylist.map((track) => track._id),
  isPublic: false,
});
```

### **2. Load Saved Playlist**

```tsx
// Convert playlist NFTs to Track format for queue
const tracks = playlist.nfts.map((nft) => ({
  _id: nft._id,
  name: nft.name,
  artist_name: nft.artist_address_mint,
  image: nft.image,
  music: nft.music,
  slug: nft._id,
}));

// Load into player context
setNftData(tracks);
setCurrentSong(tracks[0]);
setIsPlaying(true);
```

### **3. Search Public Playlists**

```tsx
const { data, pagination } = await searchPlaylists("reggaeton", {
  page: 1,
  limit: 10,
  tag: "latin",
  sortBy: "updatedAt",
  sortOrder: "desc",
});
```

## 🛠️ Installation and Setup

### **1. Backend Dependencies**

The backend is already implemented in the existing elei-marketplace system.

### **2. Frontend Components**

```tsx
// In your page or component:
import { PlaylistManager } from "@/components/PlaylistManager";
import { usePlaylists } from "@/lib/hooks/usePlaylists";

function MyComponent() {
  const { playlists, createNewPlaylist } = usePlaylists(userId);

  return (
    <PlaylistManager
      isVisible={showManager}
      onClose={() => setShowManager(false)}
      userId={userId}
    />
  );
}
```

### **3. Integration in PlayerBar**

The PlayerBar is already updated with:

- `userId` prop to identify the user
- Button to access PlaylistManager
- Complete integrated functionality

## 📡 API Endpoints

### **Create Playlist**

```http
POST /api/playlists/create
Content-Type: application/json

{
  "name": "My Playlist",
  "description": "Optional description",
  "userId": "64f7b1c2e1234567890abcde",
  "nfts": ["nft1", "nft2", "nft3"],
  "isPublic": false,
  "tags": ["rock", "metal"]
}
```

### **Get User Playlists**

```http
GET /api/playlists/getUserPlaylists/64f7b1c2e1234567890abcde?includePrivate=true
```

### **Add NFT to Playlist**

```http
POST /api/playlists/manage-nfts/64f7b1c2e1234567890abcdf
Content-Type: application/json

{
  "action": "add",
  "nftId": "64f7b1c2e1234567890abce1",
  "userId": "64f7b1c2e1234567890abcde"
}
```

## 🔄 Typical Workflow

1. **User listens to music** → Added to temporary queue
2. **Finds a good combination** → Saves as playlist
3. **Wants to listen again** → Loads playlist to queue
4. **Discovers new music** → Adds to existing playlists
5. **Shares with friends** → Makes playlist public

## ⚡ System States

### **PlayerContext** (Temporary)

- `userPlaylist: Track[]` - Current queue
- `addToPlaylist()` - Add to queue
- `removeFromPlaylist()` - Remove from queue
- `clearPlaylist()` - Clear queue
- `playNextTrack()` - Play next song
- `playPreviousTrack()` - Play previous song

### **usePlaylists Hook** (Persistent)

- `playlists: PlaylistData[]` - Saved playlists
- `createNewPlaylist()` - Create playlist
- `updateExistingPlaylist()` - Update playlist
- `removePlaylist()` - Delete playlist
- `addNftToPlaylistLocal()` - Add NFT to playlist
- `removeNftFromPlaylistLocal()` - Remove NFT from playlist

## 🚨 Important Considerations

### **User ID**

Currently `userId` is passed as prop. In production:

```tsx
// TODO: Get from real authentication context
const { userData } = useAuthContext();
const userId = userData?._id;
```

### **Validations**

- Only the owner can edit/delete their playlists
- NFTs must exist in the database
- Playlist names cannot be empty
- Length limits on descriptions

### **Performance**

- Pagination in searches
- MongoDB indexes for fast searches
- Lazy loading of NFTs in large playlists

## 🎨 Customization

### **Styles**

The system uses Tailwind CSS with dark theme by default:

- `bg-zinc-900` - Main backgrounds
- `border-zinc-700` - Borders
- `text-zinc-100` - Main text
- `text-primary-500` - Active elements

### **Animations**

Framer Motion is used for:

- PlaylistManager slide-in
- Form expand/collapse
- Loading states
- Hover effects

## 🔮 Future Improvements

- [ ] **Collaborative Playlists** - Multiple users editing
- [ ] **Smart Playlists** - Based on recommendation algorithms
- [ ] **Playlist Analytics** - Playback statistics
- [ ] **Import/Export** - Compatibility with Spotify, Apple Music
- [ ] **Offline Mode** - Local playlist caching

## 🏗️ Project Structure

### **Technology Stack**

- **Frontend**: Next.js 14.2.2 (App Router)
- **UI**: Tailwind CSS + Radix UI + Shadcn/ui
- **Animations**: Framer Motion
- **State Management**: React Context + Custom Hooks
- **Authentication**: Privy + Reown/AppKit
- **Blockchain**: Solana + Ethereum (Base)
- **HTTP Client**: Fetch API with Server Actions

### **Environment Variables**

```env
API_ELEI=https://api.elei.marketplace.url
```

All playlist API calls are made to the elei-marketplace backend via the `API_ELEI` environment variable.

---

🎉 **The system is ready to use!**

The integration maintains existing functionality while adding advanced playlist management capabilities.
