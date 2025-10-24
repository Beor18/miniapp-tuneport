import { NextRequest, NextResponse } from "next/server";
import { createFacilitatorConfig } from "@coinbase/x402";
import { exact } from "x402/schemes";
import { useFacilitator } from "x402/verify";

export const runtime = "nodejs";

// Configuración x402 (a nivel módulo)
const facilitator = createFacilitatorConfig(
  process.env.CDP_API_KEY_ID!,
  process.env.CDP_API_KEY_SECRET!
);
// eslint-disable-next-line react-hooks/rules-of-hooks
const { verify, settle } = useFacilitator(facilitator);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get("contentId");

  if (!contentId) {
    return NextResponse.json(
      { error: "contentId es requerido" },
      { status: 400 }
    );
  }

  // Obtener configuración desde el backend
  const BACKEND_URL = process.env.API_ELEI || "http://localhost:3001";
  const configResponse = await fetch(
    `${BACKEND_URL}/api/x402/config/${contentId}`
  );

  if (!configResponse.ok) {
    return NextResponse.json(
      { error: "No se pudo obtener configuración del contenido" },
      { status: 500 }
    );
  }

  const config = await configResponse.json();

  // Si no es premium, devolver error
  if (!config.price || !config.recipientAddress) {
    return NextResponse.json(
      { error: "Este contenido no es premium" },
      { status: 400 }
    );
  }

  // Configurar payment requirements con datos del backend
  const priceInCents = parseFloat(config.price.replace("$", "")) * 1000000; // Convertir a 6 decimales USDC

  // 💰 CDP: Payments van a TunePort CDP Wallet, no al artista directamente
  // El backend se encargará de distribuir automáticamente con CDP SDK
  const cdpAgentWallet =
    process.env.CDP_AGENT_ADDRESS ||
    "0x51BDDE596DFC63a46E501C2F3dC3D24FAFa50dEF"; // Fallback temporal

  const paymentRequirements = {
    scheme: "exact" as const,
    network: (config.network || "base") as "base",
    maxAmountRequired: Math.floor(priceInCents).toString(),
    resource: request.url,
    description: config.description || "Contenido premium",
    mimeType: "application/json",
    payTo: cdpAgentWallet as `0x${string}`, // 👈 TunePort CDP Wallet
    maxTimeoutSeconds: 300,
    asset: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
    extra: {
      name: "USD Coin",
      version: "2",
      chainId: 8453,
      verifyingContract:
        "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as `0x${string}`,
    },
  };

  const paymentHeader = request.headers.get("X-PAYMENT");

  if (!paymentHeader) {
    return NextResponse.json(
      {
        x402Version: 1,
        error: "Payment required",
        accepts: [paymentRequirements],
      },
      { status: 402 }
    );
  }

  // Verificar y liquidar
  try {
    const decodedPayment = exact.evm.decodePayment(paymentHeader);
    decodedPayment.x402Version = 1;

    const verification = await verify(decodedPayment, paymentRequirements);
    if (!verification.isValid) {
      return NextResponse.json(
        {
          x402Version: 1,
          error: verification.invalidReason,
          accepts: [paymentRequirements],
        },
        { status: 402 }
      );
    }

    const settlement = await settle(decodedPayment, paymentRequirements);
    if (!settlement.success) {
      return NextResponse.json(
        {
          x402Version: 1,
          error: "Settlement failed",
          accepts: [paymentRequirements],
        },
        { status: 402 }
      );
    }

    console.log("✅ Payment settled successfully:", settlement.transaction);

    // ✅ Pago exitoso - devolver contenido + info para registro
    return NextResponse.json({
      success: true,
      message: "¡Contenido desbloqueado con x402!",
      contentId,
      content: {
        title: `Contenido Premium`,
        message: "Pago verificado correctamente",
        contentType: config.contentType || "album", // ✅ Incluir tipo de contenido
      },
      payment: {
        verified: true,
        transaction: settlement.transaction,
        paidAmount: config.price,
        network: config.network || "base",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment failed" },
      { status: 402 }
    );
  }
}
