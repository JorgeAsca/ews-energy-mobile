import { SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/site-users";
import "@pnp/sp/site-groups";
import { RolUsuario } from '../models/IPersonal';

export class UserService {
    private _sp: SPFI;

    constructor(sp: SPFI) {
        this._sp = sp;
    }

    /**
     * Determina el rol del usuario actual consultando sus grupos de SharePoint
     */
    public async getRolActual(): Promise<RolUsuario> {
        try {
            // Obtenemos los grupos del usuario actual
            const grupos: any[] = await this._sp.web.currentUser.groups();
            const nombresGrupos = grupos.map(g => g.Title);

            
            if (nombresGrupos.indexOf('EWS_Admins') !== -1) {
                return 'Administrador' as RolUsuario;
            }
            
            if (nombresGrupos.indexOf('EWS_Managers') !== -1) {
                return 'Manager' as RolUsuario;
            }

            return 'Operario' as RolUsuario;
        } catch (error) {
            console.error("Error al obtener rol:", error);
            return 'Operario' as RolUsuario;
        }
    }

    /**
     * Obtiene la información del perfil del usuario logueado
     */
    public async getInfoUsuario() {
        try {
            const user = await this._sp.web.currentUser();
            return {
                nombre: user.Title,
                email: user.Email,
                id: user.Id
            };
        } catch (error) {
            console.error("Error al obtener info de usuario:", error);
            return null;
        }
    }
}