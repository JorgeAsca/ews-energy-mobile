import * as React from 'react';
import styles from './Obras.module.scss';
import { IconButton, Text, Spinner, SpinnerSize } from '@fluentui/react';
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

interface IObrasMobileProps {
  sp: SPFI | null;
}

export const Obras: React.FC<IObrasMobileProps> = (props) => {
  const [selectedKey, setSelectedKey] = React.useState<string>('obras');
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  // LOG DE DIAGNÓSTICO: Verificamos si el componente llega a montarse
  React.useEffect(() => {
    console.log(">>> COMPONENTE OBRAS MONTADO CORRECTAMENTE <<<");
    console.log(">>> ESTADO DEL OBJETO SP:", props.sp);
  }, [props.sp]);

  const renderPage = () => {
    // Si el objeto SP no ha llegado, el problema está en App.tsx
    if (!props.sp) {
      console.warn(">>> ADVERTENCIA: props.sp es NULL en Obras.tsx <<<");
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Spinner size={SpinnerSize.large} label="Esperando conexión de SharePoint..." />
          <Text variant="small">Si esto no desaparece, el login falló silenciosamente.</Text>
        </div>
      );
    }

    const sp = props.sp;
    console.log(">>> RENDERIZANDO VISTA:", selectedKey);

    switch (selectedKey) {
      case 'obras': return <TablaObras sp={sp} />;
      case 'planificacion': return <VistaPlanificacion sp={sp} />;
      case 'inventario': return <ListaMateriales sp={sp} />;
      case 'personal': return <GaleriaPersonal sp={sp} />;
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
            setIsMenuOpen(false); 
          }} 
        />
        
        <main className={styles.mainContent}>
          <header className={styles.header}>
            <div className={styles.headerLeft}>
              <IconButton 
                iconProps={{ iconName: 'GlobalNavButton' }} 
                className={styles.menuButton}
                onClick={() => {
                  console.log("Click en Menú Hamburguesa");
                  setIsMenuOpen(!isMenuOpen);
                }}
              />
            </div>
            <div className={styles.headerRight}>
              <Text variant="medium" style={{ fontWeight: 'bold', color: '#004b3e' }}>
                EWS Energy Mobile
              </Text>
            </div>
          </header>
          
          <div className={styles.pageBody}>
            {renderPage()}
          </div>
        </main>

        {isMenuOpen && (
          <div className={styles.overlay} onClick={() => setIsMenuOpen(false)} />
        )}
      </div>
    </section>
  );
};

export default Obras;