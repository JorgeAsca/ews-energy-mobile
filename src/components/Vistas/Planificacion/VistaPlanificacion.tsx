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
  Separator,
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

// Definimos que recibe 'sp' para la conexión móvil
interface IVistaPlanificacionProps {
  sp: SPFI;
}

export const VistaPlanificacion: React.FC<IVistaPlanificacionProps> = (props) => {
  const [obras, setObras] = React.useState<IObra[]>([]);
  const [personalDisponible, setPersonalDisponible] = React.useState<IPersonal[]>([]);
  const [asignaciones, setAsignaciones] = React.useState<IAsignacion[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selectedAsig, setSelectedAsig] = React.useState<number | null>(null);

  const [obrasPendientes, setObrasPendientes] = React.useState<IObraPendiente[]>([]);
  const [showAddPending, setShowAddPending] = React.useState(false);
  const [newPending, setNewPending] = React.useState<IObraPendiente>({
    nombre: "",
    motivo: "",
  });

  // Inicializamos los servicios con el objeto 'sp' inyectado
  const services = React.useMemo(() => ({
    project: new ProjectService(props.sp),
    personal: new PersonalService(props.sp),
    asignaciones: new AsignacionesService(props.sp),
  }), [props.sp]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
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

  const eliminarAsignacion = async () => {
    if (selectedAsig) {
      try {
        await services.asignaciones.eliminarAsignacion(selectedAsig);
        setSelectedAsig(null);
        cargarDatos();
      } catch (error) {
        console.error("Error al eliminar asignación:", error);
      }
    }
  };

  if (loading) return <Spinner size={SpinnerSize.large} label="Cargando planificación semanal..." />;

  return (
    <Stack className={styles.vistaPlanificacion} tokens={{ childrenGap: 20 }}>
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

      <div className={styles.calendarContainer}>
        <div className={styles.gridPlanificacion}>
          {DIAS_SEMANA.map((dia) => (
            <div key={dia} className={styles.columnaDia}>
              <Text variant="large" className={styles.diaHeader}>
                {dia}
              </Text>
              <Separator />
              <Stack tokens={{ childrenGap: 10 }} className={styles.listaAsignaciones}>
              </Stack>
            </div>
          ))}
        </div>
      </div>

      <Dialog
        hidden={!showAddPending}
        onDismiss={() => setShowAddPending(false)}
        dialogContentProps={{
          type: DialogType.normal,
          title: "Nueva Nota Pendiente",
        }}
      >
        <TextField
          label="Nombre"
          value={newPending.nombre}
          onChange={(_, v) => setNewPending({ ...newPending, nombre: v || "" })}
        />
        <TextField
          label="Motivo"
          multiline
          rows={3}
          value={newPending.motivo}
          onChange={(_, v) => setNewPending({ ...newPending, motivo: v || "" })}
        />
        <DialogFooter>
          <PrimaryButton
            onClick={() => {
              setObrasPendientes([...obrasPendientes, newPending]);
              setNewPending({ nombre: "", motivo: "" });
              setShowAddPending(false);
            }}
            text="Añadir"
          />
          <DefaultButton
            onClick={() => setShowAddPending(false)}
            text="Cancelar"
          />
        </DialogFooter>
      </Dialog>

      <Dialog
        hidden={!selectedAsig}
        onDismiss={() => setSelectedAsig(null)}
        dialogContentProps={{
          type: DialogType.normal,
          title: "Gestionar Asignación",
        }}
      >
        <DialogFooter>
          <PrimaryButton onClick={eliminarAsignacion} text="Eliminar" />
          <DefaultButton
            onClick={() => setSelectedAsig(null)}
            text="Cancelar"
          />
        </DialogFooter>
      </Dialog>
    </Stack>
  );
};