import { CertificateForPrint, fmt, fmtDate, fmtRate } from './types';

interface Props { certificate: CertificateForPrint }

export default function TemplateGuineeConakry({ certificate: cert }: Props) {
    const tenant   = cert.tenant;
    const contract = cert.contract;
    const settings = tenant?.settings ?? {};

    const primes      = cert.prime_breakdown ?? [];
    const primeRow    = (key: string) => primes.find(p => p.key === key) ?? null;
    const ro          = primeRow('ro');
    const rg          = primeRow('rg');
    const surprime    = primeRow('surprime');
    const primeNette  = primeRow('prime_nette');
    const accessories = primeRow('accessories');
    const taxe        = primeRow('taxe');

    const allNature   = cert.expedition_items?.map(i => `${i.package_count} ${i.packaging} de ${i.nature}`).join(' — ') ?? '';
    const allMarks    = cert.expedition_items?.map(i => i.marks).filter(Boolean).join(', ') ?? '';
    const totalWeight = cert.expedition_items?.map(i => i.weight).filter(Boolean).join(', ') ?? '';
    const allPackNums = cert.expedition_items?.map(i => i.package_numbers).filter(Boolean).join(', ') ?? '';

    const city      = settings?.city ?? 'Conakry';
    const issueDate = cert.issued_at ?? cert.created_at;

    return (
        <div className="cert-page">

            {/* ══ HEADER ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '1pt solid #555' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '28%', padding: '6pt 8pt', verticalAlign: 'middle' }}>
                            {tenant?.logo_path ? (
                                <img src={`/storage/${tenant.logo_path}`} alt="NSIA"
                                    style={{ maxWidth: 90, maxHeight: 50, objectFit: 'contain' }} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <div style={{ width: 36, height: 36, background: '#1e3a5f', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                                            <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z" stroke="white" strokeWidth="1.5" />
                                            <path d="M9 12L11 14L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '13pt', fontWeight: 900, color: '#c8a000' }}>NSIA</div>
                                        <div style={{ fontSize: '7pt', color: '#1e3a5f', fontWeight: 700, letterSpacing: '0.15em' }}>ASSURANCES</div>
                                    </div>
                                </div>
                            )}
                        </td>
                        <td style={{ width: '38%', padding: '6pt 4pt', textAlign: 'center', fontSize: '7.5pt', lineHeight: 1.6, verticalAlign: 'middle', borderLeft: '0.5pt solid #888', borderRight: '0.5pt solid #888' }}>
                            <strong>Siège social :</strong><br />
                            {settings?.siege_social
                                ? settings.siege_social.split('\n').map((l, i) => <span key={i}>{l}<br /></span>)
                                : tenant?.name}
                            {settings?.phone    && <><br />Tél : {settings.phone}</>}
                            {settings?.website  && <><br />Site Web : {settings.website}</>}
                            {settings?.email    && <><br />E-mail : {settings.email}</>}
                        </td>
                        <td style={{ width: '34%', padding: '6pt 8pt', textAlign: 'right', fontSize: '7.5pt', lineHeight: 1.6, verticalAlign: 'middle' }}>
                            {settings?.capital   && <>Société Anonyme au Capital de<br /><strong>{settings.capital}</strong><br /></>}
                            {settings?.rccm      && <>{settings.rccm}<br /></>}
                            {settings?.regulator && <>Entreprise régie par le code des<br />{settings.regulator}</>}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ TITRE + N° ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', borderTop: '1pt solid #555', borderBottom: '0.5pt solid #777' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '55%', padding: '5pt 8pt', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '13pt', fontWeight: 900, textTransform: 'uppercase' }}>Certificat d'Assurance</div>
                            <div style={{ fontSize: '9pt', fontStyle: 'italic', color: '#444' }}>Certificate of Insurance</div>
                        </td>
                        <td style={{ width: '45%', padding: '4pt 8pt', verticalAlign: 'top', borderLeft: '0.5pt solid #666' }}>
                            <div style={{ fontSize: '8pt', fontWeight: 700, color: '#333' }}>N°</div>
                            <div style={{ fontSize: '22pt', fontWeight: 900, letterSpacing: '0.04em' }}>{cert.certificate_number}</div>
                            <div style={{ fontSize: '6.5pt', color: '#333', marginTop: '3pt', lineHeight: 1.4 }}>
                                Sauf indication contraire, le présent certificat est établi en un seul exemplaire ORIGINAL.<br />
                                <em>Unless otherwise stated, this certificate constitutes the sole original document.</em>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ CORPS ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>

                    {/* Ligne 1 : Assuré | Police | Date */}
                    <tr>
                        <td className="cell" style={{ width: '50%', height: '38pt' }}>
                            <div className="cell-label">Assuré agissant tant pour son compte que pour le compte de qui il appartiendra</div>
                            <div className="cell-label-en">Assured acting for his own account as well as for account of whom it may concern :</div>
                            <div className="cell-value">{cert.insured_name}</div>
                            {contract?.insured_address && <div style={{ fontSize: '7.5pt', marginTop: '2pt' }}>{contract.insured_address}</div>}
                        </td>
                        <td className="cell" style={{ width: '32%', height: '38pt' }}>
                            <div className="cell-label">Application à la police N°</div>
                            <div className="cell-label-en">Application for open cover</div>
                            <div className="cell-value">{cert.policy_number}</div>
                        </td>
                        <td className="cell" style={{ width: '18%', height: '38pt' }}>
                            <div className="cell-label">Date :</div>
                            <div className="cell-value">{fmtDate(issueDate)}</div>
                        </td>
                    </tr>

                    {/* Ligne 2 : Marchandises | Poids + N° */}
                    <tr>
                        <td className="cell" style={{ width: '50%', height: '42pt' }}>
                            <div className="cell-label">Marchandises (nature et nombre des colis)</div>
                            <div className="cell-label-en">Description of cargo :</div>
                            <div className="cell-value">{allNature}</div>
                        </td>
                        <td className="cell" style={{ width: '22%' }}>
                            <div className="cell-label">Poids <em style={{ fontSize: '6.5pt', color: '#666', fontStyle: 'italic' }}>Weight</em></div>
                            <div className="cell-value">{totalWeight}</div>
                        </td>
                        <td className="cell" style={{ width: '28%' }}>
                            <div className="cell-label">N°</div>
                            <div className="cell-value">{allPackNums}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style={{ display: 'none' }} />
                        <td className="cell" colSpan={2} style={{ height: '20pt' }}>
                            <div className="cell-label">Marques : <em style={{ fontSize: '6.5pt', color: '#666', fontStyle: 'italic' }}>Marks</em></div>
                            <div className="cell-value">{allMarks}</div>
                        </td>
                    </tr>

                    {/* Ligne 3 : Navire | Voyage */}
                    <tr>
                        <td className="cell" style={{ width: '50%', height: '28pt' }}>
                            <div className="cell-label">Navire et/ou autre moyen de transport</div>
                            <div className="cell-label-en">Vessel and/or other conveyances :</div>
                            <div className="cell-value">{cert.vessel_name ?? cert.flight_number ?? ''}</div>
                        </td>
                        <td className="cell" colSpan={2} style={{ height: '28pt' }}>
                            <div className="cell-label">Voyage : (lieu de transit ou transbordement éventuel)</div>
                            <div className="cell-label-en">Voyage – places of transit or for possible transshipment</div>
                            <div className="cell-value">
                                {cert.voyage_from}{cert.voyage_to ? ` / ${cert.voyage_to}` : ''}{cert.voyage_via ? ` via ${cert.voyage_via}` : ''}
                            </div>
                        </td>
                    </tr>

                    {/* Ligne 4 : Expert | Paiement */}
                    <tr>
                        <td className="cell" style={{ width: '50%', height: '34pt' }}>
                            <div className="cell-label">En cas d'avaries à destination pour les constatations s'adresser à :</div>
                            <div className="cell-label-en">In case of loss or damage at destination, contact the following surveyor :</div>
                            <div className="cell-value">{settings?.surveyor_name ?? ''}</div>
                            {settings?.surveyor_address && <div style={{ fontSize: '7.5pt' }}>{settings.surveyor_address}</div>}
                        </td>
                        <td className="cell" colSpan={2} style={{ height: '34pt' }}>
                            <div className="cell-label">Pour le paiement des dommages susceptibles d'être mis à la charge des assureurs, adresser le dossier complet à :</div>
                            <div className="cell-label-en">For the settlement of claims for which the insurer may be liable, all document must be sent to :</div>
                            <div className="cell-value">{settings?.payment_address ?? tenant?.name ?? ''}</div>
                        </td>
                    </tr>

                    {/* Ligne 5 : Valeur | En lettres */}
                    <tr>
                        <td className="cell" style={{ width: '50%', height: '28pt' }}>
                            <div className="cell-label">Valeur d'assurance (en chiffres)</div>
                            <div className="cell-label-en">Insured values (figures)</div>
                            <div className="cell-value">{fmt(cert.insured_value, cert.currency_code)}</div>
                        </td>
                        <td className="cell" colSpan={2} style={{ height: '28pt' }}>
                            <div className="cell-label">(En lettres / letters)</div>
                            <div className="cell-value" style={{ fontStyle: 'italic', fontWeight: 500 }}>{cert.insured_value_letters}</div>
                        </td>
                    </tr>

                    {/* Ligne 6 : Conditions | Date voyage */}
                    <tr>
                        <td className="cell" style={{ width: '50%', height: '24pt' }}>
                            <div className="cell-label">Conditions Générales <em style={{ fontSize: '6.5pt', color: '#666', fontStyle: 'italic' }}>General Condition</em></div>
                            <div className="cell-value">{cert.guarantee_mode ?? contract?.coverage_type ?? ''}</div>
                        </td>
                        <td className="cell" colSpan={2} style={{ height: '24pt' }}>
                            <div className="cell-label">Date du Voyage <em style={{ fontSize: '6.5pt', color: '#666', fontStyle: 'italic' }}>Date of voyage</em></div>
                            <div className="cell-value">{fmtDate(cert.voyage_date)}</div>
                        </td>
                    </tr>

                    {/* Ligne 7 : Résumé | Décompte prime */}
                    <tr>
                        <td className="cell" style={{ width: '50%', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase' }}>Résumé des Principales Conditions d'Assurance</div>
                            <div style={{ fontSize: '6.5pt', color: '#555', fontStyle: 'italic', marginBottom: '4pt' }}>Statement of Main Insurance Condition</div>
                            <div style={{ fontSize: '8pt', marginBottom: '6pt' }}>{cert.guarantee_mode ?? contract?.coverage_type ?? ''}</div>
                            <div style={{ marginTop: '20pt', textAlign: 'center', fontSize: '7.5pt', color: '#333' }}>
                                <div style={{ borderTop: '0.5pt solid #555', width: '70%', margin: '0 auto 4pt' }} />
                                Signature et cachet de l'Assureur<br />
                                <em style={{ fontSize: '6.5pt', color: '#666' }}>Signature and stamp of the insurer</em>
                                {cert.issued_by && (
                                    <div style={{ marginTop: '3pt', fontWeight: 600, fontSize: '8pt' }}>
                                        {cert.issued_by.first_name} {cert.issued_by.last_name}
                                    </div>
                                )}
                            </div>
                        </td>
                        <td className="cell" colSpan={2} style={{ verticalAlign: 'top', padding: 0 }}>
                            <div style={{ padding: '3pt 5pt', borderBottom: '0.5pt solid #888', fontWeight: 700, fontSize: '8pt', textAlign: 'center', textTransform: 'uppercase', background: '#f0f0f0' }}>
                                Décompte de Prime
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
                                <thead>
                                    <tr>
                                        <th style={{ background: '#e8e8e8', fontWeight: 700, fontSize: '7pt', textAlign: 'left', padding: '2pt 4pt', border: '0.5pt solid #666', width: '50%' }}></th>
                                        <th style={{ background: '#e8e8e8', fontWeight: 700, fontSize: '7pt', textAlign: 'center', padding: '2pt 4pt', border: '0.5pt solid #666', width: '25%' }}>Taux / Rate</th>
                                        <th style={{ background: '#e8e8e8', fontWeight: 700, fontSize: '7pt', textAlign: 'center', padding: '2pt 4pt', border: '0.5pt solid #666', width: '25%' }}>Montant / Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { label: 'R.O / O.R',                  line: ro },
                                        { label: 'R.G / W.R',                  line: rg },
                                        { label: 'Surprime',                    line: surprime },
                                        { label: 'Prime Nette / Net premium',   line: primeNette,  bold: true },
                                        { label: 'Accessoires / Accessories',   line: accessories },
                                        { label: 'Taxe / Tax',                  line: taxe },
                                    ].map(({ label, line, bold }) => (
                                        <tr key={label}>
                                            <td style={{ padding: '3pt 5pt', border: '0.5pt solid #999', fontWeight: bold ? 600 : 400 }}>{label}</td>
                                            <td style={{ padding: '3pt 5pt', border: '0.5pt solid #999', textAlign: 'right' }}>{line ? fmtRate(line.rate) : ''}</td>
                                            <td style={{ padding: '3pt 5pt', border: '0.5pt solid #999', textAlign: 'right', fontWeight: 600 }}>{line ? fmt(line.amount) : ''}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ borderTop: '1pt solid #555', background: '#f5f5f5' }}>
                                        <td style={{ padding: '3pt 5pt', border: '0.5pt solid #999', fontWeight: 700 }}>Prime Totale / Total Premium</td>
                                        <td style={{ padding: '3pt 5pt', border: '0.5pt solid #999' }}></td>
                                        <td style={{ padding: '3pt 5pt', border: '0.5pt solid #999', textAlign: 'right', fontWeight: 700, fontSize: '9pt' }}>
                                            {fmt(cert.prime_total, cert.currency_code)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <div style={{ padding: '4pt 6pt', fontSize: '7.5pt', textAlign: 'right', color: '#333' }}>
                                Fait à {city} le {fmtDate(issueDate)}
                            </div>
                        </td>
                    </tr>

                </tbody>
            </table>

            {/* ══ FOOTER ══ */}
            <div style={{ padding: '5pt 8pt', fontSize: '6.5pt', lineHeight: 1.5, borderTop: '0.5pt solid #555' }}>
                <strong>
                    Toutes indemnités pour perte ou avaries seront payées, dans les conditions prévues à l'article 27 des Conditions Générales entre les mains du porteur de l'original
                    du certificat d'assurance et des pièces justificatives de la réclamation.
                </strong><br />
                <em>
                    All indemnities for loss or damage will be paid, in accordance with the terms and condition of article 27 of the Marine Cargo Insurance Policy to the holder of the original insurance certificate and of the substantiating documents.
                </em>
            </div>
        </div>
    );
}
