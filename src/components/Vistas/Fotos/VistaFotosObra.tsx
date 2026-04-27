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
    Checkbox,
    Slider,
    Separator,
    ActionButton
} from "@fluentui/react";
import { UserService } from "../../../service/UserService";
import { IObra } from "../../../models/IObra";
import { IPersonal } from "../../../models/IPersonal";
import { AsignacionesService } from "../../../service/AsignacionesService";
import { ProjectService } from "../../../service/ProjectService";
import { PhotoService } from "../../../service/PhotoService";
import { PersonalService } from "../../../service/PersonalService"; 
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
    const [paso, setPaso] = React.useState(1);
    const [loading, setLoading] = React.useState(true);
    const [subiendo, setSubiendo] = React.useState(false);

    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [mensajeExito, setMensajeExito] = React.useState(false);
    const [procesandoCaptura, setProcesandoCaptura] = React.useState(false);

    const [currentUser, setCurrentUser] = React.useState<{ nombre: string, email: string, id: number } | null>(null);
    const [obraSeleccionada, setObraSeleccionada] = React.useState<IObra | null>(null);
    const [fotos, setFotos] = React.useState<any[]>([]);
    const [comentarios, setComentarios] = React.useState("");

    const [personalObra, setPersonalObra] = React.useState<IPersonal[]>([]);
    const [personalSeleccionado, setPersonalSeleccionado] = React.useState<number[]>([]);
    const [horasPorPersonal, setHorasPorPersonal] = React.useState<Record<number, number>>({});

    const [data, setData] = React.useState<{ obras: IObra[]; asignaciones: any[]; personal: IPersonal[] }>({
        obras: [],
        asignaciones: [],
        personal: [] 
    });

    const services = React.useMemo(() => ({
        userService: new UserService(props.sp),
        asignaciones: new AsignacionesService(props.sp),
        proyectos: new ProjectService(props.sp),
        photos: new PhotoService(props.sp),
        personalService: new PersonalService(props.sp)
    }), [props.sp]);

    // Solución al problema [object Object] del Cliente
    const renderCliente = (cliente: any) => {
        if (!cliente) return 'Sin cliente asignado';
        if (typeof cliente === 'string') return cliente;
        if (typeof cliente === 'object' && cliente.Title) return cliente.Title;
        return 'Cliente sin especificar';
    };

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [user, o, a, p] = await Promise.all([
                services.userService.getInfoUsuario(),
                services.proyectos.getObras(),
                services.asignaciones.getAsignaciones(),
                services.personalService.getPersonal()
            ]);
            
            // @ts-ignore
            setCurrentUser(user); 
            setData({ obras: o, asignaciones: a, personal: p || [] });
        } catch (error) {
            console.error("Error cargando datos para fotos:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        cargarDatos();
    }, [props.sp]);

    const handleSeleccionarObra = (obra: IObra) => {
        setObraSeleccionada(obra);
        
        if (currentUser) {
            const sugeridos = services.asignaciones.getCuadrillaSugerida(
                obra.Id,
                currentUser.id,
                data.asignaciones,
                data.personal
            );
            setPersonalObra(sugeridos);
        }
        
        setPersonalSeleccionado([]);
        setHorasPorPersonal({});
        setPaso(2);
    };

    const handleTogglePersonal = (id: number, isChecked: boolean) => {
        if (isChecked) {
            setPersonalSeleccionado(prev => [...prev, id]);
            setHorasPorPersonal(prev => ({ ...prev, [id]: 8 }));
        } else {
            setPersonalSeleccionado(prev => prev.filter(pId => pId !== id));
            setHorasPorPersonal(prev => {
                const nuevasHoras = { ...prev };
                delete nuevasHoras[id];
                return nuevasHoras;
            });
        }
    };

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
            const resumenHoras = personalSeleccionado.map(id => {
                const persona = personalObra.find(p => p.Id === id);
                return `${persona?.NombreyApellido || 'Desconocido'}: ${horasPorPersonal[id]}h`;
            }).join(", ");

            const comentariosFinales = personalSeleccionado.length > 0 
                ? `${comentarios}\n\n[Horas registradas: ${resumenHoras}]` 
                : comentarios;

            for (const fotoObj of fotos) {
                await services.photos.subirFotoProyecto(
                    fotoObj.File,
                    obraSeleccionada.Title,
                    {
                        operario: currentUser.nombre,
                        operarioId: currentUser.id,
                        obraId: obraSeleccionada.Id,
                        comentarios: comentariosFinales
                    }
                );
            }
            setMensajeExito(true);
            setFotos([]);
            setComentarios("");
            setPersonalSeleccionado([]);
            setHorasPorPersonal({});
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
                
                {/* PASO 1: Selección de Obra */}
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
                                    onClick={() => handleSeleccionarObra(o)}
                                >
                                    <Icon iconName="CityNext" className={styles.obraIcon} />
                                    <div className={styles.obraInfo}>
                                        <Text className={styles.obraTitle}>{o.Title}</Text>
                                        <Text className={styles.obraSubtitle}>
                                            {o.Cliente ? `Cliente: ${renderCliente(o.Cliente)}` : 'Sin cliente asignado'}
                                        </Text>
                                    </div>
                                    {obraSeleccionada?.Id === o.Id && (
                                        <Icon iconName="CheckMark" className={styles.checkIcon} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* PASO 2: Selección de Personal e Información de Obra */}
                {paso === 2 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge" className={styles.stepTitle}>Personal Presente 👷🏽</Text>
                        <Text style={{ display: 'block', marginBottom: '16px', color: '#666' }}>
                            Obra: <strong>{obraSeleccionada?.Title}</strong>
                        </Text>
                        
                        <div className={styles.personalScrollList}>
                            {personalObra.length === 0 ? (
                                <MessageBar messageBarType={MessageBarType.info}>
                                    Eres el único asignado a esta obra. Puedes continuar.
                                </MessageBar>
                            ) : (
                                <div>
                                    {personalObra.map(persona => {
                                        const isSelected = personalSeleccionado.includes(persona.Id);
                                        const horas = horasPorPersonal[persona.Id] || 0;
                                        const porcentaje = Math.round((horas / 8) * 100);

                                        return (
                                            <div key={persona.Id} className={styles.personalItemContainer}>
                                                <Checkbox
                                                    label={persona.NombreyApellido || "Operario sin nombre"}
                                                    checked={isSelected}
                                                    onChange={(_, isChecked) => handleTogglePersonal(persona.Id, !!isChecked)}
                                                />
                                                
                                                {isSelected && (
                                                    <div className={styles.horasControl}>
                                                        <Text style={{ fontSize: '13px', color: '#666', display: 'flex', justifyContent: 'space-between' }}>
                                                            <span>Horas trabajadas: <strong>{horas}h</strong></span>
                                                            <span style={{ color: '#004b3e', fontWeight: 'bold' }}>{porcentaje}% de jornada</span>
                                                        </Text>
                                                        
                                                        <Slider
                                                            min={0}
                                                            max={8}
                                                            step={0.5}
                                                            showValue={false}
                                                            value={horas}
                                                            onChange={(val) => setHorasPorPersonal(prev => ({ ...prev, [persona.Id]: val }))}
                                                            styles={{ root: { margin: '8px 0 0 0' } }}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* SECCIÓN NUEVA: INFORMACIÓN DE LA OBRA */}
                            <div className={styles.infoObraSection}>
                                <Separator style={{ margin: '25px 0 15px 0' }}>
                                    <Text variant="large" style={{ color: '#004b3e', fontWeight: '600' }}>Información de la Obra 🏗️</Text>
                                </Separator>

                                <Text block style={{ marginBottom: 10, fontWeight: '600' }}>Ubicación y Mapa</Text>
                                <div className={styles.mapContainer} onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=$${encodeURIComponent(obraSeleccionada?.Title || "")}`, '_blank')}>
                                    <div className={styles.mapPlaceholder}>
                                        <Icon iconName="MapPin" style={{ fontSize: 32, color: '#004b3e' }} />
                                        <Text block variant="small">Toca para abrir en Google Maps</Text>
                                        <Text variant="tiny" style={{ color: '#666' }}>{obraSeleccionada?.Title}</Text>
                                    </div>
                                </div>

                                <Text block style={{ marginTop: 20, marginBottom: 10, fontWeight: '600' }}>Planos y Documentación</Text>
                                <div className={styles.docList}>
                                    <ActionButton iconProps={{ iconName: 'PDF' }} className={styles.docItem}>Plano_Instalacion_General.pdf</ActionButton>
                                    <ActionButton iconProps={{ iconName: 'PDF' }} className={styles.docItem}>Esquema_Electrico_V1.pdf</ActionButton>
                                    <ActionButton iconProps={{ iconName: 'DocumentSearch' }} className={styles.docItem}>Normas_Seguridad_EWS.pdf</ActionButton>
                                </div>
                            </div>
                        </div>

                        <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 24 }}>
                            <DefaultButton text="Atrás" onClick={() => setPaso(1)} styles={ewsDefaultButtonStyles} style={{ flex: 1 }} />
                            <PrimaryButton 
                                text="Continuar a Cámara" 
                                onClick={() => setPaso(3)} 
                                styles={ewsPrimaryButtonStyles} 
                                style={{ flex: 2 }} 
                            />
                        </Stack>
                    </section>
                )}

                {/* PASO 3: Captura de Fotos */}
                {paso === 3 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge" className={styles.stepTitle}>Subir Fotografía 📸</Text>
                        <Text style={{ display: 'block', marginBottom: '16px', color: '#666' }}>
                            Obra: <strong>{obraSeleccionada?.Title}</strong>
                            {personalSeleccionado.length > 0 && <span style={{display: 'block', fontSize: '12px', marginTop: 4}}>Personal marcado: {personalSeleccionado.length}</span>}
                        </Text>
                        
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            style={{ display: 'none' }}
                            ref={fileInputRef}
                            onChange={handleFileChange}
                        />

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
                            <DefaultButton text="Atrás" onClick={() => setPaso(2)} styles={ewsDefaultButtonStyles} style={{ flex: 1 }} />
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