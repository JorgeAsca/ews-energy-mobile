import * as React from "react";
import {
  Stack, Text, Persona, PersonaSize, Spinner, SpinnerSize, MessageBar, 
  MessageBarType, PrimaryButton, DefaultButton, TextField, Dropdown, 
  Icon, Separator, IconButton, Shimmer, ShimmerElementType, 
  Dialog, DialogType, DialogFooter, Modal
} from "@fluentui/react";
import { PersonalService } from "../../../service/PersonalService";
import { UserService } from "../../../service/UserService"; // Importamos UserService
import { IPersonal, RolUsuario } from "../../../models/IPersonal";
import { SPFI } from "@pnp/sp";
import styles from "./GaleriaPersonal.module.scss";

const PersonaShimmer = () => (
  <div className={styles.cardEmpleadoShimmer}>
    <Stack horizontalAlign="center" tokens={{ childrenGap: 15 }}>
      <Shimmer shimmerElements={[{ type: ShimmerElementType.circle, height: 80 }]} />
      <Shimmer shimmerElements={[{ type: ShimmerElementType.line, height: 16, width: '70%' }]} />
      <Shimmer shimmerElements={[{ type: ShimmerElementType.line, height: 12, width: '50%' }]} />
      <div style={{ width: '100%', marginTop: 10 }}>
        <Shimmer shimmerElements={[{ type: ShimmerElementType.line, height: 35, width: '100%' }]} />
      </div>
    </Stack>
  </div>
);

interface IGaleriaPersonalProps { sp: SPFI; }

