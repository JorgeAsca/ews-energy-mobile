import * as React from "react";
import {
    Stack,
    Text,
    Persona,
    PersonaSize,
    PrimaryButton,
    DefaultButton,
    Spinner,
    SpinnerSize,
    MessageBar,
    MessageBarType,
    TextField,
    Icon,
    IconButton,
    Dropdown,
    IDropdownOption,
} from "@fluentui/react";
import { IPersonal } from "../../../models/IPersonal";
import { IObra } from "../../../models/IObra";
import { PersonalService } from "../../../service/PersonalService";
import { AsignacionesService } from "../../../service/AsignacionesService";
import { ProjectService } from "../../../service/ProjectService";
import { PhotoService } from "../../../service/PhotoService";
import { SPFI } from "@pnp/sp";
import styles from "./VistaFotosObra.module.scss";

// Definimos que recibe 'sp' para la conexión móvil
interface IVistaFotosObraProps {
    sp: SPFI;
}

export const VistaFotosObra: React.FC<IVistaFotosObraProps> = (props) => {
    const [paso, setPaso] = React.useState(1);
    const [loading, setLoading] = React.useState(true);
    const [subiendo, setSubiendo] = React.useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [mensajeExito, setMensajeExito] = React.useState(false);
    const [procesandoCaptura, setProcesandoCaptura] = React.useState(false);

    const [operario, setOperario] = React.useState<IPersonal | null>(null);
    const [obraSeleccionada, setObraSeleccionada] = React.useState<IObra | null>(null);
    const [fotos, setFotos] = React.useState<any[]>([]);
    const [comentarios, setComentarios] = React.useState("");

    const [data, setData] = React.useState<{ personal: IPersonal[]; obras: IObra[]; asignaciones: any[] }>({
        personal: [],
        obras: [],
        asignaciones: [],
    });

    // Inicializamos los servicios con el objeto 'sp' inyectado
    const services = React.useMemo(() => ({
        personal: new PersonalService(props.sp),
        asignaciones: new AsignacionesService(props.sp),
        proyectos: new ProjectService(props.sp),
        photos: new PhotoService(props.sp)
    }), [props.sp]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [p, o, a] = await Promise.all([
                services.personal.getPersonal(),
                services.proyectos.getObras(),
                services.asignaciones.getAsignaciones(),
            ]);
            setData({ personal: p, obras: o, asignaciones: a });
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
        if (!obraSeleccionada || !operario || fotos.length === 0) return;

        setSubiendo(true);
        try {
            for (const fotoObj of fotos) {
                await services.photos.subirFotoProyecto(
                    fotoObj.File,
                    obraSeleccionada.Title,
                    {
                        operario: operario.NombreyApellido,
                        operarioId: operario.Id,
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

    if (loading) return <Spinner size={SpinnerSize.large} label="Preparando cámara..." />;

    return (
        <div className={styles.vistaFotosObra}>
            <main className={styles.mainContainer}>
                {paso === 1 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge" className={styles.stepTitle}>¿Quién eres? 👤</Text>
                        <Dropdown
                            label="Selecciona tu nombre"
                            options={data.personal.map(p => ({ key: p.Id, text: p.NombreyApellido }))}
                            onChange={(_, opt) => {
                                const p = data.personal.find(pers => pers.Id === opt?.key);
                                if (p) setOperario(p);
                            }}
                        />
                        <PrimaryButton 
                            text="Siguiente" 
                            disabled={!operario} 
                            onClick={() => setPaso(2)} 
                            style={{ marginTop: 20 }}
                        />
                    </section>
                )}

                {paso === 2 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge">Selecciona la Obra 🏗️</Text>
                        <Dropdown
                            label="Obra actual"
                            options={data.obras.map(o => ({ key: o.Id, text: o.Title }))}
                            onChange={(_, opt) => {
                                const o = data.obras.find(obra => obra.Id === opt?.key);
                                if (o) setObraSeleccionada(o);
                            }}
                        />
                        <Stack horizontal tokens={{ childrenGap: 10 }} style={{ marginTop: 20 }}>
                            <DefaultButton text="Atrás" onClick={() => setPaso(1)} />
                            <PrimaryButton text="Siguiente" disabled={!obraSeleccionada} onClick={() => setPaso(3)} />
                        </Stack>
                    </section>
                )}

                {paso === 3 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge">Captura de Fotos 📸</Text>
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />
                        <PrimaryButton 
                            iconProps={{ iconName: 'Camera' }} 
                            text="Tomar Foto" 
                            onClick={() => fileInputRef.current?.click()} 
                        />
                        
                        <div className={styles.previewContainer}>
                            {fotos.map((f, i) => (
                                <div key={i} className={styles.previewItem}>
                                    <img src={f.Url} alt="preview" style={{ width: '100px' }} />
                                    <IconButton 
                                        iconProps={{ iconName: "Cancel" }} 
                                        onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))} 
                                    />
                                </div>
                            ))}
                        </div>

                        <TextField 
                            label="Comentarios" 
                            multiline 
                            rows={3} 
                            value={comentarios} 
                            onChange={(_, v) => setComentarios(v || "")} 
                        />

                        {mensajeExito && (
                            <MessageBar messageBarType={MessageBarType.success}>
                                Reporte enviado con éxito.
                            </MessageBar>
                        )}

                        <Stack horizontal tokens={{ childrenGap: 10 }} style={{ marginTop: 20 }}>
                            <DefaultButton text="Atrás" onClick={() => setPaso(2)} />
                            <PrimaryButton 
                                text={subiendo ? "Enviando..." : "Finalizar Reporte"} 
                                onClick={enviarReporte} 
                                disabled={fotos.length === 0 || subiendo}
                            />
                        </Stack>
                    </section>
                )}
            </main>
        </div>
    );
};