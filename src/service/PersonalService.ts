import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/folders";
import "@pnp/sp/files";
import { IPersonal } from '../models/IPersonal';

export class PersonalService {
    private _sp: SPFI;
    private _listName: string = "Personal EWS";

    constructor(sp: SPFI) { 
        this._sp = sp; 
    }

    public async getPersonal(): Promise<IPersonal[]> {
        try {
            const items = await this._sp.web.lists.getByTitle(this._listName).items
                .select("Id", "Title", "Rol", "FotoPerfil", "Email")();

            return (items || []).map((item: any) => ({
                Id: item.Id,
                NombreyApellido: item.Title,
                Rol: item.Rol,
                FotoPerfil: item.FotoPerfil ? item.FotoPerfil.Url : undefined,
                Email: item.Email
            }));
        } catch (error) {
            console.error("Error en getPersonal:", error);
            return [];
        }
    }

    public async getFotosDisponibles(): Promise<{ key: string, text: string, url: string }[]> {
        try {
            // Corrección: Usamos la sintaxis de v4 para obtener archivos de una carpeta específica
            const files = await this._sp.web.getFolderByServerRelativePath("Fotos_Personal").files();
            
            return files.map((file: any) => ({
                key: file.Name,
                text: file.Name,
                url: file.ServerRelativeUrl
            }));
        } catch (error) {
            console.error("Error al obtener fotos de biblioteca:", error);
            return [];
        }
    }

    public async crearTrabajador(nuevo: any): Promise<void> {
        await this._sp.web.lists.getByTitle(this._listName).items.add({
            Title: nuevo.NombreyApellido,
            Rol: nuevo.Rol,
            Email: nuevo.Email,
            FotoPerfil: {
                Description: nuevo.NombreyApellido,
                Url: nuevo.FotoPerfil
            }
        });
    }

    public async actualizarTrabajador(id: number, personal: any): Promise<void> {
        await this._sp.web.lists.getByTitle(this._listName).items.getById(id).update({
            Title: personal.NombreyApellido,
            Rol: personal.Rol,
            Email: personal.Email,
            FotoPerfil: {
                Description: personal.NombreyApellido,
                Url: personal.FotoPerfil
            }
        });
    }

    public async eliminarTrabajador(id: number): Promise<void> {
        await this._sp.web.lists.getByTitle(this._listName).items.getById(id).delete();
    }
}