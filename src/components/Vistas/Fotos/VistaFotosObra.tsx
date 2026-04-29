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
    // ESTADOS DE FLUJO
    const [paso, setPaso] = React.useState(1);
    const [loading, setLoading] = React.useState(true);
    const [subiendo, setSubiendo] = React.useState(false);

    // ESTADOS DE DATOS
    const [currentUser, setCurrentUser] = React.useState<{ nombre: string, email: string, id: number } | null>(null);
    const [obraSeleccionada, setObraSeleccionada] = React.useState<IObra | null>(null);
    const [personalObra, setPersonalObra] = React.useState<IPersonal[]>([]);
    const [personalSeleccionado, setPersonalSeleccionado] = React.useState<number[]>([]);
    const [horasPorPersonal, setHorasPorPersonal] = React.useState<Record<number, number>>({});
    
    // REFERENCIAS Y ESTADOS DE CÁMARA
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const fileInputPreviasRef = React.useRef<HTMLInputElement>(null); // Referencia para fotos previas
    const [fotos, setFotos] = React.useState<any[]>([]);
    const [fotosPrevias, setFotosPrevias] = React.useState<any[]>([]); // Cambiado a array de objetos para consistencia
    const [comentarios, setComentarios] = React.useState("");
    const [mensajeExito, setMensajeExito] = React.useState(false);
    const [procesandoCaptura, setProcesandoCaptura] = React.useState(false);
    const [procesandoPrevias, setProcesandoPrevias] = React.useState(false);

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
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        cargarDatos();
    }, [props.sp]);

    // MANEJADORES DE FLUJO
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
        setFotosPrevias([]); // Resetear capturas previas al cambiar de obra
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

    // Manejador para fotos del paso 3 (Previas)
    const handleFileChangePrevias = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        setProcesandoPrevias(true);
        try {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFotosPrevias(prev => [...prev, { File: file, Url: reader.result as string }]);
                setProcesandoPrevias(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            setProcesandoPrevias(false);
        }
    };

    // Manejador para fotos del paso 5 (Finales)
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
        if (!obraSeleccionada || !currentUser || (fotos.length === 0 && fotosPrevias.length === 0)) return;
        setSubiendo(true);
        try {
            const resumenHoras = personalSeleccionado.map(id => {
                const persona = personalObra.find(p => p.Id === id);
                return `${persona?.NombreyApellido || 'Desconocido'}: ${horasPorPersonal[id]}h`;
            }).join(", ");

            const comentariosFinales = personalSeleccionado.length > 0
                ? `${comentarios}\n\n[Horas registradas: ${resumenHoras}]`
                : comentarios;

            // Unimos todas las fotos (previas y finales) para subirlas al reporte
            const todasLasFotos = [...fotosPrevias, ...fotos];

            for (const fotoObj of todasLasFotos) {
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
            setTimeout(() => {
                setMensajeExito(false);
                setFotos([]);
                setFotosPrevias([]);
                setComentarios("");
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

                {/* PASO 1: SELECCIÓN DE OBRA */}
                {paso === 1 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge" className={styles.stepTitle}>Selecciona la Obra 🏗️</Text>
                        <Text style={{ color: '#666', fontSize: '14px', marginBottom: '10px', display: 'block' }}>
                            Hola, <strong>{currentUser?.nombre?.split(' ')[0] || 'Operario'}</strong>.
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
                                        <Text className={styles.obraSubtitle}>{renderCliente(o.Cliente)}</Text>
                                    </div>
                                    {obraSeleccionada?.Id === o.Id && <Icon iconName="CheckMark" className={styles.checkIcon} />}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* PASO 2: INFORMACIÓN DE LA OBRA */}
                {paso === 2 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge" className={styles.stepTitle}>Datos de la Obra 🏗️</Text>
                        <Text variant="large" style={{ display: 'block', marginBottom: 12, color: '#004b3e', fontWeight: '600' }}>
                            {obraSeleccionada?.Title}
                        </Text>

                        <div className={styles.infoObraSection}>
                            <Text block style={{ marginBottom: 10, fontWeight: '600' }}>Ubicación y Mapa</Text>
                            <div className={styles.mapContainer} onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(obraSeleccionada?.Title || "")}`, '_blank')}>
                                <div className={styles.mapPlaceholder}>
                                    <Icon iconName="MapPin" style={{ fontSize: 32, color: '#004b3e' }} />
                                    <Text block variant="small">Toca para abrir Google Maps</Text>
                                </div>
                            </div>

                            <Text block style={{ marginTop: 20, marginBottom: 10, fontWeight: '600' }}>Planos y Documentación</Text>
                            <div className={styles.docList}>
                                <ActionButton iconProps={{ iconName: 'PDF' }} className={styles.docItem}>Plano_Instalacion_General.pdf</ActionButton>
                                <ActionButton iconProps={{ iconName: 'PDF' }} className={styles.docItem}>Esquema_Electrico_V1.pdf</ActionButton>
                                <ActionButton iconProps={{ iconName: 'DocumentSearch' }} className={styles.docItem}>Normas_Seguridad_EWS.pdf</ActionButton>
                            </div>
                        </div>

                        <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 24 }}>
                            <DefaultButton text="Atrás" onClick={() => setPaso(1)} styles={ewsDefaultButtonStyles} style={{ flex: 1 }} />
                            <PrimaryButton text="Tomar Fotos Previas" onClick={() => setPaso(3)} styles={ewsPrimaryButtonStyles} style={{ flex: 2 }} />
                        </Stack>
                    </section>
                )}

                {/* PASO 3: TOMAR FOTOS PREVIAS (MODIFICADO) */}
                {paso === 3 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge" className={styles.stepTitle}>Estado Previo 📸</Text>
                        <Text block style={{ marginBottom: 16, color: '#666' }}>Captura el estado actual antes de comenzar:</Text>
                        
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} ref={fileInputPreviasRef} onChange={handleFileChangePrevias} />

                        <div className={styles.uploadZone} onClick={() => fileInputPreviasRef.current?.click()}>
                            {procesandoPrevias ? <Spinner /> : (
                                <>
                                    <Icon iconName="Camera" className={styles.uploadIcon} />
                                    <p className={styles.uploadTitle}>Toca para tomar foto previa</p>
                                </>
                            )}
                        </div>

                        <div className={styles.previewContainer}>
                            {fotosPrevias.map((f, i) => (
                                <div key={i} className={styles.previewItem}>
                                    <img src={f.Url} alt="previo" className={styles.previewImage} />
                                    <IconButton iconProps={{ iconName: "Cancel" }} className={styles.deleteButton} onClick={() => setFotosPrevias(prev => prev.filter((_, idx) => idx !== i))} />
                                </div>
                            ))}
                        </div>

                        <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 24 }}>
                            <DefaultButton text="Atrás" onClick={() => setPaso(2)} styles={ewsDefaultButtonStyles} style={{ flex: 1 }} />
                            <PrimaryButton text="Gestionar Personal" onClick={() => setPaso(4)} styles={ewsPrimaryButtonStyles} style={{ flex: 2 }} />
                        </Stack>
                    </section>
                )}

                {/* PASO 4: SELECCIÓN DE PERSONAL */}
                {paso === 4 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge" className={styles.stepTitle}>Personal Presente 👷🏽</Text>
                        
                        <div className={styles.personalList}>
                            {personalObra.length === 0 ? (
                                <MessageBar messageBarType={MessageBarType.info}>No hay más personal sugerido. Puedes continuar.</MessageBar>
                            ) : (
                                personalObra.map(persona => {
                                    const isSelected = personalSeleccionado.includes(persona.Id);
                                    const horas = horasPorPersonal[persona.Id] || 0;
                                    return (
                                        <div key={persona.Id} className={styles.personalItemContainer} style={{ marginBottom: 15, padding: 10, border: '1px solid #eee', borderRadius: 8 }}>
                                            <Checkbox
                                                label={persona.NombreyApellido || "Operario"}
                                                checked={isSelected}
                                                onChange={(_, isChecked) => handleTogglePersonal(persona.Id, !!isChecked)}
                                            />
                                            {isSelected && (
                                                <div style={{ marginTop: 10 }}>
                                                    <Text variant="small">Horas: <strong>{horas}h</strong></Text>
                                                    <Slider min={0} max={8} step={0.5} value={horas} onChange={(v) => setHorasPorPersonal(prev => ({ ...prev, [persona.Id]: v }))} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 24 }}>
                            <DefaultButton text="Atrás" onClick={() => setPaso(3)} styles={ewsDefaultButtonStyles} style={{ flex: 1 }} />
                            <PrimaryButton text="Continuar a Cámara Final" onClick={() => setPaso(5)} styles={ewsPrimaryButtonStyles} style={{ flex: 2 }} />
                        </Stack>
                    </section>
                )}

                {/* PASO 5: CÁMARA Y COMENTARIOS FINAL */}
                {paso === 5 && (
                    <section className={styles.stepSection}>
                        <Text variant="xLarge" className={styles.stepTitle}>Fotos del Final 📸</Text>
                        
                        <input type="file" accept="image/*" capture="environment" style={{ display: 'none' }} ref={fileInputRef} onChange={handleFileChange} />

                        <div className={styles.uploadZone} onClick={() => fileInputRef.current?.click()}>
                            {procesandoCaptura ? <Spinner /> : (
                                <>
                                    <Icon iconName="Camera" className={styles.uploadIcon} />
                                    <p className={styles.uploadTitle}>Toca para tomar foto final</p>
                                </>
                            )}
                        </div>

                        <div className={styles.previewContainer}>
                            {fotos.map((f, i) => (
                                <div key={i} className={styles.previewItem}>
                                    <img src={f.Url} className={styles.previewImage} />
                                    <IconButton iconProps={{ iconName: "Cancel" }} className={styles.deleteButton} onClick={() => setFotos(prev => prev.filter((_, idx) => idx !== i))} />
                                </div>
                            ))}
                        </div>

                        <TextField label="Comentarios finales" multiline rows={3} value={comentarios} onChange={(_, v) => setComentarios(v || "")} />

                        {mensajeExito && <MessageBar messageBarType={MessageBarType.success}>Reporte enviado con éxito.</MessageBar>}

                        <Stack horizontal tokens={{ childrenGap: 12 }} style={{ marginTop: 24 }}>
                            <DefaultButton text="Atrás" onClick={() => setPaso(4)} styles={ewsDefaultButtonStyles} style={{ flex: 1 }} />
                            <PrimaryButton
                                text={subiendo ? "Enviando..." : "Finalizar Reporte"}
                                onClick={enviarReporte}
                                disabled={(fotos.length === 0 && fotosPrevias.length === 0) || subiendo}
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