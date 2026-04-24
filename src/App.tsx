import React, { useEffect, useState, useRef } from 'react';
import { IonApp, setupIonicReact, IonContent, IonButton, IonPage, IonSpinner } from '@ionic/react';
import { SPFI, spfi, SPBrowser } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { Obras } from './components/Obras';
import { Queryable } from "@pnp/queryable";
import { PublicClientApplication, AuthenticationResult } from "@azure/msal-browser";
import { initializeIcons } from '@fluentui/react/lib/Icons';
import { App as CapApp } from '@capacitor/app';
// Estilos
import '@ionic/react/css/core.css';
import './theme/variables.css';

initializeIcons();
setupIonicReact();

const msalConfig = {
  auth: {
    clientId: "26cc7630-ed5a-4cde-9db8-a7ded2c00638",
    authority: "https://login.microsoftonline.com/6cf350dd-61d1-49c8-8197-f6b6b870f6b4",
    // Esta línea detecta automáticamente si estás en la web o en el APK
    redirectUri: "msauth://io.ionic.starter/XAjh9Gj1qyMt7E7q%2Fyhop%2Beq4cc%3D", 
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: true
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

const App: React.FC = () => {
  const [sp, setSp] = useState<SPFI | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  // Función corregida para evitar el error de tipos en la línea 42
  const configurarPnP = (token: string) => {
    const spInstance = spfi("https://proyectosintegrales.sharepoint.com/sites/EWSStockManagement").using(
      SPBrowser(), // <--- ESTO ES EL MOTOR QUE FALTABA
      (instance: Queryable) => {
        instance.on.auth(async (url, init) => {
          init.headers = {
            ...init.headers,
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json;odata=verbose" 
          };
          return [url, init] as any;
        });
      }
    );

    setSp(spInstance);
    setIsAuthenticated(true);
    setIsLoading(false);
  };

useEffect(() => {
  const checkAuth = async () => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      await msalInstance.initialize();

      // 1. ESCUCHADOR PARA MÓVIL (Deep Links)
      // Este evento se dispara cuando el navegador te devuelve a la APK
      CapApp.addListener('appUrlOpen', async (data: any) => {
        console.log(">>> Volviendo a la App desde URL:", data.url);
        try {
          // MSAL procesa la URL que trae el token
          const result = await msalInstance.handleRedirectPromise(data.url);
          if (result) {
            configurarPnP(result.accessToken);
          }
        } catch (err) {
          console.error("Error al procesar el retorno del login:", err);
        }
      });

      // 2. PROCESO NORMAL (Para Web o si la App se reinicia)
      const result = await msalInstance.handleRedirectPromise();
      
      if (result) {
        configurarPnP(result.accessToken);
      } else {
        const accounts = msalInstance.getAllAccounts();
        if (accounts.length > 0) {
          const silentRequest = {
            scopes: ["https://proyectosintegrales.sharepoint.com/AllSites.Read"],
            account: accounts[0]
          };
          const silentResponse = await msalInstance.acquireTokenSilent(silentRequest);
          configurarPnP(silentResponse.accessToken);
        } else {
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error("Error inicializando sesión:", error);
      setIsLoading(false);
    }
  };
  checkAuth();
}, []);

  const handleLogin = async () => {
    try {
      await msalInstance.loginRedirect({
        scopes: ["https://proyectosintegrales.sharepoint.com/AllSites.Read"],
        prompt: "select_account"
      });
    } catch (error) {
      console.error("Error en login:", error);
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '45vh' }}>
            <IonSpinner name="crescent" />
            <p>Verificando conexión con SharePoint...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Si no está autenticado, mostramos el botón de login
  if (!isAuthenticated || !sp) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '40vh' }}>
            <h2 style={{ color: '#004b3e', fontWeight: 'bold' }}>EWS ENERGY</h2>
            <p>Gestión de Stock y Obras</p>
            <IonButton onClick={handleLogin} shape="round" style={{ marginTop: '20px' }}>
              INICIAR SESIÓN
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Solo cuando isAuthenticated es true y sp no es null, se muestra Obras
  return (
    <IonApp>
      <Obras sp={sp} />
    </IonApp>
  );
};

export default App;