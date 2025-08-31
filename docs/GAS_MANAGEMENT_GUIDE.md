# Gas Management Guide - Gestión de Gas

Esta guía explica las mejoras implementadas para el manejo de gas y prevención de errores de fondos insuficientes.

## 🔧 Mejoras Implementadas

### 1. Verificación Automática de Balance y Gas

Se agregó verificación automática antes de ejecutar transacciones que requieren gas:

- **`checkBalanceAndEstimateGas()`**: Función que verifica balance y estima costos
- **Verificación en tiempo real** antes de transacciones críticas
- **Mensajes detallados** con costos exactos y faltantes

### 2. Funciones con Verificación de Gas

Las siguientes funciones ahora verifican balance antes de ejecutar:

```typescript
// useRevenueShare hook
-createRevenueShare() - // Crear contrato RevenueShare
  configureCollectionSplits() - // Configurar distribución de ventas
  setMintSplitsForCurator() - // Configurar splits para curator
  setInheritance() - // Configurar herencia/cascada
  setCascadePercentage(); // Configurar porcentaje de cascada
```

### 3. Monitor de Balance

Se creó un componente `GasPayerBalanceMonitor` para monitorear el balance de la wallet de gas:

#### Uso Básico

```tsx
import { GasPayerBalanceMonitor } from "@Src/components/GasPayerBalanceMonitor";

// En tu componente
<GasPayerBalanceMonitor />;
```

#### Uso Avanzado

```tsx
<GasPayerBalanceMonitor
  warningThreshold={0.002} // Advertencia cuando < 0.002 ETH
  criticalThreshold={0.001} // Crítico cuando < 0.001 ETH
  refreshInterval={15000} // Actualizar cada 15 segundos
  compact={true} // Vista compacta
  autoRefresh={true} // Auto-actualización
/>
```

#### Modo Compacto

```tsx
// Para usar en headers o toolbars
<GasPayerBalanceMonitor compact />
```

## 🚨 Manejo de Errores

### Antes (Problema)

```
Error: insufficient funds for transfer
Details: insufficient funds for transfer
```

### Después (Solución)

```
❌ Fondos insuficientes para crear RevenueShare.
   Balance actual: 0.000000 ETH
   Gas estimado necesario: 0.002154 ETH
   Faltan: 0.002154 ETH

   Por favor, transfiere al menos 0.002154 ETH a la cuenta: 0xea049eF29ef59ce889Dfedffbb655BaDc734bD42
```

## 🔄 Flujo de Verificación

1. **Antes de transacción**: Se verifica balance y estima gas
2. **Si fondos suficientes**: Continúa con la transacción
3. **Si fondos insuficientes**:
   - Muestra error detallado con cantidad exacta faltante
   - Proporciona dirección de la wallet para transferencia
   - No ejecuta la transacción

## 💰 Función de Verificación Manual

```typescript
const { checkGasPayerBalance } = useRevenueShare();

// Verificar balance manualmente
const balanceInfo = await checkGasPayerBalance();
if (balanceInfo) {
  console.log(`Balance: ${balanceInfo.balance} ETH`);
  console.log(`Address: ${balanceInfo.address}`);
}
```

## 🔧 Configuración de Umbrales

En el componente monitor puedes configurar:

- **`warningThreshold`**: Umbral de advertencia (default: 0.001 ETH)
- **`criticalThreshold`**: Umbral crítico (default: 0.0005 ETH)
- **`refreshInterval`**: Intervalo de actualización (default: 30000 ms)

## 📝 Ejemplo de Implementación

### En una página de administración:

```tsx
import { GasPayerBalanceMonitor } from "@Src/components/GasPayerBalanceMonitor";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1>Panel de Administración</h1>

      {/* Monitor de balance */}
      <GasPayerBalanceMonitor
        warningThreshold={0.005}
        criticalThreshold={0.002}
      />

      {/* Resto del contenido */}
    </div>
  );
}
```

### En el header (compacto):

```tsx
import { GasPayerBalanceMonitor } from "@Src/components/GasPayerBalanceMonitor";

export default function Header() {
  return (
    <header className="flex justify-between items-center">
      <h1>Mi App</h1>

      {/* Monitor compacto */}
      <GasPayerBalanceMonitor compact />
    </header>
  );
}
```

## 🛠️ Variables de Entorno

Asegúrate de tener configurada la variable:

```env
NEXT_PUBLIC_GAS_PAYER_PRIVATE_KEY=tu_clave_privada_aqui
```

⚠️ **Seguridad**: Esta clave debe tener fondos suficientes pero limitados para pagar gas.

## 📊 Información de Debugging

Ahora en la consola verás información detallada:

```
🔍 Verificando balance y estimando costos...
💰 Balance actual: 0.001234 ETH
⛽ Gas estimado: 150000
⛽ Precio del gas: 1000000000 wei
💸 Costo estimado del gas: 0.00015 ETH
💸 Total requerido: 0.00015 ETH
```

## 🎯 Solución al Error Original

Para tu error específico:

1. La wallet `0xea049eF29ef59ce889Dfedffbb655BaDc734bD42` necesita más ETH
2. Ahora el sistema te dirá exactamente cuánto falta
3. Puedes usar el monitor para vigilar el balance continuamente
4. Las transacciones no fallarán inesperadamente

### Transferir ETH a la Gas Payer Wallet

```bash
# Desde tu wallet principal, envía ETH a:
# 0xea049eF29ef59ce889Dfedffbb655BaDc734bD42

# Cantidad recomendada: 0.01 ETH (para múltiples transacciones)
```

## 🚀 Próximos Pasos

1. **Agrega el monitor** en tu interfaz de administración
2. **Configura alertas** para cuando el balance esté bajo
3. **Automática recarga** (opcional): Implementar auto-transferencia desde wallet principal

¡Con estas mejoras, nunca más tendrás errores de fondos insuficientes sin saber el motivo exacto!
