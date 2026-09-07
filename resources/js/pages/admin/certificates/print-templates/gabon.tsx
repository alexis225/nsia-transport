import { DEFAULT_FIELD_POSITIONS } from './default-positions';
import type { FieldPosition } from './overlay-types';
import StubOverlay from './stub-overlay';
import type { CertificateForPrint } from './types';

// ⚠️ Reprend les coordonnées par défaut (voir default-positions.ts) —
// à ajuster ici une fois la souche physique NSIA Gabon calibrée
// (mode ?calibrate=1). Ce fichier peut diverger librement du défaut.
export const GABON_POSITIONS: FieldPosition[] = DEFAULT_FIELD_POSITIONS;

interface Props {
    certificate: CertificateForPrint;
    calibrate?: boolean;
    positionsOverride?: FieldPosition[] | null;
}

export default function TemplateGabon({
    certificate,
    calibrate,
    positionsOverride,
}: Props) {
    return (
        <StubOverlay
            certificate={certificate}
            positions={positionsOverride ?? GABON_POSITIONS}
            calibrate={calibrate}
        />
    );
}
