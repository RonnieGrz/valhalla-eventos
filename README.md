# Valhalla Eventos

Web app para gestionar los ingresos de los eventos de Valhalla Eventos: configuración de
localidades y palcos, venta/reserva de palcos y boletas sueltas con abonos parciales, e
historial de pagos. Incluye un dashboard en tiempo real con el estado de las ventas.

## Stack

- Vite + React + TypeScript
- Firebase (Firestore + Auth + Hosting)
- Tailwind CSS
- react-router-dom, react-hook-form + zod, recharts

## Configuración inicial

### 1. Crear el proyecto de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/) y crea un proyecto nuevo.
2. Activa **Firestore Database** (modo producción).
3. Activa **Authentication** → método **Correo electrónico/contraseña**.
4. Crea manualmente en la consola de Auth las cuentas del equipo que van a usar la app
   (no hay registro público — es intencional).
5. En **Configuración del proyecto → General → Tus apps**, crea una app web y copia las
   credenciales (`apiKey`, `authDomain`, `projectId`, etc.).

### 2. Variables de entorno

Copia `.env.example` a `.env.local` y pega las credenciales del paso anterior:

```
cp .env.example .env.local
```

### 3. Reglas e índices de Firestore

**Este paso es obligatorio** — sin él, Firestore rechaza todas las lecturas/escrituras
(por defecto un proyecto nuevo niega todo) y la app se queda "sin hacer nada" al crear
eventos, localidades, etc.

Este repo ya incluye `firestore.rules` (acceso solo para usuarios autenticados),
`firestore.indexes.json` (índice necesario para el gráfico de recaudo en el tiempo) y
`firebase.json` / `.firebaserc` apuntando al proyecto `valhalla-eventos`. Solo falta
publicarlos con la [Firebase CLI](https://firebase.google.com/docs/cli) (no hace falta
instalarla globalmente, `npx` la descarga on-demand):

```
npx firebase-tools login
npx firebase-tools deploy --only firestore:rules,firestore:indexes
```

`login` abre el navegador para que inicies sesión con la cuenta de Google dueña del
proyecto — es un paso interactivo que debes hacer tú. Alternativa sin CLI: pega el
contenido de `firestore.rules` en **Firebase Console → Firestore Database → pestaña
Reglas → Publicar** (el índice del gráfico de recaudo no se puede crear así; si no usas
la CLI, Firestore te mostrará un enlace para crearlo automáticamente la primera vez que
el dashboard intente esa consulta).

### 4. Instalar y correr

```
npm install
npm run dev
```

## Modelo de datos

Ver `src/types/index.ts` para el detalle completo. Resumen:

```
events/{eventId}
  └─ localities/{localityId}      (palcosConfig + boletasConfig; localidad puede ser mixta)
       ├─ palcos/{palcoId}
       │    └─ payments/{paymentId}
       └─ boletaSales/{saleId}
            └─ payments/{paymentId}
```

Cada `payment` guarda también `eventId` y `localidadId` (denormalizado) para poder hacer
una consulta `collectionGroup` eficiente y alimentar el gráfico de recaudo en el tiempo
del dashboard.

## Flujo de uso

1. Inicia sesión con una cuenta creada en Firebase Auth.
2. Crea un evento (nombre, lugar, fecha).
3. Dentro del evento, crea sus localidades: cada una puede tener palcos (cantidad,
   capacidad y precio por palco), boletas sueltas en preventa (aforo y precio unitario),
   o ambas.
4. En la vista de la localidad: haz clic en un palco disponible para reservarlo (nombre,
   cédula, teléfono y abono inicial opcional), o registra una venta de boletas sueltas.
5. Desde el detalle de un palco o una venta puedes ir agregando abonos; el estado pasa
   automáticamente de "separado" a "vendido" cuando se completa el pago.
6. El Dashboard del evento muestra en tiempo real los conteos de palcos y boletas por
   estado, el recaudo por localidad y el recaudo acumulado en el tiempo.

## Fuera de alcance (v1)

- Módulo de gastos (solo se gestionan ingresos).
- Roles/permisos diferenciados por usuario — cualquier cuenta autenticada tiene acceso
  completo.
- Impresión de boletas, códigos QR, notificaciones o reportes exportables.

## Notas técnicas

- Los datos se sincronizan en tiempo real con listeners de Firestore (`onSnapshot`), no
  hace falta refrescar la página para ver cambios de otro dispositivo.
- El aforo de boletas sueltas se valida contra los registros existentes al momento de la
  venta; en uso concurrente muy simultáneo (dos personas vendiendo la última boleta a la
  vez) es teóricamente posible una sobreventa puntual — aceptable para el volumen de un
  solo equipo de taquilla.
