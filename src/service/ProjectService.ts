import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { IObra } from "../models/IObra";
import { IObraCard } from "../models/IObraCard";
import { IFacepilePersona } from "@fluentui/react";

export class ProjectService {
  private _sp: SPFI;
  private _listName: string = "Proyectos y Obras";

  constructor(sp: SPFI) {
    this._sp = sp;
  }

public async getObras(): Promise<IObra[]> {
    try {
      // 1. Probamos primero con una selección mínima para asegurar que la lista responde
      const items = await this._sp.web.lists.getByTitle(this._listName).items
        .select(
          "Id", 
          "Title", 
          "EstadoObra",
          "ProgresoReal",
          "Cliente/Id", 
          "Cliente/Title"
        )
        .expand("Cliente")();

      console.log("Obras recibidas de SharePoint:", items); // Mira esto en la consola F12

      return items.map((item: any) => ({
        Id: item.Id,
        Title: item.Title,
        EstadoObra: item.EstadoObra || "En Proceso",
        ProgresoReal: item.ProgresoReal || 0,
        Cliente: item.Cliente ? { Title: item.Cliente.Title } : undefined
      }));
    } catch (error) {
      console.error("Fallo crítico al pedir Obras:", error);
      return [];
    }
  }

  public async crearObra(nuevaObra: any): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.add(nuevaObra);
  }

  public async actualizarEstado(id: number, nuevoEstado: string): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.getById(id).update({
      EstadoObra: nuevoEstado,
    });
  }

  public async cancelarObra(id: number): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.getById(id).update({
      EstadoObra: "Cancelado",
    });
  }

  public async getObrasCompletas(
    asignaciones: any[],
    personal: any[],
  ): Promise<IObraCard[]> {
    const obras = await this.getObras();

    return obras.map((obra) => {
      const asignados = asignaciones.filter(
        (a) => Number(a.ObraId) === Number(obra.Id),
      );
      const operariosProps: IFacepilePersona[] = asignados.map((asig) => {
        const p = personal.find(
          (pers) => Number(pers.Id) === Number(asig.PersonalId),
        );
        return { personaName: p ? p.NombreyApellido : "Desconocido" };
      });

      return {
        ...obra,
        clienteNombre: (obra as any).Cliente?.Title || "Sin Cliente",
        porcentajeReal: obra.ProgresoReal || 0,
        operarios: operariosProps
      } as IObraCard;
    });
  }
}