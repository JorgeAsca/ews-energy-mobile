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
    },
  ): Promise<any> {
    try {
      const nombreCarpeta = nombreProyecto.replace(/[/\\?%*:|"<>]/g, "-");
      const folderPath = `${this._libName}/${nombreCarpeta}`;

      // 1. LÓGICA SEGURA DE CARPETAS
      try {
        await this._sp.web.getFolderByServerRelativePath(folderPath)();
      } catch (folderError) {
        await this._sp.web.folders.addUsingPath(folderPath);
      }

      const nombreSinExtension = file.name.substring(0, file.name.lastIndexOf('.')) || "foto_camara";
      const fileName = `${Date.now()}_${metadatos.operarioId}_${nombreSinExtension}.jpg`;

      // 2. SUBIDA SEGURA DE ARCHIVOS
      const fileResult: any = await this._sp.web
        .getFolderByServerRelativePath(folderPath)
        .files.addUsingPath(fileName, file, { Overwrite: true });

      const serverRelativeUrl = fileResult.data?.ServerRelativeUrl || fileResult.ServerRelativeUrl;

      // 3. REGISTRO EN LA LISTA DE METADATOS
      await this._sp.web.lists.getByTitle(this._metadataListName).items.add({
        Title: fileName,
        ObraId: metadatos.obraId,
        OperarioId: metadatos.operarioId,
        Comentarios: metadatos.comentarios || "",
        UrlFoto: {
          Url: serverRelativeUrl, 
          Description: fileName,
        },
        FechaRegistro: new Date().toISOString(),
      });

      return fileResult;
    } catch (error) {
      console.error("Error en PhotoService móvil:", error);
      throw error;
    }
  }

  public async getFotosPorObra(obraId: number): Promise<any[]> {
    try {
      const fotos = await this._sp.web.lists.getByTitle(this._metadataListName).items
        .filter(`ObraId eq ${obraId}`)
        .select("Id", "Title", "UrlFoto", "Comentarios", "FechaRegistro")
        .orderBy("FechaRegistro", false)(); 
      return fotos;
    } catch (error) {
      console.error("Error al obtener fotos de la obra:", error);
      return [];
    }
  }

  public async obtenerImagenComoUrlLocal(serverRelativeUrl: string): Promise<string> {
    try {
      if (!serverRelativeUrl) return "";
      
      const blob = await this._sp.web.getFileByServerRelativePath(serverRelativeUrl).getBlob();
      
      return URL.createObjectURL(blob);
    } catch (error) {
      console.error("Error al descargar imagen desde SharePoint:", error);
      return ""; 
    }
  }
}