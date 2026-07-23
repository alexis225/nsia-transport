import { DEFAULT_FIELD_POSITIONS } from './default-positions';
import type { FieldPosition } from './overlay-types';
import StubOverlay from './stub-overlay';
import type { CertificateForPrint } from './types';

// ⚠️ Reprend les coordonnées par défaut (voir default-positions.ts) —
// à ajuster ici une fois la souche physique NSIA Congo calibrée
// (mode ?calibrate=1). Ce fichier peut diverger librement du défaut.
export const CONGO_POSITIONS: FieldPosition[] = DEFAULT_FIELD_POSITIONS;

interface Props {
    certificate: CertificateForPrint;
    calibrate?: boolean;
}

export default function TemplateCongo({ certificate, calibrate }: Props) {
    return <StubOverlay certificate={certificate} positions={CONGO_POSITIONS} calibrate={calibrate}/>;
}
