import * as React from "react";
import {
  Stack,
  Text,
  TextField,
  PrimaryButton,
  DetailsList,
  DetailsListLayoutMode,
  SelectionMode,
  IColumn,
  IconButton,
  Separator,
  Spinner,
  SpinnerSize,
  Icon,
  Panel,
  PanelType,
  SearchBox,
  DefaultButton,
  MessageBar,
  MessageBarType
} from "@fluentui/react";
import styles from "./ListaMateriales.module.scss"; 
import { StockService } from "../../../service/StockService";
import { SPFI } from "@pnp/sp";

interface IListaMaterialesProps {
  sp: SPFI;
}

export const ListaMateriales: React.FC<IListaMaterialesProps> = (props) => {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterText, setFilterText] = React.useState("");
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  
  // Sistema de notificaciones UI
  const [mensaje, setMensaje] = React.useState<{ text: string, type: MessageBarType } | null>(null);
  
  const [nuevo, setNuevo] = React.useState({
    nombre: "",
    stock: 0,
    cat: "Consumible",
    ImagenPreview: "", 
    archivo: null as File | null 
  });

  const service = React.useMemo(() => new StockService(props.sp), [props.sp]);

  const mostrarMensaje = (text: string, type: MessageBarType) => {
    setMensaje({ text, type });
    setTimeout(() => setMensaje(null), 5000); // Se oculta a los 5 segundos
  };

  const cargarInventario = async () => {
    try {
      setLoading(true);
      const res = await service.getInventario();
      setItems(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
      mostrarMensaje("Error al cargar el inventario.", MessageBarType.error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (props.sp) cargarInventario();
  }, [props.sp]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, mode: 'nuevo' | 'edit') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        if (base64) {
          if (mode === 'nuevo') {
            setNuevo({ ...nuevo, ImagenPreview: base64, archivo: file });
          } else {
            setSelectedItem({ ...selectedItem, ImagenPreview: base64, archivoNuevo: file });
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreate = async () => {
    if (!nuevo.nombre || loading) return; 
    try {
      setLoading(true);
      let archivoParaSubir = nuevo.archivo;
      
      if (archivoParaSubir) {
        const timestamp = new Date().getTime();
        archivoParaSubir = new File([archivoParaSubir], `${timestamp}_${archivoParaSubir.name}`, { type: archivoParaSubir.type });
      }

      await service.crearMaterial({ Title: nuevo.nombre, StockActual: nuevo.stock, Categoria: nuevo.cat }, archivoParaSubir);
      
      setNuevo({ nombre: "", stock: 0, cat: "Consumible", ImagenPreview: "", archivo: null });
      mostrarMensaje("Material creado correctamente.", MessageBarType.success);
      await cargarInventario();
    } catch (error) {
      console.error("Error al crear:", error);
      mostrarMensaje("No se pudo crear el material.", MessageBarType.error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!selectedItem || loading) return; 
    try {
      setLoading(true);
      const dataToUpdate = { Title: selectedItem.Title, StockActual: selectedItem.StockActual };
      let archivoParaSubir = selectedItem.archivoNuevo;
      
      if (archivoParaSubir) {
        const timestamp = new Date().getTime();
        archivoParaSubir = new File([archivoParaSubir], `${timestamp}_${archivoParaSubir.name}`, { type: archivoParaSubir.type });
      }

      await service.editarMaterial(selectedItem.Id, dataToUpdate, archivoParaSubir);
      setIsPanelOpen(false);
      mostrarMensaje("Material actualizado.", MessageBarType.success);
      await cargarInventario();
    } catch (error) {
      console.error("Error al editar:", error);
      mostrarMensaje("Error al guardar los cambios.", MessageBarType.error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este material?")) {
      try {
        setLoading(true);
        await service.eliminarMaterial(id);
        mostrarMensaje("Material eliminado.", MessageBarType.info);
        await cargarInventario();
      } catch (error) {
        console.error("Error al eliminar:", error);
        mostrarMensaje("Error al eliminar el material.", MessageBarType.error);
      } finally {
        setLoading(false);
      }
    }
  };

  const columns: IColumn[] = [
    {
      key: "col0",
      name: "Foto",
      minWidth: 50,
      maxWidth: 50,
      onRender: (item) => {
        let fotoUrl = null;
        if (item.AttachmentFiles && item.AttachmentFiles.length > 0) {
            const adjunto = item.AttachmentFiles[0];
            let relativeUrl = adjunto.ServerRelativeUrl || adjunto.ServerRelativePath?.DecodedUrl;
            if (!relativeUrl && adjunto.FileName) {
                relativeUrl = `/sites/EWSStockManagement/Lists/Inventario de Materiales/Attachments/${item.Id}/${adjunto.FileName}`;
            }
            if (relativeUrl) {
                const tenantUrl = "https://proyectosintegrales.sharepoint.com";
                const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
                fotoUrl = encodeURI(isLocal ? tenantUrl + relativeUrl : window.location.origin + relativeUrl);
            }
        }

        return fotoUrl ? (
          <img src={fotoUrl} alt={item.Title} className={styles.imageThumbnail} onError={(e) => e.currentTarget.style.display = 'none'} />
        ) : (
          <Icon iconName="Photo2" style={{ fontSize: '20px', color: '#c8c6c4' }} />
        );
      },
    },
    { key: "col1", name: "Material", fieldName: "Title", minWidth: 100, maxWidth: 200 },
    { key: "col2", name: "Stock", fieldName: "StockActual", minWidth: 50, maxWidth: 80 },
    {
      key: "col3",
      name: "Acciones",
      minWidth: 100,
      onRender: (item) => (
        <Stack horizontal tokens={{ childrenGap: 5 }}>
          <IconButton iconProps={{ iconName: "Edit" }} className={styles.actionIcon} onClick={() => { setSelectedItem(item); setIsPanelOpen(true); }} />
          <IconButton iconProps={{ iconName: "Delete" }} className={styles.actionIcon} onClick={() => handleDelete(item.Id)} />
        </Stack>
      ),
    },
  ];

  const filteredItems = items.filter(i => (i.Title || "").toLowerCase().includes(filterText.toLowerCase()));

  if (loading && items.length === 0) return <Spinner size={SpinnerSize.large} label="Cargando almacén..." />;

  return (
    <div className={styles.listaMateriales}>
      <Text variant="xLarge" className={styles.title} block>Inventario de Materiales</Text>
      
      {mensaje && (
        <MessageBar messageBarType={mensaje.type} onDismiss={() => setMensaje(null)} dismissButtonAriaLabel="Cerrar" style={{ marginBottom: 15 }}>
          {mensaje.text}
        </MessageBar>
      )}

      <Stack tokens={{ childrenGap: 20 }} className={styles.headerStack}>
        <SearchBox placeholder="Buscar material..." onChange={(_, v) => setFilterText(v || "")} />
        
        <Stack tokens={{ childrenGap: 10 }} className={styles.addForm}>
          <Text variant="mediumPlus" style={{ fontWeight: 'bold' }}>Añadir Nuevo Material</Text>
          <Stack horizontal tokens={{ childrenGap: 24 }} wrap verticalAlign="end">
            <TextField label="Nombre" value={nuevo.nombre} onChange={(_, v) => setNuevo({...nuevo, nombre: v || ""})} styles={{ root: { minWidth: 200 } }} />
            <TextField label="Stock" type="number" value={nuevo.stock.toString()} onChange={(_, v) => setNuevo({...nuevo, stock: parseInt(v || "0")})} styles={{ root: { width: 100 } }} />
            
            <Stack>
              <Text variant="small" style={{ fontWeight: 600, paddingBottom: 6 }}>Imagen</Text>
              <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
                <div className={styles.imageUploadContainer} onClick={() => document.getElementById('file-nuevo')?.click()} title="Cambiar foto">
                  {nuevo.ImagenPreview ? <img src={nuevo.ImagenPreview} alt="Preview" /> : <Icon iconName="Camera" />}
                </div>
                <input type="file" accept="image/*" id="file-nuevo" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'nuevo')} />
              </Stack>
            </Stack>

            <PrimaryButton text="Añadir" iconProps={{ iconName: "Add" }} onClick={handleCreate} disabled={!nuevo.nombre || loading} />
          </Stack>
        </Stack>
      </Stack>

      <Separator />

      <DetailsList items={filteredItems} columns={columns} layoutMode={DetailsListLayoutMode.justified} selectionMode={SelectionMode.none} />
      
      <Panel isOpen={isPanelOpen} onDismiss={() => setIsPanelOpen(false)} headerText="Editar Material" type={PanelType.medium}>
        {selectedItem && (
            <Stack tokens={{ childrenGap: 15 }} style={{ marginTop: 20 }}>
                <Stack horizontalAlign="center">
                    <div className={styles.imageUploadContainer} style={{ width: '120px', height: '120px' }} onClick={() => document.getElementById('file-edit')?.click()}>
                        {selectedItem.ImagenPreview || selectedItem.AttachmentFiles?.[0]?.ServerRelativeUrl ? (
                            <img src={selectedItem.ImagenPreview || selectedItem.AttachmentFiles[0].ServerRelativeUrl} alt="Material" />
                        ) : (
                            <Icon iconName="Camera" style={{ fontSize: '30px' }} />
                        )}
                    </div>
                    <input type="file" accept="image/*" id="file-edit" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'edit')} />
                    <DefaultButton text="Cambiar Foto" onClick={() => document.getElementById('file-edit')?.click()} style={{ marginTop: '10px' }} />
                </Stack>
                
                <TextField label="Nombre" value={selectedItem.Title} onChange={(_, v) => setSelectedItem({...selectedItem, Title: v || ""})} />
                <TextField label="Stock" type="number" value={selectedItem.StockActual?.toString()} onChange={(_, v) => setSelectedItem({...selectedItem, StockActual: parseInt(v || "0")})} />
                
                <PrimaryButton text="Guardar Cambios" onClick={handleEdit} disabled={loading} style={{ marginTop: 15 }} />
            </Stack>
        )}
      </Panel>
    </div>
  );
};

export default ListaMateriales;