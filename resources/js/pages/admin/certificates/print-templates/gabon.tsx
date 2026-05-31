import { CertificateForPrint, fmt, fmtDate, fmtRate } from './types';

interface Props { certificate: CertificateForPrint }

export default function TemplateGabon({ certificate: cert }: Props) {
    const tenant   = cert.tenant;
    const contract = cert.contract;
    const settings = tenant?.settings ?? {};

    const primes   = cert.prime_breakdown ?? [];
    const primeRow = (key: string) => primes.find(p => p.key === key) ?? null;
    const ro       = primeRow('ro');
    const rg       = primeRow('rg');
    const surprime = primeRow('surprime');
    const divers   = primeRow('divers');
    const primeNette = primeRow('prime_nette');

    const city      = settings?.city ?? 'Libreville';
    const issueDate = cert.issued_at ?? cert.created_at;

    const transportType = cert.transport_type ?? '';
    const isAir    = transportType === 'AIR';
    const isSea    = transportType === 'SEA';
    const isRoad   = transportType === 'ROAD';

    // Styles communs
    const cell: React.CSSProperties = { border: '0.5pt solid #1a3a8a', padding: '2pt 4pt', verticalAlign: 'top' };
    const label: React.CSSProperties = { fontSize: '7pt', color: '#1a3a8a', fontWeight: 700, textTransform: 'uppercase' };
    const value: React.CSSProperties = { fontSize: '9pt', fontWeight: 600, color: '#000', marginTop: '1pt' };
    const checkbox = (checked: boolean) => (
        <span style={{ display: 'inline-block', width: 10, height: 10, border: '1pt solid #1a3a8a', background: checked ? '#1a3a8a' : 'transparent', marginRight: 3, verticalAlign: 'middle' }} />
    );

    return (
        <div className="cert-page" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>

            {/* ══ HEADER ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4pt' }}>
                <tbody>
                    <tr>
                        {/* Logo + infos légales Gabon */}
                        <td style={{ width: '45%', padding: '6pt 8pt', verticalAlign: 'top' }}>
                            {tenant?.logo_path ? (
                                <img src={`/storage/${tenant.logo_path}`} alt="NSIA" style={{ maxWidth: 90, maxHeight: 45, objectFit: 'contain', display: 'block', marginBottom: 4 }} />
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                                    <div style={{ width: 32, height: 32, background: '#1a3a8a', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z" stroke="white" strokeWidth="1.5" /><path d="M9 12L11 14L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11pt', fontWeight: 900, color: '#1a3a8a' }}>NSIA <span style={{ fontSize: '8pt' }}>Gabon</span></div>
                                        <div style={{ fontSize: '6pt', color: '#555', fontStyle: 'italic' }}>Le vrai visage de l'assurance</div>
                                    </div>
                                </div>
                            )}
                            <div style={{ fontSize: '6.5pt', color: '#333', lineHeight: 1.5 }}>
                                {settings?.regulator && <div>Entreprise régie par le code des assurances {settings.regulator}</div>}
                                {settings?.capital   && <div>S.A avec Conseil d'Administration au Capital de <strong>{settings.capital}</strong></div>}
                                {settings?.siege_social && settings.siege_social.split('\n').map((l, i) => <div key={i}>{l}</div>)}
                                {settings?.phone    && <div>Tél : {settings.phone}</div>}
                                {settings?.website  && <div>e-mail : {settings.email} – {settings.website}</div>}
                                {settings?.rccm     && <div>{settings.rccm}</div>}
                            </div>
                        </td>

                        {/* Titre + N° */}
                        <td style={{ width: '55%', padding: '6pt 8pt', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '14pt', fontWeight: 900, color: '#1a3a8a', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                Ordre d'Assurance
                            </div>
                            <div style={{ fontSize: '9pt', fontWeight: 700, color: '#1a3a8a', marginBottom: '4pt' }}>
                                Valant Certificat d'Assurance
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: '6pt' }}>
                                <span style={{ fontSize: '9pt', fontWeight: 700, color: '#1a3a8a' }}>N°</span>
                                <span style={{ fontSize: '20pt', fontWeight: 900, letterSpacing: '0.05em', color: '#000', fontFamily: 'monospace' }}>{cert.certificate_number}</span>
                            </div>
                            {/* A / LE */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4pt' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ ...cell, width: '50%', height: '18pt' }}>
                                            <span style={label}>A </span>
                                            <span style={{ ...value, fontSize: '8pt' }}>{city}</span>
                                        </td>
                                        <td style={{ ...cell, width: '50%' }}>
                                            <span style={label}>LE </span>
                                            <span style={{ ...value, fontSize: '8pt' }}>{fmtDate(issueDate)}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            {/* Checkboxes type assurance */}
                            <div style={{ display: 'flex', gap: 8, marginBottom: '3pt', fontSize: '8pt', color: '#1a3a8a', fontWeight: 600 }}>
                                <div style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 8pt' }}>
                                    {checkbox(true)} ASSURANCE AU VOYAGE
                                </div>
                            </div>
                            {/* Suivant POLICE N° */}
                            <div style={{ fontSize: '8pt', marginTop: '3pt' }}>
                                <span style={{ fontWeight: 700, color: '#1a3a8a' }}>suivant POLICE N° </span>
                                <span style={{ borderBottom: '0.5pt solid #000', minWidth: 120, display: 'inline-block', fontWeight: 600 }}>
                                    {cert.policy_number}
                                </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ ASSURE ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1pt solid #1a3a8a', marginBottom: '4pt' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '60%', padding: '4pt 6pt', borderRight: '0.5pt solid #1a3a8a' }}>
                            <div style={{ ...label, marginBottom: '2pt' }}>
                                Assuré<br />
                                <span style={{ fontSize: '6.5pt', fontWeight: 400, textTransform: 'none' }}>Agissant tant pour son compte que pour qui il appartiendra</span>
                            </div>
                            <div style={value}>{cert.insured_name}</div>
                            {contract?.insured_address && <div style={{ fontSize: '7.5pt' }}>{contract.insured_address}</div>}
                        </td>
                        <td style={{ width: '40%', padding: '4pt 6pt' }}>
                            <div style={label}>Références Assuré :</div>
                            <div style={value}>{cert.insured_ref ?? ''}</div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ VOYAGE ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1pt solid #1a3a8a', marginBottom: '4pt' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '20%', padding: '4pt 6pt', borderRight: '1pt solid #1a3a8a', verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '11pt', fontWeight: 900, color: '#1a3a8a', letterSpacing: '0.05em' }}>VOYAGE</div>
                        </td>
                        <td style={{ width: '80%', padding: '4pt 6pt' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ paddingBottom: '3pt', fontWeight: 700, color: '#1a3a8a', width: '30%' }}>DATE DE L'EXPEDITION</td>
                                        <td style={{ paddingBottom: '3pt', fontWeight: 600 }}>{fmtDate(cert.voyage_date)}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ paddingBottom: '2pt', color: '#555' }}>DE</td>
                                        <td style={{ paddingBottom: '2pt', fontWeight: 600 }}>
                                            {cert.voyage_from}
                                            <span style={{ color: '#555', margin: '0 6pt' }}>A</span>
                                            {cert.voyage_to}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ paddingBottom: '3pt', color: '#555' }}>VIA</td>
                                        <td style={{ paddingBottom: '3pt', fontWeight: 600 }}>{cert.voyage_via ?? ''}</td>
                                    </tr>
                                    {/* Transport type */}
                                    <tr>
                                        <td colSpan={2}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    <tr>
                                                        <td style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 5pt', width: '25%' }}>
                                                            {checkbox(isAir)} <span style={{ fontSize: '7.5pt', fontWeight: 700 }}>AVION</span>
                                                            <span style={{ fontSize: '6.5pt', marginLeft: 4 }}>VOL N° {isAir ? (cert.flight_number ?? '') : ''}</span>
                                                        </td>
                                                        <td style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 5pt', width: '25%' }}>
                                                            {checkbox(isSea)} <span style={{ fontSize: '7.5pt', fontWeight: 700 }}>NAVIRE</span>
                                                            <span style={{ fontSize: '6.5pt', marginLeft: 4 }}>S/S {isSea ? (cert.vessel_name ?? '') : ''}</span>
                                                        </td>
                                                        <td style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 5pt', width: '25%' }}>
                                                            {checkbox(false)} <span style={{ fontSize: '7.5pt', fontWeight: 700 }}>CALE</span>
                                                            <span style={{ fontSize: '6.5pt', marginLeft: 4 }}>AVEC TRANSBORDEMENT</span>
                                                        </td>
                                                        <td style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 5pt', width: '25%' }}>
                                                            {checkbox(false)} <span style={{ fontSize: '7.5pt', fontWeight: 700 }}>PONTEE</span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td colSpan={4} style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 4pt' }}>
                                                            <span style={{ fontSize: '7pt', color: '#555' }}>Mode : </span>
                                                            {['CONTAINER','BOUT EN BOUT','GROUPAGE','CONVENTIONNEL'].map(m => (
                                                                <span key={m} style={{ marginRight: 8, fontSize: '7.5pt' }}>
                                                                    {checkbox(cert.voyage_mode === m)} {m}
                                                                </span>
                                                            ))}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ DETAIL DE L'EXPEDITION ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1pt solid #1a3a8a', marginBottom: '4pt' }}>
                <thead>
                    <tr style={{ background: '#e8eef8' }}>
                        <td colSpan={5} style={{ padding: '3pt 6pt', textAlign: 'center', fontWeight: 900, fontSize: '9pt', color: '#1a3a8a', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '0.5pt solid #1a3a8a' }}>
                            Détail de l'Expédition
                            <div style={{ fontSize: '6.5pt', fontWeight: 400, fontStyle: 'italic' }}>(Ne porter qu'une seule expédition sur cet ordre)</div>
                        </td>
                    </tr>
                    <tr style={{ background: '#f0f4fb', fontSize: '7pt', fontWeight: 700, color: '#1a3a8a', textAlign: 'center' }}>
                        <th style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 4pt', width: '15%' }}>Marques</th>
                        <th style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 4pt', width: '20%' }}>NUMÉROS<br />et nombres de colis</th>
                        <th style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 4pt', width: '12%' }}>POIDS</th>
                        <th style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 4pt', width: '33%' }}>NATURE DES MARCHANDISES<br />ET DE L'EMBALLAGE</th>
                        <th style={{ border: '0.5pt solid #1a3a8a', padding: '2pt 4pt', width: '20%' }}>VALEUR<br />D'ASSURANCE</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Lignes des items */}
                    {cert.expedition_items?.length > 0
                        ? cert.expedition_items.map((item, i) => (
                            <tr key={i} style={{ fontSize: '8pt' }}>
                                <td style={{ border: '0.5pt solid #aaa', padding: '3pt 4pt', height: '18pt' }}>{item.marks}</td>
                                <td style={{ border: '0.5pt solid #aaa', padding: '3pt 4pt', textAlign: 'center' }}>
                                    {item.package_numbers}<br />
                                    <span style={{ fontSize: '7pt', color: '#555' }}>{item.package_count} colis</span>
                                </td>
                                <td style={{ border: '0.5pt solid #aaa', padding: '3pt 4pt', textAlign: 'center' }}>{item.weight}</td>
                                <td style={{ border: '0.5pt solid #aaa', padding: '3pt 4pt' }}>{item.nature} — {item.packaging}</td>
                                <td style={{ border: '0.5pt solid #aaa', padding: '3pt 4pt', textAlign: 'right', fontWeight: 600 }}>
                                    {fmt(item.insured_value, cert.currency_code)}
                                </td>
                            </tr>
                        ))
                        : /* Lignes vides si pas d'items */
                        Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                {Array.from({ length: 5 }).map((_, j) => (
                                    <td key={j} style={{ border: '0.5pt solid #aaa', padding: '0', height: '16pt' }} />
                                ))}
                            </tr>
                        ))
                    }
                    {/* Valeur totale en lettres */}
                    <tr>
                        <td colSpan={5} style={{ border: '0.5pt solid #1a3a8a', padding: '3pt 6pt', borderTop: '1pt solid #1a3a8a' }}>
                            <span style={{ fontSize: '7.5pt', fontWeight: 700, color: '#1a3a8a' }}>VALEUR TOTALE D'ASSURANCE (en lettres) : </span>
                            <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>{cert.insured_value_letters}</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ TEXTE LÉGAL ══ */}
            <div style={{ fontSize: '6pt', color: '#333', lineHeight: 1.5, marginBottom: '6pt', padding: '0 2pt' }}>
                Conformément aux conditions générales, l'Assureur pourra déduire, de l'indemnité de sinistre lui incombant, la prime afférente aux risques garantis par le présent ordre
                d'assurance, si cette prime n'a pas été payée. Toutes indemnités pour pertes ou avaries seront payées entre les mains du porteur de l'original de l'ordre d'assurance
                et des pièces justificatives de la réclamation. (voir au verso)
            </div>

            {/* ══ PARTIE BASSE : Cachets + Décompte ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1pt solid #1a3a8a' }}>
                <tbody>
                    <tr>
                        {/* Cachets */}
                        <td style={{ width: '38%', borderRight: '1pt solid #1a3a8a', padding: '6pt', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '7pt', fontWeight: 700, color: '#1a3a8a', marginBottom: '30pt', textAlign: 'center' }}>
                                CACHET COMMERCIAL ET SIGNATURE<br />DE L'ASSURÉ
                            </div>
                            <div style={{ fontSize: '7pt', fontWeight: 700, color: '#1a3a8a', marginTop: '10pt', textAlign: 'center' }}>
                                CACHET COMMERCIAL ET SIGNATURE<br />DE L'ASSUREUR
                            </div>
                            {/* Zone cachet */}
                            <div style={{ width: 70, height: 70, border: '0.5pt dashed #aaa', borderRadius: '50%', margin: '6pt auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {cert.issued_by && (
                                    <div style={{ fontSize: '6pt', textAlign: 'center', color: '#555' }}>
                                        {cert.issued_by.first_name}<br />{cert.issued_by.last_name}
                                    </div>
                                )}
                            </div>
                        </td>

                        {/* Mode de garantie + Décompte */}
                        <td style={{ width: '62%', padding: 0, verticalAlign: 'top' }}>
                            {/* Mode de garantie */}
                            <div style={{ padding: '4pt 6pt', borderBottom: '0.5pt solid #1a3a8a', fontSize: '8pt' }}>
                                <span style={{ fontWeight: 700, color: '#1a3a8a' }}>MODE DE GARANTIE : </span>
                                <span style={{ fontWeight: 600 }}>{cert.guarantee_mode ?? contract?.coverage_type ?? ''}</span>
                            </div>

                            {/* Décompte de prime */}
                            <div style={{ padding: '3pt 6pt 2pt', textAlign: 'center', fontWeight: 900, fontSize: '9pt', color: '#1a3a8a', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '0.5pt solid #1a3a8a', background: '#f0f4fb' }}>
                                Décompte de Prime
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
                                <thead>
                                    <tr style={{ background: '#e8eef8', fontWeight: 700, color: '#1a3a8a', fontSize: '7pt' }}>
                                        <th style={{ border: '0.5pt solid #aaa', padding: '2pt 4pt', width: '55%', textAlign: 'left' }}></th>
                                        <th style={{ border: '0.5pt solid #aaa', padding: '2pt 4pt', width: '22%', textAlign: 'center' }}>TAUX</th>
                                        <th style={{ border: '0.5pt solid #aaa', padding: '2pt 4pt', width: '23%', textAlign: 'center' }}>MONTANT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { label: 'R.O. / C.F.A.',  line: ro },
                                        { label: 'R.G. / C.F.A.',  line: rg },
                                        { label: 'SURPRIME',        line: surprime },
                                        { label: 'DIVERS',          line: divers },
                                        { label: 'PRIME NETTE',     line: primeNette, bold: true },
                                    ].map(({ label: lbl, line, bold }) => (
                                        <tr key={lbl}>
                                            <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', fontWeight: bold ? 700 : 400 }}>{lbl}</td>
                                            <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', textAlign: 'right' }}>{line ? fmtRate(line.rate) : ''}</td>
                                            <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', textAlign: 'right', fontWeight: 600 }}>{line ? fmt(line.amount, cert.currency_code) : ''}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ IMPORTANT ══ */}
            <div style={{ marginTop: '6pt', padding: '4pt 6pt', border: '1pt solid #1a3a8a', fontSize: '7pt', textAlign: 'center' }}>
                <strong>IMPORTANT</strong> — LE PRÉSENT ORDRE D'ASSURANCE NE VAUT CERTIFICAT D'ASSURANCE QUE REVÊTU DE LA SIGNATURE ET DU CACHET DE L'ASSUREUR
            </div>

        </div>
    );
}
