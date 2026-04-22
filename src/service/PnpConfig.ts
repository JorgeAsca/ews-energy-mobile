import { spfi, SPFI } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/batching";

let _sp: SPFI;

export const getSP = (accessToken?: string): SPFI => {
  if (accessToken) {
    // URL de tu sitio basada en tu Tenant ID y nombre de app
    _sp = spfi("https://ewsenergy.sharepoint.com/sites/EwsEnergy")
      .using((instance) => {
        instance.on.auth(async (url: string, init: RequestInit) => {
          init.headers = {
            ...init.headers,
            "Authorization": `Bearer ${accessToken}`,
            "Accept": "application/json;odata=verbose"
          };
          return [url, init];
        });
      });
  }
  return _sp;
};