import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { ICliente } from "../models/ICliente";

export class ClientesService {
  private _sp: SPFI;
  // Cambia esto si tu lista de SharePoint se llama diferente
  private _listName = "Clientes"; 

  constructor(sp: SPFI) {
    this._sp = sp;
  }

  public async getClientes(): Promise<ICliente[]> {
    try {
      const items = await this._sp.web.lists.getByTitle(this._listName).items();
      return items || [];
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      return [];
    }
  }

  public async crearCliente(datos: Partial<ICliente>): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.add(datos);
  }

  public async actualizarCliente(id: number, datos: Partial<ICliente>): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.getById(id).update(datos);
  }

  public async eliminarCliente(id: number): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.getById(id).delete();
  }
}