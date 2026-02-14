import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  icon: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Gestión de Tickets',
    icon: '🎫',
    description: (
      <>
        Crea, consulta y gestiona tickets de soporte de manera eficiente.
        Sistema completo de filtros avanzados, vistas personalizadas y seguimiento en tiempo real.
      </>
    ),
  },
  {
    title: 'Workflows Personalizables',
    icon: '⚙️',
    description: (
      <>
        Define flujos de trabajo adaptados a tus procesos. Pasos paralelos,
        firmas digitales, asignación automática y notificaciones inteligentes.
      </>
    ),
  },
  {
    title: 'Fácil de Usar',
    icon: '✨',
    description: (
      <>
        Interfaz intuitiva diseñada para usuarios finales y agentes.
        Documentación completa, FAQ y guías paso a paso para cada funcionalidad.
      </>
    ),
  },
];

function Feature({ title, icon, description }: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <div className={styles.featureIcon}>{icon}</div>
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
