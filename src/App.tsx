import React, { useEffect, useState, useRef } from 'react';
import {
  IonApp, setupIonicReact, IonContent, IonButton, IonPage,
  IonSpinner, IonHeader, IonToolbar, IonTitle, IonButtons,
  IonMenuButton, IonSplitPane
} from '@ionic/react';
import { SPFI, spfi, SPBrowser } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { Obras } from './components/Obras';
import { Sidebar } from './components/Navegacion/Sidebar';
import { ListaMateriales } from './components/Vistas/Inventario/ListaMateriales';
import { GaleriaPersonal } from './components/Vistas/Personal/GaleriaPersonal';
import { VistaPlanificacion } from './components/Vistas/Planificacion/VistaPlanificacion';
import { VistaAsignaciones } from './components/Vistas/Asignaciones/VistaAsignaciones';
import { VistaFotosObra } from './components/Vistas/Fotos/VistaFotosObra';
import { VistaHistorialTarjetas } from './components/Vistas/historial/VistaHistorialReportes';
// NUEVA IMPORTACIÓN: Tu vista de Clientes
import { ListaClientes } from './components/Vistas/Cliente/ListaClientes';
import { Queryable } from "@pnp/queryable";
import { PublicClientApplication } from "@azure/msal-browser";
import { initializeIcons } from '@fluentui/react/lib/Icons';
import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
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
  const [activeView, setActiveView] = useState("obras");
  const [userEmail, setUserEmail] = useState<string>("");

  const configurarPnP = (token: string) => {
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

    const accounts = msalInstance.getAllAccounts();
    if (accounts.length > 0) {
      const email = accounts[0].username.toLowerCase();
      setUserEmail(email);
      if (email === "prueba20262@proyteal.com") {
        setActiveView("fotos");
      }
    }

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
        const intentarSilencioso = async () => {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            try {
              const silentResponse = await msalInstance.acquireTokenSilent({
                scopes: [
                  "https://proyectosintegrales.sharepoint.com/AllSites.Read",
                  "https://proyectosintegrales.sharepoint.com/AllSites.Write"
                ],
                account: accounts[0]
              });
              configurarPnP(silentResponse.accessToken);
            } catch (e) { setIsLoading(false); }
          } else { setIsLoading(false); }
        };
        if (Capacitor.isNativePlatform()) {
          CapApp.addListener('appUrlOpen', async (data: any) => {
            const urlHash = data.url.includes('#') ? `#${data.url.split('#')[1]}` : data.url;
            const result = await msalInstance.handleRedirectPromise({ hash: urlHash });
            result ? configurarPnP(result.accessToken) : intentarSilencioso();
          });
          const launchUrl = await CapApp.getLaunchUrl();
          if (launchUrl?.url?.includes('msauth')) {
            const urlHash = launchUrl.url.includes('#') ? `#${launchUrl.url.split('#')[1]}` : launchUrl.url;
            const result = await msalInstance.handleRedirectPromise({ hash: urlHash });
            result ? configurarPnP(result.accessToken) : intentarSilencioso();
          } else { intentarSilencioso(); }
        } else {
          const result = await msalInstance.handleRedirectPromise();
          result ? configurarPnP(result.accessToken) : intentarSilencioso();
        }
      } catch (error) { setIsLoading(false); }
    };
    checkAuth();
  }, []);

  const handleLogin = async () => {
    try {
      await msalInstance.loginRedirect({
        scopes: ["https://proyectosintegrales.sharepoint.com/AllSites.Read", "https://proyectosintegrales.sharepoint.com/AllSites.Write"],
        prompt: "select_account"
      });
    } catch (error) { console.error(error); }
  };

  if (isLoading) return <IonPage><IonContent className="ion-padding ion-text-center"><IonSpinner name="crescent" /></IonContent></IonPage>;

  if (!isAuthenticated || !sp) {
    return (
      <IonPage>
        <IonContent className="ion-no-scroll">
          <div className="login-container">
            <div className="login-card">
              {/* Cabecera de marca */}
              <h1 className="login-logo-text">EWS</h1>
              <div className="login-subtitle">Energy</div>

              <div style={{ marginBottom: '40px' }}>
                <p style={{ color: '#fff', fontSize: '1.1rem', fontWeight: '500', margin: '0' }}>
                  Sistema de Gestión
                </p>
              </div>

              <IonButton
                onClick={handleLogin}
                expand="block"
                style={{
                  '--background': '#ffffff',
                  '--color': '#2f2f2f', /* Un gris casi negro para el texto */
                  '--border-radius': '14px',
                  'height': '58px',
                  'margin-top': '25px',
                  'font-weight': '700',
                  'font-size': '1.05rem',
                  /* Sombra más marcada para que despegue del fondo verde */
                  '--box-shadow': '0 8px 25px rgba(0,0,0,0.4)',
                  'text-transform': 'none'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 21 21" style={{ marginRight: '12px' }}>
                    <path fill="#f25022" d="M1 1h9v9H1z" />
                    <path fill="#7fbb00" d="M11 1h9v9h-9z" />
                    <path fill="#00a1f1" d="M1 11h9v9H1z" />
                    <path fill="#ffb900" d="M11 11h9v9h-9z" />
                  </svg>
                  Continuar con Microsoft
                </div>
              </IonButton>

              <div style={{
                marginTop: '40px',
                paddingTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '5px'
              }}>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>
                  CONEXIÓN ENCRIPTADA
                </span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', fontWeight: '600' }}>
                  Microsoft Azure AD
                </span>
              </div>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  const isRestricted = userEmail === "prueba20262@proyteal.com";

  return (
    <IonApp>
      <IonSplitPane contentId="main-content" when="lg">
        <Sidebar contentId="main-content" selectedKey={activeView} onLinkClick={(key) => setActiveView(key)} userEmail={userEmail} />
        <IonPage id="main-content" style={{ background: '#f9fbf9' }}>
          <IonHeader className="ion-no-border">
            <IonToolbar style={{ '--background': '#004b3e', '--color': '#ffffff' }}>
              <IonButtons slot="start"><IonMenuButton style={{ color: '#ffffff' }} /></IonButtons>
              <IonTitle style={{ fontWeight: 'bold' }}>EWS ENERGY</IonTitle>
            </IonToolbar>
          </IonHeader>
          <IonContent style={{ '--background': '#f9fbf9' }}>
            <div style={{ width: '100%', height: '100%' }}>
              {/* VISTAS EXCLUSIVAS DE ADMINISTRADOR */}
              {!isRestricted && activeView === "obras" && <Obras sp={sp} activeView={activeView} />}
              {!isRestricted && activeView === "inventario" && <ListaMateriales sp={sp} />}
              {!isRestricted && activeView === "asignaciones" && <VistaAsignaciones sp={sp} />}
              {/* NUEVA VISTA DE CLIENTES (Solo para administradores) */}
              {!isRestricted && activeView === "clientes" && <ListaClientes sp={sp} />}

              {/* VISTAS COMPARTIDAS (Administrador y Operario) */}
              {activeView === "fotos" && <VistaFotosObra sp={sp} />}
              {activeView === "personal" && <GaleriaPersonal sp={sp} />}
              {activeView === "planificacion" && <VistaPlanificacion sp={sp} />}
              {activeView === "historial" && <VistaHistorialTarjetas sp={sp} />}
            </div>
          </IonContent>
        </IonPage>
      </IonSplitPane>
    </IonApp>
  );
};

export default App;