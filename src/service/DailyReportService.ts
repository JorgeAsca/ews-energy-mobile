import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { IReporteHistorial } from "../models/IReporteHistorial";
import { IDiarioEntrada } from "../models/IDiarioEntrada";

export class DailyReportService {
    private _sp: SPFI;
    private _metadataListName: string = "Registro_Fotos_Diarias";

    constructor(sp: SPFI) {
        this._sp = sp;
    }

    public async guardarReporteDiario(reporte: IDiarioEntrada): Promise<void> {
        await this._sp.web.lists.getByTitle('Diario de Trabajo').items.add({
            Title: `Reporte - Obra ${reporte.ObraId} - ${reporte.Fecha}`,
            ObraId: reporte.ObraId,
            Comentarios: reporte.Comentarios,
            FotosRelacionadas: reporte.FotosUrls.join('; ')
        });
    }

    public async getHistorialGlobal(): Promise<IReporteHistorial[]> {
        try {
            const items = await this._sp.web.lists.getByTitle(this._metadataListName).items
                .select("Id", "Title", "Comentarios", "FechaRegistro", "OperarioId", "ObraId", "UrlFoto")
                .orderBy("FechaRegistro", false)();
            
            return items || [];
        } catch (error) {
            console.error("Error al obtener historial:", error);
            return [];
        }
    }

    public async getFotosPorObra(obraId: number): Promise<any[]> {
        try {
            return await this._sp.web.lists.getByTitle(this._metadataListName).items
                .filter(`ObraId eq ${obraId}`)
                .orderBy("FechaRegistro", false)();
        } catch (error) {
            console.error("Error al obtener fotos:", error);
            return [];
        }
    }
}