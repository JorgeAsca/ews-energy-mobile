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

  // CORRECCIÓN: Renombramos la función para que coincida con VistaPlanificacion.tsx
  public async asignarPersonal(datos: any): Promise<void> {
    try {
      await this._sp.web.lists.getByTitle(this._listName).items.add(datos);
    } catch (error) {
      // Si SharePoint rechaza los datos (ej: las columnas no se llaman así), esto nos dará la pista
      console.error("Error detallado al guardar en SharePoint:", error);
      throw error; 
    }
  }

  // Mantenemos crearAsignacion por si la usabas en otro lado de tu app
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
    const idsEnObra: number[] = asignaciones
        .filter(asig => Number(asig.ObraId) === Number(obraId) && Number(asig.PersonalId) !== Number(operarioId))
        .map(asig => Number(asig.PersonalId));

    return personal.filter(p => idsEnObra.some(id => id === Number(p.Id)));
  }
}