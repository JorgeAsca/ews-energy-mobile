import React, { useEffect, useState, useRef } from 'react';
import { IonApp, setupIonicReact, IonContent, IonButton, IonPage, IonSpinner } from '@ionic/react';
import { SPFI, spfi } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { Obras } from './components/Obras';
import { Queryable } from "@pnp/queryable";
import { PublicClientApplication } from "@azure/msal-browser";
import { initializeIcons } from '@fluentui/react/lib/Icons';

import '@ionic/react/css/core.css';
import './theme/variables.css';

initializeIcons();
setupIonicReact();

const msalConfig = {
  auth: {
    clientId: "26cc7630-ed5a-4cde-9db8-a7ded2c00638", 
    authority: "https://login.microsoftonline.com/6cf350dd-61d1-49c8-8197-f6b6b870f6b4", 
    redirectUri: "http://localhost:8100", 
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

const configurarPnP = (token: string) => {
    const spInstance = spfi("https://proyectosintegrales.sharepoint.com/sites/EWSStockManagement").using(
      (instance: Queryable) => {
        // Usamos 'as any' en la función para que TypeScript no bloquee la compilación
        instance.on.pre(async (url: string, init: RequestInit): Promise<any> => {
          init.headers = {
            ...init.headers,
            "Authorization": `Bearer ${token}`,
            "Accept": "application/json;odata=nometadata"
          };

          return [url, init];
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
            <p>Cargando aplicación...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!isAuthenticated || !sp) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '40vh' }}>
            <h2 style={{ color: '#3880ff', fontWeight: 'bold' }}>EWS Energy</h2>
            <p>Inicia sesión para acceder al panel</p>
            <IonButton onClick={handleLogin} shape="round" style={{ marginTop: '20px' }}>
              INICIAR SESIÓN
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return <Obras sp={sp} />;
};

export default App;