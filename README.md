# App Libros

Marketplace móvil para reventa de libros con secciones de Publicar, Reventa, Comunidades y Perfil.

## Requisitos
- Node.js LTS
- Expo CLI (se instala con `npm install` y se ejecuta con `npx expo`)

## Configuración rápida
1. Instala dependencias:

```bash
npm install
```

2. Crea tu archivo de entorno:

```powershell
Copy-Item .env.example .env
```

3. En Supabase, crea las tablas usando `supabase/schema.sql`.

4. Desactiva RLS temporalmente o crea políticas de lectura/escritura para la clave anónima.

5. Ejecuta la app:

```bash
npm run start
```

## Estructura
- `App.tsx` navegación con 4 pestañas.
- `src/screens` contiene las pantallas principales.
- `src/services` integra Supabase.
- `supabase/schema.sql` define las tablas base.

## Notas
- Sin autenticación por ahora, el botón **Unirse** a comunidades se guarda solo en memoria local.
- Para perfil se guarda localmente hasta que se integre autenticación.

