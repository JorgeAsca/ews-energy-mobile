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
  
  // Usamos una referencia para evitar múltiples llamadas si el componente se re-renderiza
  const hasLoaded = React.useRef(false);

  // Memorizamos el servicio para que sea eficiente
  const projectService = React.useMemo(() => new ProjectService(props.sp), [props.sp]);

  const cargarObras = async () => {
    try {
      setLoading(true);
      console.log("Iniciando petición de obras a SharePoint...");
      const data = await projectService.getObras();
      console.log("Datos cargados con éxito:", data);
      setObras(data);
    } catch (error) {
      console.error("Error al cargar las obras en el componente:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Solo disparamos la carga si el objeto SP existe y no hemos cargado ya
    if (props.sp && !hasLoaded.current) {
      console.log("Conexión SP detectada, cargando tabla...");
      hasLoaded.current = true;
      cargarObras();
    }
  }, [props.sp]);

  const columns: IColumn[] = [
    {
      key: "col1",
      name: "Proyecto",
      fieldName: "Title",
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
    },
    {
      key: "col2",
      name: "Estado",
      fieldName: "EstadoObra",
      minWidth: 100,
      onRender: (item: IObra) => (
        <Text style={{ 
          color: item.EstadoObra === 'Finalizado' ? '#107c10' : '#3880ff',
          fontWeight: '600' 
        }}>
          {item.EstadoObra}
        </Text>
      ),
    },
    {
      key: "col3",
      name: "Progreso",
      fieldName: "ProgresoReal",
      minWidth: 120,
      onRender: (item: IObra) => (
        <ProgressIndicator 
          percentComplete={(item.ProgresoReal || 0) / 100} 
          description={`${item.ProgresoReal || 0}%`} 
        />
      ),
    },
    {
      key: "col4",
      name: "Acciones",
      minWidth: 50,
      onRender: (item: IObra) => (
        <IconButton 
          iconProps={{ iconName: "View" }} 
          title="Ver detalles" 
          onClick={() => console.log("Ver obra ID:", item.Id)} 
        />
      ),
    },
  ];

  if (loading) {
    return (
      <Stack verticalAlign="center" horizontalAlign="center" style={{ height: '200px' }}>
        <Spinner size={SpinnerSize.large} label="Conectando con SharePoint..." />
      </Stack>
    );
  }

  return (
    <Stack className={styles.tablaObras} tokens={{ childrenGap: 20 }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge" style={{ fontWeight: '600' }}>Panel de Proyectos Activos</Text>
        <PrimaryButton iconProps={{ iconName: "Add" }} text="Nueva Obra" />
      </Stack>

      <Separator />

      {obras.length > 0 ? (
        <DetailsList
          items={obras}
          columns={columns}
          setKey="set"
          layoutMode={DetailsListLayoutMode.justified}
          selectionMode={SelectionMode.none}
        />
      ) : (
        <Stack horizontalAlign="center" tokens={{ childrenGap: 10 }}>
          <Text variant="medium">No se encontraron proyectos o no tienes permisos de acceso.</Text>
          <PrimaryButton text="Reintentar carga" onClick={cargarObras} />
        </Stack>
      )}
    </Stack>
  );
};