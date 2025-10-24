# Guía para Artistas: Configurar Contenido Premium

## 🎯 ¿Qué es el Contenido Premium?

El contenido premium permite a los artistas monetizar sus tracks o álbumes directamente mediante micropagos en USDC (Base blockchain). Los fans pagan una única vez para desbloquear el contenido permanentemente.

---

## 💡 Casos de Uso

### Para Tracks Individuales

- **Demos exclusivos**: Versiones especiales solo para fans
- **Tracks bonus**: Contenido extra del álbum
- **Versiones instrumentales**: Sin voz para productores
- **Remixes exclusivos**: Versiones únicas

### Para Álbumes Completos

- **Álbumes deluxe**: Versión premium con extras
- **Lanzamientos anticipados**: Early access para fans
- **Contenido detrás de cámaras**: Making of + tracks

---

## 🎨 Interfaz para Artistas

### Opción 1: Desde tu Panel de Control

**Ubicación**: Página de tu NFT/Álbum → Tab "Premium Settings"

1. Ve a tu track o álbum
2. Click en "Configurar Premium"
3. Completa el formulario:
   - ☑️ **Activar Premium**: Toggle ON
   - 💰 **Precio**: `$0.01` - `$1.00` (recomendado para música)
   - 🌐 **Red**: Base Sepolia (testing) o Base (producción)
   - 📝 **Descripción**: "Track exclusivo para fans"
4. Click en "Guardar Cambios"

### Opción 2: Integrar el Componente

```typescript
import { PremiumContentManager } from "@/components/admin/PremiumContentManager";

function MyTrackSettings({ trackId, currentConfig }: Props) {
  return (
    <div>
      <h2>Configuración del Track</h2>

      <PremiumContentManager
        contentId={trackId}
        contentType="nft"
        currentConfig={currentConfig}
        onSave={() => {
          // Refrescar datos
          console.log("Configuración guardada!");
        }}
      />
    </div>
  );
}
```

---

## 📋 Formulario de Configuración

### Campos del Formulario

#### 1. **Contenido Premium** (Toggle)

- **ON**: El contenido requiere pago
- **OFF**: El contenido es gratuito

#### 2. **Precio en USDC**

```
Precio sugerido por tipo:
- Track individual: $0.01 - $0.10
- Track exclusivo: $0.25 - $0.50
- Álbum completo: $0.50 - $2.00
- Contenido especial: $1.00 - $5.00
```

**Ejemplos**:

- `$0.01` = 1 centavo de dólar
- `$0.50` = 50 centavos
- `$1.00` = 1 dólar

#### 3. **Red de Blockchain**

- **Base Sepolia** (Testnet): Para probar antes de lanzar
- **Base** (Mainnet): Para producción real

⚠️ **Importante**: Prueba primero en Sepolia antes de activar en Base

#### 4. **Descripción**

Texto que verán los fans antes de pagar. Sé claro y atractivo:

✅ Buenos ejemplos:

- "Versión extendida con 2 minutos extras"
- "Track exclusivo de mi nuevo álbum"
- "Remix colaboración con [Artist]"
- "Instrumental para producers"

❌ Malos ejemplos:

- "Premium"
- "Paga por esto"
- "Track bloqueado"

---

## 🎬 Ejemplo Completo

### Marcar un Track como Premium

```typescript
// En tu página de edición de track
import { PremiumContentManager } from "@/components/admin/PremiumContentManager";

export default function EditTrackPage({ track }: { track: NFT }) {
  return (
    <div className="space-y-8">
      {/* Información básica del track */}
      <section>
        <h2>Información del Track</h2>
        {/* ... formulario existente ... */}
      </section>

      {/* Configuración Premium */}
      <section>
        <PremiumContentManager
          contentId={track._id}
          contentType="nft"
          currentConfig={{
            isPremium: track.isPremium,
            premiumPrice: track.premiumPrice,
            x402Config: track.x402Config,
          }}
          onSave={() => {
            toast.success("Track actualizado");
            // Refrescar datos del track
          }}
        />
      </section>
    </div>
  );
}
```

---

## 🛠️ Para Developers: Integración Manual

Si prefieres integrar manualmente sin el componente UI:

