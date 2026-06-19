BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS case_workflow_stage_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key varchar(80) NOT NULL UNIQUE,
  label varchar(120) NOT NULL,
  stage_order integer NOT NULL UNIQUE,
  is_terminal boolean NOT NULL DEFAULT false,
  activities jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_activity_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  activity_key varchar(120) NOT NULL,
  is_completed boolean NOT NULL DEFAULT false,
  source varchar(120) NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT uq_case_activity_progress_case_activity UNIQUE (case_id, activity_key)
);
CREATE INDEX IF NOT EXISTS idx_case_activity_progress_case_id ON case_activity_progress(case_id);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'lifecycle_source_enum') THEN
    CREATE TYPE lifecycle_source_enum AS ENUM ('AUTO', 'MANUAL');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS case_lifecycle_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL UNIQUE REFERENCES cases(id) ON DELETE CASCADE,
  current_stage varchar(80) NOT NULL,
  current_stage_label varchar(120) NOT NULL,
  auto_stage varchar(80) NULL,
  source lifecycle_source_enum NOT NULL DEFAULT 'AUTO',
  manual_override_active boolean NOT NULL DEFAULT false,
  manual_override_stage varchar(80) NULL,
  manual_override_reason text NULL,
  manual_override_user_id uuid NULL REFERENCES "Usuarios"(id) ON DELETE SET NULL,
  manual_override_at timestamp NULL,
  last_recalculated_at timestamp NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS case_lifecycle_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  from_stage varchar(80) NULL,
  to_stage varchar(80) NOT NULL,
  source lifecycle_source_enum NOT NULL,
  reason text NULL,
  user_id uuid NULL REFERENCES "Usuarios"(id) ON DELETE SET NULL,
  changed_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_case_lifecycle_history_case_id ON case_lifecycle_history(case_id);
CREATE INDEX IF NOT EXISTS idx_case_lifecycle_history_changed_at ON case_lifecycle_history(changed_at);

ALTER TABLE cases
  ADD COLUMN IF NOT EXISTS "lifecycleFlags" jsonb NULL DEFAULT '{}'::jsonb;

INSERT INTO case_workflow_stage_config (key, label, stage_order, is_terminal, activities)
VALUES
  ('PENDIENTE', 'Pendiente', 1, false, '[{"key":"case_created","label":"Caso creado","weight":100,"indicatorKey":"case_created"}]'::jsonb),
  ('UBICADO', 'Ubicado', 2, false, '[{"key":"client_located","label":"Cliente ubicado","weight":100,"indicatorKey":"client_located"}]'::jsonb),
  ('CONTACTADO', 'Contactado', 3, false, '[{"key":"first_contact_done","label":"Primer contacto realizado","weight":100,"indicatorKey":"first_contact_done"}]'::jsonb),
  ('CONTRATO_ENVIADO', 'Contrato enviado', 4, false, '[{"key":"contract_sent","label":"Contrato enviado","weight":100,"indicatorKey":"contract_sent"}]'::jsonb),
  ('CONTRATO_FIRMADO', 'Contrato firmado', 5, false, '[{"key":"contract_signed","label":"Contrato firmado","weight":100,"indicatorKey":"contract_signed"}]'::jsonb),
  ('DOCUMENTOS_LISTOS', 'Documentos listos', 6, false, '[{"key":"documents_ready","label":"Documentos obligatorios listos","weight":100,"indicatorKey":"documents_ready"}]'::jsonb),
  ('RADICADO_ENTIDAD', 'Radicado entidad', 7, false, '[{"key":"entity_filed","label":"Radicado en entidad","weight":100,"indicatorKey":"entity_filed"}]'::jsonb),
  ('ACTUALIZACION_CASO', 'Actualizacion caso', 8, false, '[{"key":"case_updated","label":"Actualizacion de caso registrada","weight":100,"indicatorKey":"case_updated"}]'::jsonb),
  ('PAGADO', 'Pagado', 9, false, '[{"key":"payment_confirmed","label":"Pago confirmado","weight":100,"indicatorKey":"payment_confirmed"}]'::jsonb),
  ('FINALIZADO', 'Finalizado', 10, true, '[]'::jsonb),
  ('CANCELADO', 'Cancelado', 11, true, '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMIT;
