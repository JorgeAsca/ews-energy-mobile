import * as React from "react";
import {
  Stack,
  Text,
  Spinner,
  SpinnerSize,
  PrimaryButton,
  IconButton,
  ProgressIndicator,
  Separator,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  Modal,
  TextField,
  DefaultButton,
} from "@fluentui/react";
import { ProjectService } from "../../../service/ProjectService";
import { SPFI } from "@pnp/sp";
import { IObra } from "../../../models/IObra";
import styles from "./TablaObras.module.scss";

interface ITablaObrasProps {
  sp: SPFI;
}

export const TablaObras: React.FC<ITablaObrasProps> = (props) => {
  const [obras, setObras] = React.useState<IObra[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const hasLoaded = React.useRef(false);

  // Estados para el formulario de la Modal
  const [nuevoNombre, setNuevoNombre] = React.useState("");
  const [nuevaUbicacion, setNuevaUbicacion] = React.useState("");
  const [jornadasPropuestas, setJornadasPropuestas] = React.useState<string>("0");

  const cargarObras = async () => {
    console.log("!!! EJECUTANDO CARGAR OBRAS !!!"); // <-- LOG CRÍTICO MANTENIDO
    try {
      setLoading(true);
      const projectService = new ProjectService(props.sp);
      const data = await projectService.getObras();
      console.log("Datos recibidos:", data);
      setObras(data);
    } catch (error) {
      console.error("Error en el servicio:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    console.log("useEffect disparado. sp existe?:", !!props.sp); // <-- LOG CRÍTICO MANTENIDO
    if (props.sp && !hasLoaded.current) {
      cargarObras();
      hasLoaded.current = true;
    }
  }, [props.sp]);

  const columns: IColumn[] = [
    {
      key: "col1",
      name: "Proyecto",
      fieldName: "Title",
      minWidth: 200,
      onRender: (item: IObra) => (
        <Stack className={styles.cellMain}>
          <Text className={styles.txtTitle}>{item.Title}</Text>
          <Text className={styles.txtSubtitle}>{item.Cliente?.Title || "Sin Cliente"}</Text>
        </Stack>
      ),
    },
    {
      key: "col2",
      name: "Ubicación",
      fieldName: "DireccionObra",
      minWidth: 150,
      onRender: (item: IObra) => (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 6 }}>
          <IconButton iconProps={{ iconName: 'CompassNW' }} className={styles.iconDim} />
          <Text className={styles.txtNormal}>{item.DireccionObra || "Pendiente"}</Text>
        </Stack>
      ),
    },
    {
      key: "col3",
      name: "Progreso y Jornadas",
      minWidth: 200,
      onRender: (item: IObra) => {
        const progreso = (item.ProgresoReal || 0) / 100;
        return (
          <Stack tokens={{ childrenGap: 2 }}>
            <Stack horizontal horizontalAlign="space-between">
              <Text className={styles.txtSmallBold}>{item.ProgresoReal || 0}%</Text>
              <Text className={styles.txtSmallDim}>{item.JornadasTotales || 0} Jornadas</Text>
            </Stack>
            <ProgressIndicator 
              percentComplete={progreso} 
              barHeight={4} 
              className={styles.discreetProgress}
            />
          </Stack>
        );
      },
    },
    {
      key: "col4",
      name: "Acciones",
      minWidth: 50,
      onRender: (item: IObra) => (
        <IconButton 
          iconProps={{ iconName: "ChevronRight" }} 
          className={styles.actionIcon}
          onClick={() => console.log("Navegar a detalle de:", item.Id)} 
        />
      ),
    },
  ];

  return (
    <Stack className={styles.container}>
      <Stack className={styles.headerSection} horizontal horizontalAlign="space-between" verticalAlign="center">
        <Stack>
          <Text variant="xxLarge" className={styles.tituloPrincipal}>Mis Proyectos</Text>
          <Text className={styles.subtituloHeader}>Gestión y seguimiento de obras activas</Text>
        </Stack>
        <PrimaryButton 
          iconProps={{ iconName: "Add" }} 
          text="Nueva Obra" 
          className={styles.btnNuevaObra}
          onClick={() => setIsOpen(true)}
        />
      </Stack>

      <div className={styles.tableWrapper}>
        {loading ? (
          <Stack verticalAlign="center" horizontalAlign="center" style={{ height: '300px' }}>
            <Spinner size={SpinnerSize.large} label="Sincronizando con SharePoint..." />
          </Stack>
        ) : (
          <DetailsList
            items={obras}
            columns={columns}
            setKey="id"
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            className={styles.fluentList}
          />
        )}
      </div>

      {/* =========================================
          MODAL FLOTANTE ESTILO "PERSONAL"
      ========================================= */}
      <Modal
        isOpen={isOpen}
        onDismiss={() => setIsOpen(false)}
        isBlocking={false}
        containerClassName={styles.modalContainer}
      >
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <Text variant="xLarge" className={styles.modalTitle}>Añadir Nueva Obra</Text>
            <IconButton
              iconProps={{ iconName: 'Cancel' }}
              ariaLabel="Cerrar modal"
              onClick={() => setIsOpen(false)}
              className={styles.btnClose}
            />
          </div>
          
          <Separator className={styles.modalSeparator} />

          <Stack tokens={{ childrenGap: 15 }}>
            <TextField 
              label="Nombre de la Obra" 
              placeholder="Ej: Instalación Fotovoltaica..." 
              value={nuevoNombre} 
              onChange={(_, val) => setNuevoNombre(val || "")}
              required 
            />
            <TextField 
              label="Dirección / Ubicación" 
              placeholder="Calle, Ciudad..." 
              value={nuevaUbicacion}
              onChange={(_, val) => setNuevaUbicacion(val || "")}
            />
            <Stack horizontal tokens={{ childrenGap: 10 }}>
              <TextField 
                label="Jornadas Propuestas" 
                type="number"
                style={{ width: '100%' }}
                value={jornadasPropuestas}
                onChange={(_, val) => setJornadasPropuestas(val || "0")}
              />
              <TextField 
                label="Estado Inicial" 
                value="En Proceso" 
                disabled 
                style={{ width: '100%' }} 
              />
            </Stack>
          </Stack>
          
          <Separator className={styles.modalSeparator} />
          
          <div className={styles.modalFooter}>
            <DefaultButton text="Cancelar" onClick={() => setIsOpen(false)} />
            <PrimaryButton 
              text="Guardar Proyecto" 
              onClick={() => {
                console.log("Guardando:", { nuevoNombre, nuevaUbicacion, jornadasPropuestas });
                setIsOpen(false);
              }} 
            />
          </div>
        </div>
      </Modal>
    </Stack>
  );
};