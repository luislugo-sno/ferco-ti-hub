import React, { useId, useState } from 'react';
import {
  Sliders,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  RotateCcw,
  ListPlus,
  HelpCircle,
  KeyRound,
  AlertCircle,
  Edit3,
  Check,
} from 'lucide-react';
import {
  AplicaAPregunta,
  DEFAULT_FORM_SCHEMA,
  FormSchemaConfig,
  PreguntaPersonalizada,
  TipoCampoPersonalizado,
} from '../types/tickets';
import {
  upsertAdminPinInSupabase,
  upsertFormSchemaInSupabase,
} from '../lib/supabase';
import { getExpectedPin } from './PinAuthDialog';

interface ConfigurarFormularioViewProps {
  formSchema: FormSchemaConfig;
  onSchemaUpdated: (nextSchema: FormSchemaConfig) => void;
}

type CatalogKey = 'departamentos' | 'sedes' | 'categorias_ti' | 'modulos_odoo';

const CATALOG_TABS: Array<{ key: CatalogKey; label: string; desc: string }> = [
  {
    key: 'departamentos',
    label: 'Departamentos / Áreas',
    desc: 'Lista desplegable de departamentos y áreas organizacionales.',
  },
  {
    key: 'sedes',
    label: 'Sedes Comerciales / Centros',
    desc: 'Tiendas SNÖ, Chönkies y Centros de Distribución (CDP / CDA).',
  },
  {
    key: 'categorias_ti',
    label: 'Categorías Soporte TI',
    desc: 'Categorías mostradas cuando el usuario elige "Soporte Técnico / TI".',
  },
  {
    key: 'modulos_odoo',
    label: 'Módulos Consultas sobre Odoo',
    desc: 'Módulos mostrados cuando el usuario elige "Consultas sobre Odoo".',
  },
];

const TIPO_CAMPO_LABELS: Record<TipoCampoPersonalizado, string> = {
  texto_corto: 'Texto corto',
  parrafo: 'Párrafo',
  lista_desplegable: 'Lista desplegable',
  casilla_verificacion: 'Casilla de verificación',
};

