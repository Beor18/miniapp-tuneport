import { useCallback, useState, useEffect } from "react";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import { X, Plus, Info, FileText } from "lucide-react";
import {
  FREE_PLAN_PLATFORM_FEE_PERCENTAGE,
  FREE_PLAN_ARTIST_FEE_PERCENTAGE,
  PAID_PLAN_PLATFORM_FEE_PERCENTAGE,
  PAID_PLAN_ARTIST_FEE_PERCENTAGE,
} from "@Src/lib/constants/feeCalculations";

interface Collaborator {
  name: string;
  address: string;
  royalties: number;
}

interface CollaboratorsFormProps {
  collectionType: any;
  plan: string;
  collaborators: Collaborator[];
  updateCollaborators: (newCollaborators: Collaborator[]) => void;
  removeCollaborator: (index: number) => void;
  addCollaborator: () => void;
  useHydra: boolean;
  setUseHydra: (value: boolean) => void;
}

export function CollaboratorsForm({
  collectionType,
  plan,
  collaborators,
  updateCollaborators,
  removeCollaborator,
  addCollaborator,
  useHydra,
  setUseHydra,
}: CollaboratorsFormProps) {
  // Obtenemos valores de royalties según el plan
  const initialArtistRoyalty =
    plan === "free"
      ? FREE_PLAN_ARTIST_FEE_PERCENTAGE * 100
      : PAID_PLAN_ARTIST_FEE_PERCENTAGE * 100;
  const platformRoyalty =
    plan === "free"
      ? FREE_PLAN_PLATFORM_FEE_PERCENTAGE * 100
      : PAID_PLAN_PLATFORM_FEE_PERCENTAGE * 100;

  // Función para recalcular royalties del "artist main" cuando
  // el resto de colaboradores cambian (menos la plataforma).
  const calculateRoyalties = useCallback(
    (updatedCollaborators: Collaborator[]) => {
      const availableRoyalties = initialArtistRoyalty;

      // Suma de todos los colaboradores "extra" a partir del index 2
      const totalOthers = updatedCollaborators
        .slice(2)
        .reduce((sum, c) => sum + c.royalties, 0);

      // Ajustamos el royalty del Artist (posición 0)
      updatedCollaborators[0].royalties = Math.max(
        0,
        availableRoyalties - totalOthers
      );

      // Aseguramos que ninguno quede en negativo
      updatedCollaborators.forEach((c, i) => {
        if (i !== 1) {
          // index 1 es la plataforma: skip
          c.royalties = parseFloat(Math.max(0, c.royalties).toFixed(2));
        }
      });

      return updatedCollaborators;
    },
    [initialArtistRoyalty]
  );

  // Cambio de royalties en un input
  const handleRoyaltyChange = useCallback(
    (index: number, value: string) => {
      const newRoyalty = parseFloat(value);
      if (isNaN(newRoyalty)) return;

      // Hacemos una copia del array para mutar
      const updated = collaborators.map((c, i) =>
        i === index ? { ...c, royalties: newRoyalty } : c
      );

      // Recalculamos
      const recalculated = calculateRoyalties(updated);

      // Avisamos al padre con la nueva lista
      updateCollaborators(recalculated);
    },
    [collaborators, calculateRoyalties, updateCollaborators]
  );

  // Cambio de name o address
  const handleCollaboratorUpdate = useCallback(
    (index: number, field: keyof Collaborator, value: string | number) => {
      const updated = collaborators.map((c, i) =>
        i === index ? { ...c, [field]: value } : c
      );
      updateCollaborators(updated);
    },
    [collaborators, updateCollaborators]
  );

  // Eliminar colaborador
  const handleRemoveCollaborator = useCallback(
    (index: number) => {
      // Eliminamos ese colaborador
      const updated = collaborators.filter((_, i) => i !== index);
      // Recalcular
      const recalculated = calculateRoyalties(updated);
      // Avisar al padre
      updateCollaborators(recalculated);
    },
    [collaborators, calculateRoyalties, updateCollaborators]
  );

  // Agregar colaborador
  const handleAddCollaborator = useCallback(() => {
    const newCollaborator: Collaborator = {
      name: "",
      address: "",
      royalties: 0,
    };
    // Agregamos al final
    const updated = [...collaborators, newCollaborator];
    // Recalculamos
    const recalculated = calculateRoyalties(updated);
    // Avisar al padre
    updateCollaborators(recalculated);
  }, [collaborators, calculateRoyalties, updateCollaborators]);

  // Siempre activar Hydra para cualquier cantidad de colaboradores
  useEffect(() => {
    if (collaborators.length > 1) {
      setUseHydra(true);
    }
  }, [collaborators.length, setUseHydra]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold text-zinc-100">
          {collectionType === "DROP" ? "Collaborators" : "Royalties"}
        </Label>
      </div>

      {/* Panel informativo para distribución de royalties */}
      {collaborators.length > 0 && (
        <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-zinc-200 mb-1">
                Distribución de royalties
              </h3>
              <p className="text-xs text-zinc-400 mb-2">
                Los pagos de royalties se distribuyen:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-zinc-900/70 rounded-md border border-zinc-800">
                  <h4 className="font-medium text-emerald-400 text-xs mb-1">
                    Pagos de mint (venta primaria)
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Cuando alguien compra un track, el pago va directamente al
                    artista específico de ese track.
                    <span className="block mt-1 text-emerald-400 font-medium">
                      Sin límite de colaboradores.
                    </span>
                  </p>
                </div>

                <div className="p-3 bg-zinc-900/70 rounded-md border border-zinc-800">
                  <h4 className="font-medium text-amber-400 text-xs mb-1">
                    Royalties (ventas secundarias)
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Los royalties de ventas secundarias se distribuyen entre
                    todos los colaboradores según los porcentajes definidos.
                    <span className="block mt-1 text-amber-400 font-medium">
                      Sin límite de colaboradores.
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Visualización de distribución de royalties */}
      {collaborators.length > 0 && (
        <div className="p-4 bg-zinc-800/50 border border-zinc-800 rounded-lg">
          <Label className="text-sm font-medium text-zinc-200 mb-2 block">
            Distribución de royalties
          </Label>

          <div className="relative h-8 bg-zinc-900 rounded-md overflow-hidden mb-1">
            {collaborators.map((collab, index) => {
              // Calcular el porcentaje del total
              const totalRoyalties = collaborators.reduce(
                (sum, c) => sum + c.royalties,
                0
              );
              const width = (collab.royalties / totalRoyalties) * 100;

              // Si es muy pequeño, no mostrar
              if (width < 2) return null;

              // Colores para cada colaborador
              const colors = [
                "bg-blue-500",
                "bg-green-500",
                "bg-purple-500",
                "bg-red-500",
                "bg-indigo-500",
                "bg-yellow-500",
                "bg-pink-500",
                "bg-emerald-500",
                "bg-amber-500",
                "bg-cyan-500",
                "bg-lime-500",
                "bg-fuchsia-500",
              ];

              return (
                <div
                  key={index}
                  className={`absolute top-0 h-full ${
                    colors[index % colors.length]
                  }`}
                  style={{
                    left: `${collaborators
                      .slice(0, index)
                      .reduce(
                        (sum, c) => sum + (c.royalties / totalRoyalties) * 100,
                        0
                      )}%`,
                    width: `${width}%`,
                  }}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                    {collab.name.slice(0, 8)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-2 text-xs text-zinc-400 flex justify-between">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>
      )}

      {/* Lista de colaboradores */}
      {collaborators.map((collaborator, index) => (
        <div
          key={index}
          className="space-y-4 p-4 rounded-lg bg-zinc-800/50 border border-zinc-800"
        >
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium text-zinc-200">
              {index === 0
                ? "Artist (Main)"
                : index === 1
                ? "Tuneport"
                : `Collaborator ${index - 1}`}
            </Label>

            {index > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCollaborator(index)}
                className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {index < 2 ? (
              <div className="md:col-span-2">
                <Label htmlFor={`name-${index}`} className="sr-only">
                  Name
                </Label>
                <Input
                  id={`name-${index}`}
                  placeholder="Name"
                  value={collaborator.name}
                  onChange={(e) =>
                    handleCollaboratorUpdate(index, "name", e.target.value)
                  }
                  disabled={index === 1}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor={`name-${index}`} className="sr-only">
                    Name
                  </Label>
                  <Input
                    id={`name-${index}`}
                    placeholder="Name"
                    value={collaborator.name}
                    onChange={(e) =>
                      handleCollaboratorUpdate(index, "name", e.target.value)
                    }
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div>
                  <Label htmlFor={`address-${index}`} className="sr-only">
                    Wallet Address
                  </Label>
                  <Input
                    id={`address-${index}`}
                    placeholder="Wallet Address"
                    value={collaborator.address}
                    onChange={(e) =>
                      handleCollaboratorUpdate(index, "address", e.target.value)
                    }
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </>
            )}
            <div>
              <Label htmlFor={`royalties-${index}`} className="sr-only">
                Royalties %
              </Label>
              <div className="relative">
                <Input
                  id={`royalties-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Royalties %"
                  value={collaborator.royalties}
                  onChange={(e) => handleRoyaltyChange(index, e.target.value)}
                  disabled={index === 0 || index === 1}
                  className="bg-zinc-800 border-zinc-700 pr-8"
                />
                <span className="absolute right-3 top-2.5 text-zinc-400 text-sm">
                  %
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Botón para agregar colaborador */}
      {collaborators.length < 12 && (
        <Button
          type="button"
          variant="outline"
          onClick={handleAddCollaborator}
          className="w-full bg-zinc-800/50 border-zinc-800 text-zinc-100 hover:bg-zinc-800 hover:border-zinc-700 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" /> Add Collaborator
        </Button>
      )}
    </div>
  );
}
