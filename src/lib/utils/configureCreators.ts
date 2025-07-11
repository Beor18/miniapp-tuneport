/**
 * Configura los creators para los metadatos de NFT usando Hydra
 */
export function configureCreators(
  collaborators: Array<{ name: string; address: string; royalties: number }>,
  hydraWalletAddress?: string | null
) {
  // Separar la plataforma de los colaboradores
  const platformCollab = collaborators.find(
    (c) => c.name === "Platform" || c.name === "Tuneport"
  );

  if (!platformCollab) {
    throw new Error("Platform collaborator is required");
  }

  // Si tenemos una dirección de Hydra, siempre usarla
  if (hydraWalletAddress) {
    return [
      {
        address: platformCollab.address,
        share: platformCollab.royalties,
        verified: false,
      },
      {
        address: hydraWalletAddress,
        share: 100 - platformCollab.royalties,
        verified: false,
      },
    ];
  }

  // Si no hay Hydra (caso de fallback), usar el primer artista directamente
  const artistCollab = collaborators.find(
    (c) => c.name !== "Platform" && c.name !== "Tuneport"
  );

  if (!artistCollab) {
    throw new Error("At least one artist collaborator is required");
  }

  return [
    {
      address: platformCollab.address,
      share: platformCollab.royalties,
      verified: false,
    },
    {
      address: artistCollab.address,
      share: 100 - platformCollab.royalties,
      verified: false,
    },
  ];
}
