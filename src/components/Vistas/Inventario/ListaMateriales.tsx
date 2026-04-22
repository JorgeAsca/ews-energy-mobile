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
  Dropdown,
  IDropdownOption,
  SearchBox,
  Separator,
  Spinner,
  SpinnerSize,
  Icon,
  Panel,
  PanelType,
  DefaultButton,
} from "@fluentui/react";
import styles from "./ListaMateriales.module.scss";
import { StockService } from "../../../service/StockService";
import { SPFI } from "@pnp/sp";

const categorias: IDropdownOption[] = [
  { key: "Consumible", text: "Consumible" },
  { key: "Herramienta", text: "Herramienta" },
  { key: "Maquinaria", text: "Maquinaria" },
  { key: "EPIS", text: "EPIS" },
];

// Definimos que recibe 'sp' para la conexión móvil
interface IListaMaterialesProps {
  sp: SPFI;
}

export const ListaMateriales: React.FC<IListaMaterialesProps> = (props) => {
  const [items, setItems] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filterText, setFilterText] = React.useState("");
  const [isPanelOpen, setIsPanelOpen] = React.useState(false);
  const [selectedItem, setSelectedItem] = React.useState<any>(null);
  
  const [nuevo, setNuevo] = React.useState({
    nombre: "",
    stock: 0,
    stockMin: 0,
    cat: "Consumible",
  });

  // Instancia del servicio usando el objeto 'sp' inyectado
  const service = React.useMemo(() => new StockService(props.sp), [props.sp]);

  const cargarInventario = async () => {
    try {
      setLoading(true);
      const res = await service.getInventario();
      setItems(res);
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

  const handleCreate = async () => {
    try {
      await service.crearMaterial({
        Title: nuevo.nombre,
        StockActual: nuevo.stock,
        StockMinimo: nuevo.stockMin,
        Categoria: nuevo.cat,
      });
      setNuevo({ nombre: "", stock: 0, stockMin: 0, cat: "Consumible" });
      cargarInventario();
    } catch (error) {
      console.error("Error al crear:", error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedItem) return;
    try {
      await service.editarMaterial(selectedItem.Id, selectedItem);
      setIsPanelOpen(false);
      cargarInventario();
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

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

  const columns: IColumn[] = [
    {
      key: "col1",
      name: "Material",
      fieldName: "Title",
      minWidth: 100,
      maxWidth: 200,
      isResizable: true,
    },
    {
      key: "col2",
      name: "Stock",
      fieldName: "StockActual",
      minWidth: 50,
      maxWidth: 80,
      onRender: (item) => (
        <span style={{ color: item.StockActual <= item.StockMinimo ? "red" : "inherit", fontWeight: "bold" }}>
          {item.StockActual}
        </span>
      ),
    },
    {
      key: "col3",
      name: "Acciones",
      minWidth: 100,
      onRender: (item) => (
        <Stack horizontal gap={5}>
          <IconButton iconProps={{ iconName: "Edit" }} onClick={() => { setSelectedItem(item); setIsPanelOpen(true); }} />
          <IconButton iconProps={{ iconName: "Delete" }} onClick={() => handleDelete(item.Id)} />
        </Stack>
      ),
    },
  ];

  const filteredItems = items.filter(i => 
    i.Title.toLowerCase().includes(filterText.toLowerCase()) || 
    i.Categoria.toLowerCase().includes(filterText.toLowerCase())
  );

  if (loading) return <Spinner size={SpinnerSize.large} label="Cargando almacén..." />;

  return (
    <div className={styles.listaMateriales}>
      <Text variant="xLarge" className={styles.title}>Inventario de Materiales</Text>
      
      <Stack gap={20} className={styles.headerStack}>
        <SearchBox placeholder="Buscar material..." onChange={(_, v) => setFilterText(v || "")} />
        
        <Stack gap={10} className={styles.addForm}>
          <Text variant="mediumPlus">Añadir Nuevo Material</Text>
          <Stack horizontal gap={10} verticalAlign="end" wrap>
            <TextField label="Nombre" value={nuevo.nombre} onChange={(_, v) => setNuevo({...nuevo, nombre: v || ""})} />
            <TextField label="Stock" type="number" value={nuevo.stock.toString()} onChange={(_, v) => setNuevo({...nuevo, stock: parseInt(v || "0")})} />
            <PrimaryButton text="Añadir" iconProps={{ iconName: "Add" }} onClick={handleCreate} />
          </Stack>
        </Stack>
      </Stack>

      <Separator />

      <DetailsList
        items={filteredItems}
        columns={columns}
        setKey="set"
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
          <Stack gap={15}>
            <TextField label="Nombre" value={selectedItem.Title} onChange={(_, v) => setSelectedItem({...selectedItem, Title: v || ""})} />
            <Dropdown label="Categoría" options={categorias} selectedKey={selectedItem.Categoria} onChange={(_, o) => setSelectedItem({...selectedItem, Categoria: o?.key as string})} />
            <TextField label="Stock Actual" type="number" value={selectedItem.StockActual?.toString()} onChange={(_, v) => setSelectedItem({...selectedItem, StockActual: parseInt(v || "0")})} />
            <PrimaryButton text="Guardar Cambios" onClick={handleUpdate} />
          </Stack>
        )}
      </Panel>
    </div>
  );
};