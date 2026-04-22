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
} from "@fluentui/react";
import { AsignacionesService } from "../../../service/AsignacionesService";
import { IObra } from "../../../models/IObra";
import { IPersonal } from "../../../models/IPersonal";
import { IAsignacion } from "../../../models/IAsignacion";
import { SPFI } from "@pnp/sp";
import styles from "./VistaAsignaciones.module.scss";

// Definimos que ahora recibe 'sp' en lugar de 'context'
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

    // Instancia del servicio usando el objeto 'sp' inyectado
    const service = React.useMemo(() => new AsignacionesService(props.sp), [props.sp]);

    const cargarPanel = async () => {
        try {
            setLoading(true);
            const res = await service.getAsignaciones(); 
            setData(prev => ({ ...prev, asignaciones: res }));
            setLoading(false);
        } catch (err) {
            setError("Error al cargar las asignaciones");
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (props.sp) {
            cargarPanel();
        }
    }, [props.sp]);

    const handleAsignar = async () => {
        if (seleccion.obraId === 0 || seleccion.personalId === 0) return;
        try {
            await service.crearAsignacion({
                ObraId: seleccion.obraId,
                PersonalId: seleccion.personalId,
                FechaFin: seleccion.fechaFin.toISOString(),
            });
            cargarPanel();
        } catch (err) {
            setError("No se pudo crear la asignación");
        }
    };

    const handleEliminar = async (id: number) => {
        try {
            await service.eliminarAsignacion(id);
            cargarPanel();
        } catch (err) {
            setError("Error al eliminar la asignación");
        }
    };

    if (loading) return <Spinner label="Cargando asignaciones..." />;

    return (
        <div className={styles.vistaAsignaciones}>
            {error && (
                <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
                    {error}
                </MessageBar>
            )}
            
            <Text variant="large" className={styles.title}>Gestión de Asignaciones</Text>
            
            <Stack tokens={{ childrenGap: 15 }} className={styles.formContainer}>
                <DatePicker
                    label="Fecha de finalización"
                    value={seleccion.fechaFin}
                    onSelectDate={(date) => setSeleccion({ ...seleccion, fechaFin: date || new Date() })}
                />
                <PrimaryButton text="Asignar Personal" onClick={handleAsignar} />
            </Stack>

            <Separator />

            <div className={styles.listaAsignaciones}>
                {data.asignaciones.map((asig) => (
                    <Stack key={asig.Id} horizontal horizontalAlign="space-between" verticalAlign="center" className={styles.asignacionItem}>
                        <Text>Obra ID: {asig.ObraId} - Personal ID: {asig.PersonalId}</Text>
                        <IconButton
                            iconProps={{ iconName: "Cancel" }}
                            title="Eliminar asignación"
                            onClick={() => handleEliminar(asig.Id!)}
                        />
                    </Stack>
                ))}
            </div>
        </div>
    );
};