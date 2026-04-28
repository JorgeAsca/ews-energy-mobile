import * as React from "react";
import {
  Stack,
  Text,
  Spinner,
  SpinnerSize,
  PrimaryButton,
  IconButton,
  ProgressIndicator,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  Panel,
  PanelType,
  TextField,
  DefaultButton,
  Separator,
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

  // Estados para el formulario de Nueva Obra
  const [nuevoNombre, setNuevoNombre] = React.useState("");
  const [nuevaUbicacion, setNuevaUbicacion] = React.useState("");
  const [jornadasPropuestas, setJornadasPropuestas] = React.useState<string>("0");

  const cargarObras = async () => {
    console.log("!!! EJECUTANDO CARGAR OBRAS !!!");
    try {
      setLoading(true);
      const projectService = new ProjectService(props.sp);
      const data = await projectService.getObras();
      setObras(data);
    } catch (error) {
      console.error("Error al cargar obras:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
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
              barHeight={4} // Más delgada y discreta
              className={styles.discreetProgress}
            />
          </Stack>
        );
      },
    },
    {
      key: "col4",
      name: "",
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
      <Stack className={styles.header} horizontal horizontalAlign="space-between" verticalAlign="center">
        <Stack>
          <Text variant="xxLarge" className={styles.mainHeading}>Mis Proyectos</Text>
          <Text className={styles.subHeading}>Control de obras y recursos</Text>
        </Stack>
        <PrimaryButton 
          iconProps={{ iconName: "Add" }} 
          text="Nueva Obra" 
          onClick={() => setIsOpen(true)}
          className={styles.mainBtn}
        />
      </Stack>

      <div className={styles.cardContainer}>
        {loading ? (
          <Spinner size={SpinnerSize.large} label="Actualizando datos..." className={styles.loading} />
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

      {/* Panel para Crear Nueva Obra */}
      <Panel
        isOpen={isOpen}
        onDismiss={() => setIsOpen(false)}
        type={PanelType.medium}
        headerText="Configuración de Nueva Obra"
        closeButtonAriaLabel="Cerrar"
      >
        <Stack tokens={{ childrenGap: 15 }} style={{ marginTop: 20 }}>
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
          
          <Separator style={{ marginTop: 20 }} />
          
          <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
            <DefaultButton text="Cancelar" onClick={() => setIsOpen(false)} />
            <PrimaryButton 
              text="Guardar Proyecto" 
              onClick={() => {
                console.log("Guardando:", { nuevoNombre, nuevaUbicacion, jornadasPropuestas });
                setIsOpen(false);
              }} 
            />
          </Stack>
        </Stack>
      </Panel>
    </Stack>
  );
};