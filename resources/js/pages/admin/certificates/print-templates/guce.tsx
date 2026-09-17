import { buildFieldValues } from './build-field-values';
import type { CertificateForPrint } from './types';

// ============================================================
// Modèle "GUCE" (Guichet Unique du Commerce Extérieur) — NSIA
// Côte d'Ivoire. Contrairement aux autres modèles (Togo, Gabon,
// Bénin, ...) qui superposent uniquement les champs variables sur
// une souche papier PRÉ-IMPRIMÉE, ce modèle est un document complet
// généré intégralement par l'application (cadre, logo, tampon
// ASACI, QR code) — il n'est donc pas basé sur StubOverlay et n'a
// pas d'équivalent dans le pipeline FPDF/FPDI de souche physique
// (CertificatePrePrintedService).
// ============================================================

interface Props {
    certificate: CertificateForPrint;
    calibrate?: boolean;
    positionsOverride?: unknown;
}

export default function TemplateGuce({ certificate: cert }: Props) {
    const f = buildFieldValues(cert);
    const settings = cert.tenant?.settings ?? {};
    const item = cert.expedition_items?.[0];

    const qrUrl = cert.qr_token
        ? `https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=${encodeURIComponent(
              (typeof window !== 'undefined' ? window.location.origin : '') +
                  '/verify/' +
                  cert.qr_token,
          )}`
        : null;

    return (
        <div className="guce-page">
            <style>{`
                .guce-page {
                    width: 210mm;
                    min-height: 297mm;
                    margin: 0 auto;
                    padding: 8mm;
                    color: #111;
                    font-family: Arial, Helvetica, sans-serif;
                    font-size: 8.3pt;
                }
                .guce-page * { box-sizing: border-box; }
                .guce-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    border: 1pt solid #111;
                    padding: 3mm;
                }
                .guce-header .brand { font-size: 15pt; font-weight: 800; color: #f7941e; }
                .guce-header .brand small { display: block; font-size: 7pt; font-weight: 600; color: #1e3a5f; }
                .guce-header .legal { font-size: 6pt; max-width: 95mm; line-height: 1.3; margin-top: 2mm; }
                .guce-header .ref-box { text-align: right; font-size: 7.5pt; }
                .guce-header .ref-box b { display: block; }
                .guce-title-row {
                    display: flex;
                    border: 1pt solid #111;
                    border-top: none;
                }
                .guce-title-row .title { flex: 1; padding: 2mm 3mm; }
                .guce-title-row .title h1 { font-size: 12pt; }
                .guce-title-row .title p { font-size: 7pt; font-style: italic; }
                .guce-title-row .num {
                    width: 65mm;
                    border-left: 1pt solid #111;
                    padding: 2mm 3mm;
                }
                .guce-title-row .num .n { font-size: 8.5pt; font-weight: 700; }
                .guce-title-row .num .note { font-size: 6pt; margin-top: 1mm; }

                .guce-grid { border: 1pt solid #111; border-top: none; }
                .guce-row { display: flex; border-bottom: 1pt solid #111; }
                .guce-row:last-child { border-bottom: none; }
                .guce-cell {
                    flex: 1;
                    padding: 1.8mm 3mm;
                    border-left: 1pt solid #111;
                    min-height: 12mm;
                }
                .guce-cell:first-child { border-left: none; }
                .guce-label { font-size: 6.4pt; font-weight: 700; text-transform: none; }
                .guce-label small { display: block; font-weight: 400; font-style: italic; font-size: 5.8pt; }
                .guce-value { margin-top: 1mm; font-size: 8pt; white-space: pre-wrap; }

                .guce-bottom { display: flex; gap: 3mm; margin-top: 3mm; }
                .guce-left-col { flex: 1; display: flex; flex-direction: column; gap: 0; }
                .guce-right-col { width: 78mm; }

                .guce-decompte { border: 1pt solid #111; }
                .guce-decompte-title { text-align: center; font-weight: 700; font-size: 7.5pt; padding: 1.5mm; border-bottom: 1pt solid #111; }
                .guce-decompte table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
                .guce-decompte td { padding: 1.3mm 2mm; border-top: 1pt solid #ccc; }
                .guce-decompte td.lbl { }
                .guce-decompte td.rate { text-align: center; width: 16mm; }
                .guce-decompte td.amt { text-align: right; width: 22mm; }
                .guce-decompte tr.total td { border-top: 1pt solid #111; font-weight: 700; }

                .guce-footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 4mm; border: 1pt solid #111; padding: 3mm; }
                .guce-footer .legal { font-size: 6px; max-width: 130mm; line-height: 1.3; }
                .guce-footer .stamp { width: 30mm; height: 30mm; border: 1pt dashed #999; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 6pt; color: #999; text-align: center; }
                .guce-footer .sign { text-align: right; font-size: 7pt; }
                .guce-qr { text-align: center; }
                .guce-qr img { width: 22mm; height: 22mm; }
            `}</style>

            {/* En-tête : logo, mentions légales, référence requête + QR */}
            <div className="guce-header">
                <div>
                    <div className="brand">
                        NSIA
                        <small>ASSURANCES</small>
                    </div>
                    <div className="legal">
                        Société Anonyme au capital de F.CFA{' '}
                        {settings.capital ?? ''} entièrement libéré. Entreprise
                        régie par le code des Assurances CIMA.
                        <br />
                        R.C. {settings.rccm ?? ''} — Siège Social :{' '}
                        {settings.siege_social ?? ''}
                        <br />
                        Tél : {settings.phone ?? ''} — Site Web :{' '}
                        {settings.website ?? ''} — email :{' '}
                        {settings.email ?? ''}
                    </div>
                </div>
                <div className="ref-box">
                    <span>Référence requête / Request Number</span>
                    <b>{cert.insured_ref || f.certificate_number}</b>
                    {qrUrl && (
                        <div className="guce-qr">
                            <img src={qrUrl} alt="QR code de vérification" />
                        </div>
                    )}
                </div>
            </div>

            {/* Titre + numéro de certificat */}
            <div className="guce-title-row">
                <div className="title">
                    <h1>CERTIFICAT D'ASSURANCE</h1>
                    <p>CERTIFICATE OF INSURANCE</p>
                </div>
                <div className="num">
                    <span>N°</span>
                    <div className="n">{f.certificate_number}</div>
                    <div className="note">
                        Sauf indication contraire, le présent certificat est
                        établi en un seul exemplaire ORIGINAL.
                    </div>
                </div>
            </div>

            {/* Bloc principal */}
            <div className="guce-grid">
                <div className="guce-row">
                    <div className="guce-cell" style={{ flex: 2 }}>
                        <div className="guce-label">
                            Assuré agissant tant pour son compte que pour le
                            compte de qui il appartiendra
                            <small>
                                Assured acting for his own account as well as
                                for account of whom it may concern
                            </small>
                        </div>
                        <div className="guce-value">
                            {f.insured_name}
                            {f.insured_address ? `\n${f.insured_address}` : ''}
                        </div>
                    </div>
                    <div className="guce-cell">
                        <div className="guce-label">
                            Application à la police N°
                            <small>Application for open cover</small>
                        </div>
                        <div className="guce-value">{f.policy_number}</div>
                    </div>
                    <div className="guce-cell" style={{ flex: 0.6 }}>
                        <div className="guce-label">Date</div>
                        <div className="guce-value">{f.issue_date}</div>
                    </div>
                </div>

                <div className="guce-row">
                    <div className="guce-cell" style={{ flex: 2 }}>
                        <div className="guce-label">
                            Marchandises (nature et nombre des colis)
                            <small>Description of cargo</small>
                        </div>
                        <div className="guce-value">
                            {f.package_count} {f.packaging}
                            {'\n'}
                            {f.nature}
                        </div>
                    </div>
                    <div className="guce-cell">
                        <div className="guce-label">
                            Poids <small>Weight</small>
                        </div>
                        <div className="guce-value">{f.weight}</div>
                    </div>
                    <div className="guce-cell">
                        <div className="guce-label">N°</div>
                        <div className="guce-value">
                            {item?.package_numbers ?? ''}
                        </div>
                    </div>
                </div>

                <div className="guce-row">
                    <div className="guce-cell">
                        <div className="guce-label">
                            Navire et/ou autre moyen de transport
                            <small>Vessel and/or other conveyances</small>
                        </div>
                        <div className="guce-value">{f.vessel_name}</div>
                    </div>
                    <div className="guce-cell" style={{ flex: 1.4 }}>
                        <div className="guce-label">
                            Voyage : (lieu de transit ou transbordement
                            éventuel)
                            <small>
                                Voyage — places of transit or of possible
                                transshipment
                            </small>
                        </div>
                        <div className="guce-value">
                            {f.voyage_from}
                            {f.voyage_via ? ` / ${f.voyage_via}` : ''}
                        </div>
                    </div>
                </div>

                <div className="guce-row">
                    <div className="guce-cell">
                        <div className="guce-label">Marques</div>
                        <div className="guce-value">{f.marks}</div>
                    </div>
                </div>

                <div className="guce-row">
                    <div className="guce-cell">
                        <div className="guce-label">
                            En cas d'avaries à destination pour les
                            constatations s'adresser à
                            <small>
                                In case of loss or damage at destination,
                                contact the following surveyor
                            </small>
                        </div>
                        <div className="guce-value">
                            {settings.surveyor_name ?? f.expert_name}
                            {settings.surveyor_address
                                ? `\n${settings.surveyor_address}`
                                : ''}
                        </div>
                    </div>
                    <div className="guce-cell">
                        <div className="guce-label">
                            Pour le paiement des dommages susceptibles d'être
                            mis à la charge des assureurs, adresser le dossier
                            complet à
                            <small>
                                For the settlement of claims for which the
                                insurer may be liable, all documents must be
                                sent to
                            </small>
                        </div>
                        <div className="guce-value">
                            {cert.tenant?.name ?? ''}
                            {settings.payment_address
                                ? `\n${settings.payment_address}`
                                : ''}
                        </div>
                    </div>
                </div>

                <div className="guce-row">
                    <div className="guce-cell">
                        <div className="guce-label">
                            Valeur d'assurance (en chiffres)
                            <small>Insured values (figures)</small>
                        </div>
                        <div className="guce-value">{f.insured_value}</div>
                    </div>
                    <div className="guce-cell" style={{ flex: 1.6 }}>
                        <div className="guce-label">(En lettres / letters)</div>
                        <div className="guce-value">
                            {f.insured_value_letters}
                        </div>
                    </div>
                </div>

                <div className="guce-row">
                    <div className="guce-cell">
                        <div className="guce-label">
                            Conditions générales
                            <small>General conditions</small>
                        </div>
                        <div className="guce-value">{f.guarantee_mode}</div>
                    </div>
                    <div className="guce-cell">
                        <div className="guce-label">
                            Date du voyage
                            <small>Date of transit</small>
                        </div>
                        <div className="guce-value">{f.voyage_date}</div>
                    </div>
                </div>
            </div>

            {/* Résumé conditions + décompte de prime */}
            <div className="guce-bottom">
                <div
                    className="guce-left-col"
                    style={{ border: '1pt solid #111' }}
                >
                    <div style={{ padding: '2mm 3mm' }}>
                        <div className="guce-label">
                            Résumé des principales conditions d'assurance
                            <small>
                                Statement of main insurance conditions
                            </small>
                        </div>
                        <div className="guce-value">{f.special_conditions}</div>
                    </div>
                </div>

                <div className="guce-right-col guce-decompte">
                    <div className="guce-decompte-title">
                        DÉCOMPTE DE PRIME
                        <br />
                        <span style={{ fontWeight: 400, fontSize: '6.5pt' }}>
                            TAUX / RATE — MONTANT / AMOUNT ({f.currency_code})
                        </span>
                    </div>
                    <table>
                        <tbody>
                            <tr>
                                <td className="lbl">R.O / O.R</td>
                                <td className="rate">{f.rate_ro}</td>
                                <td className="amt">{f.amount_ro}</td>
                            </tr>
                            <tr>
                                <td className="lbl">R.G / W.R</td>
                                <td className="rate">{f.rate_rg}</td>
                                <td className="amt">{f.amount_rg}</td>
                            </tr>
                            <tr>
                                <td className="lbl">Surprime</td>
                                <td className="rate">{f.rate_surprime}</td>
                                <td className="amt">{f.amount_surprime}</td>
                            </tr>
                            <tr>
                                <td className="lbl">
                                    Prime Nette / Net premium
                                </td>
                                <td className="rate" />
                                <td className="amt">{f.amount_prime_nette}</td>
                            </tr>
                            <tr>
                                <td className="lbl">
                                    Accessoires / Accessories
                                </td>
                                <td className="rate" />
                                <td className="amt">{f.amount_accessoires}</td>
                            </tr>
                            <tr>
                                <td className="lbl">Taxe / Tax</td>
                                <td className="rate">{f.rate_taxe}</td>
                                <td className="amt">{f.amount_taxe}</td>
                            </tr>
                            <tr className="total">
                                <td className="lbl">
                                    Prime Totale / Total Premium
                                </td>
                                <td className="rate" />
                                <td className="amt">{f.prime_total}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pied de page : signature + mentions légales */}
            <div className="guce-footer">
                <div className="legal">
                    Toutes indemnités pour perte ou avaries seront payées, dans
                    les conditions prévues à l'article 27 des conditions
                    générales entre les mains du porteur de l'original du
                    certificat d'assurance et des pièces justificatives de la
                    réclamation.
                    <br />
                    All indemnities for loss or damage will be paid, in
                    accordance with the terms and conditions of Article 27 of
                    the Marine Cargo Insurance Policy to the holder of the
                    original insurance certificate and of the substantiating
                    documents.
                </div>
                <div className="sign">
                    <div>
                        Fait à {settings.city ?? ''} le : {f.issue_date}
                    </div>
                    <div style={{ marginTop: '4mm' }}>{f.issued_by}</div>
                </div>
            </div>
        </div>
    );
}