export const GaleriaPersonal: React.FC<IGaleriaPersonalProps> = (props) => {
  const [personal, setPersonal] = React.useState<IPersonal[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [userRol, setUserRol] = React.useState<RolUsuario>('Operario' as any); // Estado para el rol
  const [mensaje, setMensaje] = React.useState<{ texto: string; tipo: MessageBarType } | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [procesando, setProcesando] = React.useState(false);
  const [editandoId, setEditandoId] = React.useState<number | null>(null);
  const [hideDeleteDialog, setHideDeleteDialog] = React.useState(true);

  const [formulario, setFormulario] = React.useState<Partial<IPersonal>>({
    NombreyApellido: "",
    Email: "",
    Telefono: "",
    Rol: "Operario" as any
  });

  // Verificamos el rol y cargamos datos al iniciar
  const inicializarComponente = async () => {
    try {
      setLoading(true);
      const uService = new UserService(props.sp);
      const pService = new PersonalService(props.sp);
      
      const [rol, data] = await Promise.all([
        uService.getRolActual(),
        pService.getPersonal()
      ]);

      setUserRol(rol);
      setPersonal(data);
    } catch (error) {
      setMensaje({ texto: "Error al cargar la información", tipo: MessageBarType.error });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { inicializarComponente(); }, [props.sp]);

  const esAdmin = userRol === 'Administrador';

  const handleGuardar = async () => {
    if (!esAdmin) return; // Seguridad extra
    if (!formulario.NombreyApellido || !formulario.Email) {
      setMensaje({ texto: "Nombre y Correo son obligatorios", tipo: MessageBarType.warning });
      return;
    }
    try {
      setProcesando(true);
      const service = new PersonalService(props.sp);
      if (editandoId) {
        await service.actualizarTrabajador(editandoId, formulario);
      } else {
        await service.crearTrabajador(formulario);
      }
      setIsOpen(false);
      inicializarComponente();
    } catch (error) {
      setMensaje({ texto: "Error al procesar", tipo: MessageBarType.error });
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!editandoId || !esAdmin) return;
    try {
      setProcesando(true);
      const service = new PersonalService(props.sp);
      await service.eliminarTrabajador(editandoId);
      setHideDeleteDialog(true);
      setIsOpen(false);
      inicializarComponente();
    } catch (error) {
      setMensaje({ texto: "Error al eliminar", tipo: MessageBarType.error });
    } finally {
      setProcesando(false);
    }
  };

  const abrirEditor = (empleado?: IPersonal) => {
    if (!esAdmin) return; // Solo admin abre el editor
    if (empleado) {
      setEditandoId(empleado.Id);
      setFormulario(empleado);
    } else {
      setEditandoId(null);
      setFormulario({ NombreyApellido: "", Email: "", Telefono: "", Rol: "Operario" as any });
    }
    setIsOpen(true);
  };

  return (
    <div className={styles.container}>
      <Stack className={styles.headerSection} horizontal horizontalAlign="space-between" verticalAlign="center">
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <Text variant="xxLarge" className={styles.tituloPrincipal}>Nuestro Equipo</Text>
          <div className={styles.countBadge}>{personal.length} miembros</div>
        </Stack>
        
        {/* Solo mostramos el botón si es Administrador */}
        {esAdmin && (
          <PrimaryButton 
            iconProps={{ iconName: "AddFriend" }} 
            text="Añadir Miembro" 
            onClick={() => abrirEditor()}
            className={styles.btnNuevo}
          />
        )}
      </Stack>

      {mensaje && (
        <MessageBar messageBarType={mensaje.tipo} onDismiss={() => setMensaje(null)} className={styles.mensaje}>
          {mensaje.texto}
        </MessageBar>
      )}

      <div className={styles.gridPersonal}>
        {loading ? (
          Array(6).fill(0).map((_, i) => <PersonaShimmer key={i} />)
        ) : (
          personal.map((empleado) => (
            <div key={empleado.Id} className={styles.cardEmpleado}>
              {/* El icono de edición solo aparece para Administradores */}
              {esAdmin && (
                <IconButton 
                  iconProps={{ iconName: 'Edit' }} 
                  className={styles.editIcon} 
                  onClick={() => abrirEditor(empleado)} 
                />
              )}
              <Stack horizontalAlign="center" tokens={{ childrenGap: 8 }}>
                <Persona
                  imageUrl={empleado.FotoPerfil}
                  text={empleado.NombreyApellido}
                  size={PersonaSize.size100}
                  hidePersonaDetails
                  className={styles.personaStyled}
                />
                <Text className={styles.empName}>{empleado.NombreyApellido}</Text>
                <Text className={styles.empRole}>{empleado.Rol}</Text>
                
                <Separator className={styles.cardSeparator} />
                
                <Stack horizontal tokens={{ childrenGap: 15 }} className={styles.contactInfo}>
                  <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 5 }}>
                    <Icon iconName="Mail" className={styles.iconContact} />
                    <Text variant="small">{empleado.Email}</Text>
                  </Stack>
                </Stack>

                <DefaultButton 
                  text="Contactar" 
                  className={styles.btnContactar}
                  onClick={() => window.location.href = `mailto:${empleado.Email}`}
                />
              </Stack>
            </div>
          ))
        )}
      </div>

      <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} isBlocking={false} containerClassName={styles.modalFlotante}>
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <Text variant="xLarge" className={styles.modalTitle}>{editandoId ? "Editar Miembro" : "Nuevo Miembro"}</Text>
            <IconButton iconProps={{ iconName: 'Cancel' }} onClick={() => setIsOpen(false)} />
          </div>
          <Separator className={styles.modalSeparator} />
          
          <Stack tokens={{ childrenGap: 15 }} className={styles.modalBody}>
            <TextField label="Nombre y Apellidos" value={formulario.NombreyApellido} onChange={(_, v) => setFormulario({...formulario, NombreyApellido: v || ""})} required />
            <TextField label="Correo Electrónico" value={formulario.Email} onChange={(_, v) => setFormulario({...formulario, Email: v || ""})} required />
            <Stack horizontal tokens={{ childrenGap: 10 }}>
              <TextField label="Teléfono" style={{ width: '100%' }} value={formulario.Telefono} onChange={(_, v) => setFormulario({...formulario, Telefono: v || ""})} />
              <Dropdown 
                label="Rol / Cargo" 
                style={{ width: '100%' }}
                selectedKey={formulario.Rol} 
                options={[{ key: 'Administrador', text: 'Administrador' }, { key: 'Manager', text: 'Manager' }, { key: 'Operario', text: 'Operario' }]} 
                onChange={(_, o) => setFormulario({ ...formulario, Rol: o?.key as any })} 
              />
            </Stack>
          </Stack>

          <Stack horizontal tokens={{ childrenGap: 10 }} horizontalAlign="end" className={styles.modalFooter}>
            {procesando ? <Spinner size={SpinnerSize.medium} /> : (
              <>
                <PrimaryButton text={editandoId ? "Actualizar" : "Registrar"} onClick={handleGuardar} />
                {editandoId && <DefaultButton text="Eliminar" onClick={() => setHideDeleteDialog(false)} style={{ color: '#d32f2f' }} />}
                <DefaultButton text="Cancelar" onClick={() => setIsOpen(false)} />
              </>
            )}
          </Stack>
        </div>
      </Modal>

      <Dialog hidden={hideDeleteDialog} onDismiss={() => setHideDeleteDialog(true)} 
        dialogContentProps={{ type: DialogType.normal, title: 'Confirmar eliminación', subText: `¿Eliminar a ${formulario.NombreyApellido}?` }}>
        <DialogFooter>
          <PrimaryButton onClick={handleEliminar} text="Eliminar" style={{ background: '#d32f2f', border: 'none' }} />
          <DefaultButton onClick={() => setHideDeleteDialog(true)} text="Cancelar" />
        </DialogFooter>
      </Dialog>
    </div>
  );
};