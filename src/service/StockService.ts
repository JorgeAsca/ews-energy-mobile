import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments"; // NUEVO: Importación crítica para manejar imágenes adjuntas
import { IMaterial } from '../models/IMaterial';

export class StockService {
    private _sp: SPFI;
    private _listName: string = "Inventario de Materiales";

    constructor(sp: SPFI) {
        this._sp = sp;
    }

    public async getInventario(): Promise<IMaterial[]> {
        // Añadimos "AttachmentFiles/ServerRelativeUrl" a la selección
        const items = await this._sp.web.lists.getByTitle(this._listName)
            .items
            .select("*", "AttachmentFiles", "AttachmentFiles/ServerRelativeUrl")
            .expand("AttachmentFiles")();
        
        return items.map((item: any) => ({
            Id: item.Id,
            Title: item.Title,
            Categoria: item.Categor_x00ed_a || "General",
            StockActual: item.StockActual || 0,
            StockMinimo: item.StockM_x00ed_nimo || 0,
            // Dependiendo de tu versión de PnP, los adjuntos pueden venir directos o dentro de .results
            AttachmentFiles: item.AttachmentFiles?.results || item.AttachmentFiles || []
        } as IMaterial));
    }

    // NUEVO: Se añade el parámetro 'archivo' que enviamos desde el componente React
    public async crearMaterial(material: any, archivo: File | null = null): Promise<void> {
        // 1. Creamos el elemento en la lista
        const resultado: any = await this._sp.web.lists.getByTitle(this._listName).items.add({
            Title: material.Title,
            Categor_x00ed_a: material.Categoria,
            StockActual: material.StockActual,
            StockM_x00ed_nimo: material.StockMinimo
        });

        // 2. Extraemos el ID del nuevo material de forma segura (dependiendo de la versión, viene en .data.Id o directo en .Id)
        const nuevoId = resultado.data ? resultado.data.Id : resultado.Id;

        // 3. Si hay un archivo y obtuvimos el ID, lo buscamos explícitamente y subimos el adjunto
        if (archivo && nuevoId) {
            await this._sp.web.lists.getByTitle(this._listName)
                .items.getById(nuevoId)
                .attachmentFiles.add(archivo.name, archivo);
        }
    }

    public async editarMaterial(id: number, material: any): Promise<void> {
        const item = this._sp.web.lists.getByTitle(this._listName).items.getById(id);
        
        await item.update({
            Title: material.Title,
            Categor_x00ed_a: material.Categoria || material.Categor_x00ed_a, 
            StockActual: material.StockActual,
            StockM_x00ed_nimo: material.StockMinimo || material.StockM_x00ed_nimo
        });

        // NUEVO: Si en el panel de edición subieron una foto nueva, la añadimos a los adjuntos
        if (material.archivoNuevo) {
            await item.attachmentFiles.add(material.archivoNuevo.name, material.archivoNuevo);
        }
    }

    public async actualizarStock(materialId: number, nuevaCantidad: number): Promise<void> {
        await this._sp.web.lists.getByTitle(this._listName).items.getById(materialId).update({
            StockActual: nuevaCantidad
        });
    }

    public async eliminarMaterial(id: number): Promise<void> {
        await this._sp.web.lists.getByTitle(this._listName).items.getById(id).delete();
    }
}