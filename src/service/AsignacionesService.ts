import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { IAsignacion } from "../models/IAsignacion";
import { IPersonal } from "../models/IPersonal";

export class AsignacionesService {
  private _sp: SPFI;
  private _listName = "Asignaciones EWS";

  constructor(sp: SPFI) {
    this._sp = sp;
  }

  public async getAsignaciones(): Promise<IAsignacion[]> {
    try {
      const items = await this._sp.web.lists.getByTitle(this._listName).items();
      return items || [];
    } catch (error) {
      console.error("Error al obtener asignaciones:", error);
      return [];
    }
  }

  public async crearAsignacion(datos: any): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.add(datos);
  }

  public async eliminarAsignacion(id: number): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.getById(id).delete();
  }

  public async actualizarAsignacion(
    id: number,
    datos: Partial<IAsignacion>,
  ): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.getById(id).update(datos);
  }

  public getCuadrillaSugerida(obraId: number, operarioId: number, asignaciones: any[], personal: IPersonal[]): IPersonal[] {
    // Extraemos los IDs y aseguramos que TypeScript los vea como un array de números
    const idsEnObra: number[] = asignaciones
        .filter(asig => Number(asig.ObraId) === Number(obraId) && Number(asig.PersonalId) !== Number(operarioId))
        .map(asig => Number(asig.PersonalId));

    // Usamos 'some' en lugar de 'includes' si el error persiste, 
    // o simplemente aseguramos el casteo del ID de la persona
    return personal.filter(p => idsEnObra.some(id => id === Number(p.Id)));
  }
}