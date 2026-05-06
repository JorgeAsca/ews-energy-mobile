import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/attachments"; 
import { IMaterial } from '../models/IMaterial';

export class StockService {
    private _sp: SPFI;
    private _listName: string = "Inventario de Materiales";

    constructor(sp: SPFI) {
        this._sp = sp;
    }

    public async getInventario(): Promise<IMaterial[]> {
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
            AttachmentFiles: item.AttachmentFiles?.results || item.AttachmentFiles || []
        } as IMaterial));
    }

    public async crearMaterial(material: any, archivo: File | null = null): Promise<void> {
        // 1. Creamos el elemento en la lista
        const resultado: any = await this._sp.web.lists.getByTitle(this._listName).items.add({
            Title: material.Title,
            Categor_x00ed_a: material.Categoria,
            StockActual: material.StockActual,
            StockM_x00ed_nimo: material.StockMinimo
        });

        // 2. Extraemos el ID del nuevo material
        const nuevoId = resultado.data ? resultado.data.Id : resultado.Id;

        // 3. Si hay un archivo, lo subimos
        if (archivo && nuevoId) {
            await this._sp.web.lists.getByTitle(this._listName)
                .items.getById(nuevoId)
                .attachmentFiles.add(archivo.name, archivo);
        }
    }

    // AÑADIDO: El tercer parámetro 'archivo' para recibir la nueva imagen desde React
    public async editarMaterial(id: number, material: any, archivo: File | null = null): Promise<void> {
        const item = this._sp.web.lists.getByTitle(this._listName).items.getById(id);
        
        // 1. Actualizamos los datos de texto
        await item.update({
            Title: material.Title,
            Categor_x00ed_a: material.Categoria || material.Categor_x00ed_a, 
            StockActual: material.StockActual,
            StockM_x00ed_nimo: material.StockMinimo || material.StockM_x00ed_nimo
        });

        // 2. Si nos han pasado una foto nueva, gestionamos los adjuntos
        if (archivo) {
            // MEJORA: Borramos la foto antigua (si existe) para no acumular basura
            const adjuntosActuales = await item.attachmentFiles();
            if (adjuntosActuales && adjuntosActuales.length > 0) {
                for (const adjunto of adjuntosActuales) {
                    await item.attachmentFiles.getByName(adjunto.FileName).delete();
                }
            }

            // Subimos la nueva foto (que ya viene con el timestamp para evitar conflictos)
            await item.attachmentFiles.add(archivo.name, archivo);
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