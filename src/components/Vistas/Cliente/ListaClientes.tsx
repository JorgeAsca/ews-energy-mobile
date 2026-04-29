import * as React from "react";
import {
  Stack, Text, Spinner, SpinnerSize, MessageBar, 
  MessageBarType, PrimaryButton, DefaultButton, TextField, 
  Separator, IconButton, Dialog, DialogType, DialogFooter, Modal,
  DetailsList, DetailsListLayoutMode, SelectionMode, IColumn
} from "@fluentui/react";
import { SPFI } from "@pnp/sp";
import { ClientesService } from "../../../service/ClientesService"; 
import { ICliente } from "../../../models/ICliente";
import styles from "./ListaClientes.module.scss";

interface IListaClientesProps { sp: SPFI; }

export const ListaClientes: React.FC<IListaClientesProps> = (props) => {
  const [clientes, setClientes] = React.useState<ICliente[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [mensaje, setMensaje] = React.useState<{ texto: string; tipo: MessageBarType } | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);
  const [procesando, setProcesando] = React.useState(false);
  const [editandoId, setEditandoId] = React.useState<number | null>(null);
  const [hideDeleteDialog, setHideDeleteDialog] = React.useState(true);

  // Formulario limpio, sin rastro de Empresa Relacionada
  const [formulario, setFormulario] = React.useState<Partial<ICliente>>({
    Title: "", 
    CIF: "",
    Direccion: "",
    Email: "",
    Telefono: ""
  });

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const service = new ClientesService(props.sp);
      const data = await service.getClientes();
      setClientes(data);
    } catch (error) {
      setMensaje({ texto: "Error al cargar los clientes", tipo: MessageBarType.error });
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { cargarClientes(); }, [props.sp]);

  const handleGuardar = async () => {
    if (!formulario.Title) {
      setMensaje({ texto: "El nombre del cliente es obligatorio", tipo: MessageBarType.warning });
      return;
    }
    try {
      setProcesando(true);
      const service = new ClientesService(props.sp);
      
      const datosParaEnviar = { ...formulario };

      if (editandoId) {
        await service.actualizarCliente(editandoId, datosParaEnviar);
      } else {
        await service.crearCliente(datosParaEnviar);
      }
      
      setIsOpen(false);
      cargarClientes();
    } catch (error) {
      setMensaje({ texto: "Error al guardar el cliente.", tipo: MessageBarType.error });
      console.error(error);
    } finally {
      setProcesando(false);
    }
  };

  const handleEliminar = async () => {
    if (!editandoId) return;
    try {
      setProcesando(true);
      const service = new ClientesService(props.sp);
      await service.eliminarCliente(editandoId);
      setHideDeleteDialog(true);
      setIsOpen(false);
      cargarClientes();
    } catch (error) {
      setMensaje({ texto: "Error al eliminar el cliente", tipo: MessageBarType.error });
    } finally {
      setProcesando(false);
    }
  };

  const abrirEditor = (cliente?: ICliente) => {
    if (cliente) {
      setEditandoId(cliente.Id || null);
      setFormulario(cliente);
    } else {
      setEditandoId(null);
      setFormulario({ Title: "", CIF: "", Direccion: "", Email: "", Telefono: "" });
    }
    setIsOpen(true);
  };

  // Tabla limpia sin la columna de Empresa Relacionada
  const columns: IColumn[] = [
    {
      key: "colNombre",
      name: "Nombre",
      fieldName: "Title", 
      minWidth: 150,
      maxWidth: 250,
      isResizable: true,
      onRender: (item: ICliente) => <Text style={{ fontWeight: 600 }}>{item.Title}</Text>
    },
    {
      key: "colCIF",
      name: "CIF",
      fieldName: "CIF",
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
    },
    {
      key: "colTelefono",
      name: "Teléfono",
      fieldName: "Telefono",
      minWidth: 100,
      maxWidth: 120,
      isResizable: true,
    },
    {
      key: "colEmail",
      name: "Email",
      fieldName: "Email",
      minWidth: 150,
      maxWidth: 200,
      isResizable: true,
      onRender: (item: ICliente) => (
        item.Email ? (
            <a href={`mailto:${item.Email}`} style={{ color: '#0078d4', textDecoration: 'none' }}>
            {item.Email}
            </a>
        ) : <span>-</span>
      )
    },
    {
      key: "colAcciones",
      name: "Acciones",
      minWidth: 100,
      maxWidth: 100,
      onRender: (item: ICliente) => (
        <Stack horizontal tokens={{ childrenGap: 5 }}>
          <IconButton iconProps={{ iconName: "Edit" }} title="Editar cliente" onClick={() => abrirEditor(item)} />
          <IconButton iconProps={{ iconName: "Delete" }} title="Eliminar cliente" onClick={() => { abrirEditor(item); setHideDeleteDialog(false); }} styles={{ root: { color: '#d13438' }, rootHovered: { color: '#a4262c' } }} />
        </Stack>
      )
    }
  ];

  return (
    <div className={styles.container}>
      <Stack className={styles.headerSection} horizontal horizontalAlign="space-between" verticalAlign="center" style={{ marginBottom: 20 }}>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <Text variant="xxLarge" style={{ fontWeight: 600, color: '#323130' }}>Directorio de Clientes</Text>
          <div style={{ backgroundColor: '#e1dfdd', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            {clientes.length} registrados
          </div>
        </Stack>
        <PrimaryButton iconProps={{ iconName: "AddFriend" }} text="Nuevo Cliente" onClick={() => abrirEditor()} />
      </Stack>

      {mensaje && (
        <MessageBar messageBarType={mensaje.tipo} onDismiss={() => setMensaje(null)} style={{ marginBottom: 20 }}>
          {mensaje.texto}
        </MessageBar>
      )}

      <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', padding: '10px' }}>
        {loading ? (
          <Spinner size={SpinnerSize.large} label="Cargando cartera de clientes..." style={{ padding: '40px' }} />
        ) : (
          <DetailsList
            items={clientes}
            columns={columns}
            layoutMode={DetailsListLayoutMode.justified}
            selectionMode={SelectionMode.none}
            styles={{ root: { overflowX: 'auto' }, headerWrapper: { '& .ms-DetailsHeader': { paddingTop: 0 } } }}
          />
        )}
      </div>

      <Modal isOpen={isOpen} onDismiss={() => setIsOpen(false)} isBlocking={false}>
        <div style={{ padding: '24px', width: '450px', maxWidth: '90vw' }}>
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            <Text variant="xLarge" style={{ fontWeight: 600 }}>{editandoId ? "Editar Cliente" : "Nuevo Cliente"}</Text>
            <IconButton iconProps={{ iconName: 'Cancel' }} onClick={() => setIsOpen(false)} />
          </Stack>
          
          <Separator style={{ margin: '15px 0' }} />
          
          <Stack tokens={{ childrenGap: 15 }}>
            <TextField label="Nombre del Cliente" value={formulario.Title} onChange={(_, v) => setFormulario({...formulario, Title: v || ""})} required />
            <Stack horizontal tokens={{ childrenGap: 10 }}>
                <TextField label="CIF" style={{ width: '100%' }} value={formulario.CIF} onChange={(_, v) => setFormulario({...formulario, CIF: v || ""})} />
                <TextField label="Teléfono" style={{ width: '100%' }} value={formulario.Telefono} onChange={(_, v) => setFormulario({...formulario, Telefono: v || ""})} />
            </Stack>
            <TextField label="Correo Electrónico" style={{ width: '100%' }} value={formulario.Email} onChange={(_, v) => setFormulario({...formulario, Email: v || ""})} />
            <TextField label="Dirección" multiline rows={2} value={formulario.Direccion} onChange={(_, v) => setFormulario({...formulario, Direccion: v || ""})} />
          </Stack>

          <Stack horizontal tokens={{ childrenGap: 10 }} horizontalAlign="end" style={{ marginTop: '25px' }}>
            {procesando ? <Spinner size={SpinnerSize.medium} /> : (
              <>
                <PrimaryButton text={editandoId ? "Actualizar" : "Registrar"} onClick={handleGuardar} />
                <DefaultButton text="Cancelar" onClick={() => setIsOpen(false)} />
              </>
            )}
          </Stack>
        </div>
      </Modal>

      <Dialog hidden={hideDeleteDialog} onDismiss={() => setHideDeleteDialog(true)} 
        dialogContentProps={{ type: DialogType.normal, title: 'Confirmar eliminación', subText: `¿Estás seguro de que deseas eliminar al cliente ${formulario.Title}?` }}>
        <DialogFooter>
          <PrimaryButton onClick={handleEliminar} text="Eliminar" styles={{ root: { backgroundColor: '#d13438', borderColor: '#d13438' }, rootHovered: { backgroundColor: '#a4262c', borderColor: '#a4262c' } }} />
          <DefaultButton onClick={() => setHideDeleteDialog(true)} text="Cancelar" />
        </DialogFooter>
      </Dialog>
    </div>
  );
};