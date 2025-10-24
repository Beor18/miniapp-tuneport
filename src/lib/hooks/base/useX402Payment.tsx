import { useState, useCallback } from "react";
import { useAppKitAccount, useWallets } from "@Src/lib/privy";
import { toast } from "sonner";
import { wrapFetchWithPayment, createSigner } from "x402-fetch";
import { createWalletClient, custom } from "viem";
import { base } from "viem/chains";
import type { X402ContentConfig, X402UnlockStatus } from "@Src/types/x402";

interface UseX402PaymentOptions {
  onSuccess?: (contentId: string, txHash: string) => void;
  onError?: (error: Error) => void;
}

export function useX402Payment(options?: UseX402PaymentOptions) {
  const { evmWalletAddress, isConnected } = useAppKitAccount();
  const { wallets } = useWallets();
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Verificar estado de desbloqueo desde el backend (vía proxy)
  const checkUnlockStatus = useCallback(
    async (contentId: string): Promise<X402UnlockStatus> => {
      if (!evmWalletAddress) {
        return {
          isUnlocked: false,
          hasPaid: false,
        };
      }

      try {
        // Usar ruta proxy de Next.js (evita CORS)
        const response = await fetch(
          `/api/x402/check-unlock/${contentId}?address=${evmWalletAddress}`
        );
        const data = await response.json();

        return {
          isUnlocked: data.isUnlocked || false,
          hasPaid: data.hasPaid || false,
          transactionHash: data.transactionHash,
          expiresAt: data.expiresAt,
        };
      } catch (error) {
        console.error("Error checking unlock status:", error);
        return {
          isUnlocked: false,
          hasPaid: false,
        };
      }
    },
    [evmWalletAddress]
  );

  // 💰 PAGO x402 DIRECTO - Usa CDP Facilitator para verificación real
  const unlockContent = useCallback(
    async (contentId: string, x402Config: X402ContentConfig) => {
      if (!evmWalletAddress) {
        throw new Error("Wallet not connected");
      }

      if (!x402Config.price) {
        throw new Error("Price not configured");
      }

      setIsUnlocking(true);

      try {
        // Obtener wallet EVM de Privy
        const evmWallet = wallets.find(
          (w: any) =>
            w.walletClientType === "privy" ||
            w.walletClientType === "coinbase_wallet" ||
            w.walletClientType === "metamask"
        );

        if (!evmWallet) {
          throw new Error("No EVM wallet found");
        }

        const provider = await evmWallet.getEthereumProvider();

        if (!provider) {
          throw new Error("No provider available");
        }

        // Crear WalletClient de viem - usar directamente la address de la wallet conectada
        const walletClient = createWalletClient({
          account: evmWallet.address as `0x${string}`,
          chain: base, // Base Mainnet
          transport: custom(provider),
        });

        // Wrap fetch with x402 payment handling
        // El walletClient de viem es compatible con x402-fetch (igual que Wagmi)
        // @ts-ignore - Type compatibility
        const fetchWithPayment = wrapFetchWithPayment(fetch, walletClient);

        // ✅ Usar query params en lugar de path dinámico (requerido por x402-next)
        const response = await fetchWithPayment(
          `/api/premium-content?contentId=${encodeURIComponent(contentId)}`,
          { method: "GET" }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          // Manejar errores específicos del facilitator
          if (errorData.reason) {
            const errorMessages: Record<string, string> = {
              insufficient_funds: "No tienes suficiente USDC en tu wallet",
              invalid_signature: "Firma inválida. Intenta de nuevo",
              payment_expired: "El pago expiró. Intenta de nuevo",
              invalid_amount: "El monto del pago es incorrecto",
              network_mismatch: "Red incorrecta. Verifica tu wallet",
            };

            throw new Error(
              errorMessages[errorData.reason] ||
                errorData.message ||
                `Error: ${errorData.reason}`
            );
          }

          throw new Error(
            errorData.message || `Payment failed: ${response.status}`
          );
        }

        const data = await response.json();

        // Registrar el unlock en el backend (vía proxy)
        if (data.success && data.payment) {
          try {
            await fetch(`/api/x402/register-unlock`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                contentId,
                contentType: data.content?.contentType || "album", // Tipo de contenido
                walletAddress: evmWalletAddress, // ✅ Corregido: walletAddress no "address"
                paymentResponse: data.payment, // ✅ Objeto completo de pago
                paidAmount: x402Config.price, // ✅ Precio desde la config
                network: data.payment.network || x402Config.network || "base",
                currency: x402Config.currency || "USDC",
              }),
            });
          } catch (registerError) {
            console.error("Error registering unlock:", registerError);
            // No lanzar error - el pago fue exitoso de todas formas
          }
        }

        toast.success("¡Pago exitoso!", {
          description: `Contenido desbloqueado: ${
            data.content?.title || contentId
          }`,
        });

        options?.onSuccess?.(
          contentId,
          data.payment?.transaction || "x402-verified"
        );
        return data;
      } catch (error) {
        toast.error("Error al procesar pago", {
          description:
            error instanceof Error ? error.message : "Payment failed",
        });
        options?.onError?.(error as Error);
        throw error;
      } finally {
        setIsUnlocking(false);
      }
    },
    [evmWalletAddress, wallets, options]
  );

  return {
    unlockContent,
    checkUnlockStatus,
    isUnlocking,
    hasWallet: !!evmWalletAddress && isConnected,
  };
}
