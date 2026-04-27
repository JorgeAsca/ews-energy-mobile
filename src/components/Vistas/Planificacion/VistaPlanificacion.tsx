import * as React from "react";
import {
  Stack,
  Text,
  Persona,
  PersonaSize,
  Spinner,
  SpinnerSize,
  Dialog,
  DialogType,
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  TextField,
  IconButton,
  ProgressIndicator,
  Dropdown,
  IDropdownOption,
} from "@fluentui/react";
import { ProjectService } from "../../../service/ProjectService";
import { PersonalService } from "../../../service/PersonalService";
import { AsignacionesService } from "../../../service/AsignacionesService";
import { IObra } from "../../../models/IObra";
import { IPersonal } from "../../../models/IPersonal";
import { IAsignacion } from "../../../models/IAsignacion";
import { SPFI } from "@pnp/sp";
import styles from "./VistaPlanificacion.module.scss";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

interface IObraPendiente {
  nombre: string;
  motivo: string;
}

interface IVistaPlanificacionProps {
  sp: SPFI;
}

export const VistaPlanificacion: React.FC<IVistaPlanificacionProps> = (props) => {
  const [obras, setObras] = React.useState<IObra[]>([]);
  const [personalDisponible, setPersonalDisponible] = React.useState<IPersonal[]>([]);
  const [asignaciones, setAsignaciones] = React.useState<IAsignacion[]>([]);
  const [loading, setLoading] = React.useState(true);
  
  const [selectedAsig, setSelectedAsig] = React.useState<{
    asig: IAsignacion;
    persona: IPersonal;
  } | null>(null);
  
  // NUEVO ESTADO: Para saber a qué persona nueva hemos seleccionado en el desplegable
  const [editPersonId, setEditPersonId] = React.useState<number | null>(null);
  
  const [obrasPendientes, setObrasPendientes] = React.useState<IObraPendiente[]>([]);
  const [showAddPending, setShowAddPending] = React.useState(false);
  const [newPending, setNewPending] = React.useState<IObraPendiente>({
    nombre: "",
    motivo: "",
  });

  const services = React.useMemo(
    () => ({
      project: new ProjectService(props.sp),
      personal: new PersonalService(props.sp),
      asignaciones: new AsignacionesService(props.sp),
    }),
    [props.sp],
  );

  const getFechaPorDia = (nombreDia: string): Date => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); 
    
    const diaSemana = hoy.getDay() || 7; 
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - diaSemana + 1);
    
    const index = DIAS_SEMANA.indexOf(nombreDia);
    const fechaResultado = new Date(lunes);
    fechaResultado.setDate(lunes.getDate() + index);
    
    return fechaResultado;
  };

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [o, p, a] = await Promise.all([
        services.project.getObras(),
        services.personal.getPersonal(),
        services.asignaciones.getAsignaciones(),
      ]);
      setObras(o);
      setPersonalDisponible(p);
      setAsignaciones(a);
    } catch (error) {
      console.error("Error al cargar planificación:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (props.sp) {
      cargarDatos();
    }
  }, [props.sp]);

  const onDrop = async (ev: React.DragEvent, obraId: number, dia: string) => {
    ev.preventDefault();
    const personId = parseInt(ev.dataTransfer.getData("personId"));
    const fecha = getFechaPorDia(dia);
    try {
      await services.asignaciones.asignarPersonal({
        ObraId: obraId,
        PersonalId: personId,
        FechaInicio: fecha,
        FechaFinPrevista: fecha,
        EstadoProgreso: 0,
      });
      await cargarDatos();
    } catch (error) {
      console.error("Error al asignar personal:", error);
    }
  };

  // NUEVA FUNCIÓN: Para guardar el cambio de persona
  const editarAsignacion = async () => {
    if (!selectedAsig?.asig.Id || !editPersonId) return;
    try {
      await services.asignaciones.actualizarAsignacion(selectedAsig.asig.Id, {
        PersonalId: editPersonId
      });
      setSelectedAsig(null);
      await cargarDatos();
    } catch (error) {
      console.error("Error al editar asignación:", error);
    }
  };

  const eliminarAsignacion = async () => {
    if (!selectedAsig?.asig.Id) return;
    try {
      await services.asignaciones.eliminarAsignacion(selectedAsig.asig.Id);
      setSelectedAsig(null);
      await cargarDatos();
    } catch (error) {
      console.error("Error al eliminar asignación:", error);
    }
  };

  // Preparamos las opciones para el desplegable de trabajadores
  const personalOptions: IDropdownOption[] = personalDisponible.map(p => ({
    key: p.Id,
    text: p.NombreyApellido
  }));

  if (loading) return <Spinner label="Cargando planificación semanal..." size={SpinnerSize.large} />;

  return (
    <Stack tokens={{ childrenGap: 15 }} className={styles.vistaPlanificacion}>
      {/* HEADER */}
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Text variant="xLarge" className={styles.title}>
          Planificación Semanal 📅
        </Text>
        <PrimaryButton
          iconProps={{ iconName: "Add" }}
          text="Nota Pendiente"
          onClick={() => setShowAddPending(true)}
        />
      </Stack>

      {/* PANEL PERSONAL ARRIBA */}
      <div className={styles.personalPanelTop}>
        <div className={styles.personalListHorizontal}>
          {personalDisponible.map((p) => (
            <div
              key={p.Id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData("personId", p.Id.toString())}
              className={styles.draggablePersonaCard}
            >
              <Persona text={p.NombreyApellido} imageUrl={p.FotoPerfil} size={PersonaSize.size24} />
            </div>
          ))}
        </div>
      </div>

      {/* CUERPO: TABLA Y PENDIENTES */}
      <Stack horizontal tokens={{ childrenGap: 15 }} styles={{ root: { width: "100%", alignItems: "start" } }}>
        <div className={styles.tableContainer}>
          <table className={styles.planTable}>
            <thead>
              <tr>
                <th className={styles.colObra}>Obra</th>
                {DIAS_SEMANA.map((d) => (
                  <th key={d} className={styles.colDia}>{d}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {obras.map((obra) => (
                <tr key={obra.Id}>
                  <td className={styles.cellObra}>
                    <Stack tokens={{ childrenGap: 4 }}>
                      <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>{obra.Title}</Text>
                      <Stack>
                        <Text variant="small" styles={{ root: { color: '#666', fontSize: '11px' } }}>
                          Avance: {obra.ProgresoReal || 0}% • {obra.EstadoObra}
                        </Text>
                        <ProgressIndicator 
                          percentComplete={(obra.ProgresoReal || 0) / 100} 
                          styles={{ itemProgress: { padding: 0 }, progressBar: { backgroundColor: '#107c41' } }} 
                        />
                      </Stack>
                    </Stack>
                  </td>

                  {DIAS_SEMANA.map((dia) => {
                    const fechaDiaObj = getFechaPorDia(dia);
                    
                    const asigsEnDia = asignaciones.filter((a) => {
                      if (a.ObraId !== obra.Id || !a.FechaInicio) return false;
                      const fechaAsig = new Date(a.FechaInicio);
                      return (
                        fechaAsig.getFullYear() === fechaDiaObj.getFullYear() &&
                        fechaAsig.getMonth() === fechaDiaObj.getMonth() &&
                        fechaAsig.getDate() === fechaDiaObj.getDate()
                      );
                    });

                    return (
                      <td
                        key={dia}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => onDrop(e, obra.Id, dia)}
                        className={styles.dropZone}
                      >
                        <div className={styles.asignadosConsola}>
                          {asigsEnDia.map((a) => {
                            const p = personalDisponible.find((pers) => pers.Id === a.PersonalId);
                            return p ? (
                              <div
                                key={a.Id}
                                onClick={() => {
                                  setSelectedAsig({ asig: a, persona: p });
                                  setEditPersonId(p.Id); // Al abrir el modal, preseleccionamos a la persona actual
                                }}
                                className={styles.fotoAsignada}
                              >
                                <Persona text={p.NombreyApellido} imageUrl={p.FotoPerfil} size={PersonaSize.size32} />
                              </div>
                            ) : null;
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PANEL PENDIENTES */}
        <div className={styles.pendingPanel}>
          <Text className={styles.panelTituloCompacto}>Pendientes</Text>
          <div className={styles.pendingList}>
            {obrasPendientes.length === 0 && <span className={styles.emptyText}>Sin notas</span>}
            {obrasPendientes.map((op, idx) => (
              <div key={idx} className={styles.pendingItem}>
                <Stack horizontal horizontalAlign="space-between">
                  <Text className={styles.pendingName}>{op.nombre}</Text>
                  <IconButton
                    iconProps={{ iconName: "Cancel" }}
                    styles={{ root: { height: 16, width: 16, fontSize: 10 } }}
                    onClick={() => setObrasPendientes(obrasPendientes.filter((_, i) => i !== idx))}
                  />
                </Stack>
                <Text className={styles.pendingReason}>{op.motivo}</Text>
              </div>
            ))}
          </div>
        </div>
      </Stack>

      {/* DIALOGS */}
      <Dialog hidden={!showAddPending} onDismiss={() => setShowAddPending(false)} dialogContentProps={{ type: DialogType.normal, title: "Nueva Nota Pendiente" }}>
        <TextField label="Nombre" value={newPending.nombre} onChange={(_, v) => setNewPending({ ...newPending, nombre: v || "" })} />
        <TextField label="Motivo" multiline rows={3} value={newPending.motivo} onChange={(_, v) => setNewPending({ ...newPending, motivo: v || "" })} />
        <DialogFooter>
          <PrimaryButton onClick={() => { setObrasPendientes([...obrasPendientes, newPending]); setNewPending({ nombre: "", motivo: "" }); setShowAddPending(false); }} text="Añadir" />
          <DefaultButton onClick={() => setShowAddPending(false)} text="Cancelar" />
        </DialogFooter>
      </Dialog>

      <Dialog
        hidden={!selectedAsig}
        onDismiss={() => setSelectedAsig(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: "Editar Asignación",
          subText: "Cambia el trabajador asignado o elimina la asignación por completo."
        }}
      >
        <Stack tokens={{ childrenGap: 15 }} style={{ marginTop: '10px' }}>
            <Dropdown
              label="Trabajador asignado"
              selectedKey={editPersonId}
              options={personalOptions}
              onChange={(_, option) => setEditPersonId(option?.key as number)}
            />
        </Stack>
        <DialogFooter>
          <PrimaryButton 
            onClick={editarAsignacion} 
            text="Guardar Cambios" 
            disabled={editPersonId === selectedAsig?.persona.Id} // Se deshabilita si no hay cambios
          />
          <DefaultButton 
            onClick={eliminarAsignacion} 
            text="Eliminar" 
            styles={{ root: { color: '#d13438' } }} // Color rojo sutil para indicar peligro
          />
          <DefaultButton onClick={() => setSelectedAsig(null)} text="Cancelar" />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};