import * as React from 'react';
import styles from './Obras.module.scss';
import { IconButton, Text } from '@fluentui/react';
import { Sidebar } from './Navegacion/Sidebar';
import { SPFI } from "@pnp/sp";

// Vistas
import { ListaMateriales } from './Vistas/Inventario/ListaMateriales';
import { GaleriaPersonal } from './Vistas/Personal/GaleriaPersonal';
import { TablaObras } from './Vistas/Proyectos/TablaObras';
import { VistaAsignaciones } from './Vistas/Asignaciones/VistaAsignaciones';
import { VistaFotosObra } from './Vistas/Fotos/VistaFotosObra';
import { VistaPlanificacion } from './Vistas/Planificacion/VistaPlanificacion';
import { VistaHistorialTarjetas } from './Vistas/historial/VistaHistorialReportes';

// Definimos la interfaz localmente para evitar errores de importación de IObrasProps antigua
interface IObrasMobileProps {
  sp: SPFI | null;
}

export const Obras: React.FC<IObrasMobileProps> = (props) => {
  const [selectedKey, setSelectedKey] = React.useState<string>('obras');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // Verificamos que tengamos conexión antes de renderizar las vistas
  if (!props.sp) {
    return (
      <div className={styles.loadingContainer}>
        <Text variant="large">Conectando con EWS Energy...</Text>
      </div>
    );
  }

  const sp = props.sp;

  const renderPage = () => {
    switch (selectedKey) {
      case 'inventario': return <ListaMateriales sp={sp} />;
      case 'personal': return <GaleriaPersonal sp={sp} />;
      case 'obras': return <TablaObras sp={sp} />;
      case 'planificacion': return <VistaPlanificacion sp={sp} />;
      case 'asignaciones': return <VistaAsignaciones sp={sp} />;
      case 'fotos': return <VistaFotosObra sp={sp} />;
      case 'historial': return <VistaHistorialTarjetas sp={sp} />;
      default: return <TablaObras sp={sp} />;
    }
  };

  return (
    <section className={styles.obras}>
      <div className={styles.appWrapper}>
        <Sidebar 
          selectedKey={selectedKey} 
          isOpen={isMenuOpen}
          onLinkClick={(key) => {
            setSelectedKey(key);
            setIsMenuOpen(false); // Cierra el menú al navegar en móvil
          }} 
        />
        
        <main className={styles.mainContent}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <IconButton 
                iconProps={{ iconName: 'GlobalNavButton' }} 
                className={styles.menuButton}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                title="Menú"
              />
            </div>
            <div className={styles.headerRight}>
              <Text variant="medium" style={{ fontWeight: 'bold' }}>EWS Energy Mobile</Text>
            </div>
          </header>
          
          <div className={styles.pageBody}>
            {renderPage()}
          </div>
        </main>

        {/* Capa para cerrar el menú en móvil al tocar fuera */}
        {isMenuOpen && <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />}
      </div>
    </section>
  );
};

export default Obras;