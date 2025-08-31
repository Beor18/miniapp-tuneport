# 🚀 Guía de Configuración - Neynar User Quality Filter & TipButton

Esta guía explica cómo configurar las nuevas funcionalidades implementadas usando las APIs de Neynar.

## ✅ **Funcionalidades Implementadas**

### 1. **User Quality Filter**

- ✅ Filtra automáticamente el feed ForYou por calidad de usuarios
- ✅ Usa el contrato onchain de Neynar en Base Mainnet
- ✅ Solo muestra contenido de usuarios top 50% o mejor
- ✅ Elimina bots y spam automáticamente

### 2. **TipButton**

- ✅ Permite enviar tips en USDC a artistas
- ✅ Integrado en las tarjetas de música
- ✅ Opciones de $1, $5, $10, $25 USDC
- ✅ Usa la API de Neynar para envío de fungibles

## 📋 **Cómo Obtener las Claves**

### **NEYNAR_API_KEY**

1. Ve a [neynar.com](https://neynar.com)
2. Crea una cuenta o inicia sesión
3. Ve al dashboard y obtén tu API key
4. Asegúrate de tener el plan pagado para acceso completo

### **FARCASTER_SIGNER_UUID**

1. En el dashboard de Neynar, ve a "Signers"
2. Crea un nuevo signer o usa uno existente
3. Copia el UUID del signer

## 🎯 **Archivos Creados/Modificados**

### **Nuevos Archivos:**

- `src/lib/hooks/useUserQuality.ts` - Hook para User Quality Filter
- `src/components/TipButton.tsx` - Componente para tips
- `src/app/api/neynar/tips/route.ts` - API route para tips

### **Archivos Modificados:**

- `src/app/[locale]/foryou/page.tsx` - Agregado campo artist_wallet
- `src/components/cardMusicHome/index.tsx` - Integración de filtro y TipButton

## 🚀 **Cómo Funciona**

### **User Quality Filter:**

1. Extrae direcciones de wallet de artistas
2. Consulta el contrato de Neynar en Base para obtener scores
3. Filtra automáticamente solo usuarios con score ≥ 500,000 (top 50%)
4. Reduce spam y mejora la calidad del contenido

### **TipButton:**

1. Usuario hace click en el botón de tips ($)
2. Se muestra menú con opciones de cantidad
3. Usuario selecciona cantidad (1, 5, 10, 25 USDC)
4. Se envía tip usando la API de Neynar
5. Se muestra confirmación de éxito

## 🔥 **Beneficios Inmediatos**

- ✅ **Mejor UX**: Feed más limpio sin spam
- ✅ **Monetización**: Artists reciben tips directos
- ✅ **Sin Backend**: Todo usa APIs de Neynar
- ✅ **Real-time**: Filtrado automático
- ✅ **Escalable**: Funciona con plan pagado de Neynar

## 🛠️ **Testing**

1. Configura las variables de entorno
2. Reinicia el servidor de desarrollo
3. Ve a `/foryou` - el feed debería filtrar automáticamente
4. Prueba el botón de tips en las tarjetas de música
5. Verifica en el dashboard de Neynar que los tips se envíen

## 📊 **Umbrales de Calidad Configurados**

```typescript
QUALITY_THRESHOLDS = {
  TOP_5_PERCENT: 950000, // Premium users
  TOP_20_PERCENT: 800000, // High quality users
  TOP_50_PERCENT: 500000, // Average users (filtro actual)
  MINIMUM: 100000, // Minimum to filter bots
};
```

## 🔄 **Próximos Pasos Opcionales**

1. **Ajustar umbrales**: Cambia `TOP_50_PERCENT` por `TOP_20_PERCENT` para filtro más estricto
2. **Agregar metrics**: Monitorear efectividad del filtro
3. **Personalización**: Permitir a usuarios ajustar nivel de filtro
4. **Notificaciones**: Usar webhooks de Neynar para tips recibidos

## 🆘 **Troubleshooting**

### **Error "NEYNAR_API_KEY not configured"**

- Verifica que la variable esté en `.env.local`
- Reinicia el servidor de desarrollo

### **Tips no se envían**

- Verifica `FARCASTER_SIGNER_UUID`
- Asegúrate de tener plan pagado de Neynar
- Revisa los logs del servidor

### **Feed no se filtra**

- El filtro se aplica después de cargar los datos
- Verifica la consola del navegador para errores
- El contrato funciona solo en Base Mainnet

---

**Estado**: ✅ Implementado y listo para usar  
**Versión**: MVP con APIs de Neynar  
**Última actualización**: Diciembre 2024
