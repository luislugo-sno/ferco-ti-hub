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
  tipo_solicitud TEXT NOT NULL DEFAULT 'Soporte Técnico / TI',
  solicitante_nombre TEXT NOT NULL,
  departamento_tienda TEXT NOT NULL,
  categoria TEXT NOT NULL,
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
  asignado_a TEXT NOT NULL DEFAULT 'Luis Lugo - Analista BI/TI',
  nota_publica TEXT DEFAULT '',
  notas_tecnicas TEXT DEFAULT '',
  fecha_resolucion TIMESTAMPTZ NULL,
  imagenes_urls TEXT[] NOT NULL DEFAULT '{}',
  respuestas_extra JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 2.1 Migración segura si la tabla tickets_ti ya existía previamente
ALTER TABLE public.tickets_ti
  ADD COLUMN IF NOT EXISTS tipo_solicitud TEXT NOT NULL DEFAULT 'Soporte Técnico / TI',
  ADD COLUMN IF NOT EXISTS nota_publica TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS imagenes_urls TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS respuestas_extra JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Eliminar restricción rígida previa de categoria/asignado_a para permitir Módulos Odoo y Editor Dinámico
ALTER TABLE public.tickets_ti DROP CONSTRAINT IF EXISTS tickets_ti_categoria_check;
ALTER TABLE public.tickets_ti DROP CONSTRAINT IF EXISTS tickets_ti_asignado_a_check;

-- 3. Tabla de Configuración Global (app_config) para PIN ('admin_pin') y Editor Dinámico ('form_schema')
CREATE TABLE IF NOT EXISTS public.app_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insertar PIN inicial si no existe aún
INSERT INTO public.app_config (key, value)
VALUES ('admin_pin', '{"pin": "1234"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 4. Trigger automático para actualizar updated_at en tickets_ti
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

-- 5. Índices para optimizar consultas del Kanban, Portal Público y KPIs
CREATE INDEX IF NOT EXISTS idx_tickets_ti_codigo_ticket ON public.tickets_ti(codigo_ticket);
CREATE INDEX IF NOT EXISTS idx_tickets_ti_estado ON public.tickets_ti(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_ti_score_prioridad ON public.tickets_ti(score_prioridad DESC);
CREATE INDEX IF NOT EXISTS idx_tickets_ti_created_at ON public.tickets_ti(created_at DESC);

-- 6. Configurar Row Level Security (RLS) para tickets_ti y app_config
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

ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura de app_config" ON public.app_config;
CREATE POLICY "Permitir lectura de app_config"
  ON public.app_config FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Permitir insercion en app_config" ON public.app_config;
CREATE POLICY "Permitir insercion en app_config"
  ON public.app_config FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir actualizacion en app_config" ON public.app_config;
CREATE POLICY "Permitir actualizacion en app_config"
  ON public.app_config FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- 7. Configurar Bucket de Supabase Storage 'ticket-evidencias' para fotos/capturas
INSERT INTO storage.buckets (id, name, public)
VALUES ('ticket-evidencias', 'ticket-evidencias', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Lectura publica de evidencias" ON storage.objects;
CREATE POLICY "Lectura publica de evidencias"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ticket-evidencias');

DROP POLICY IF EXISTS "Subida publica de evidencias de tickets" ON storage.objects;
CREATE POLICY "Subida publica de evidencias de tickets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ticket-evidencias');

-- 8. Activar Supabase Realtime para tickets_ti y app_config
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

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'app_config'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_config;
  END IF;
END $$;
