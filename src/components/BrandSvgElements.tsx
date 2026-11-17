import React from 'react';
import { AsignadoA } from '../types/tickets';

/**
 * Respaldo vectorial SVG del logo corporativo GCF para fondo blanco empresarial
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
    <rect x="3" y="4" width="56" height="51" rx="6" fill="#6A87E4" />
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
 * Iniciales técnicas en formato cuadrado sobrio (estilo Jira / Odoo Enterprise)
 */
export const SpecialistBadge: React.FC<{
  nombre: AsignadoA | string;
  size?: 'sm' | 'md';
}> = ({ nombre, size = 'sm' }) => {
  const soloNombre = nombre.split(' - ')[0] || nombre;
  const initials = soloNombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');

  const dim =
    size === 'sm'
      ? 'h-5 w-5 text-[10px]'
      : 'h-6 w-6 text-[11px]';

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-sm border border-slate-300 bg-slate-100 font-mono font-bold text-slate-700 ${dim}`}
      aria-hidden="true"
    >
      {initials || 'TI'}
    </span>
  );
};
