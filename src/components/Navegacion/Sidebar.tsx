import * as React from "react";
import {
  IonMenu,
  IonContent,
  IonList,
  IonItem,
  IonIcon,
  IonLabel,
  IonMenuToggle,
  IonHeader,
  IonToolbar,
  IonTitle
} from "@ionic/react";
import { 
  cubeOutline, 
  peopleOutline, 
  constructOutline, 
  calendarOutline, 
  linkOutline, 
  cameraOutline, 
  timeOutline 
} from "ionicons/icons";

interface ISidebarProps {
  selectedKey: string;
  onLinkClick: (key: string) => void;
  contentId: string; 
}

const menuItems = [
  { name: "Inventario", key: "inventario", icon: cubeOutline },
  { name: "Personal", key: "personal", icon: peopleOutline },
  { name: "Obras", key: "obras", icon: constructOutline },
  { name: "Planificación", key: "planificacion", icon: calendarOutline },
  { name: "Asignaciones", key: "asignaciones", icon: linkOutline },
  { name: "Diario", key: "fotos", icon: cameraOutline },
  { name: "Control de Obras", key: "historial", icon: timeOutline },
];

export const Sidebar: React.FC<ISidebarProps> = (props) => {
  return (
    <IonMenu 
      contentId={props.contentId} 
      type="overlay" 
      style={{ '--width': '250px' }} 
    >
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#004b3e', '--color': '#ffffff' }}>
          <IonTitle style={{ fontWeight: 'bold', fontSize: '16px' }}>MENÚ</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        <IonList lines="none" className="ion-padding-top">
          {menuItems.map((item) => (
            <IonMenuToggle key={item.key} autoHide={false}>
              <IonItem
                button
                detail={false}
                onClick={() => props.onLinkClick(item.key)}
                color={props.selectedKey === item.key ? "light" : ""}
                style={{
                  '--border-radius': '0 20px 20px 0',
                  '--margin-end': '10px',
                  marginBottom: '4px'
                }}
              >
                <IonIcon 
                  slot="start" 
                  icon={item.icon} 
                  color={props.selectedKey === item.key ? "primary" : "medium"} 
                />
                <IonLabel 
                  style={{ 
                    fontWeight: props.selectedKey === item.key ? 'bold' : 'normal',
                    fontSize: '14px' 
                  }}
                >
                  {item.name}
                </IonLabel>
              </IonItem>
            </IonMenuToggle>
          ))}
        </IonList>
      </IonContent>
    </IonMenu>
  );
};