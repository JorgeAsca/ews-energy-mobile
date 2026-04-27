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
  
  // Estado para el nuevo material (incluye 'archivo' para subir a SharePoint)
  const [nuevo, setNuevo] = React.useState({
    nombre: "",
    stock: 0,
    cat: "Consumible",
    ImagenPreview: "", // Para ver la miniatura antes de subir
    archivo: null as File | null // El archivo real que se enviará
  });

  const service = React.useMemo(() => new StockService(props.sp), [props.sp]);

  const cargarInventario = async () => {
    try {
      setLoading(true);
      const res = await service.getInventario();
      console.log("DATOS CARGADOS:", res);
      setItems(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Error al cargar inventario:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (props.sp) {
      cargarInventario();
    }
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
    if (!nuevo.nombre) return;
    try {
      setLoading(true);
      await service.crearMaterial({
        Title: nuevo.nombre,
        StockActual: nuevo.stock,
        Categoria: nuevo.cat
      }, nuevo.archivo);
      
      // Limpiar formulario
      setNuevo({ nombre: "", stock: 0, cat: "Consumible", ImagenPreview: "", archivo: null });
      await cargarInventario();
    } catch (error) {
      console.error("Error al crear:", error);
    } finally {
      setLoading(false);
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
            
            // 1. Obtenemos la ruta relativa
            let relativeUrl = adjunto.ServerRelativeUrl || adjunto.ServerRelativePath?.DecodedUrl;

            // 2. Si no viene la ruta, la construimos manualmente
            if (!relativeUrl && adjunto.FileName) {
                // Aquí usamos la ruta directa que sabemos que funciona en tu entorno
                relativeUrl = `/sites/EWSStockManagement/Lists/Inventario de Materiales/Attachments/${item.Id}/${adjunto.FileName}`;
            }

            // 3. LA SOLUCIÓN DEFINITIVA: Detectar si estamos en localhost
            if (relativeUrl) {
                let fullUrl = "";
                const tenantUrl = "https://proyectosintegrales.sharepoint.com";

                if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
                    // Si estamos probando en el PC, forzamos el dominio de SharePoint
                    fullUrl = tenantUrl + relativeUrl;
                } else {
                    // Si ya está subido a SharePoint, usamos el origen normal
                    fullUrl = window.location.origin + relativeUrl;
                }
                
                fotoUrl = encodeURI(fullUrl);
            }
        }

        return fotoUrl ? (
          <img 
            src={fotoUrl} 
            alt="Foto" 
            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #ddd' }} 
            onError={(e) => {
                console.error("Error final cargando imagen:", e.currentTarget.src);
                e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <Icon iconName="Photo2" style={{ fontSize: '20px', color: '#c8c6c4', padding: '10px' }} />
        );
      },
    },
    {
        key: "col1",
        name: "Material",
        fieldName: "Title",
        minWidth: 100,
        maxWidth: 200,
    },
    {
        key: "col2",
        name: "Stock",
        fieldName: "StockActual",
        minWidth: 50,
        maxWidth: 80,
    },
    {
      key: "col3",
      name: "Acciones",
      minWidth: 100,
      onRender: (item) => (
        <Stack horizontal tokens={{ childrenGap: 5 }}>
          <IconButton iconProps={{ iconName: "Edit" }} onClick={() => { setSelectedItem(item); setIsPanelOpen(true); }} />
          <IconButton iconProps={{ iconName: "Delete" }} onClick={() => handleDelete(item.Id)} />
        </Stack>
      ),
    },
  ];

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Seguro que deseas eliminar este material?")) {
      try {
        await service.eliminarMaterial(id);
        cargarInventario();
      } catch (error) {
        console.error("Error al eliminar:", error);
      }
    }
  };

  const filteredItems = items.filter(i => 
    (i.Title || "").toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading && items.length === 0) return <Spinner size={SpinnerSize.large} label="Cargando almacén..." />;

  return (
    <div className={styles.listaMateriales}>
      <Text variant="xLarge" className={styles.title}>Inventario de Materiales</Text>
      
      <Stack tokens={{ childrenGap: 20 }} className={styles.headerStack}>
        <SearchBox placeholder="Buscar material..." onChange={(_, v) => setFilterText(v || "")} />
        
        <Stack tokens={{ childrenGap: 10 }} className={styles.addForm}>
          <Text variant="mediumPlus" style={{ fontWeight: 'bold' }}>Añadir Nuevo Material</Text>
          
          {/* FORMULARIO REDISEÑADO Y ALINEADO */}
          <Stack horizontal tokens={{ childrenGap: 24 }} wrap verticalAlign="end" style={{ paddingBottom: '8px', paddingTop: '8px' }}>
            
            <TextField 
              label="Nombre" 
              value={nuevo.nombre} 
              onChange={(_, v) => setNuevo({...nuevo, nombre: v || ""})} 
              styles={{ root: { minWidth: 200 } }} 
            />
            
            <TextField 
              label="Stock" 
              type="number" 
              value={nuevo.stock.toString()} 
              onChange={(_, v) => setNuevo({...nuevo, stock: parseInt(v || "0")})} 
              styles={{ root: { width: 100 } }} 
            />
            
            {/* Contenedor de la foto con etiqueta para igualar alturas */}
            <Stack>
              <Text variant="small" style={{ fontWeight: 600, paddingBottom: 6, color: '#323130' }}>Imagen</Text>
              <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
                <div 
                  onClick={() => document.getElementById('file-nuevo')?.click()}
                  style={{ width: '32px', height: '32px', border: '1px solid #c8c6c4', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#f3f2f1', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s' }}
                  title="Haz clic para cambiar la foto"
                >
                  {nuevo.ImagenPreview ? (
                      <img src={nuevo.ImagenPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                      <Icon iconName="Photo2" style={{ fontSize: '16px', color: '#a19f9d' }} />
                  )}
                </div>
                <input type="file" accept="image/*" id="file-nuevo" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'nuevo')} />
                <DefaultButton 
                  iconProps={{ iconName: "Camera" }} 
                  onClick={() => document.getElementById('file-nuevo')?.click()} 
                />
              </Stack>
            </Stack>

            <PrimaryButton 
                text="Añadir" 
                iconProps={{ iconName: "Add" }} 
                onClick={handleCreate} 
                disabled={!nuevo.nombre || loading} 
                styles={{ root: { height: '32px' } }} /* Fuerza la altura para que encaje perfecto con los inputs */
            />
          </Stack>
        </Stack>
      </Stack>

      <Separator />

      <DetailsList
        items={filteredItems}
        columns={columns}
        layoutMode={DetailsListLayoutMode.justified}
        selectionMode={SelectionMode.none}
      />
      
      <Panel 
        isOpen={isPanelOpen} 
        onDismiss={() => setIsPanelOpen(false)} 
        headerText="Editar Material"
        type={PanelType.medium}
      >
        {selectedItem && (
            <Stack tokens={{ childrenGap: 15 }}>
                <Stack horizontalAlign="center">
                    {/* Prioridad: 1. Nueva vista previa, 2. Foto actual en SharePoint, 3. Icono vacío */}
                    {selectedItem.ImagenPreview || (selectedItem.AttachmentFiles?.[0]?.ServerRelativeUrl) ? (
                        <img 
                            src={selectedItem.ImagenPreview || selectedItem.AttachmentFiles[0].ServerRelativeUrl} 
                            style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} 
                        />
                    ) : (
                        <Icon iconName="Photo2" style={{ fontSize: '40px', color: '#ccc' }} />
                    )}
                    <input type="file" accept="image/*" id="file-edit" style={{ display: 'none' }} onChange={(e) => handleFileChange(e, 'edit')} />
                    <DefaultButton 
                        text="Cambiar Foto" 
                        iconProps={{ iconName: "Camera" }} 
                        onClick={() => document.getElementById('file-edit')?.click()} 
                        style={{ marginTop: '10px' }}
                    />
                </Stack>
                
                <TextField label="Nombre" value={selectedItem.Title} onChange={(_, v) => setSelectedItem({...selectedItem, Title: v || ""})} />
                <TextField label="Stock" type="number" value={selectedItem.StockActual?.toString()} onChange={(_, v) => setSelectedItem({...selectedItem, StockActual: parseInt(v || "0")})} />
                
                <PrimaryButton text="Guardar Cambios" onClick={async () => {
                    setLoading(true);
                    await service.editarMaterial(selectedItem.Id, selectedItem);
                    setIsPanelOpen(false);
                    await cargarInventario();
                }} />
            </Stack>
        )}
      </Panel>
    </div>
  );
};

export default ListaMateriales;