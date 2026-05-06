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
    ): Promise<any> { // Devolvemos 'any' para que VistaFotosObra pueda leer el resultado
        try {
            // Reemplazamos caracteres no válidos para el nombre de la carpeta
            const nombreCarpeta = nombreProyecto.replace(/[/\\?%*:|"<>]/g, "-");
            const folderPath = `${this._libName}/${nombreCarpeta}`;
            
            // 1. LÓGICA SEGURA DE CARPETAS
            // Intentamos obtener la carpeta. Si falla (error 404), significa que no existe y la creamos.
            try {
                await this._sp.web.getFolderByServerRelativePath(folderPath)();
            } catch (folderError) {
                // La carpeta no existe, así que la creamos
                await this._sp.web.folders.addUsingPath(folderPath);
            }

            const fileName = `${Date.now()}_${metadatos.operarioId}_${file.name}`;
            
            // 2. SUBIDA SEGURA DE ARCHIVOS
            // Cambiamos addChunked por addUsingPath con Overwrite en true para evitar el error de [object Object]
            const fileResult: any = await this._sp.web.getFolderByServerRelativePath(folderPath)
                .files.addUsingPath(fileName, file, { Overwrite: true });

            // 3. REGISTRO EN LA LISTA DE METADATOS
            await this._sp.web.lists.getByTitle(this._metadataListName).items.add({
                Title: fileName,
                ObraId: metadatos.obraId,
                OperarioId: metadatos.operarioId,
                Comentarios: metadatos.comentarios || "",
                UrlFoto: fileResult.data.ServerRelativeUrl,
                FechaRegistro: new Date().toISOString()
            });

            // Retornamos el resultado para que el componente obtenga la URL
            return fileResult;

        } catch (error) {
            console.error("Error en PhotoService móvil:", error);
            throw error;
        }
    }
}