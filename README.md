# Invitación de boda · Tania & Raymundo

Next.js 16 + Supabase. Cada familia tiene su propia URL: `tudominio.com/familia-alba-garcia`
muestra la invitación con su nombre, los lugares asignados y el formulario para confirmar.
`tudominio.com/` muestra la invitación general sin confirmación.

## Correr en local

```bash
npm install
npm run dev
```

Sin variables de Supabase la app usa familias de ejemplo en memoria:
`/demo`, `/familia-alba-garcia`, `/familia-garcia-leon` y el panel en `/admin`.

## Supabase

1. Crea un proyecto en Supabase y ejecuta `supabase/schema.sql` en el SQL Editor.
2. Copia `.env.example` a `.env.local` y llena las llaves (Project Settings → API).
3. **Usuarios del panel:** en Authentication → Users → *Add user*, crea la cuenta de Tania (y
   quien más ayude) con correo y contraseña, y agrega esos correos a `ADMIN_EMAILS`.
   Recomendado: en Authentication → Sign In / Providers desactiva *Allow new users to sign up*.
4. Entra a `/admin` para dar de alta familias, sus invitados y su teléfono.

La URL de cada familia tolera mayúsculas, espacios y acentos: `/Familia Alba García` redirige a `/familia-alba-garcia`.

## Panel `/admin`

- Resumen: invitados, confirmados, no asistirán, pendientes y últimas respuestas.
- Familias: agregar, editar y eliminar; buscar por familia, invitado o teléfono; filtrar por estado.
- Por familia: copiar su enlace, enviarlo por WhatsApp con mensaje listo, ver quién confirmó.
- Exportar a Excel (CSV) con una fila por invitado.

Seguridad: solo entran correos de `ADMIN_EMAILS` con sesión válida de Supabase; cada página y
acción del panel lo verifica en el servidor. La tabla tiene RLS sin políticas, así que la llave
pública no puede leer ni escribir datos.

Sin variables de Supabase, en local el panel abre en **modo demo** (sin login, datos de ejemplo
en memoria). En producción ese modo nunca se activa.

## Contenido

Todo el texto de la invitación (nombres, horarios, padres, hoteles, mesa de regalos, canción)
está en `src/lib/boda.ts`. Las fotos del Save the Date están en `public/fotos/`.
