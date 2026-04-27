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
      style={{ 
        '--width': '180px', 
        '--min-width': '180px',
        '--max-width': '180px',
        '--border': 'none',
        '--box-shadow': 'none'
      }} 
    >
      <IonHeader className="ion-no-border">
        <IonToolbar style={{ '--background': '#004b3e', '--color': '#ffffff', '--min-height': '44px' }}>
          <IonTitle style={{ fontWeight: 'bold', fontSize: '13px' }}>MENÚ</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent style={{ '--background': '#ffffff' }}>
        <IonList lines="none" style={{ paddingTop: '8px' }}>
          {menuItems.map((item) => (
            <IonMenuToggle key={item.key} autoHide={false}>
              <IonItem
                button
                detail={false}
                onClick={() => props.onLinkClick(item.key)}
                style={{
                  '--background': props.selectedKey === item.key ? '#e8f5e9' : 'transparent',
                  '--border-radius': '0 16px 16px 0',
                  '--padding-start': '10px',
                  '--padding-end': '6px',
                  '--min-height': '40px',
                  '--border-color': 'transparent',
                  marginBottom: '2px',
                  marginRight: '8px',
                }}
              >
                <IonIcon 
                  slot="start" 
                  icon={item.icon} 
                  style={{ 
                    fontSize: '16px',
                    marginRight: '8px',
                    color: props.selectedKey === item.key ? '#004b3e' : '#888'
                  }} 
                />
                <IonLabel 
                  style={{ 
                    fontWeight: props.selectedKey === item.key ? '600' : 'normal',
                    fontSize: '12px',
                    color: props.selectedKey === item.key ? '#004b3e' : '#444'
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