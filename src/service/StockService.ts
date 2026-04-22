import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { IMaterial } from '../models/IMaterial';

export class StockService {
    private _sp: SPFI;
    private _listName: string = "Inventario de Materiales";

    constructor(sp: SPFI) {
        this._sp = sp;
    }

    public async getInventario(): Promise<IMaterial[]> {
        const items = await this._sp.web.lists.getByTitle(this._listName).items();
        
        return items.map((item: any) => ({
            Id: item.Id,
            Title: item.Title,
            Categoria: item.Categor_x00ed_a || "General",
            StockActual: item.StockActual || 0,
            StockMinimo: item.StockM_x00ed_nimo || 0
        } as IMaterial));
    }

    public async crearMaterial(material: any): Promise<void> {
        await this._sp.web.lists.getByTitle(this._listName).items.add({
            Title: material.Title,
            Categor_x00ed_a: material.Categoria,
            StockActual: material.StockActual,
            StockM_x00ed_nimo: material.StockMinimo
        });
    }

    public async editarMaterial(id: number, material: any): Promise<void> {
        await this._sp.web.lists.getByTitle(this._listName).items.getById(id).update({
            Title: material.Title,
            Categor_x00ed_a: material.Categoria,
            StockActual: material.StockActual,
            StockM_x00ed_nimo: material.StockMinimo
        });
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