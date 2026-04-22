import * as React from 'react';
import {
    Stack,
    Text,
    SearchBox,
    Spinner,
    Icon,
    Image,
    ImageFit,
    MessageBar,
    MessageBarType
} from '@fluentui/react';
import { DailyReportService } from '../../../service/DailyReportService';
import { IReporteHistorial } from '../../../models/IReporteHistorial';
import { SPFI } from "@pnp/sp";
import styles from './VistaHistorialTarjetas.module.scss';

// Definimos que recibe 'sp' para la conexión móvil
interface IVistaHistorialTarjetasProps {
    sp: SPFI;
}

export const VistaHistorialTarjetas: React.FC<IVistaHistorialTarjetasProps> = (props) => {
    // --- ESTADOS ---
    const [reportes, setReportes] = React.useState<IReporteHistorial[]>([]);
    const [filtrados, setFiltrados] = React.useState<IReporteHistorial[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    // --- SERVICIO ---
    // Instancia del servicio usando el objeto 'sp' inyectado
    const service = React.useMemo(() => new DailyReportService(props.sp), [props.sp]);

    // --- CARGA DE DATOS ---
    const cargarDatos = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await service.getHistorialGlobal();
            setReportes(data);
            setFiltrados(data);
        } catch (e) {
            setError("Error al cargar el historial de evidencias. Por favor, intente de nuevo.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (props.sp) {
            cargarDatos();
        }
    }, [props.sp]);

    // --- FILTRADO ---
    const onSearch = (newValue: string) => {
        if (!newValue) {
            setFiltrados(reportes);
            return;
        }
        const lowerCaseValue = newValue.toLowerCase();
        const filtered = reportes.filter(item =>
            (item.Title && item.Title.toLowerCase().includes(lowerCaseValue)) ||
            (item.Comentarios && item.Comentarios.toLowerCase().includes(lowerCaseValue)) ||
            (item.ObraId && item.ObraId.toString().includes(lowerCaseValue))
        );
        setFiltrados(filtered);
    };

    return (
        <div className={styles.vistaHistorial}>
            <Stack tokens={{ childrenGap: 20 }}>
                <div className={styles.headerSection}>
                    <Text variant="xLarge" className={styles.title}>Evidencias de Obra</Text>
                    <SearchBox
                        placeholder="Buscar por obra o comentario..."
                        onSearch={onSearch}
                        onChange={(_, newValue) => onSearch(newValue || "")}
                        className={styles.searchBar}
                    />
                </div>

                {error && (
                    <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setError(null)}>
                        {error}
                    </MessageBar>
                )}

                {loading ? (
                    <Spinner label="Cargando historial..." />
                ) : (
                    <div className={styles.gridContainer}>
                        {filtrados.length > 0 ? (
                            filtrados.map((item) => (
                                <div key={item.Id} className={styles.reporteCard}>
                                    <div className={styles.cardHeader}>
                                        <Text variant="mediumPlus" className={styles.obraTitle}>
                                            Obra ID: {item.ObraId}
                                        </Text>
                                        <Text variant="small" className={styles.fecha}>
                                            {item.FechaRegistro ? new Date(item.FechaRegistro).toLocaleDateString() : ''}
                                        </Text>
                                    </div>

                                    <div className={styles.imageWrapper}>
                                        <Image
                                            
                                            src={item.UrlFoto?.Url || ''}
                                            alt="Foto reporte"
                                            height={200}
                                            imageFit={ImageFit.cover}
                                            className={styles.reporteImagen}
                                        />
                                    </div>

                                    <div className={styles.cardContent}>
                                        <div className={styles.comentarioBox}>
                                            <Text className={styles.comentarios}>
                                                {item.Comentarios ? `"${item.Comentarios}"` : "Sin observaciones técnicas"}
                                            </Text>
                                        </div>
                                        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }} className={styles.footerOperario}>
                                            <Icon iconName="Contact" className={styles.iconOperario} />
                                            <Text variant="small">ID Operario: <b>{item.OperarioId}</b></Text>
                                        </Stack>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !error && <Text variant="large" styles={{ root: { textAlign: 'center', marginTop: 20 } }}>No se encontraron evidencias.</Text>
                        )}
                    </div>
                )}
            </Stack>
        </div>
    );
};