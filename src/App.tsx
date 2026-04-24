import React, { useEffect, useState, useRef } from 'react';
import { IonApp, setupIonicReact, IonContent, IonButton, IonPage, IonSpinner, IonHeader, IonToolbar, IonTitle } from '@ionic/react';
import { SPFI, spfi, SPBrowser } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { Obras } from './components/Obras';
import { Queryable } from "@pnp/queryable";
import { PublicClientApplication } from "@azure/msal-browser";
import { initializeIcons } from '@fluentui/react/lib/Icons';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

// Estilos
import '@ionic/react/css/core.css';
import './theme/variables.css';

initializeIcons();
setupIonicReact();

const msalConfig = {
  auth: {
    clientId: "26cc7630-ed5a-4cde-9db8-a7ded2c00638", 
    authority: "https://login.microsoftonline.com/6cf350dd-61d1-49c8-8197-f6b6b870f6b4", 
    redirectUri: Capacitor.isNativePlatform() 
      ? "msauth://io.ionic.starter/XAjh9Gj1qyMt7E7q%2Fyhop%2Beq4cc%3D" 
      : window.location.origin, 
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false 
  },
  system: {
    redirectNavigationTimeout: 300000 
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

const App: React.FC = () => {
  const [sp, setSp] = useState<SPFI | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasInitialized = useRef(false);

  const configurarPnP = (token: string) => {
    console.log(">>> Configurando conexión con SharePoint...");
    const spInstance = spfi("https://proyectosintegrales.sharepoint.com/sites/EWSStockManagement").using(
      SPBrowser(),
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

        // Función auxiliar para login silencioso
        const intentarSilencioso = async () => {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            try {
              const silentResponse = await msalInstance.acquireTokenSilent({
                scopes: ["https://proyectosintegrales.sharepoint.com/AllSites.Read"],
                account: accounts[0]
              });
              configurarPnP(silentResponse.accessToken);
            } catch (e) {
              console.log(">>> Fallo token silencioso, requiere login manual.");
              setIsLoading(false);
            }
          } else {
            setIsLoading(false);
          }
        };

        if (Capacitor.isNativePlatform()) {
          // --- LÓGICA EXCLUSIVA MÓVIL ---
          
          // 1. Escuchamos Deep Links cuando la app vuelve del navegador
          CapApp.addListener('appUrlOpen', async (data: any) => {
            console.log(">>> Regresando a la App (Listener):", data.url);
            try {
              const urlHash = data.url.includes('#') ? `#${data.url.split('#')[1]}` : data.url;
              const result = await msalInstance.handleRedirectPromise({ hash: urlHash });
              if (result) {
                configurarPnP(result.accessToken);
              } else {
                intentarSilencioso();
              }
            } catch (err) {
              console.error(">>> Error procesando token:", err);
            }
          });

          // 2. Comprobamos si la app se arrancó desde cero por culpa del Deep Link
          const launchUrl = await CapApp.getLaunchUrl();
          if (launchUrl && launchUrl.url && launchUrl.url.includes('msauth')) {
            console.log(">>> App arrancada por URL (Launch):", launchUrl.url);
            const urlHash = launchUrl.url.includes('#') ? `#${launchUrl.url.split('#')[1]}` : launchUrl.url;
            const result = await msalInstance.handleRedirectPromise({ hash: urlHash });
            if (result) {
              configurarPnP(result.accessToken);
            } else {
              intentarSilencioso();
            }
          } else {
            // Si la app se abrió normal (sin URL), intentamos recuperar sesión guardada
            intentarSilencioso();
          }

        } else {
          // --- LÓGICA EXCLUSIVA WEB ---
          const result = await msalInstance.handleRedirectPromise();
          if (result) {
            configurarPnP(result.accessToken);
          } else {
            intentarSilencioso();
          }
        }
      } catch (error) {
        console.error(">>> Error inicializando sesión:", error);
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
    } catch (error: any) {
      if (error.name === 'BrowserAuthError' && error.message.includes('timed_out')) {
        console.log(">>> Ignorando timeout visual de Capacitor...");
      } else {
        console.error(">>> Error en inicio de sesión:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <IonPage>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '45vh' }}>
            <IonSpinner name="crescent" />
            <p>Iniciando sistema...</p>
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
            <h2 style={{ color: '#004b3e', fontWeight: 'bold' }}>EWS ENERGY</h2>
            <IonButton onClick={handleLogin} shape="round" style={{ marginTop: '20px' }}>
              INICIAR SESIÓN
            </IonButton>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonApp>
      <IonPage> {/* <-- Agregamos IonPage para gestionar el layout */}
        <IonHeader translucent={true}>
          <IonToolbar color="primary">
            <IonTitle>EWS ENERGY</IonTitle>
          </IonToolbar>
        </IonHeader>
        
        <IonContent>
          <Obras sp={sp} />
        </IonContent>
      </IonPage>
    </IonApp>
  );
};

export default App;