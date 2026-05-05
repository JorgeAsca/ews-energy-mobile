import * as React from "react";
import {
  Stack,
  Text,
  Spinner,
  SpinnerSize,
  PrimaryButton,
  IconButton,
  Separator,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  Modal,
  TextField,
  DefaultButton,
  SearchBox,
  Dropdown,
  IDropdownOption,
  DatePicker,
  ActionButton,
  Link,
} from "@fluentui/react";
import { ProjectService } from "../../../service/ProjectService";
import { ClientesService } from "../../../service/ClientesService"; // <-- IMPORTACIÓN NUEVA
import { SPFI } from "@pnp/sp";
import { IObra } from "../../../models/IObra";
import styles from "./TablaObras.module.scss";

interface ITablaObrasProps {
  sp: SPFI;
}

const estadoOptions: IDropdownOption[] = [
  { key: "all", text: "Todos los estados" },
  { key: "En Proceso", text: "En Proceso" },
  { key: "Completado", text: "Completado" },
  { key: "Pendiente", text: "Pendiente" },
];

export const TablaObras: React.FC<ITablaObrasProps> = (props) => {
  const [obras, setObras] = React.useState<IObra[]>([]);
  const [loading, setLoading] = React.useState(true);
  const hasLoaded = React.useRef(false);

  // Estados para clientes
  const [clientesOptions, setClientesOptions] = React.useState<IDropdownOption[]>([]);

  // Estados para filtros
  const [filterText, setFilterText] = React.useState("");
  const [filterEstado, setFilterEstado] = React.useState<string>("all");
  const [filterFecha, setFilterFecha] = React.useState<Date | undefined>(undefined);

  // Estados para Modal "Nueva Obra"
  const [isOpenNueva, setIsOpenNueva] = React.useState(false);
  const [nuevoNombre, setNuevoNombre] = React.useState("");
  const [nuevaUbicacion, setNuevaUbicacion] = React.useState("");
  const [jornadasPropuestas, setJornadasPropuestas] = React.useState<string>("0");
  const [nuevoClienteId, setNuevoClienteId] = React.useState<number | undefined>(undefined);

  // ESTADOS PARA MODAL "DETALLE / EDITAR"
  const [selectedObra, setSelectedObra] = React.useState<IObra | null>(null);
  const [isDetailOpen, setIsDetailOpen] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  // Campos de edición
  const [editNombre, setEditNombre] = React.useState("");
  const [editUbicacion, setEditUbicacion] = React.useState("");
  const [editEstado, setEditEstado] = React.useState("");
  const [editJornadas, setEditJornadas] = React.useState("");
  const [editClienteId, setEditClienteId] = React.useState<number | undefined>(undefined);

  // Cargar Obras y Clientes simultáneamente
  const cargarDatos = async () => {
    console.log("!!! EJECUTANDO CARGAR DATOS (OBRAS Y CLIENTES) !!!");
    try {
      setLoading(true);
      const projectService = new ProjectService(props.sp);
      const clientesService = new ClientesService(props.sp);

      // Traemos ambas listas a la vez
      const [dataObras, dataClientes] = await Promise.all([
        projectService.getObras(),
        clientesService.getClientes() // OJO: Verifica que este método se llame así en tu ClientesService
      ]);

      setObras(dataObras);

      // Mapeamos los clientes para el Dropdown
      const opcionesClientes = dataClientes.map((c: any) => ({
        key: c.Id,
        text: c.Title
      }));
      setClientesOptions(opcionesClientes);

    } catch (error) {
      console.error("Error al cargar datos:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (!hasLoaded.current) {
      cargarDatos();
      hasLoaded.current = true;
    }
  }, []);

  const guardarNuevaObra = async () => {
    try {
      setLoading(true);
      const projectService = new ProjectService(props.sp);

      await projectService.addObra({
        Title: nuevoNombre,
        DireccionObra: nuevaUbicacion,
        JornadasTotales: Number(jornadasPropuestas),
        EstadoObra: "Pendiente",
        ClienteId: nuevoClienteId // Pasamos el ID del cliente
      });

      await cargarDatos();
      setIsOpenNueva(false);

      // Limpiamos los campos
      setNuevoNombre("");
      setNuevaUbicacion("");
      setJornadasPropuestas("0");
      setNuevoClienteId(undefined);
    } catch (error) {
      console.error("Error al guardar la nueva obra:", error);
    } finally {
      setLoading(false);
    }
  };

  const guardarCambiosObra = async () => {
    if (!selectedObra || !selectedObra.Id) return;

    try {
      setLoading(true);
      const projectService = new ProjectService(props.sp);

      await projectService.updateObra(selectedObra.Id, {
        Title: editNombre,
        DireccionObra: editUbicacion,
        EstadoObra: editEstado,
        JornadasTotales: Number(editJornadas),
        ClienteId: editClienteId // Pasamos el ID del cliente actualizado
      });

      await cargarDatos();
      setIsEditing(false);
      setIsDetailOpen(false);
    } catch (error) {
      console.error("Error al actualizar la obra:", error);
    } finally {
      setLoading(false);
    }
  };

  const abrirDetalle = (obra: IObra) => {
    setSelectedObra(obra);
    setEditNombre(obra.Title);
    setEditUbicacion(obra.DireccionObra || "");
    setEditEstado(obra.EstadoObra || "Pendiente");
    setEditJornadas(String((obra as any).JornadasTotales || 0)); // Corregido a JornadasTotales
    setEditClienteId((obra as any).Cliente?.Id || undefined); // Guardamos el cliente actual
    
    setIsEditing(false);
    setIsDetailOpen(true);
  };

  const filteredObras = React.useMemo(() => {
    return obras.filter((obra) => {
      const matchesName = obra.Title.toLowerCase().includes(filterText.toLowerCase());
      const matchesEstado = filterEstado === "all" || obra.EstadoObra === filterEstado;
      let matchesFecha = true;
      if (filterFecha && (obra as any).Created) {
        const fechaObra = new Date((obra as any).Created).toLocaleDateString();
        const fechaFiltro = filterFecha.toLocaleDateString();
        matchesFecha = fechaObra === fechaFiltro;
      }
      return matchesName && matchesEstado && matchesFecha;
    });
  }, [obras, filterText, filterEstado, filterFecha]);

  const columns: IColumn[] = [
    {
      key: "col1",
      name: "Nombre de la Obra",
      fieldName: "Title",
      minWidth: 200,
      maxWidth: 300,
      isResizable: true,
      onRender: (item: IObra) => (
        <Stack>
          <Link
            onClick={() => abrirDetalle(item)}
            styles={{ root: { textAlign: "left", textDecoration: "none" } }}
          >
            <Text variant="mediumPlus" block style={{ fontWeight: 600, color: "#004d40" }}>
              {item.Title}
            </Text>
          </Link>
          <Text variant="small" style={{ color: "#605e5c" }}>
            {item.DireccionObra || "Sin ubicación"}
          </Text>
        </Stack>
      ),
    },
    {
      key: "col2",
      name: "Estado",
      fieldName: "EstadoObra",
      minWidth: 100,
      maxWidth: 120,
      onRender: (item: IObra) => (
        <span className={`${styles.badge} ${item.EstadoObra === "En Proceso" ? styles.badgeProcess : ""}`}>
          {item.EstadoObra || "Pendiente"}
        </span>
      ),
    },
    {
      key: "col3",
      name: "Progreso",
      minWidth: 150,
      onRender: (item: IObra) => {
        const progreso = (item as any).ProgresoReal || 0; // Usando ProgresoReal por tu servicio
        return (
          <Stack verticalAlign="center" style={{ height: "100%" }}>
            <Text variant="small">{progreso}% completado</Text>
            <div style={{ width: "100%", background: "#eee", height: 8, borderRadius: 4 }}>
              <div style={{ width: `${progreso}%`, background: "#8bc34a", height: "100%", borderRadius: 4 }} />
            </div>
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
          iconProps={{ iconName: "Info" }}
          title="Ver detalles"
          className={styles.actionIcon}
          onClick={() => abrirDetalle(item)}
        />
      ),
    },
  ];

  return (
    <Stack className={styles.container}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" className={styles.headerSection}>
        <Stack>
          <Text className={styles.tituloPrincipal}>Gestión de Proyectos</Text>
          <Text className={styles.subtituloHeader}>
            Supervisa el avance y detalles de las obras activas.
          </Text>
        </Stack>
        <PrimaryButton iconProps={{ iconName: "Add" }} className={styles.btnNuevaObra} onClick={() => setIsOpenNueva(true)}>
          Nueva Obra
        </PrimaryButton>
      </Stack>

      <Stack horizontal tokens={{ childrenGap: 15 }} className={styles.filterBar} style={{ marginBottom: 20 }}>
        <SearchBox placeholder="Buscar por nombre..." styles={{ root: { width: 300 } }} onChange={(_, val) => setFilterText(val || "")} />
        <Dropdown placeholder="Estado" options={estadoOptions} selectedKey={filterEstado} onChange={(_, opt) => setFilterEstado(opt?.key as string)} styles={{ root: { width: 180 } }} />
        <DatePicker placeholder="Filtrar por fecha" value={filterFecha} onSelectDate={(date) => setFilterFecha(date || undefined)} styles={{ root: { width: 180 } }} />
      </Stack>

      <Separator />

      <div className={styles.tableWrapper}>
        <DetailsList items={filteredObras} columns={columns} layoutMode={DetailsListLayoutMode.justified} selectionMode={SelectionMode.none} />
      </div>

      {/* MODAL: REGISTRAR NUEVA OBRA */}
      <Modal isOpen={isOpenNueva} onDismiss={() => setIsOpenNueva(false)} containerClassName={styles.modalContainer}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <Text variant="xLarge" className={styles.modalTitle}>Registrar Nueva Obra</Text>
            <IconButton iconProps={{ iconName: "Cancel" }} onClick={() => setIsOpenNueva(false)} />
          </div>
          <Stack tokens={{ childrenGap: 15 }} style={{ marginTop: 20 }}>
            <TextField label="Nombre del Proyecto" value={nuevoNombre} onChange={(_, val) => setNuevoNombre(val || "")} required />
            
            <Dropdown 
              label="Cliente" 
              placeholder="Selecciona un cliente" 
              options={clientesOptions} 
              selectedKey={nuevoClienteId} 
              onChange={(_, opt) => setNuevoClienteId(opt?.key as number)} 
            />

            <TextField label="Dirección / Ubicación" value={nuevaUbicacion} onChange={(_, val) => setNuevaUbicacion(val || "")} />
            <TextField label="Jornadas Propuestas" type="number" value={jornadasPropuestas} onChange={(_, val) => setJornadasPropuestas(val || "0")} />
          </Stack>
          <div className={styles.modalFooter}>
            <DefaultButton text="Cancelar" onClick={() => setIsOpenNueva(false)} />
            <PrimaryButton text="Guardar Proyecto" onClick={guardarNuevaObra} disabled={!nuevoNombre} />
          </div>
        </div>
      </Modal>

      {/* MODAL FLOTANTE: DETALLE E INFORMACIÓN DE LA OBRA */}
      <Modal isOpen={isDetailOpen} onDismiss={() => setIsDetailOpen(false)} containerClassName={styles.modalContainer}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <Text variant="xLarge" className={styles.modalTitle}>
              {isEditing ? "Editar Información" : "Detalles de la Obra"}
            </Text>
            <IconButton iconProps={{ iconName: "Cancel" }} onClick={() => setIsDetailOpen(false)} />
          </div>

          <Stack tokens={{ childrenGap: 20 }} style={{ marginTop: 20 }}>
            {isEditing ? (
              // VISTA DE EDICIÓN
              <>
                <TextField label="Nombre de la Obra" value={editNombre} onChange={(_, v) => setEditNombre(v || "")} />
                
                <Dropdown 
                  label="Cliente" 
                  options={clientesOptions} 
                  selectedKey={editClienteId}
                  onChange={(_, opt) => setEditClienteId(opt?.key as number)}
                />

                <TextField label="Ubicación" value={editUbicacion} onChange={(_, v) => setEditUbicacion(v || "")} />
                <Dropdown label="Estado" options={estadoOptions.filter((o) => o.key !== "all")} selectedKey={editEstado} onChange={(_, opt) => setEditEstado(opt?.key as string)} />
                <TextField label="Jornadas Totales" type="number" value={editJornadas} onChange={(_, v) => setEditJornadas(v || "0")} />
              </>
            ) : (
              // VISTA DE DETALLE
              <Stack tokens={{ childrenGap: 10 }}>
                <div style={{ background: "#f8f9fa", padding: "15px", borderRadius: "8px", borderLeft: "4px solid #004d40" }}>
                  <Text variant="large" block style={{ fontWeight: 600 }}>{selectedObra?.Title}</Text>
                  <Text variant="medium" style={{ color: "#605e5c" }}>{selectedObra?.DireccionObra || "Sin dirección registrada"}</Text>
                </div>

                <Stack horizontal horizontalAlign="space-between">
                  <Text style={{ fontWeight: 600 }}>Estado Actual:</Text>
                  <span className={`${styles.badge} ${selectedObra?.EstadoObra === "En Proceso" ? styles.badgeProcess : ""}`}>
                    {selectedObra?.EstadoObra}
                  </span>
                </Stack>

                <Separator />

                <Stack tokens={{ childrenGap: 5 }}>
                  <Text variant="medium" style={{ fontWeight: 600 }}>Información de Seguimiento</Text>
                  <Text>ID de Obra: <strong>{selectedObra?.Id}</strong></Text>
                  <Text>Cliente: <strong>{(selectedObra as any)?.Cliente?.Title || "Sin cliente"}</strong></Text>
                  <Text>Jornadas Totales: <strong>{(selectedObra as any)?.JornadasTotales || 0}</strong></Text>
                  <Text>
                    Fecha de Creación: <strong>{selectedObra && (selectedObra as any).Created ? new Date((selectedObra as any).Created).toLocaleDateString() : "No disponible"}</strong>
                  </Text>
                </Stack>
              </Stack>
            )}
          </Stack>

          <div className={styles.modalFooter} style={{ marginTop: 30 }}>
            {isEditing ? (
              <>
                <DefaultButton text="Descartar" onClick={() => setIsEditing(false)} />
                <PrimaryButton text="Guardar Cambios" iconProps={{ iconName: "Save" }} onClick={guardarCambiosObra} disabled={!editNombre} />
              </>
            ) : (
              <>
                <DefaultButton text="Cerrar" onClick={() => setIsDetailOpen(false)} />
                <PrimaryButton text="Editar Obra" iconProps={{ iconName: "Edit" }} onClick={() => setIsEditing(true)} />
              </>
            )}
          </div>
        </div>
      </Modal>
    </Stack>
  );
};