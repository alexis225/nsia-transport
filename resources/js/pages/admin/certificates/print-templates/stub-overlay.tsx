import { buildFieldValues } from './build-field-values';
import type { FieldPosition } from './overlay-types';
import type { CertificateForPrint } from './types';

interface Props {
    certificate: CertificateForPrint;
    positions: FieldPosition[];
    calibrate?: boolean;
}

// Rendu commun à tous les modèles de souche pays : chaque champ est
// positionné en absolu (mm) par-dessus la page, sans bordure ni fond —
// pensé pour être imprimé sur un papier déjà pré-imprimé par NSIA.
export default function StubOverlay({ certificate, positions, calibrate = false }: Props) {
    const values = buildFieldValues(certificate);

    return (
        <div className="stub-page">
            {calibrate && <CalibrationGrid/>}
            {positions.map(pos => {
                const text = values[pos.key] ?? '';

                if (!text && !calibrate) {
                    return null;
                }

                return (
                    <div key={pos.key}
                         className={calibrate ? 'stub-field stub-field--calibrate' : 'stub-field'}
                         style={{
                             top: `${pos.top}mm`,
                             left: `${pos.left}mm`,
                             width: pos.width ? `${pos.width}mm` : undefined,
                             fontSize: `${pos.fontSize ?? 9}pt`,
                             textAlign: pos.align ?? 'left',
                             fontWeight: pos.bold ? 700 : 400,
                         }}>
                        {calibrate && <span className="stub-field-key">{pos.key}</span>}
                        {text || (calibrate ? '—' : '')}
                    </div>
                );
            })}
        </div>
    );
}

// Grille de repère (tous les 10mm) affichée uniquement en mode
// calibration (?calibrate=1) pour mesurer les écarts contre la souche
// physique réelle tenue derrière la feuille imprimée.
function CalibrationGrid() {
    const width = 210;
    const height = 297;
    const verticals: number[] = [];
    const horizontals: number[] = [];

    for (let x = 0; x <= width; x += 10) {
        verticals.push(x);
    }

    for (let y = 0; y <= height; y += 10) {
        horizontals.push(y);
    }

    return (
        <div className="calibration-grid">
            {verticals.map(x => (
                <div key={`v${x}`} className="grid-line grid-line--v" style={{ left: `${x}mm` }}>
                    <span>{x}</span>
                </div>
            ))}
            {horizontals.map(y => (
                <div key={`h${y}`} className="grid-line grid-line--h" style={{ top: `${y}mm` }}>
                    <span>{y}</span>
                </div>
            ))}
        </div>
    );
}