export const ConfigurarFormularioView: React.FC<ConfigurarFormularioViewProps> = ({
  formSchema,
  onSchemaUpdated,
}) => {
  const newOptionInputId = useId();
  const qTituloId = useId();
  const qTipoId = useId();
  const qAplicaId = useId();
  const qOpcionesId = useId();
  const pinInputId = useId();

  const [localSchema, setLocalSchema] = useState<FormSchemaConfig>(formSchema);
  const [activeCatalog, setActiveCatalog] = useState<CatalogKey>('departamentos');
  const [newOptionText, setNewOptionText] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingText, setEditingText] = useState('');

  // Estado para nueva pregunta o edición de pregunta personalizada
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [qTitulo, setQTitulo] = useState('');
  const [qTipo, setQTipo] = useState<TipoCampoPersonalizado>('texto_corto');
  const [qOpcionesText, setQOpcionesText] = useState('');
  const [qObligatoria, setQObligatoria] = useState(false);
  const [qAplicaA, setQAplicaA] = useState<AplicaAPregunta>('Todos');

  // Estado de guardado en Supabase
  const [isSavingSchema, setIsSavingSchema] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  // Estado para PIN Global en app_config
  const [pinValue, setPinValue] = useState<string>(() => getExpectedPin());
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);

  const persistSchema = async (next: FormSchemaConfig, customMessage?: string) => {
    setLocalSchema(next);
    onSchemaUpdated(next);
    setIsSavingSchema(true);
    setSaveFeedback(null);

    try {
      const res = await upsertFormSchemaInSupabase(next);
      if (res.mode === 'supabase') {
        setSaveFeedback({
          ok: true,
          text:
            customMessage ||
            'Cambios guardados y sincronizados en Supabase (app_config -> form_schema).',
        });
      } else {
        setSaveFeedback({
          ok: true,
          text:
            res.error ||
            'Cambios guardados localmente (conecte Supabase para sincronización multi-dispositivo).',
        });
      }
      setTimeout(() => setSaveFeedback(null), 4000);
    } finally {
      setIsSavingSchema(false);
    }
  };

  // --- Operaciones sobre Catálogos ---
  const currentList = localSchema[activeCatalog];

  const handleAddOption = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newOptionText.trim();
    if (!clean) return;
    if (currentList.includes(clean)) {
      setNewOptionText('');
      return;
    }
    const nextList = [...currentList, clean];
    setNewOptionText('');
    await persistSchema(
      { ...localSchema, [activeCatalog]: nextList },
      `Opción "${clean}" agregada al catálogo.`
    );
  };

  const handleMoveOption = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;
    const copy = [...currentList];
    const [moved] = copy.splice(index, 1);
    copy.splice(targetIndex, 0, moved);
    await persistSchema({ ...localSchema, [activeCatalog]: copy });
  };

  const handleDeleteOption = async (index: number) => {
    if (currentList.length <= 1) return;
    const removed = currentList[index];
    const copy = currentList.filter((_, idx) => idx !== index);
    await persistSchema(
      { ...localSchema, [activeCatalog]: copy },
      `Opción "${removed}" eliminada.`
    );
  };

  const handleStartEditOption = (index: number) => {
    setEditingIndex(index);
    setEditingText(currentList[index]);
  };

  const handleConfirmEditOption = async (index: number) => {
    const clean = editingText.trim();
    setEditingIndex(null);
    if (!clean || clean === currentList[index]) return;
    const copy = [...currentList];
    copy[index] = clean;
    await persistSchema(
      { ...localSchema, [activeCatalog]: copy },
      'Opción actualizada correctamente.'
    );
  };

  const handleRestoreCatalogDefaults = async () => {
    const defaultList = DEFAULT_FORM_SCHEMA[activeCatalog];
    await persistSchema(
      { ...localSchema, [activeCatalog]: [...defaultList] },
      'Catálogo restaurado a los valores oficiales predeterminados.'
    );
  };

  // --- Operaciones sobre Preguntas Personalizadas ---
  const resetQuestionForm = () => {
    setEditingQuestionId(null);
    setQTitulo('');
    setQTipo('texto_corto');
    setQOpcionesText('');
    setQObligatoria(false);
    setQAplicaA('Todos');
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = qTitulo.trim();
    if (!cleanTitle) return;

    const parsedOptions =
      qTipo === 'lista_desplegable'
        ? qOpcionesText
            .split(/[,\n]/)
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    if (qTipo === 'lista_desplegable' && parsedOptions.length === 0) {
      setSaveFeedback({
        ok: false,
        text: 'Para una Lista desplegable debe indicar al menos una opción separada por coma.',
      });
      return;
    }

    let nextQuestions: PreguntaPersonalizada[];

    if (editingQuestionId) {
      nextQuestions = localSchema.preguntas_personalizadas.map((q) =>
        q.id === editingQuestionId
          ? {
              ...q,
              titulo: cleanTitle,
              tipo: qTipo,
              opciones: parsedOptions,
              obligatoria: qObligatoria,
              aplica_a: qAplicaA,
            }
          : q
      );
    } else {
      const nuevaPregunta: PreguntaPersonalizada = {
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        titulo: cleanTitle,
        tipo: qTipo,
        opciones: parsedOptions,
        obligatoria: qObligatoria,
        aplica_a: qAplicaA,
        activa: true,
      };
      nextQuestions = [...localSchema.preguntas_personalizadas, nuevaPregunta];
    }

    resetQuestionForm();
    await persistSchema(
      {
        ...localSchema,
        preguntas_personalizadas: nextQuestions,
      },
      editingQuestionId
        ? 'Pregunta personalizada actualizada.'
        : 'Nueva pregunta personalizada agregada al formulario.'
    );
  };

  const handleEditQuestionClick = (q: PreguntaPersonalizada) => {
    setEditingQuestionId(q.id);
    setQTitulo(q.titulo);
    setQTipo(q.tipo);
    setQOpcionesText(q.opciones.join(', '));
    setQObligatoria(q.obligatoria);
    setQAplicaA(q.aplica_a);
  };

  const handleToggleQuestionActive = async (id: string) => {
    const nextQuestions = localSchema.preguntas_personalizadas.map((q) =>
      q.id === id ? { ...q, activa: !q.activa } : q
    );
    await persistSchema({
      ...localSchema,
      preguntas_personalizadas: nextQuestions,
    });
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const list = localSchema.preguntas_personalizadas;
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= list.length) return;
    const copy = [...list];
    const [moved] = copy.splice(index, 1);
    copy.splice(target, 0, moved);
    await persistSchema({
      ...localSchema,
      preguntas_personalizadas: copy,
    });
  };

  const handleDeleteQuestion = async (id: string) => {
    const nextQuestions = localSchema.preguntas_personalizadas.filter(
      (q) => q.id !== id
    );
    if (editingQuestionId === id) resetQuestionForm();
    await persistSchema(
      {
        ...localSchema,
        preguntas_personalizadas: nextQuestions,
      },
      'Pregunta personalizada eliminada.'
    );
  };

  const handleSaveGlobalPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pinValue.trim().length < 4) return;
    setIsSavingPin(true);
    setPinFeedback(null);
    try {
      const res = await upsertAdminPinInSupabase(pinValue.trim());
      setPinFeedback(
        res.mode === 'supabase'
          ? 'PIN actualizado globalmente en Supabase (app_config) para todos los dispositivos.'
          : res.error || 'PIN guardado localmente.'
      );
      setTimeout(() => setPinFeedback(null), 4000);
    } finally {
      setIsSavingPin(false);
    }
  };

  return (
    <div className="space-y-5 pb-16 lg:pb-6">
      {/* Cabecera */}
      <div className="flex flex-col justify-between gap-3 rounded-md border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:px-5">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700">
            Administración Dinámica sin Código • Tabla Supabase app_config
          </span>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            Editor Dinámico de Formulario, Catálogos y Seguridad Global
          </h2>
          <p className="text-xs text-slate-600">
            Modifique listas desplegables, cree preguntas adicionales y actualice el PIN
            global en tiempo real para todos los dispositivos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSavingSchema}
            onClick={() => persistSchema(localSchema)}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 disabled:opacity-60 sm:h-9 sm:min-h-0 sm:w-auto"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            <span>
              {isSavingSchema ? 'Sincronizando...' : 'Sincronizar Todo en Supabase'}
            </span>
          </button>
        </div>
      </div>

      {/* Notificación de estado de guardado */}
      <div aria-live="polite">
        {saveFeedback && (
          <div
            className={`flex items-center gap-2 rounded-sm border px-4 py-3 text-xs font-semibold ${
              saveFeedback.ok
                ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                : 'border-red-300 bg-red-50 text-red-800'
            }`}
          >
            {saveFeedback.ok ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
            )}
            <span>{saveFeedback.text}</span>
          </div>
        )}
      </div>

      {/* BLOQUE 1: SEGURIDAD GLOBAL (PIN EN SUPABASE APP_CONFIG) */}
      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs sm:p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <KeyRound className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>1. PIN Global de Acceso TI/BI (Persistencia en Supabase app_config)</span>
            </h3>
            <p className="mt-0.5 text-xs text-slate-600">
              Al actualizar el PIN aquí, se ejecuta un <code className="font-mono text-slate-800">upsert</code> en la clave{' '}
              <code className="font-mono text-slate-800">&apos;admin_pin&apos;</code> aplicando de inmediato en PC y móviles.
            </p>
          </div>

          <form
            onSubmit={handleSaveGlobalPin}
            className="flex flex-col gap-2 sm:flex-row sm:items-center"
          >
            <label htmlFor={pinInputId} className="sr-only">
              PIN Global de Acceso
            </label>
            <input
              id={pinInputId}
              type="text"
              inputMode="numeric"
              minLength={4}
              required
              value={pinValue}
              onChange={(e) => setPinValue(e.target.value)}
              placeholder="Nuevo PIN (mín. 4 dígitos)"
              className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-3 font-mono text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:w-44 sm:text-sm"
            />
            <button
              type="submit"
              disabled={isSavingPin}
              className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-sm bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:h-9 sm:min-h-0 sm:w-auto"
            >
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{isSavingPin ? 'Guardando PIN...' : 'Actualizar PIN Global'}</span>
            </button>
          </form>
        </div>

        <div aria-live="polite">
          {pinFeedback && (
            <div className="mt-3 flex items-center gap-2 rounded-sm border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>{pinFeedback}</span>
            </div>
          )}
        </div>
      </section>

      {/* BLOQUE 2: GESTIÓN DE CATÁLOGOS Y LISTAS DESPLEGABLES */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs sm:p-5 lg:col-span-6">
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <ListPlus className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>2. Editor de Catálogos y Listas Desplegables</span>
            </h3>
            <button
              type="button"
              onClick={handleRestoreCatalogDefaults}
              className="inline-flex items-center gap-1 rounded-sm border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              <RotateCcw className="h-3 w-3" aria-hidden="true" />
              <span>Restaurar Lista</span>
            </button>
          </div>

          {/* Pestañas de selección de catálogo */}
          <div className="mb-3 grid grid-cols-2 gap-1.5">
            {CATALOG_TABS.map((tab) => {
              const active = activeCatalog === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveCatalog(tab.key);
                    setEditingIndex(null);
                  }}
                  className={`min-h-[40px] rounded-sm border px-2.5 py-1.5 text-left text-xs font-bold transition ${
                    active
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="block truncate">{tab.label}</span>
                  <span
                    className={`text-[10px] font-normal ${
                      active ? 'text-blue-100' : 'text-slate-500'
                    }`}
                  >
                    {localSchema[tab.key].length} opciones
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mb-3 text-xs text-slate-600">
            {CATALOG_TABS.find((t) => t.key === activeCatalog)?.desc}
          </p>

          {/* Formulario para agregar nueva opción al catálogo activo */}
          <form onSubmit={handleAddOption} className="mb-3 flex flex-col gap-2 sm:flex-row">
            <label htmlFor={newOptionInputId} className="sr-only">
              Nueva opción para el catálogo
            </label>
            <input
              id={newOptionInputId}
              type="text"
              value={newOptionText}
              onChange={(e) => setNewOptionText(e.target.value)}
              placeholder="Escriba nueva opción y presione Agregar..."
              className="min-h-[44px] flex-1 rounded-sm border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-xs"
            />
            <button
              type="submit"
              className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 sm:h-9 sm:min-h-0"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Agregar Opción</span>
            </button>
          </form>

          {/* Lista scrollable de opciones con reordenamiento, edición y borrado */}
          <div className="max-h-[420px] divide-y divide-slate-200 overflow-y-auto rounded-sm border border-slate-200 bg-slate-50">
            {currentList.map((item, idx) => (
              <div
                key={`${item}-${idx}`}
                className="flex items-center justify-between gap-2 bg-white px-3 py-2 text-xs hover:bg-slate-50"
              >
                {editingIndex === idx ? (
                  <div className="flex flex-1 items-center gap-1.5">
                    <input
                      type="text"
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      autoFocus
                      className="h-8 flex-1 rounded-sm border border-blue-700 bg-white px-2 text-xs text-slate-900 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleConfirmEditOption(idx)}
                      className="rounded-sm bg-blue-700 px-2.5 py-1 text-[11px] font-bold text-white"
                    >
                      OK
                    </button>
                  </div>
                ) : (
                  <span className="flex-1 font-medium text-slate-800">{item}</span>
                )}

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveOption(idx, 'up')}
                    aria-label={`Subir ${item}`}
                    className="rounded-sm border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === currentList.length - 1}
                    onClick={() => handleMoveOption(idx, 'down')}
                    aria-label={`Bajar ${item}`}
                    className="rounded-sm border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStartEditOption(idx)}
                    aria-label={`Editar ${item}`}
                    className="rounded-sm border border-slate-200 p-1.5 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    disabled={currentList.length <= 1}
                    onClick={() => handleDeleteOption(idx)}
                    aria-label={`Eliminar ${item}`}
                    className="rounded-sm border border-slate-200 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-30"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* BLOQUE 3: CONSTRUCTOR DE PREGUNTAS PERSONALIZADAS */}
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-xs sm:p-5 lg:col-span-6">
          <div className="mb-3 flex items-center justify-between border-b border-slate-200 pb-2.5">
            <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
              <HelpCircle className="h-4 w-4 text-blue-700" aria-hidden="true" />
              <span>3. Preguntas Personalizadas del Formulario (respuestas_extra)</span>
            </h3>
            <span className="rounded-sm border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700">
              {localSchema.preguntas_personalizadas.length} configurada(s)
            </span>
          </div>

          {/* Formulario de creación / edición de pregunta */}
          <form
            onSubmit={handleSaveQuestion}
            className="mb-4 space-y-3 rounded-sm border border-slate-200 bg-slate-50 p-3.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                {editingQuestionId
                  ? 'Editando Pregunta Personalizada'
                  : 'Agregar Nueva Pregunta al Formulario'}
              </span>
              {editingQuestionId && (
                <button
                  type="button"
                  onClick={resetQuestionForm}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Cancelar edición
                </button>
              )}
            </div>

            <div>
              <label
                htmlFor={qTituloId}
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Título de la Pregunta <span className="text-red-600">*</span>
              </label>
              <input
                id={qTituloId}
                type="text"
                required
                value={qTitulo}
                onChange={(e) => setQTitulo(e.target.value)}
                placeholder="Ej: Número de Caja / Documento de Odoo / Código de Activo"
                className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-xs"
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={qTipoId}
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Tipo de Campo
                </label>
                <select
                  id={qTipoId}
                  value={qTipo}
                  onChange={(e) => setQTipo(e.target.value as TipoCampoPersonalizado)}
                  className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-xs"
                >
                  <option value="texto_corto">Texto corto</option>
                  <option value="parrafo">Párrafo</option>
                  <option value="lista_desplegable">Lista desplegable</option>
                  <option value="casilla_verificacion">Casilla de verificación</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor={qAplicaId}
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Aplica a Tipo de Solicitud
                </label>
                <select
                  id={qAplicaId}
                  value={qAplicaA}
                  onChange={(e) => setQAplicaA(e.target.value as AplicaAPregunta)}
                  className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-2.5 text-base text-slate-900 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-xs"
                >
                  <option value="Todos">Todos (Soporte TI y Consultas sobre Odoo)</option>
                  <option value="Soporte Técnico / TI">Solo Soporte Técnico / TI</option>
                  <option value="Consultas sobre Odoo">Solo Consultas sobre Odoo</option>
                </select>
              </div>
            </div>

            {qTipo === 'lista_desplegable' && (
              <div>
                <label
                  htmlFor={qOpcionesId}
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Opciones de la Lista Desplegable (Separadas por coma){' '}
                  <span className="text-red-600">*</span>
                </label>
                <input
                  id={qOpcionesId}
                  type="text"
                  required
                  value={qOpcionesText}
                  onChange={(e) => setQOpcionesText(e.target.value)}
                  placeholder="Ej: Caja 01, Caja 02, Caja 03, Servidor Local"
                  className="min-h-[44px] w-full rounded-sm border border-slate-300 bg-white px-3 text-base text-slate-900 placeholder:text-slate-400 focus:border-blue-700 focus:outline-none sm:h-9 sm:min-h-0 sm:text-xs"
                />
              </div>
            )}

            <div className="flex flex-col justify-between gap-3 pt-1 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-slate-800">
                <input
                  type="checkbox"
                  checked={qObligatoria}
                  onChange={(e) => setQObligatoria(e.target.checked)}
                  className="h-4 w-4 accent-blue-700"
                />
                <span>Respuesta Obligatoria</span>
              </label>

              <button
                type="submit"
                className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-sm bg-blue-700 px-4 text-xs font-bold text-white transition hover:bg-blue-800 sm:h-9 sm:min-h-0 sm:w-auto"
              >
                <Sliders className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  {editingQuestionId ? 'Guardar Cambios de Pregunta' : 'Agregar Pregunta'}
                </span>
              </button>
            </div>
          </form>

          {/* Listado de preguntas personalizadas configuradas */}
          <div className="space-y-2">
            {localSchema.preguntas_personalizadas.length === 0 ? (
              <div className="rounded-sm border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-500">
                No hay preguntas personalizadas adicionales. Utilice el formulario superior
                para agregar campos dinámicos a <code className="font-mono">/solicitar</code>.
              </div>
            ) : (
              localSchema.preguntas_personalizadas.map((q, idx) => (
                <div
                  key={q.id}
                  className={`rounded-sm border p-3 transition ${
                    q.activa
                      ? 'border-slate-200 bg-white'
                      : 'border-slate-200 bg-slate-100 opacity-70'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900">{q.titulo}</span>
                        {q.obligatoria && (
                          <span className="rounded-sm border border-red-200 bg-red-50 px-1.5 py-0.2 text-[10px] font-bold text-red-700">
                            Obligatoria
                          </span>
                        )}
                        <span className="rounded-sm border border-slate-200 bg-slate-100 px-1.5 py-0.2 text-[10px] font-semibold text-slate-700">
                          {TIPO_CAMPO_LABELS[q.tipo]}
                        </span>
                        <span className="rounded-sm border border-blue-200 bg-blue-50 px-1.5 py-0.2 text-[10px] font-semibold text-blue-800">
                          {q.aplica_a}
                        </span>
                      </div>

                      {q.tipo === 'lista_desplegable' && q.opciones.length > 0 && (
                        <p className="text-[11px] text-slate-500">
                          Opciones: {q.opciones.join(' • ')}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleToggleQuestionActive(q.id)}
                        className={`rounded-sm border px-2 py-1 text-[10px] font-bold ${
                          q.activa
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : 'border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        {q.activa ? 'Activa' : 'Inactiva'}
                      </button>

                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, 'up')}
                        aria-label="Subir pregunta"
                        className="rounded-sm border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        disabled={
                          idx === localSchema.preguntas_personalizadas.length - 1
                        }
                        onClick={() => handleMoveQuestion(idx, 'down')}
                        aria-label="Bajar pregunta"
                        className="rounded-sm border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                      >
                        <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEditQuestionClick(q)}
                        aria-label="Editar pregunta"
                        className="rounded-sm border border-slate-200 p-1.5 text-blue-700 hover:bg-blue-50"
                      >
                        <Edit3 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        aria-label="Eliminar pregunta"
                        className="rounded-sm border border-slate-200 p-1.5 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
