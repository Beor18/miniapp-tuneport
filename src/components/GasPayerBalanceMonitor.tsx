"use client";

import { useState, useEffect } from "react";
import { useRevenueShare } from "@Src/lib/contracts/erc1155/useRevenueShare";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@Src/ui/ui/card";
import { Badge } from "@Src/ui/ui/badge";
import { Button } from "@Src/ui/ui/button";
import { AlertTriangle, Wallet, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface GasPayerBalanceMonitorProps {
  /**
   * Umbral mínimo de balance en ETH para mostrar advertencia
   * @default 0.001
   */
  warningThreshold?: number;

  /**
   * Umbral crítico de balance en ETH para mostrar alerta
   * @default 0.0005
   */
  criticalThreshold?: number;

  /**
   * Intervalo de actualización automática en milisegundos
   * @default 30000 (30 segundos)
   */
  refreshInterval?: number;

  /**
   * Si mostrar el componente de forma compacta
   * @default false
   */
  compact?: boolean;

  /**
   * Si auto-actualizar el balance
   * @default true
   */
  autoRefresh?: boolean;
}

/**
 * Componente para monitorear el balance de la wallet que paga el gas
 * Muestra el balance actual y alertas cuando está bajo
 */
export function GasPayerBalanceMonitor({
  warningThreshold = 0.001,
  criticalThreshold = 0.0005,
  refreshInterval = 30000,
  compact = false,
  autoRefresh = true,
}: GasPayerBalanceMonitorProps) {
  const { checkGasPayerBalance } = useRevenueShare();
  const [balance, setBalance] = useState<number | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const updateBalance = async () => {
    setIsLoading(true);
    try {
      const result = await checkGasPayerBalance();
      if (result) {
        setBalance(result.balance);
        setAddress(result.address);
        setLastUpdate(new Date());
      } else {
        setBalance(null);
        setAddress(null);
      }
    } catch (error) {
      console.error("Error checking gas payer balance:", error);
      toast.error("Error verificando balance de gas payer");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Cargar balance inicial
    updateBalance();

    // Configurar auto-refresh si está habilitado
    if (autoRefresh) {
      const interval = setInterval(updateBalance, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const getBalanceStatus = () => {
    if (balance === null) return "unknown";
    if (balance <= criticalThreshold) return "critical";
    if (balance <= warningThreshold) return "warning";
    return "good";
  };

  const getStatusColor = () => {
    const status = getBalanceStatus();
    switch (status) {
      case "critical":
        return "destructive";
      case "warning":
        return "outline";
      case "good":
        return "default";
      default:
        return "secondary";
    }
  };

  const getStatusText = () => {
    const status = getBalanceStatus();
    switch (status) {
      case "critical":
        return "Crítico";
      case "warning":
        return "Bajo";
      case "good":
        return "Suficiente";
      default:
        return "Desconocido";
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      try {
        if (typeof window !== "undefined" && navigator.clipboard) {
          await navigator.clipboard.writeText(address);
          toast.success("Dirección copiada al portapapeles");
        } else {
          // Fallback para navegadores que no soportan clipboard API
          const textArea = document.createElement("textarea");
          textArea.value = address;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand("copy");
          document.body.removeChild(textArea);
          toast.success("Dirección copiada al portapapeles");
        }
      } catch (error) {
        console.error("Error copying address:", error);
        toast.error("Error al copiar dirección");
      }
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 p-2 border rounded-lg bg-background">
        <Wallet className="h-4 w-4" />
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {balance !== null ? `${balance.toFixed(6)} ETH` : "---"}
          </span>
          <Badge variant={getStatusColor()} size="sm">
            {getStatusText()}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={updateBalance}
          disabled={isLoading}
          className="h-6 w-6 p-0"
        >
          <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            <CardTitle className="text-lg">Gas Payer Balance</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={updateBalance}
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Actualizar
          </Button>
        </div>
        <CardDescription>
          Balance de la wallet que paga el gas de transacciones
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Balance Display */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-2xl font-bold">
              {balance !== null ? `${balance.toFixed(6)} ETH` : "---"}
            </p>
            <p className="text-sm text-muted-foreground">
              {lastUpdate
                ? `Actualizado: ${lastUpdate.toLocaleTimeString()}`
                : "Sin datos"}
            </p>
          </div>
          <Badge variant={getStatusColor()}>{getStatusText()}</Badge>
        </div>

        {/* Address */}
        {address && (
          <div>
            <p className="text-sm text-muted-foreground mb-1">Dirección:</p>
            <Button
              variant="outline"
              className="w-full justify-start font-mono text-xs"
              onClick={copyAddress}
            >
              {formatAddress(address)}
            </Button>
          </div>
        )}

        {/* Status Alerts */}
        {balance !== null && balance <= criticalThreshold && (
          <div className="flex items-start gap-2 p-3 border border-destructive/20 bg-destructive/5 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-destructive">Balance crítico</p>
              <p className="text-muted-foreground">
                El balance está por debajo del umbral crítico (
                {criticalThreshold} ETH). Las transacciones fallarán por fondos
                insuficientes.
              </p>
            </div>
          </div>
        )}

        {balance !== null &&
          balance <= warningThreshold &&
          balance > criticalThreshold && (
            <div className="flex items-start gap-2 p-3 border border-orange-200 bg-orange-50 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange-800">Balance bajo</p>
                <p className="text-orange-700">
                  El balance está por debajo del umbral de advertencia (
                  {warningThreshold} ETH). Considera transferir más ETH pronto.
                </p>
              </div>
            </div>
          )}

        {/* Thresholds Info */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground mb-2">
            Umbrales configurados:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-orange-600">Advertencia:</span>{" "}
              {warningThreshold} ETH
            </div>
            <div>
              <span className="text-destructive">Crítico:</span>{" "}
              {criticalThreshold} ETH
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default GasPayerBalanceMonitor;
