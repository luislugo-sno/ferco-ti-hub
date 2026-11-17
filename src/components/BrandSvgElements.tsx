import React from 'react';
import {
  AsignadoA,
  CategoriaTicket,
  EstadoTicket,
  NivelImpacto,
  NivelUrgencia,
} from '../types/tickets';

/**
 * Vector SVG corporativo exacto de GCF (Isotipo + Logotipo #6A87E4 y #2524CD)
 */
export const GcfVectorLogoSvg: React.FC<{ className?: string }> = ({
  className = 'h-8 w-auto',
}) => (
  <svg
    viewBox="0 0 267 59"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    role="img"
    aria-label="Logo Grupo Comercializadora Ferco GCF"
  >
    {/* Isotipo izquierdo */}
    <rect x="3" y="4" width="56" height="51" rx="8" fill="#6A87E4" />
    <circle cx="20.5" cy="16.5" r="6.5" fill="#FFFFFF" />
    <circle cx="37.5" cy="14.5" r="6.5" fill="#FFFFFF" />
    <path
      d="M3 36C7 32 12 34 15 40C18 47 28 49 36 44C42 40 44 33 44 30H33C28.5 30 25 26.5 25 22C25 17.5 28.5 14 33 14H48C51.5 14 54 17 54 21C54 38 42 53 23 54.5C13 55 6 50 3 44V36Z"
      fill="#FFFFFF"
    />
    <path
      d="M59 35V47C59 51.4183 55.4183 55 51 55H39C47.5 51 54.5 44 59 35Z"
      fill="#2524CD"
    />
    {/* Letras GCF */}
    <path
      d="M90 10H126C129 10 131 12 131 15C131 18 129 20 126 20H92C83 20 77 25 77 32.5C77 40 83 45 92 45H122V36H102C99 36 97 34 97 31.5C97 29 99 27 102 27H127C130 27 132 29 132 32V48C132 52 129 55 125 55H90C76 55 66 46 66 32.5C66 19 76 10 90 10Z"
      fill="#6A87E4"
    />
    <path
      d="M164 10H195C198 10 200 12 200 15C200 18 198 20 195 20H165C156 20 150 25 150 32.5C150 40 156 45 165 45H195C198 45 200 47 200 50C200 53 198 55 195 55H164C150 55 139 46 139 32.5C139 19 150 10 164 10Z"
      fill="#6A87E4"
    />
    <path
      d="M216 10H257C260 10 262 12 262 15C262 18 260 20 257 20H219V28H254C257 28 259 30 259 33C259 36 257 38 254 38H219V50C219 53 217 55 214 55C211 55 208 53 208 50V18C208 13 211 10 216 10Z"
      fill="#6A87E4"
    />
  </svg>
);

/**
 * Iconos vectoriales SVG a medida para cada Categoría de Servicio TI/BI
 */