### Actualizar via API

```typescript
// PUT /api/nft/[nftId]
const response = await fetch(`${API_ELEI}/api/nft/${nftId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    isPremium: true,
    premiumPrice: "$0.01",
    x402Config: {
      isLocked: true,
      price: "$0.01",
      network: "base-sepolia",
      description: "Track exclusivo para fans",
      currency: "USDC",
    },
  }),
});
```

### Para Álbumes

```typescript
// PUT /api/collections/[collectionId]
const response = await fetch(`${API_ELEI}/api/collections/${collectionId}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    isPremiumAlbum: true,
    x402Config: {
      isLocked: true,
      price: "$0.50",
      network: "base-sepolia",
      description: "Álbum completo exclusivo",
      currency: "USDC",
    },
  }),
});
```

---

## 💰 ¿Cómo Recibo los Pagos?

### Configuración de Wallet

1. **Configura tu wallet** en las variables de entorno:

```bash
X402_WALLET_ADDRESS=0xTuWalletAddress
```

2. **Los pagos van directamente** a esta wallet en USDC (Base)

3. **Sin intermediarios**: 100% del pago va directo a ti

### Verificar Pagos

```bash
# Ver todos los pagos recibidos
curl ${API_ELEI}/api/x402/user-unlocks?address=0xTuWallet
```

---

## 📊 Analytics y Estadísticas

### Ver qué contenido genera más ingresos

```javascript
// En MongoDB
db.contentunlocks.aggregate([
  {
    $group: {
      _id: "$contentId",
      totalRevenue: { $sum: { $toDouble: "$paidAmount" } },
      totalUnlocks: { $sum: 1 },
    },
  },
  { $sort: { totalRevenue: -1 } },
  { $limit: 10 }, // Top 10 tracks
]);
```

### Dashboard de Analytics (próximamente)

Estamos trabajando en un dashboard donde podrás ver:

- 💰 Revenue total
- 📈 Tracks más vendidos
- 👥 Cantidad de fans que desbloquearon
- 📅 Gráficos de ventas por fecha

---

## ❓ FAQs

### ¿Puedo cambiar el precio después?

✅ Sí, pero solo afecta nuevos desbloqueos. Los fans que ya pagaron mantienen acceso.

### ¿Puedo hacer contenido gratuito después de premium?

✅ Sí, desactiva el toggle "Contenido Premium" y guarda.

### ¿Los fans pueden compartir el contenido desbloqueado?

❌ No, el desbloqueo está vinculado a la wallet del fan. Es personal e intransferible.

### ¿Qué pasa si un fan cambia de wallet?

Debe desbloquear nuevamente desde la nueva wallet. El desbloqueo no se transfiere.

### ¿Puedo ofrecer descuentos?

Actualmente no, pero es una feature planeada. Puedes ajustar el precio manualmente.

### ¿Cuánto cobran de comisión?

**0%** - Recibes 100% del pago. Solo pagas el gas fee de la transacción (muy bajo en Base).

---

## 🚀 Mejores Prácticas

### Precios Estratégicos

1. **Empieza bajo**: `$0.01` - `$0.10` para generar momentum
2. **Prueba en Sepolia** antes de activar en mainnet
3. **Comunica el valor**: Explica por qué vale la pena pagar

### Marketing

1. **Anuncia en redes**: "Nuevo track exclusivo en Tuneport"
2. **Teaser gratis**: Sube un preview de 30 segundos gratis
3. **Crea FOMO**: "Solo 100 copias disponibles" (con limits en el NFT)

### Experiencia del Fan

1. **Descripción clara**: Qué obtienen al pagar
2. **Precio justo**: No te pases, la idea es volumen
3. **Contenido de calidad**: Que valga la pena el pago

---

## 🎯 Próximos Pasos

1. **Prueba en testnet**: Usa Base Sepolia primero
2. **Marca un track como premium**: Usa el componente PremiumContentManager
3. **Comparte con fans**: Anuncia tu contenido exclusivo
4. **Monitorea ventas**: Revisa analytics en MongoDB
5. **Itera y mejora**: Ajusta precios basado en resultados

---

**¿Necesitas ayuda?** Consulta la documentación técnica o contacta soporte.
