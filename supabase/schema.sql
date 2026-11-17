-- =============================================================================
-- GRUPO COMERCIALIZADORA FERCO - GERENCIA DE INTELIGENCIA DE NEGOCIOS Y TECNOLOGÍA
-- Esquema de Base de Datos Supabase (PostgreSQL) para Hub Operativo TI/BI (ITSM)
-- Ejecuta este script en el SQL Editor de tu proyecto en Supabase
-- =============================================================================

-- 1. Habilitar extensión para UUIDs si no existe
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Crear tabla principal de tickets
CREATE TABLE IF NOT EXISTS public.tickets_ti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_ticket SERIAL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  solicitante_nombre TEXT NOT NULL,
  departamento_tienda TEXT NOT NULL,
  categoria TEXT NOT NULL CHECK (
    categoria IN (
      'Infraestructura / Redes / Starlink',
      'Odoo ERP / TPV Tiendas',
      'Business Intelligence / Reportes',
      'Hardware / Impresoras / Equipos',
      'Accesos / Google Workspace',
      'Desarrollo / Automatización'
    )
  ),
  titulo TEXT NOT NULL,
  descripcion TEXT NOT NULL DEFAULT '',
  impacto SMALLINT NOT NULL DEFAULT 1 CHECK (impacto BETWEEN 1 AND 3),
  urgencia SMALLINT NOT NULL DEFAULT 1 CHECK (urgencia BETWEEN 1 AND 3),
  score_prioridad SMALLINT GENERATED ALWAYS AS (impacto * urgencia) STORED,
  estado TEXT NOT NULL DEFAULT 'Bandeja de Entrada' CHECK (
    estado IN (
      'Bandeja de Entrada',
      'En Cola',
      'En Progreso',
      'Esperando Proveedor/Tercero',
      'Resuelto'
    )
  ),
  asignado_a TEXT NOT NULL DEFAULT 'Luis Lugo - Analista BI/TI' CHECK (
    asignado_a IN (
      'Luis Lugo - Analista BI/TI',
      'Juan García - Gerente BI/TI',
      'Leonardo Semprun - Especialista de Soluciones de Negocio',
      'Plinio Becerra - Analista de Soluciones de Negocio'
    )
  ),
  notas_tecnicas TEXT DEFAULT '',
  fecha_resolucion TIMESTAMPTZ NULL
);

-- 3. Trigger automático para actualizar updated_at (crítico para detectar tickets >48h en Esperando Proveedor/Tercero)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.estado = 'Resuelto' AND OLD.estado IS DISTINCT FROM 'Resuelto' AND NEW.fecha_resolucion IS NULL THEN
    NEW.fecha_resolucion = now();
  ELSIF NEW.estado <> 'Resuelto' THEN
    NEW.fecha_resolucion = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tickets_ti_updated_at ON public.tickets_ti;
CREATE TRIGGER set_tickets_ti_updated_at
  BEFORE UPDATE ON public.tickets_ti
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 4. Índices para optimizar consultas del Kanban y KPIs
CREATE INDEX IF NOT EXISTS idx_tickets_ti_estado ON public.tickets_ti(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_ti_score_prioridad ON public.tickets_ti(score_prioridad DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_ti_created_at ON public.tickets_ti(created_at DESC);

-- 5. Configurar Row Level Security (RLS) permisivo para operación con Anon Key en intranet/portal
ALTER TABLE public.tickets_ti ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de tickets" ON public.tickets_ti;
CREATE POLICY "Permitir lectura de tickets"
  ON public.tickets_ti FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir creacion de tickets desde portal y quick-add" ON public.tickets_ti;
CREATE POLICY "Permitir creacion de tickets desde portal y quick-add"
  ON public.tickets_ti FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion de tickets en Centro de Comando" ON public.tickets_ti;
CREATE POLICY "Permitir actualizacion de tickets en Centro de Comando"
  ON public.tickets_ti FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 6. Activar Supabase Realtime para la tabla tickets_ti
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'tickets_ti'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets_ti;
  END IF;
END $$;
