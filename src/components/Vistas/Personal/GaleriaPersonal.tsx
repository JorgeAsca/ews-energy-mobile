import * as React from "react";
import {
  Stack, Text, Persona, PersonaSize, Spinner, SpinnerSize, MessageBar, 
  MessageBarType, PrimaryButton, DefaultButton, TextField, Dropdown, 
  IDropdownOption, Icon, Separator, IconButton, Shimmer,
  ShimmerElementType, Dialog, DialogType, DialogFooter, Modal
} from "@fluentui/react";
import { PersonalService } from "../../../service/PersonalService";
import { IPersonal } from "../../../models/IPersonal";
import { SPFI } from "@pnp/sp";
import styles from "./GaleriaPersonal.module.scss";

// Componente para el estado de carga estética
const PersonaShimmer = () => (
  <div className={styles.cardEmpleadoShimmer}>
    <Stack horizontalAlign="center" tokens={{ childrenGap: 15 }}>
      <Shimmer shimmerElements={[{ type: ShimmerElementType.circle, height: 100 }]} />
      <Shimmer shimmerElements={[{ type: ShimmerElementType.line, height: 16, width: '80%' }]} />
      <Shimmer shimmerElements={[{ type: ShimmerElementType.line, height: 12, width: '60%' }]} />
      <Separator className={styles.shimmerSeparator} />
      <Stack horizontal horizontalAlign="space-between" className={styles.fullWidth}>
        <Shimmer shimmerElements={[{ type: ShimmerElementType.line, height: 10, width: '30%' }]} />
        <Shimmer shimmerElements={[{ type: ShimmerElementType.circle, height: 16 }]} />
      </Stack>
    </Stack>
  </div>
);

// Interfaz que recibe la conexión PnPjs desde el componente padre
interface IGaleriaPersonalProps {
  sp: SPFI;
}

export const GaleriaPersonal: React.FC<IGaleriaPersonalProps> = (props) => {
  const [personal, setPersonal] = React.useState<IPersonal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isOpen, setIsOpen] = React.useState(false);
  const [editandoId, setEditandoId] = React.useState<number | null>(null);
  const [hideDeleteDialog, setHideDeleteDialog] = React.useState(true);
  const [procesando, setProcesando] = React.useState(false);

  const [formulario, setFormulario] = React.useState({
    Id: 0,
    NombreyApellido: "",
    Rol: "Operario",
    Email: "",
    FotoPerfil: ""
  });

  // Instanciamos el servicio con la conexión móvil
  const service = React.useMemo(() => new PersonalService(props.sp), [props.sp]);

  const cargarPersonal = async () => {
    try {
      setLoading(true);
      const data = await service.getPersonal();
      setPersonal(data);
    } catch (error) {
      console.error("Error al cargar personal:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (props.sp) {
        cargarPersonal();
    }
  }, [props.sp]);

  const handleGuardar = async () => {
    setProcesando(true);
    try {
      if (editandoId) {
        await service.actualizarTrabajador(editandoId, formulario);
      } else {
        await service.crearTrabajador(formulario);
      }
      setIsOpen(false);
      cargarPersonal();
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!editandoId) return;
    setProcesando(true);
    try {
      await service.eliminarTrabajador(editandoId);
      setHideDeleteDialog(true);
      setIsOpen(false);
      cargarPersonal();
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className={styles.galeriaPersonal}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" className={styles.header}>
        <Text variant="xLarge">Equipo EWS Energy</Text>
        <PrimaryButton iconProps={{ iconName: 'AddFriend' }} text="Nuevo" onClick={() => {
          setEditandoId(null);
          setFormulario({ Id: 0, NombreyApellido: "", Rol: "Operario", Email: "", FotoPerfil: "" });
          setIsOpen(true);
        }} />
      </Stack>

      <Separator />

      <div className={styles.gridPersonal}>
        {loading ? (
          [1, 2, 3, 4].map(n => <PersonaShimmer key={n} />)
        ) : (
          personal.map(p => (
            <div key={p.Id} className={styles.cardEmpleado} onClick={() => {
              setEditandoId(p.Id || null);
              setFormulario({ Id: p.Id, NombreyApellido: p.NombreyApellido, Rol: p.Rol || "", Email: p.Email || "", FotoPerfil: p.FotoPerfil || "" });
              setIsOpen(true);
            }}>
              <Persona
                imageUrl={p.FotoPerfil}
                text={p.NombreyApellido}
                secondaryText={p.Rol}
                size={PersonaSize.size100}
                hidePersonaDetails={false}
              />
              <div className={styles.cardFooter}>
                <Text variant="small">{p.Email}</Text>
                <Icon iconName="Edit" />
              </div>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} isBlocking={false} className={styles.modal}>
        <div className={styles.modalContent}>
          <Text variant="large">{editandoId ? "Editar Perfil" : "Nuevo Trabajador"}</Text>
          <Stack tokens={{ childrenGap: 15 }} style={{ marginTop: 20 }}>
            <TextField label="Nombre y Apellidos" value={formulario.NombreyApellido} onChange={(_, v) => setFormulario({ ...formulario, NombreyApellido: v || "" })} />
            <TextField label="Correo Electrónico" value={formulario.Email} onChange={(_, v) => setFormulario({ ...formulario, Email: v || "" })} />
            <Dropdown 
                label="Rol / Cargo" 
                selectedKey={formulario.Rol} 
                options={[{ key: 'Administrador', text: 'Administrador' }, { key: 'Manager', text: 'Manager' }, { key: 'Operario', text: 'Operario' }]} 
                onChange={(_, o) => setFormulario({ ...formulario, Rol: o?.key as any })} 
            />
          </Stack>

          <div className={styles.modalFooter}>
            {procesando ? (
              <Spinner size={SpinnerSize.medium} label="Procesando..." />
            ) : (
              <Stack horizontal tokens={{ childrenGap: 10 }} horizontalAlign="end">
                <PrimaryButton text={editandoId ? "Actualizar" : "Registrar"} onClick={handleGuardar} />
                {editandoId && <DefaultButton text="Eliminar" onClick={() => setHideDeleteDialog(false)} className={styles.btnDelete} />}
                <DefaultButton text="Cancelar" onClick={() => setIsOpen(false)} />
              </Stack>
            )}
          </div>
        </div>
      </Modal>

      <Dialog
        hidden={hideDeleteDialog}
        onDismiss={() => setHideDeleteDialog(true)}
        dialogContentProps={{ type: DialogType.normal, title: 'Confirmar eliminación', subText: `¿Eliminar a ${formulario.NombreyApellido}?` }}
      >
        <DialogFooter>
          <PrimaryButton onClick={handleEliminar} text="Eliminar" />
          <DefaultButton onClick={() => setHideDeleteDialog(true)} text="Cancelar" />
        </DialogFooter>
      </Dialog>
    </div>
  );
};