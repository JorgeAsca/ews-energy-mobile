import { Configuration } from "@azure/msal-browser";

export const msalConfig: Configuration = {
    auth: {
        clientId: "26cc7630-ed5a-4cde-9db8-a7ded2c00638", 
        authority: "https://login.microsoftonline.com/e0a30b7c-f865-4277-9097-9e794344605f",
        redirectUri: "http://localhost:8100", 
    },
    cache: {
        cacheLocation: "localStorage",
    }
};

// IMPORTANTE: Scope configurado con tu dominio real
export const loginRequest = {
    scopes: ["https://proyectosintegrales.sharepoint.com/AllSites.Read"] 
};