import * as React from "react";
import {
    Stack,
    Text,
    Spinner,
    SpinnerSize,
    MessageBar,
    MessageBarType,
    TextField,
    Icon,
    IconButton,
    PrimaryButton,
    DefaultButton,
} from "@fluentui/react";
// Importamos el UserService que ya tenías creado
import { UserService } from "../../../service/UserService";
import { IObra } from "../../../models/IObra";
import { AsignacionesService } from "../../../service/AsignacionesService";
import { ProjectService } from "../../../service/ProjectService";
import { PhotoService } from "../../../service/PhotoService";
import { SPFI } from "@pnp/sp";
import styles from "./VistaFotosObra.module.scss";

const ewsPrimaryButtonStyles = {
    root: { backgroundColor: '#004b3e', borderColor: '#004b3e', borderRadius: '8px', height: '48px' },
    rootHovered: { backgroundColor: '#00362c', borderColor: '#00362c' },
    rootPressed: { backgroundColor: '#00221b', borderColor: '#00221b' },
    rootDisabled: { backgroundColor: '#cccccc', borderColor: '#cccccc' }
};

const ewsDefaultButtonStyles = {
    root: { borderRadius: '8px', height: '48px', color: '#004b3e', borderColor: '#004b3e' },
    rootHovered: { backgroundColor: '#f4f5f8' }
};

interface IVistaFotosObraProps {
    sp: SPFI;
}

