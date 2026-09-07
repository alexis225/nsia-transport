import { Head } from '@inertiajs/react';
import {
    CheckCircle,
    XCircle,
    AlertCircle,
    Repeat,
    Ship,
    Plane,
    Truck,
    Building2,
} from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

interface CertificatePublic {
    certificate_number: string;
    policy_number: string;
    insured_name: string;
    voyage_date: string;
    voyage_from: string;
    voyage_to: string;
    transport_type: string | null;
    status: string;
    issued_at: string | null;
    currency_code: string;
    tenant: { name: string; code: string } | null;
    issuer: string | null;
    template_company: string | null;
    template_logo: string | null;
    verification_count: number;
    replaced_by: string | null;
}

interface Props {
    status: 'valid' | 'invalid' | 'cancelled' | 'replaced' | 'not_found';
    certificate: CertificatePublic | null;
    verifiedAt: string;
}

const TRANSPORT_ICONS: Record<string, any> = {
    SEA: Ship,
    AIR: Plane,
    ROAD: Truck,
    RAIL: Truck,
};

export default function CertificateVerify({
    status,
    certificate,
    verifiedAt,
}: Props) {
    const { t } = useTranslation('public');
    const isValid = status === 'valid';
    const isCancelled = status === 'cancelled';
    const isReplaced = status === 'replaced';
    const notFound = status === 'not_found';

    const TransIcon = certificate?.transport_type
        ? (TRANSPORT_ICONS[certificate.transport_type] ?? Ship)
        : Ship;

    return (
        <>
            <Head title={t('verify.headTitle')} />
            <style>{`
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; background: #f1f5f9; min-height: 100vh; color: #1a1a2e; }

                .page { min-height: 100vh; display: flex; flex-direction: column; align-items: center; padding: 24px 16px; }

                /* Header NSIA */
                .nsia-header { width: 100%; max-width: 540px; display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
                .nsia-logo { width: 40px; height: 40px; background: #1e3a8a; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .nsia-name { font-size: 15px; font-weight: 700; color: #1e3a8a; letter-spacing: .04em; }
                .nsia-sub  { font-size: 11px; color: #64748b; }

                /* Status card */
                .status-card { width: 100%; max-width: 540px; border-radius: 16px; overflow: hidden; margin-bottom: 16px; }
                .status-valid     { background: linear-gradient(135deg, #15803d, #16a34a); }
                .status-cancelled { background: linear-gradient(135deg, #dc2626, #ef4444); }
                .status-replaced  { background: linear-gradient(135deg, #475569, #64748b); }
                .status-invalid   { background: linear-gradient(135deg, #d97706, #f59e0b); }
                .status-notfound  { background: linear-gradient(135deg, #475569, #64748b); }

                .status-inner { padding: 24px; display: flex; align-items: center; gap: 16px; }
                .status-ico { width: 52px; height: 52px; background: rgba(255,255,255,0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .status-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 3px; }
                .status-sub { font-size: 12px; color: rgba(255,255,255,0.75); }

                /* Info card */
                .info-card { width: 100%; max-width: 540px; background: #fff; border-radius: 14px; border: 1.5px solid #e2e8f0; overflow: hidden; margin-bottom: 12px; }
                .info-card-hdr { padding: 14px 18px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 8px; }
                .info-card-ico { width: 30px; height: 30px; border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
                .info-card-ttl { font-size: 13px; font-weight: 600; color: #1e293b; }
                .info-card-body { padding: 16px 18px; }
                .info-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid #f8fafc; }
                .info-row:last-child { border-bottom: none; }
                .info-label { font-size: 12px; color: #64748b; }
                .info-value { font-size: 12px; font-weight: 500; color: #1e293b; text-align: right; max-width: 240px; }

                /* Cert number badge */
                .cert-num { font-family: monospace; font-size: 20px; font-weight: 700; color: #1e3a8a; text-align: center; padding: 16px; background: #eff6ff; border-radius: 10px; margin-bottom: 12px; letter-spacing: .1em; }

                /* Issuer info */
                .issuer-row { display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; }
                .issuer-text { font-size: 12px; color: #15803d; }

                /* Footer */
                .verify-footer { margin-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
                .verify-count { font-size: 11px; color: #94a3b8; text-align: center; margin-top: 6px; }
            `}</style>

            <div className="page">
                {/* Header */}
                <div className="nsia-header">
                    <div className="nsia-logo">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                        >
                            <path
                                d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinejoin="round"
                            />
                            <path
                                d="M9 12L11 14L15 10"
                                stroke="white"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </div>
                    <div>
                        <div className="nsia-name">NSIA TRANSPORT</div>
                        <div className="nsia-sub">{t('verify.brandSub')}</div>
                    </div>
                </div>

                {/* Status */}
                <div className="status-card">
                    <div
                        className={`status-inner ${
                            notFound
                                ? 'status-notfound'
                                : isCancelled
                                  ? 'status-cancelled'
                                  : isReplaced
                                    ? 'status-replaced'
                                    : isValid
                                      ? 'status-valid'
                                      : 'status-invalid'
                        }`}
                    >
                        <div className="status-ico">
                            {isValid && <CheckCircle size={26} color="#fff" />}
                            {isCancelled && <XCircle size={26} color="#fff" />}
                            {isReplaced && <Repeat size={26} color="#fff" />}
                            {!isValid && !isCancelled && !isReplaced && (
                                <AlertCircle size={26} color="#fff" />
                            )}
                        </div>
                        <div>
                            <div className="status-title">
                                {isValid && t('verify.status.valid')}
                                {isCancelled && t('verify.status.cancelled')}
                                {isReplaced && t('verify.status.replaced')}
                                {notFound && t('verify.status.notFound')}
                                {!isValid &&
                                    !isCancelled &&
                                    !isReplaced &&
                                    !notFound &&
                                    t('verify.status.invalid')}
                            </div>
                            <div className="status-sub">
                                {isValid &&
                                    t('verify.statusSub.valid', {
                                        tenant:
                                            certificate?.tenant?.name ?? 'NSIA',
                                        date: verifiedAt,
                                    })}
                                {isCancelled && t('verify.statusSub.cancelled')}
                                {isReplaced &&
                                    (certificate?.replaced_by
                                        ? t(
                                              'verify.statusSub.replacedWithNumber',
                                              {
                                                  number: certificate.replaced_by,
                                              },
                                          )
                                        : t('verify.statusSub.replaced'))}
                                {notFound && t('verify.statusSub.notFound')}
                                {!isValid &&
                                    !isCancelled &&
                                    !isReplaced &&
                                    !notFound &&
                                    t('verify.statusSub.invalid')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Détails du certificat */}
                {certificate && (
                    <>
                        {/* Numéro */}
                        <div style={{ width: '100%', maxWidth: 540 }}>
                            <div className="cert-num">
                                {certificate.certificate_number}
                            </div>
                        </div>

                        {/* Assuré + Voyage */}
                        <div className="info-card">
                            <div className="info-card-hdr">
                                <div
                                    className="info-card-ico"
                                    style={{ background: '#eff6ff' }}
                                >
                                    <TransIcon size={15} color="#3b82f6" />
                                </div>
                                <span className="info-card-ttl">
                                    {t('verify.shipment.title')}
                                </span>
                            </div>
                            <div className="info-card-body">
                                <div className="info-row">
                                    <span className="info-label">
                                        {t('verify.shipment.insured')}
                                    </span>
                                    <span
                                        className="info-value"
                                        style={{ fontWeight: 600 }}
                                    >
                                        {certificate.insured_name}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">
                                        {t('verify.shipment.policyNumber')}
                                    </span>
                                    <span
                                        className="info-value"
                                        style={{ fontFamily: 'monospace' }}
                                    >
                                        {certificate.policy_number}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">
                                        {t('verify.shipment.voyageDate')}
                                    </span>
                                    <span className="info-value">
                                        {certificate.voyage_date}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">
                                        {t('verify.shipment.from')}
                                    </span>
                                    <span className="info-value">
                                        {certificate.voyage_from}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">
                                        {t('verify.shipment.to')}
                                    </span>
                                    <span className="info-value">
                                        {certificate.voyage_to}
                                    </span>
                                </div>
                                {certificate.transport_type && (
                                    <div className="info-row">
                                        <span className="info-label">
                                            {t('verify.shipment.transport')}
                                        </span>
                                        <span className="info-value">
                                            {t(
                                                `verify.shipment.transportTypes.${certificate.transport_type}`,
                                                {
                                                    defaultValue:
                                                        certificate.transport_type,
                                                },
                                            )}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Filiale */}
                        <div className="info-card">
                            <div className="info-card-hdr">
                                <div
                                    className="info-card-ico"
                                    style={{ background: '#fdf4ff' }}
                                >
                                    <Building2 size={15} color="#7c3aed" />
                                </div>
                                <span className="info-card-ttl">
                                    {t('verify.company.title')}
                                </span>
                            </div>
                            <div className="info-card-body">
                                {certificate.template_logo && (
                                    <div
                                        style={{
                                            textAlign: 'center',
                                            marginBottom: 12,
                                        }}
                                    >
                                        <img
                                            src={certificate.template_logo}
                                            alt={t('verify.logoAlt')}
                                            style={{
                                                maxHeight: 48,
                                                maxWidth: 160,
                                                objectFit: 'contain',
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="info-row">
                                    <span className="info-label">
                                        {t('verify.company.name')}
                                    </span>
                                    <span className="info-value">
                                        {certificate.template_company ??
                                            certificate.tenant?.name}
                                    </span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">
                                        {t('verify.company.subsidiary')}
                                    </span>
                                    <span className="info-value">
                                        {certificate.tenant?.name}
                                    </span>
                                </div>
                                {certificate.issued_at && (
                                    <div className="info-row">
                                        <span className="info-label">
                                            {t('verify.company.issuedAt')}
                                        </span>
                                        <span className="info-value">
                                            {certificate.issued_at}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Émetteur */}
                        {certificate.issuer && (
                            <div style={{ width: '100%', maxWidth: 540 }}>
                                <div className="issuer-row">
                                    <CheckCircle size={14} color="#15803d" />
                                    <span className="issuer-text">
                                        <Trans
                                            t={t}
                                            i18nKey="verify.issuedBy"
                                            values={{
                                                issuer: certificate.issuer,
                                                tenant: certificate.tenant
                                                    ?.name,
                                            }}
                                            components={{ 1: <strong /> }}
                                        />
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Compteur vérifications */}
                        {certificate.verification_count > 1 && (
                            <div className="verify-count">
                                {t('verify.verifiedCount', {
                                    count: certificate.verification_count,
                                })}
                            </div>
                        )}
                    </>
                )}

                {/* Footer */}
                <div className="verify-footer">
                    {t('verify.footer')}
                    <br />
                    {t('verify.verifiedOn', { date: verifiedAt })}
                </div>
            </div>
        </>
    );
}