export const CategorySvgIcon: React.FC<{
  categoria: CategoriaTicket;
  className?: string;
}> = ({ categoria, className = 'h-5 w-5' }) => {
  switch (categoria) {
    case 'Infraestructura / Redes / Starlink':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          {/* Antena Satelital Starlink + Ondas de Red */}
          <path
            d="M4.5 19.5L9.5 14.5M7 19.5H13.5"
            stroke="#A5B7EF"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M15.8 13.8C12.9 16.7 8.2 16.7 5.3 13.8C2.4 10.9 2.4 6.2 5.3 3.3L15.8 13.8Z"
            fill="#6A87E4"
            fillOpacity="0.25"
            stroke="#6A87E4"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="13.5" cy="6.5" r="2" fill="#2524CD" stroke="#D5DDF9" strokeWidth="1.4" />
          <path
            d="M17 3.5C18.8 4.8 20 6.8 20.3 9.2M19.5 2C21.2 3.4 22.2 5.3 22.5 7.5"
            stroke="#A5B7EF"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'Odoo ERP / TPV Tiendas':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          {/* Terminal Punto de Venta TPV + Cubo ERP */}
          <rect
            x="3"
            y="4"
            width="18"
            height="12"
            rx="2.5"
            fill="#6A87E4"
            fillOpacity="0.22"
            stroke="#6A87E4"
            strokeWidth="1.8"
          />
          <path
            d="M7 8H11M7 11.5H9.5"
            stroke="#D5DDF9"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <rect x="13.5" y="7.5" width="4" height="4.5" rx="1" fill="#2524CD" stroke="#A5B7EF" strokeWidth="1.2" />
          <path
            d="M6 20H18M9 16V20M15 16V20"
            stroke="#A5B7EF"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'Business Intelligence / Reportes':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          {/* Barras Analíticas BI + Curva de Tendencia */}
          <rect x="3.5" y="13" width="3.5" height="7.5" rx="1" fill="#6A87E4" fillOpacity="0.45" stroke="#6A87E4" strokeWidth="1.5" />
          <rect x="10.25" y="9.5" width="3.5" height="11" rx="1" fill="#6A87E4" fillOpacity="0.7" stroke="#6A87E4" strokeWidth="1.5" />
          <rect x="17" y="5.5" width="3.5" height="15" rx="1" fill="#2524CD" stroke="#A5B7EF" strokeWidth="1.5" />
          <path
            d="M4.5 9.5L10.5 5.5L15 7L20 2.5"
            stroke="#D5DDF9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="20" cy="2.5" r="1.8" fill="#6A87E4" />
        </svg>
      );

    case 'Hardware / Impresoras / Equipos':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          {/* Impresora Fiscal/Térmica y Estación */}
          <path
            d="M7 8V4.5C7 3.95 7.45 3.5 8 3.5H16C16.55 3.5 17 3.95 17 4.5V8"
            stroke="#A5B7EF"
            strokeWidth="1.7"
          />
          <rect
            x="3.5"
            y="8"
            width="17"
            height="8.5"
            rx="2.2"
            fill="#6A87E4"
            fillOpacity="0.22"
            stroke="#6A87E4"
            strokeWidth="1.8"
          />
          <rect
            x="7"
            y="14"
            width="10"
            height="6.5"
            rx="1"
            fill="#0C0F26"
            stroke="#D5DDF9"
            strokeWidth="1.6"
          />
          <circle cx="17" cy="11" r="1.2" fill="#2524CD" stroke="#D5DDF9" strokeWidth="1" />
        </svg>
      );

    case 'Accesos / Google Workspace':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          {/* Escudo de Identidad Corporativa + Llave */}
          <path
            d="M12 3L4.5 6.2V11.8C4.5 16.6 7.7 20.8 12 22C16.3 20.8 19.5 16.6 19.5 11.8V6.2L12 3Z"
            fill="#6A87E4"
            fillOpacity="0.22"
            stroke="#6A87E4"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="10.5" r="2.3" fill="#2524CD" stroke="#D5DDF9" strokeWidth="1.5" />
          <path
            d="M8.5 16.5C9.3 14.7 10.5 13.8 12 13.8C13.5 13.8 14.7 14.7 15.5 16.5"
            stroke="#D5DDF9"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );

    case 'Desarrollo / Automatización':
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className={className}
          aria-hidden="true"
        >
          {/* Nodos de Automatización y Código */}
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="3"
            fill="#6A87E4"
            fillOpacity="0.2"
            stroke="#6A87E4"
            strokeWidth="1.8"
          />
          <path
            d="M8.5 9.5L6 12L8.5 14.5M15.5 9.5L18 12L15.5 14.5M13 8.5L11 15.5"
            stroke="#D5DDF9"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
};

/**
 * Ilustración SVG para los 3 niveles de Impacto en la Matriz de Priorización
 */
