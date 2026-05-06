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
      const items = await this._sp.web.lists.getByTitle(this._listName).items
        .select(
          "Id", 
          "Title", 
          "EstadoObra",
          "ProgresoReal",
          "JornadasTotales", 
          "Cliente/Id", 
          "Cliente/Title"
        )
        .expand("Cliente")();

      return items.map((item: any) => ({
        Id: item.Id,
        Title: item.Title,
        EstadoObra: item.EstadoObra || "En Proceso",
        ProgresoReal: item.ProgresoReal || 0,
        JornadasTotales: item.JornadasTotales || 0,
        Cliente: item.Cliente ? { Id: item.Cliente.Id, Title: item.Cliente.Title } : undefined
      }));
    } catch (error) {
      console.error("Fallo crítico al pedir Obras:", error);
      return [];
    }
  }

  /**
   * Método automático para descontar jornadas de una obra y subir el progreso real
   * @param id ID de la obra
   * @param jornadasADescontar Cantidad calculada (Horas/8)
   */
  public async descontarJornadasObra(id: number, jornadasADescontar: number): Promise<void> {
    try {
      if (jornadasADescontar === 0) {
        console.warn("Se intentó procesar 0 jornadas. Omitiendo actualización.");
        return;
      }

      // 1. Obtenemos los valores actuales (JornadasTotales y ProgresoReal)
      const obra = await this._sp.web.lists.getByTitle(this._listName).items.getById(id).select("JornadasTotales", "ProgresoReal")();
      
      const valorActual = obra.JornadasTotales || 0;
      const progresoActual = obra.ProgresoReal || 0;

      // 2. Matemáticas: Restamos a las jornadas restantes y sumamos al progreso visual
      const nuevoValor = valorActual - jornadasADescontar;
      const nuevoProgreso = progresoActual + jornadasADescontar;

      // 3. Actualizamos la lista con ambos valores
      await this._sp.web.lists.getByTitle(this._listName).items.getById(id).update({
        JornadasTotales: nuevoValor,
        ProgresoReal: nuevoProgreso
      });

      console.log(`Actualización exitosa - Obra ID ${id} | Restantes: ${nuevoValor} | Progreso: ${nuevoProgreso}`);
    } catch (error) {
      console.error("Error al actualizar las jornadas y progreso automáticamente:", error);
      throw error;
    }
  }

  public async addObra(nuevaObra: any): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.add(nuevaObra);
  }

  public async updateObra(id: number, data: any): Promise<void> {
    await this._sp.web.lists.getByTitle(this._listName).items.getById(id).update(data);
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