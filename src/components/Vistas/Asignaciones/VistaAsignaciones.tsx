import * as React from "react";
import {
    Stack,
    Text,
    Persona,
    PersonaSize,
    Dropdown,
    PrimaryButton,
    IconButton,
    Spinner,
    MessageBar,
    MessageBarType,
    DatePicker,
    Separator,
    Icon
} from "@fluentui/react";
import { AsignacionesService } from "../../../service/AsignacionesService";
import { ProjectService } from "../../../service/ProjectService";
import { PersonalService } from "../../../service/PersonalService";
import { IObra } from "../../../models/IObra";
import { IPersonal } from "../../../models/IPersonal";
import { IAsignacion } from "../../../models/IAsignacion";
import { SPFI } from "@pnp/sp";
import styles from "./VistaAsignaciones.module.scss";

interface IVistaAsignacionesProps {
    sp: SPFI;
}

export const VistaAsignaciones: React.FC<IVistaAsignacionesProps> = (props) => {
    const [data, setData] = React.useState<{
        obras: IObra[];
        personal: IPersonal[];
        asignaciones: IAsignacion[];
    }>({ obras: [], personal: [], asignaciones: [] });

    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);
    const [seleccion, setSeleccion] = React.useState({
        obraId: 0,
        personalId: 0,
        fechaFin: new Date(),
    });

    const services = React.useMemo(() => ({
        asignaciones: new AsignacionesService(props.sp),
        proyectos: new ProjectService(props.sp),
        personalService: new PersonalService(props.sp)
    }), [props.sp]);

    const cargarPanel = async () => {
        try {
            setLoading(true);
            const [obrasRes, personalRes, asignacionesRes] = await Promise.all([
                services.proyectos.getObras(),
                services.personalService.getPersonal(),
                services.asignaciones.getAsignaciones()
            ]);
            
            setData({ 
                obras: obrasRes || [], 
                personal: personalRes || [], 
                asignaciones: asignacionesRes || [] 
            });
            setLoading(false);
        } catch (err) {
            console.error(err);
            setError("Error al cargar los datos de SharePoint");
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (props.sp) {
            cargarPanel();
        }
    }, [props.sp]);

    const handleAsignar = async () => {
        if (seleccion.obraId === 0 || seleccion.personalId === 0) {
            setError("Por favor, selecciona una obra y un operario.");
            return;
        }
        try {
            await services.asignaciones.crearAsignacion({
                ObraId: seleccion.obraId,
                PersonalId: seleccion.personalId,
                FechaFinPrevista: seleccion.fechaFin.toISOString(),
                EstadoProgreso: 0
            });
            cargarPanel();
            setSeleccion({ obraId: 0, personalId: 0, fechaFin: new Date() });
            setError(null);
        } catch (err) {
            console.error(err);
            setError("No se pudo crear la asignación en SharePoint");
        }
    };

    const handleEliminar = async (id: number) => {
        try {
            await services.asignaciones.eliminarAsignacion(id);
            cargarPanel();
        } catch (err) {
            setError("Error al eliminar la asignación");
        }
    };

    const getNombreObra = (id: number) => {
        const obra = data.obras.find(o => o.Id === id);
        if (!obra) return `Obra ${id}`;
        return typeof obra.Title === 'string' ? obra.Title : 'Obra sin título';
    };

    const getNombrePersonal = (id: number) => {
        const persona = data.personal.find(p => p.Id === id);
        if (!persona) return `Personal ${id}`;
        return persona.NombreyApellido || (persona as any).Title || 'Sin Nombre';
    };

    const asignacionesAgrupadas = React.useMemo(() => {
        const agrupador: { [key: number]: IAsignacion[] } = {};
        
        // 1. Registramos todas las obras con un array vacío para que siempre se muestre la tarjeta
        data.obras.forEach(obra => {
            if (obra.Id) {
                agrupador[obra.Id] = [];
            }
        });

        // 2. Llenamos esos arrays con las asignaciones reales
        data.asignaciones.forEach(asig => {
            if (!agrupador[asig.ObraId]) {
                agrupador[asig.ObraId] = [];
            }
            agrupador[asig.ObraId].push(asig);
        });

        return agrupador;
    }, [data.asignaciones, data.obras]);

    if (loading) return (
        <div className={styles.loader}>
            <Spinner label="Sincronizando datos con EWS Energy..." />
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.headerArea}>
                <Text className={styles.headerTitle}>Gestión de Asignaciones</Text>
            </div>

            {error && (
                <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)} className={styles.fieldWrapper}>
                    {error}
                </MessageBar>
            )}
            
            <div className={styles.formContainer}>
                <Stack tokens={{ childrenGap: 20 }}>
                    <Stack horizontal tokens={{ childrenGap: 15 }} wrap>
                        <Dropdown
                            label="Seleccionar Obra"
                            placeholder="Elige una obra"
                            className={styles.dropdownLarge}
                            options={data.obras.map(o => ({ 
                                key: o.Id, 
                                text: typeof o.Title === 'string' ? o.Title : 'Obra sin título' 
                            }))}
                            onChange={(_, item) => setSeleccion(prev => ({ ...prev, obraId: item ? Number(item.key) : 0 }))}
                            selectedKey={seleccion.obraId === 0 ? undefined : seleccion.obraId}
                        />
                        <Dropdown
                            label="Seleccionar Personal"
                            placeholder="Elige el personal"
                            className={styles.dropdownLarge}
                            options={data.personal.map(p => ({ 
                                key: p.Id, 
                                text: p.NombreyApellido || (p as any).Title || 'Sin Nombre' 
                            }))}
                            onChange={(_, item) => setSeleccion(prev => ({ ...prev, personalId: item ? Number(item.key) : 0 }))}
                            selectedKey={seleccion.personalId === 0 ? undefined : seleccion.personalId}
                        />
                    </Stack>
                    
                    <Stack horizontal verticalAlign="end" tokens={{ childrenGap: 15 }} wrap>
                        <DatePicker
                            label="Fecha de finalización"
                            className={styles.datePicker}
                            value={seleccion.fechaFin}
                            onSelectDate={(date) => setSeleccion({ ...seleccion, fechaFin: date || new Date() })}
                        />
                        <PrimaryButton 
                            text="Asignar Personal" 
                            onClick={handleAsignar} 
                            className={styles.btnAsignar}
                            iconProps={{ iconName: 'Add' }}
                        />
                    </Stack>
                </Stack>
            </div>

            <Separator styles={{ root: { marginBottom: '30px' } }} />

            {data.obras.length === 0 ? (
                <Text className={styles.emptyText}>No hay proyectos registrados en el sistema.</Text>
            ) : (
                <div className={styles.grid}>
                    {Object.keys(asignacionesAgrupadas).map((obraIdStr) => {
                        const obraId = Number(obraIdStr);
                        const listaAsig = asignacionesAgrupadas[obraId];
                        return (
                            <div key={obraId} className={styles.obraCardGroup}>
                                <div className={styles.cardHeader}>
                                    <Icon iconName="ConstructionCone" className={styles.headerIcon} />
                                    <Text className={styles.obraTitleAgrupada}>{getNombreObra(obraId)}</Text>
                                </div>
                                
                                <div className={styles.personalContainer}>
                                    
                                    {listaAsig.length === 0 ? (
                                        <Text style={{ display: 'block', color: '#888', fontStyle: 'italic', padding: '10px 0', fontSize: '13px' }}>
                                            Sin personal asignado actualmente.
                                        </Text>
                                    ) : (
                                        listaAsig.map(asig => (
                                            <div key={asig.Id} className={styles.personaRow}>
                                                <Persona
                                                    text={getNombrePersonal(asig.PersonalId)}
                                                    secondaryText={asig.FechaFinPrevista ? `Hasta: ${new Date(asig.FechaFinPrevista).toLocaleDateString()}` : "Fecha no especificada"}
                                                    size={PersonaSize.size32}
                                                />
                                                <IconButton
                                                    iconProps={{ iconName: "Cancel" }}
                                                    onClick={() => handleEliminar(asig.Id!)}
                                                    className={styles.deleteMiniBtn}
                                                    title="Eliminar asignación"
                                                />
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};