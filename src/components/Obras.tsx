import * as React from 'react';
import styles from './Obras.module.scss';
import { Spinner, SpinnerSize } from '@fluentui/react';
import { SPFI } from "@pnp/sp";

// Vistas
import { ListaMateriales } from './Vistas/Inventario/ListaMateriales';
import { GaleriaPersonal } from './Vistas/Personal/GaleriaPersonal';
import { TablaObras } from './Vistas/Proyectos/TablaObras';
import { VistaAsignaciones } from './Vistas/Asignaciones/VistaAsignaciones';
import { VistaFotosObra } from './Vistas/Fotos/VistaFotosObra';
import { VistaPlanificacion } from './Vistas/Planificacion/VistaPlanificacion';
import { VistaHistorialTarjetas } from './Vistas/historial/VistaHistorialReportes';
import { ListaClientes } from './Vistas/Cliente/ListaClientes';

interface IObrasMobileProps {
  sp: SPFI | null;
  activeView?: string; // Recibimos la vista activa desde App.tsx
}

export const Obras: React.FC<IObrasMobileProps> = (props) => {
  
  const renderPage = () => {
    if (!props.sp) {
      return (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <Spinner size={SpinnerSize.large} label="Esperando conexión de SharePoint..." />
        </div>
      );
    }

    const sp = props.sp;
    // Utilizamos la prop que viene de App.tsx (activeView)
    const view = props.activeView || 'obras';

    switch (view) {
      case 'obras': return <TablaObras sp={sp} />;
      case 'planificacion': return <VistaPlanificacion sp={sp} />;
      case 'inventario': return <ListaMateriales sp={sp} />;
      case 'personal': return <GaleriaPersonal sp={sp} />;
      case 'asignaciones': return <VistaAsignaciones sp={sp} />;
      case 'fotos': return <VistaFotosObra sp={sp} />;
      case 'historial': return <VistaHistorialTarjetas sp={sp} />;
      case 'clientes': return <ListaClientes sp={sp} />;
      default: return <TablaObras sp={sp} />;
    }
  };

  return (
    <div className={styles.obras}>
      {/* Eliminado appWrapper, Sidebar y Header antiguos que causaban la raya negra */}
      <div className={styles.pageBody}>
        {renderPage()}
      </div>
    </div>
  );
};

export default Obras;