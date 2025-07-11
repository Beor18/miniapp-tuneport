import { useCallback, useState, useEffect } from "react";
import { Button } from "@Src/ui/components/ui/button";
import { Input } from "@Src/ui/components/ui/input";
import { Label } from "@Src/ui/components/ui/label";
import { X, Plus, Info, Users, PieChart, DollarSign } from "lucide-react";
import {
  FREE_PLAN_PLATFORM_FEE_PERCENTAGE,
  FREE_PLAN_ARTIST_FEE_PERCENTAGE,
  PAID_PLAN_PLATFORM_FEE_PERCENTAGE,
  PAID_PLAN_ARTIST_FEE_PERCENTAGE,
} from "@Src/lib/constants/feeCalculations";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@Src/ui/components/ui/tooltip";
import { useTranslations } from "next-intl";

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
}

export function CollaboratorsForm({
  collectionType,
  plan,
  collaborators,
  updateCollaborators,
  removeCollaborator,
  addCollaborator,
}: CollaboratorsFormProps) {
  // Translation hooks
  const tNft = useTranslations("nft");
  const tCommon = useTranslations("common");
  const tForms = useTranslations("forms");

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Label className="text-lg font-semibold text-zinc-100 flex items-center">
          {collectionType === "DROP" ? (
            <>
              <Users className="h-5 w-5 mr-2 text-indigo-400" />{" "}
              {tNft("collaborators")}
            </>
          ) : (
            <>
              <DollarSign className="h-5 w-5 mr-2 text-indigo-400" />{" "}
              {tNft("totalRoyalties")}
            </>
          )}
        </Label>
      </div>

      {/* Panel informativo para distribución de royalties */}
      {collaborators.length > 0 && (
        <div className="bg-gradient-to-br from-indigo-950/30 to-purple-950/30 border border-indigo-800/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-indigo-400 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-zinc-200 mb-1">
                Distribución de Royalties
              </h3>
              <p className="text-xs text-zinc-400 mb-3">
                Los royalties se distribuyen automáticamente:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <div className="p-3 bg-zinc-900/70 rounded-md border border-zinc-800 hover:border-indigo-800/40 transition-colors">
                  <h4 className="font-medium text-indigo-400 text-xs mb-1 flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" /> Pagos de mint (venta
                    primaria)
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Cuando alguien compra un token, el pago va directamente al
                    artista específico de ese token.
                    <span className="block mt-1 text-indigo-300 font-medium">
                      Sin límite de colaboradores.
                    </span>
                  </p>
                </div>

                <div className="p-3 bg-zinc-900/70 rounded-md border border-zinc-800 hover:border-indigo-800/40 transition-colors">
                  <h4 className="font-medium text-indigo-400 text-xs mb-1 flex items-center">
                    <PieChart className="h-3 w-3 mr-1" /> Royalties (ventas
                    secundarias)
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Los royalties de ventas secundarias se distribuyen entre
                    todos los colaboradores según los porcentajes definidos.
                    <span className="block mt-1 text-indigo-300 font-medium">
                      Máximo 12 colaboradores.
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
        <div className="p-4 bg-gradient-to-br from-zinc-900/90 to-zinc-900/80 border border-indigo-900/20 rounded-lg">
          <Label className="text-sm font-medium text-zinc-200 mb-3 block">
            Distribución de Royalties
          </Label>

          <div className="relative h-9 bg-zinc-800 rounded-md overflow-hidden mb-2">
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
                "bg-indigo-600",
                "bg-purple-600",
                "bg-blue-600",
                "bg-cyan-600",
                "bg-teal-600",
                "bg-green-600",
                "bg-emerald-600",
                "bg-yellow-600",
                "bg-amber-600",
                "bg-orange-600",
                "bg-red-600",
                "bg-pink-600",
              ];

              return (
                <div
                  key={index}
                  className={`absolute top-0 h-full ${
                    colors[index % colors.length]
                  } transition-all duration-300 ease-in-out`}
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
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white cursor-help">
                          {collab.name.slice(0, 8)}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-100">
                        <p>
                          {collab.name}: {collab.royalties}%
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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
      <div className="space-y-4">
        {collaborators.map((collaborator, index) => (
          <div
            key={index}
            className="p-4 rounded-lg bg-gradient-to-br from-zinc-900/90 to-zinc-900/80 border border-indigo-900/20 hover:shadow-md hover:shadow-indigo-900/5 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-zinc-200">
                {index === 0
                  ? tNft("mainArtist")
                  : index === 1
                  ? "Tuneport (Plataforma)"
                  : `${tNft("collaborator")} ${index - 1}`}
              </Label>

              {index > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCollaborator(index)}
                  className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-100 hover:bg-red-900/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {index < 2 ? (
                <div className="md:col-span-2">
                  <Label htmlFor={`name-${index}`} className="sr-only">
                    Nombre
                  </Label>
                  <Input
                    id={`name-${index}`}
                    placeholder={tForms("nameLabel")}
                    value={collaborator.name}
                    onChange={(e) =>
                      handleCollaboratorUpdate(index, "name", e.target.value)
                    }
                    disabled={index === 1}
                    className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
                  />
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor={`name-${index}`} className="sr-only">
                      Nombre
                    </Label>
                    <Input
                      id={`name-${index}`}
                      placeholder={tForms("nameLabel")}
                      value={collaborator.name}
                      onChange={(e) =>
                        handleCollaboratorUpdate(index, "name", e.target.value)
                      }
                      className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`address-${index}`} className="sr-only">
                      Dirección de Wallet
                    </Label>
                    <Input
                      id={`address-${index}`}
                      placeholder={tForms("walletAddressPlaceholder")}
                      value={collaborator.address}
                      onChange={(e) =>
                        handleCollaboratorUpdate(
                          index,
                          "address",
                          e.target.value
                        )
                      }
                      className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500"
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
                    placeholder={tForms("royaltiesPercent")}
                    value={collaborator.royalties}
                    onChange={(e) => handleRoyaltyChange(index, e.target.value)}
                    disabled={index === 0 || index === 1}
                    className="bg-zinc-800/50 border-zinc-700 focus:border-indigo-600 text-zinc-100 placeholder:text-zinc-500 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-zinc-400 text-sm">
                    %
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Botón para agregar colaborador */}
      {collaborators.length < 12 && (
        <Button
          type="button"
          variant="outline"
          onClick={addCollaborator}
          className="w-full bg-gradient-to-r from-indigo-900/30 to-purple-900/30 border-indigo-800/30 text-zinc-100 hover:bg-gradient-to-r hover:from-indigo-800/40 hover:to-purple-800/40 hover:border-indigo-700/50 transition-all"
        >
          <Plus className="h-4 w-4 mr-2" /> Añadir Colaborador
        </Button>
      )}
    </div>
  );
}
