import { notFound } from "next/navigation";
import { Metadata, ResolvingMetadata } from "next";
import CardAlbumMusic from "@Src/components/cardAlbumMusic";

interface PageProps {
  params: {
    slug: string;
  };
}

interface NFT {
  _id: string;
  name: string;
  image: string;
  music: string;
}

interface Album {
  _id: string;
  slug: string;
  name: string;
  artist_name: string;
  nfts: string[];
  image_cover?: string; // Añadimos esta propiedad
}

async function fetchNFTData() {
  const res = await fetch(`${process.env.API_ELEI}/api/nft`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch NFT data");
  }
  return res.json();
}

async function fetchAlbumData() {
  const res = await fetch(`${process.env.API_ELEI}/api/collections`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch album data");
  }
  return res.json();
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = params;
  const albumData = await fetchAlbumData();
  const album = albumData.find((album: Album) => album.slug === slug);

  if (!album) {
    return {
      title: "Album Not Found",
    };
  }

  const defaultImage = "/preview.png";
  const albumImage = album.image_cover || defaultImage;

  return {
    title: `${album.name} by ${album.artist_name} | Tuneport`,
    description: `Listen to ${album.name}, an album by ${album.artist_name}. Explore the NFT collection.`,
    openGraph: {
      title: `${album.name} by ${album.artist_name}`,
      description: `Listen to ${album.name}, an album by ${album.artist_name}. Explore the NFT collection.`,
      type: "music.album",
      musicians: [album.artist_name],
      images: [
        {
          url: albumImage,
          width: 800,
          height: 800,
          alt: `Cover of ${album.name} by ${album.artist_name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${album.name} by ${album.artist_name} | Tuneport`,
      description: `Listen to ${album.name}, an album by ${album.artist_name}. Explore the NFT collection.`,
      images: [albumImage],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = params;

  // Ejecutar todos los fetches en paralelo para eliminar el flash
  const [nftData, albumData] = await Promise.all([
    fetchNFTData(),
    fetchAlbumData(),
  ]);

  //console.log("albumData FER >>>>> ", albumData);
  //console.log("nftData FER >>>>> ", nftData);
  // Find the specific album based on the slug
  const album = albumData.find((album: Album) => album.slug === slug);

  if (!album) {
    notFound();
  }

  // Filter NFTs that belong to this album using the album's 'nfts' property
  const albumNfts = nftData.filter((nft: NFT) => album.nfts.includes(nft._id));

  if (albumNfts.length === 0) {
    console.warn(
      `No NFTs found for the album with slug: ${slug} and ID: ${album._id}`
    );
  } else {
    console.log(
      `Found ${albumNfts.length} NFTs for the album with slug: ${slug} and ID: ${album._id}`
    );
  }

  return (
    <div className="h-full w-full">
      <CardAlbumMusic nftsData={albumNfts} albumData={album} />
    </div>
  );
}