export const VistaFotosObra: React.FC<IVistaFotosObraProps> = (props) => {
    // El paso 1 ahora es directamente seleccionar la obra
    const [paso, setPaso] = React.useState(1);
    const [loading, setLoading] = React.useState(true);
    const [subiendo, setSubiendo] = React.useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [mensajeExito, setMensajeExito] = React.useState(false);
    const [procesandoCaptura, setProcesandoCaptura] = React.useState(false);

    // Estado para el usuario actual capturado desde Microsoft Entra
    const [currentUser, setCurrentUser] = React.useState<{ nombre: string, email: string, id: number } | null>(null);
    const [obraSeleccionada, setObraSeleccionada] = React.useState<IObra | null>(null);
    const [fotos, setFotos] = React.useState<any[]>([]);
    const [comentarios, setComentarios] = React.useState("");

    const [data, setData] = React.useState<{ obras: IObra[]; asignaciones: any[] }>({
        obras: [],
        asignaciones: [],
    });

    const services = React.useMemo(() => ({
        userService: new UserService(props.sp), // Añadido el servicio de usuario
        asignaciones: new AsignacionesService(props.sp),
        proyectos: new ProjectService(props.sp),
        photos: new PhotoService(props.sp)
    }), [props.sp]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            // Ejecutamos en paralelo la petición de Obras y la identidad del Usuario
            const [user, o, a] = await Promise.all([
                services.userService.getInfoUsuario(),
                services.proyectos.getObras(),
                services.asignaciones.getAsignaciones(),
            ]);
            
            // @ts-ignore (Asegurando que user no venga null)
            setCurrentUser(user); 
            setData({ obras: o, asignaciones: a });
        } catch (error) {
            console.error("Error cargando datos para fotos:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        cargarDatos();
    }, [props.sp]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setProcesandoCaptura(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotos(prev => [...prev, { File: file, Url: reader.result as string }]);
                setProcesandoCaptura(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            setProcesandoCaptura(false);
        }
    };

    const enviarReporte = async () => {
        if (!obraSeleccionada || !currentUser || fotos.length === 0) return;

        setSubiendo(true);
        try {
            for (const fotoObj of fotos) {
                await services.photos.subirFotoProyecto(
                    fotoObj.File,
                    obraSeleccionada.Title,
                    {
                        operario: currentUser.nombre, // Usamos el nombre detectado en la sesión
                        operarioId: currentUser.id,   // Usamos el ID de SharePoint
                        obraId: obraSeleccionada.Id,
                        comentarios: comentarios
                    }
                );
            }
            setMensajeExito(true);
            setFotos([]);
            setComentarios("");
            setTimeout(() => {
                setMensajeExito(false);
                setPaso(1);
            }, 3000);
        } catch (error) {
            console.error("Error al enviar reporte:", error);
        } finally {
            setSubiendo(false);
        }
    };

    if (loading) return (
        <div style={{ marginTop: '40vh', textAlign: 'center' }}>
            <Spinner size={SpinnerSize.large} label="Sincronizando datos..." />
        </div>
    );

    return (
        <div className={styles.vistaFotosObra}>
            <main className={styles.mainContainer}>
                
                {/* PASO 1: Lista de Obras Estilo App */}
                {paso === 1 && (
                    <section className={styles.stepSection}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text variant="xLarge" className={styles.stepTitle}>Selecciona la Obra 🏗️</Text>
                        </div>
                        <Text style={{ color: '#666', fontSize: '14px', marginBottom: '10px', display: 'block' }}>
                            Hola, <strong>{currentUser?.nombre?.split(' ')[0] || 'Operario'}</strong>. ¿Dónde estás trabajando hoy?
                        </Text>
                        
                        <div className={styles.obraList}>
                            {data.obras.map(o => (
                                <div 
                                    key={o.Id} 
                                    className={`${styles.obraCard} ${obraSeleccionada?.Id === o.Id ? styles.obraCardSelected : ''}`}
                                    onClick={() => setObraSeleccionada(o)}
                                >
                                    <Icon iconName="CityNext" className={styles.obraIcon} />
                                    <div className={styles.obraInfo}>
                                        <Text className={styles.obraTitle}>{o.Title}</Text>
                                        <Text className={styles.obraSubtitle}>
                                            {o.Cliente ? `Cliente: ${o.Cliente}` : 'Sin cliente asignado'}
                                        </Text>
                                    </div>
                                    {obraSeleccionada?.Id === o.Id && (
                                        <Icon iconName="CheckMark" className={styles.checkIcon} />
                                    )}
                                </div>
                            ))}
                        </div>

                        <PrimaryButton 
                            text="Continuar a Cámara" 
                            disabled={!obraSeleccionada} 
                            onClick={() => setPaso(2)} 
                            styles={ewsPrimaryButtonStyles} 
                            style={{ width: '100%', marginTop: '20px' }} 
                        />
                    </section>
                )}

                {/* PASO 2: Captura de Fotos (Antes era el paso 3) */}
                {paso === 2 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge" className={styles.stepTitle}>Subir Fotografía 📸</Text>
                        <Text style={{ display: 'block', marginBottom: '16px', color: '#666' }}>
                            Obra: <strong>{obraSeleccionada?.Title}</strong>
                        </Text>
                        
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

                        {/* Diseño del área de carga */}
                        <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
                            {procesandoCaptura ? (
                                <Spinner size={SpinnerSize.medium} />
                            ) : (
                                <>
                                    <Icon iconName="Camera" className={styles.uploadIcon} />
                                    <p className={styles.uploadTitle}>Capturar o Seleccionar</p>
                                    <p className={styles.uploadSubtitle}>Toca aquí para abrir la cámara</p>
                                </>
                            )}
                        </div>
                        
                        {/* Previsualización de imágenes */}
                        {fotos.length > 0 && (
                            <div className={styles.previewContainer}>
                                {fotos.map((f, i) => (
                                    <div key={i} className={styles.previewItem}>
                                        <img src={f.Url} alt="preview" className={styles.previewImage} />
                                        <IconButton 
                                            iconProps={{ iconName: "Cancel", styles: { root: { color: '#d13438' } } }} 
                                            className={styles.deleteButton}
                                            onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))} 
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <TextField 
                            label="Comentarios (Opcional)" 
                            placeholder="Añade un comentario sobre esta imagen..."
                            multiline 
                            rows={3} 
                            value={comentarios} 
                            onChange={(_, v) => setComentarios(v || "")} 
                            style={{ marginTop: 20 }}
                            styles={{ fieldGroup: { borderRadius: '8px' } }}
                        />

                        {mensajeExito && (
                            <MessageBar messageBarType={MessageBarType.success} style={{ marginTop: 16 }}>
                                Reporte enviado a SharePoint con éxito.
                            </MessageBar>
                        )}

                        <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 24 }}>
                            <DefaultButton text="Atrás" onClick={() => setPaso(1)} styles={ewsDefaultButtonStyles} style={{ flex: 1 }} />
                            <PrimaryButton 
                                text={subiendo ? "Enviando..." : "Finalizar Reporte"} 
                                onClick={enviarReporte} 
                                disabled={fotos.length === 0 || subiendo}
                                styles={ewsPrimaryButtonStyles}
                                style={{ flex: 2 }}
                            />
                        </Stack>
                    </section>
                )}
            </main>
        </div>
    );
};