export const ImpactoVectorSvg: React.FC<{
  nivel: NivelImpacto;
  className?: string;
}> = ({ nivel, className = 'h-7 w-7' }) => {
  if (nivel === 1) {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#6A87E4" fillOpacity="0.16" />
        <circle cx="16" cy="12" r="4.2" stroke="#6A87E4" strokeWidth="2" />
        <path
          d="M9.5 24C10.5 20.2 13 18.5 16 18.5C19 18.5 21.5 20.2 22.5 24"
          stroke="#A5B7EF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (nivel === 2) {
    return (
      <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="#F59E0B" fillOpacity="0.15" />
        <path
          d="M7 24V11C7 9.9 7.9 9 9 9H17C18.1 9 19 9.9 19 11V24M19 15H23C24.1 15 25 15.9 25 17V24M5 24H27"
          stroke="#FBBF24"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M11 13H15M11 17H15" stroke="#FDE68A" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="#F43F5E" fillOpacity="0.18" />
      <path
        d="M16 7L26 24H6L16 7Z"
        fill="#F43F5E"
        fillOpacity="0.2"
        stroke="#FB7185"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M16 13.5V18" stroke="#FFE4E6" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="16" cy="21" r="1.3" fill="#FFE4E6" />
    </svg>
  );
};

/**
 * Ilustración SVG para los 3 niveles de Urgencia
 */
export const UrgenciaVectorSvg: React.FC<{
  nivel: NivelUrgencia;
  className?: string;
}> = ({ nivel, className = 'h-7 w-7' }) => {
  const strokeColor =
    nivel === 3 ? '#FB7185' : nivel === 2 ? '#FBBF24' : '#6A87E4';
  const bgFill =
    nivel === 3 ? '#F43F5E' : nivel === 2 ? '#F59E0B' : '#6A87E4';

  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="9" fill={bgFill} fillOpacity="0.16" />
      <circle cx="16" cy="16.5" r="8.5" stroke={strokeColor} strokeWidth="2" />
      <path
        d="M16 12V16.5L19.5 18.5"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {nivel === 3 && (
        <path
          d="M9 7.5L6.5 10M23 7.5L25.5 10"
          stroke="#FDA4AF"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
};

/**
 * Icono SVG para cabecera de cada Columna Kanban
 */
export const EstadoColumnaSvg: React.FC<{
  estado: EstadoTicket;
  wipAlert?: boolean;
  className?: string;
}> = ({ estado, wipAlert = false, className = 'h-4 w-4' }) => {
  switch (estado) {
    case 'Bandeja de Entrada':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <rect x="2.5" y="3.5" width="15" height="13" rx="2.5" stroke="#A5B7EF" strokeWidth="1.7" />
          <path d="M2.5 11.5H7L8.5 13.5H11.5L13 11.5H17.5" stroke="#6A87E4" strokeWidth="1.7" />
        </svg>
      );
    case 'En Cola':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <path d="M4 5.5H16M4 10H16M4 14.5H11" stroke="#6A87E4" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="15" cy="14.5" r="2" fill="#2524CD" stroke="#A5B7EF" strokeWidth="1.2" />
        </svg>
      );
    case 'En Progreso':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <circle
            cx="10"
            cy="10"
            r="7.2"
            stroke={wipAlert ? '#FB7185' : '#FBBF24'}
            strokeWidth="1.8"
            strokeDasharray="28 10"
          />
          <path
            d="M10 6.5V10L12.5 11.5"
            stroke={wipAlert ? '#FFE4E6' : '#FDE68A'}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'Esperando Proveedor/Tercero':
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <path
            d="M6 3.5H14M6 16.5H14M7 3.5C7 7 10 8.5 10 10C10 11.5 7 13 7 16.5M13 3.5C13 7 10 8.5 10 10C10 11.5 13 13 13 16.5"
            stroke="#FB923C"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case 'Resuelto':
    default:
      return (
        <svg viewBox="0 0 20 20" fill="none" className={className} aria-hidden="true">
          <circle cx="10" cy="10" r="7.5" fill="#10B981" fillOpacity="0.18" stroke="#34D399" strokeWidth="1.7" />
          <path d="M6.8 10.2L9 12.4L13.5 7.8" stroke="#6EE7B7" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
  }
};

/**
 * Avatar vectorial en SVG para los ingenieros y analistas de TI/BI
 */
export const SpecialistAvatarSvg: React.FC<{
  nombre: AsignadoA | string;
  size?: 'sm' | 'md';
}> = ({ nombre, size = 'sm' }) => {
  const initials = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const dim = size === 'sm' ? 'h-5 w-5 text-[9px]' : 'h-7 w-7 text-[11px]';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border border-gcf-400/50 bg-gradient-to-br from-gcf-500 to-gcf-800 font-mono font-bold text-white shadow-sm ${dim}`}
      aria-hidden="true"
    >
      {initials || 'TI'}
    </span>
  );
};

/**
 * Ilustración vectorial SVG para columnas vacías del Kanban
 */
export const EmptyColumnVectorSvg: React.FC<{ className?: string }> = ({
  className = 'h-14 w-14',
}) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden="true">
    <rect
      x="10"
      y="12"
      width="44"
      height="40"
      rx="8"
      fill="#6A87E4"
      fillOpacity="0.08"
      stroke="#6A87E4"
      strokeOpacity="0.35"
      strokeWidth="1.8"
      strokeDasharray="4 4"
    />
    <rect
      x="18"
      y="21"
      width="28"
      height="7"
      rx="3"
      fill="#6A87E4"
      fillOpacity="0.18"
    />
    <rect
      x="18"
      y="33"
      width="19"
      height="6"
      rx="3"
      fill="#2524CD"
      fillOpacity="0.28"
    />
    <circle cx="44" cy="36" r="4" fill="#6A87E4" fillOpacity="0.4" />
  </svg>
);

/**
 * Ilustración vectorial SVG de Confirmación de Ticket Encolado
 */
export const SuccessTicketVectorSvg: React.FC<{ className?: string }> = ({
  className = 'h-20 w-20',
}) => (
  <svg viewBox="0 0 88 88" fill="none" className={className} aria-hidden="true">
    <circle cx="44" cy="44" r="38" fill="#6A87E4" fillOpacity="0.14" />
    <circle
      cx="44"
      cy="44"
      r="30"
      fill="#2524CD"
      fillOpacity="0.25"
      stroke="#6A87E4"
      strokeWidth="2.2"
    />
    <path
      d="M31 44.5L40 53.5L58 35.5"
      stroke="#D5DDF9"
      strokeWidth="4.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="67" cy="23" r="4" fill="#6A87E4" />
    <circle cx="21" cy="64" r="3" fill="#A5B7EF" />
  </svg>
);
