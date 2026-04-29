import * as React from 'react';
import { IonMenu, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel } from '@ionic/react';
import { constructOutline, cubeOutline, linkOutline, cameraOutline, peopleOutline, calendarOutline, timeOutline } from 'ionicons/icons';
import './Sidebar.css';

interface ISidebarProps {
  contentId: string;
  selectedKey: string;
  onLinkClick: (key: string) => void;
  userEmail?: string;
}

interface IMenuItem {
  name: string;
  key: string;
  icon: string;
}

const menuItems: IMenuItem[] = [
  { name: 'Proyectos',    key: 'obras',         icon: constructOutline },
  { name: 'Inventario',  key: 'inventario',     icon: cubeOutline },
  { name: 'Asignaciones',key: 'asignaciones',   icon: linkOutline },
  { name: 'Diario',      key: 'fotos',          icon: cameraOutline },
  { name: 'Personal',    key: 'personal',       icon: peopleOutline },
  { name: 'Planificación',key: 'planificacion', icon: calendarOutline },
  { name: 'Historial',   key: 'historial',      icon: timeOutline },
];

export const Sidebar: React.FC<ISidebarProps> = (props) => {
  const isRestricted = props.userEmail === "prueba20262@proyteal.com";

  const visibleItems = menuItems.filter(item => {
    if (isRestricted) {
      return ["fotos", "personal", "planificacion", "historial"].includes(item.key);
    }
    return true;
  });

  return (
    <IonMenu contentId={props.contentId} type="overlay" className="sidebar-menu">
      <IonHeader className="ion-no-border">
        <IonToolbar className="menu-toolbar">
          <IonTitle className="menu-title">MENÚ EWS</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="sidebar-content">
        <IonList lines="none" className="ion-padding-top">
          {visibleItems.map((item) => {
            const isSelected = props.selectedKey === item.key;
            
            return (
              <IonMenuToggle key={item.key} autoHide={false}>
                <IonItem
                  button
                  detail={false}
                  onClick={() => props.onLinkClick(item.key)}
                  // Aquí aplicamos las clases del archivo CSS
                  className={`menu-item-custom ${isSelected ? 'item-selected' : ''}`}
                >
                  <IonIcon 
                    slot="start" 
                    icon={item.icon} 
                    className={`menu-icon ${isSelected ? 'icon-selected' : 'icon-default'}`} 
                  />
                  <IonLabel className={`menu-label ${isSelected ? 'label-selected' : ''}`}>
                    {item.name}
                  </IonLabel>
                </IonItem>
              </IonMenuToggle>
            );
          })}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};