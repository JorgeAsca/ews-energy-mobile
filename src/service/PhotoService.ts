import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/files";
import "@pnp/sp/folders";
import "@pnp/sp/lists";
import "@pnp/sp/items";

export class PhotoService {
    private _sp: SPFI;
    private _libName: string = "Fotos_Diario";
    private _metadataListName: string = "Registro_Fotos_Diarias";

    constructor(sp: SPFI) {
        this._sp = sp;
    }

    public async subirFotoProyecto(
        file: File,
        nombreProyecto: string,
        metadatos: {
            operario: string;
            operarioId: number;
            obraId: number;
            comentarios?: string;
        }
    ): Promise<void> {
        try {
            const nombreCarpeta = nombreProyecto.replace(/[/\\?%*:|"<>]/g, "-");
            const folderPath = `${this._libName}/${nombreCarpeta}`;
            
            await this._sp.web.folders.addUsingPath(folderPath);

            const fileName = `${Date.now()}_${metadatos.operarioId}_${file.name}`;
            
            // Corrección: Guardamos el resultado como 'any' para acceder a .data.ServerRelativeUrl
            const fileResult: any = await this._sp.web.getFolderByServerRelativePath(folderPath)
                .files.addChunked(fileName, file);

            await this._sp.web.lists.getByTitle(this._metadataListName).items.add({
                Title: fileName,
                ObraId: metadatos.obraId,
                OperarioId: metadatos.operarioId,
                Comentarios: metadatos.comentarios || "",
                UrlFoto: fileResult.data.ServerRelativeUrl, // Ya no dará error
                FechaRegistro: new Date().toISOString()
            });

        } catch (error) {
            console.error("Error en PhotoService móvil:", error);
            throw error;
        }
    }
}