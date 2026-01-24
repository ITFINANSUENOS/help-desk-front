import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Tickets',
      items: [
        'tickets/crear-ticket',
        'tickets/ver-tickets',
        'tickets/estados-tickets',
      ],
    },
    {
      type: 'category',
      label: 'Usuarios',
      items: [
        'usuarios/gestionar-usuarios',
        'usuarios/roles-permisos',
      ],
    },
    {
      type: 'category',
      label: 'Organigrama',
      items: [
        'organigrama/gestion-organigrama',
      ],
    },
    {
      type: 'category',
      label: 'Administración',
      items: [
        'administracion/gestion-empresas',
        'administracion/gestion-zonas',
        'administracion/gestion-regionales',
        'administracion/gestion-departamentos',
        'administracion/gestion-cargos',
        'administracion/gestion-categorias',
        'administracion/gestion-subcategorias',
      ],
    },
  ],
};

export default sidebars;
