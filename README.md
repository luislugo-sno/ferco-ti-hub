# Hub Operativo TI/BI — Grupo Comercializadora Ferco

Aplicación Web Progresiva (PWA) desarrollada en **React + Vite + TailwindCSS + Lucide Icons + Supabase (`@supabase/supabase-js`)** para la **Gerencia de Inteligencia de Negocios y Tecnología** de **Grupo Comercializadora Ferco**.

## Características Principales

1. **Header Institucional y Control de Acceso por PIN**:
   - Identidad corporativa con soporte para `/public/gcf_logo.png` y fallback vectorial automático (`GCF FERCO`).
   - Switch de navegación entre **Nuevo Requerimiento (`/solicitar`)**, **Centro de Comando (`/comando`)** y **Métricas / KPIs (`/metricas`)**.
   - Protección con PIN rápido (por defecto `1234`, configurable vía `.env` en `VITE_ADMIN_PIN` o directamente desde el panel de KPIs).

2. **Portal de Solicitud Externa (`/solicitar`)**:
   - Selector de Departamento/Tienda con opción **"Otro"** y campo de texto libre condicional.
   - Matriz interactiva **Impacto (1–3) × Urgencia (1–3)** explicada en lenguaje de usuario con previsualización en vivo del **Score de Prioridad (1 a 9)**.
   - Confirmación inmediata con código único formateado (`FER-TI-00X`).

3. **Centro de Comando del Ingeniero (`/comando`)**:
   - **Captura Rápida (Quick-Add < 5s)**: Input de una sola línea con selección de categoría en 1 clic y guardado inmediato con `Enter`.
   - **Modo "Foco / Fuego Hoy"**: Filtra exclusivamente tareas `'En Progreso'` o críticas con `score_prioridad >= 6` (P1/P2).
   - **Tablero Kanban Interactivo por Estado** (`Bandeja de Entrada`, `En Cola`, `En Progreso`, `Esperando Proveedor/Tercero`, `Resuelto`) con soporte Drag & Drop y avance en 1 clic.
   - **Alerta Visual de WIP Limit**: Si hay más de **3 tareas** simultáneas en `'En Progreso'`, la columna se resalta con borde rojo/ámbar de saturación.
   - **Alerta de Proveedor (>48h)**: Resalta automáticamente los tickets estancados por más de 48 horas desde `updated_at` en `'Esperando Proveedor/Tercero'`.
   - **Suscripción Realtime**: Canal `supabase.channel('tickets_ti_realtime_hub')` sincronizado al instante.

4. **Dashboard Ejecutivo de Carga y KPIs (`/metricas`)**:
   - Tarjetas resumen: Total tickets activos, Resueltos en la semana, Bloqueados por terceros (>48h) y comparativa **Odoo vs Infraestructura vs BI**.
   - Desglose por especialista (`Luis Lugo`, `Plinio Becerra`, `Leonardo Semprún`, `Cristina Núñez`, `Marinés González`, `Juan García`).
   - Exportación directa a **Excel / CSV** (codificación UTF-8 con BOM).

---

## Puesta en Marcha

### 1. Configurar Base de Datos en Supabase
Ejecuta el script SQL ubicado en [`supabase/schema.sql`](./supabase/schema.sql) dentro del **SQL Editor** de tu proyecto en Supabase.

### 2. Variables de Entorno
Copia el archivo `.env.example` a `.env` y completa tus credenciales:
```bash
cp .env.example .env
```
> **Nota:** Si aún no has configurado `.env`, la aplicación activa automáticamente el **Modo Local / Demo Sincronizado** (con datos semilla reales de Ferco y sincronización entre pestañas vía `BroadcastChannel`) para que puedas probar todos los flujos de inmediato.

### 3. Instalar y Ejecutar
```bash
npm install
npm run dev
```

### 4. Despliegue en Netlify
El proyecto ya incluye `public/_redirects` con `/* /index.html 200` para soportar rutas SPA (`/solicitar`, `/comando`, `/metricas`).
