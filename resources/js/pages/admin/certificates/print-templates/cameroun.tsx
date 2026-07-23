import { DEFAULT_FIELD_POSITIONS } from './default-positions';
import type { FieldPosition } from './overlay-types';
import StubOverlay from './stub-overlay';
import type { CertificateForPrint } from './types';

// ⚠️ Reprend les coordonnées par défaut (voir default-positions.ts) —
// à ajuster ici une fois la souche physique NSIA Cameroun calibrée
// (mode ?calibrate=1). Ce fichier peut diverger librement du défaut.
export const CAMEROUN_POSITIONS: FieldPosition[] = DEFAULT_FIELD_POSITIONS;

interface Props {
    certificate: CertificateForPrint;
    calibrate?: boolean;
}

export default function TemplateCameroun({ certificate, calibrate }: Props) {
    return <StubOverlay certificate={certificate} positions={CAMEROUN_POSITIONS} calibrate={calibrate}/>;
}
