import { CertificateForPrint, fmt, fmtDate, fmtRate } from './types';

interface Props { certificate: CertificateForPrint }

export default function TemplateTogo({ certificate: cert }: Props) {
    const tenant   = cert.tenant;
    const contract = cert.contract;
    const settings = tenant?.settings ?? {};

    const primes      = cert.prime_breakdown ?? [];
    const primeRow    = (key: string) => primes.find(p => p.key === key) ?? null;
    const ro          = primeRow('ro');
    const rg          = primeRow('rg');
    const surprime    = primeRow('surprime');
    const primeNette  = primeRow('prime_nette');
    const coutPolice  = primeRow('accessories');   // mappé sur accessories
    const taxe        = primeRow('taxe');
    const primeAPayer = cert.prime_total;

    const city      = settings?.city ?? 'Lomé';
    const issueDate = cert.issued_at ?? cert.created_at;

    // Styles
    const blueColor = '#1a3a8a';
    const cell: React.CSSProperties  = { border: `0.5pt solid ${blueColor}`, padding: '2pt 4pt', verticalAlign: 'top' };
    const lbl: React.CSSProperties   = { fontSize: '7pt', color: blueColor, fontWeight: 700, textTransform: 'uppercase' as const };
    const val: React.CSSProperties   = { fontSize: '9pt', fontWeight: 600, color: '#000', marginTop: '1pt' };
    const thStyle: React.CSSProperties = { border: `0.5pt solid ${blueColor}`, padding: '2pt 4pt', background: '#e8eef8', fontWeight: 700, fontSize: '7pt', color: blueColor, textAlign: 'center' as const };

    return (
        <div className="cert-page" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>

            {/* Bande "ORIGINAL ASSURE" sur le bord gauche (simulée) */}
            <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', transformOrigin: 'left center', fontSize: '7pt', fontWeight: 700, color: blueColor, letterSpacing: '0.2em', whiteSpace: 'nowrap', marginLeft: '-30pt' }}>
                ORIGINAL ASSURE
            </div>

            {/* ══ HEADER ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: `1pt solid ${blueColor}`, marginBottom: '5pt' }}>
                <tbody>
                    <tr>
                        {/* Logo + infos Togo */}
                        <td style={{ width: '42%', padding: '5pt 8pt', verticalAlign: 'top', borderRight: `0.5pt solid ${blueColor}` }}>
                            <div style={{ border: `1.5pt solid ${blueColor}`, borderRadius: 4, padding: '4pt 6pt', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: '5pt' }}>
                                {tenant?.logo_path ? (
                                    <img src={`/storage/${tenant.logo_path}`} alt="NSIA" style={{ maxWidth: 60, maxHeight: 35, objectFit: 'contain' }} />
                                ) : (
                                    <>
                                        <div style={{ width: 28, height: 28, background: blueColor, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z" stroke="white" strokeWidth="1.5" /><path d="M9 12L11 14L15 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '11pt', fontWeight: 900, color: blueColor }}>NSIA</div>
                                            <div style={{ fontSize: '6.5pt', fontWeight: 700, color: blueColor, letterSpacing: '0.1em' }}>ASSURANCES</div>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div style={{ fontSize: '6.5pt', color: '#333', lineHeight: 1.55 }}>
                                {settings?.capital   && <div>SOCIÉTÉ ANONYME AU CAPITAL DE <strong>{settings.capital}</strong></div>}
                                {settings?.regulator && <div>Entreprise régie par le code des Assurances<br />des Etats Membres de la CIMA</div>}
                                {settings?.siege_social && settings.siege_social.split('\n').map((l, i) => <div key={i}>{l}</div>)}
                                {settings?.phone    && <div>Tél. : {settings.phone}</div>}
                                {settings?.website  && <div>Fax – E-mail : {settings.email}</div>}
                            </div>
                        </td>

                        {/* Titre + N° + Date */}
                        <td style={{ width: '58%', padding: '5pt 8pt', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '13pt', fontWeight: 900, color: blueColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                Ordre d'Assurance
                            </div>
                            <div style={{ fontSize: '7.5pt', fontWeight: 700, color: blueColor, marginBottom: '4pt', lineHeight: 1.4 }}>
                                VALANT CERTIFICAT D'ASSURANCE OBLIGATOIRE<br />
                                {settings?.rccm && <span style={{ fontWeight: 400, color: '#555' }}>{settings.rccm}</span>}
                            </div>

                            {/* A LOME, LE */}
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5pt' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ border: `0.5pt solid ${blueColor}`, padding: '3pt 6pt', fontSize: '8pt', fontWeight: 700, color: blueColor }}>
                                            A {city},&nbsp;LE&nbsp;
                                            <span style={{ fontWeight: 600, color: '#000' }}>{fmtDate(issueDate)}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            {/* Nr + Suivant POLICE */}
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                                <span style={{ fontSize: '10pt', fontWeight: 700, color: blueColor }}>Nr</span>
                                <span style={{ fontSize: '18pt', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.06em' }}>{cert.certificate_number}</span>
                                <span style={{ fontSize: '8pt', fontWeight: 700, color: blueColor, marginLeft: 8 }}>
                                    Suivant POLICE : <span style={{ color: '#000', fontWeight: 600 }}>{cert.policy_number}</span>
                                </span>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ ASSURE ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1pt solid ${blueColor}`, marginBottom: '4pt' }}>
                <tbody>
                    <tr>
                        <td style={{ padding: '3pt 6pt', borderBottom: `0.5pt solid ${blueColor}` }}>
                            <div style={{ ...lbl, marginBottom: '1pt' }}>Assuré :</div>
                            <div style={{ fontSize: '6.5pt', color: '#555', fontStyle: 'italic', marginBottom: '2pt' }}>
                                Agissant tant pour son compte que pour celui de qui il appartiendra
                            </div>
                            <div style={val}>{cert.insured_name}</div>
                            {contract?.insured_address && <div style={{ fontSize: '7.5pt' }}>{contract.insured_address}</div>}
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ VOYAGE ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1pt solid ${blueColor}`, marginBottom: '4pt' }}>
                <tbody>
                    <tr>
                        <td style={{ width: '20%', padding: '4pt 6pt', borderRight: `1pt solid ${blueColor}`, verticalAlign: 'middle' }}>
                            <div style={{ fontSize: '10pt', fontWeight: 900, color: blueColor, letterSpacing: '0.12em' }}>
                                V<br />O<br />Y<br />A<br />G<br />E
                            </div>
                        </td>
                        <td style={{ width: '80%', padding: '4pt 6pt' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '8pt' }}>
                                <tbody>
                                    <tr>
                                        <td style={{ width: '50%', paddingBottom: '3pt' }}>
                                            <span style={{ fontWeight: 700, color: blueColor }}>Date de l'expédition : </span>
                                            <span style={{ fontWeight: 600 }}>{fmtDate(cert.voyage_date)}</span>
                                        </td>
                                        <td style={{ width: '50%', paddingBottom: '3pt' }}>
                                            <span style={{ fontWeight: 700, color: blueColor }}>Réf. Assuré : </span>
                                            <span style={{ fontWeight: 600 }}>{cert.insured_ref ?? ''}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ paddingBottom: '2pt' }}>
                                            <span style={{ color: blueColor, fontWeight: 700 }}>DE : </span>
                                            <span style={{ fontWeight: 600 }}>{cert.voyage_from}</span>
                                        </td>
                                        <td style={{ paddingBottom: '2pt' }}>
                                            <span style={{ color: blueColor, fontWeight: 700 }}>à : </span>
                                            <span style={{ fontWeight: 600 }}>{cert.voyage_to}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style={{ paddingBottom: '2pt' }}>
                                            <span style={{ color: blueColor, fontWeight: 700 }}>Via : </span>
                                            <span style={{ fontWeight: 600 }}>{cert.voyage_via ?? ''}</span>
                                        </td>
                                        <td style={{ paddingBottom: '2pt' }}>
                                            <span style={{ color: blueColor, fontWeight: 700 }}>M / S : </span>
                                            <span style={{ fontWeight: 600 }}>{cert.vessel_name ?? ''}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} style={{ paddingBottom: '2pt' }}>
                                            <span style={{ color: blueColor, fontWeight: 700 }}>N° Vol : </span>
                                            <span style={{ fontWeight: 600 }}>{cert.flight_number ?? ''}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td colSpan={2} style={{ borderTop: `0.5pt solid ${blueColor}`, paddingTop: '3pt' }}>
                                            <span style={{ fontWeight: 700, color: blueColor }}>MODE DE GARANTIE : </span>
                                            <span style={{ fontWeight: 600 }}>{cert.guarantee_mode ?? contract?.coverage_type ?? ''}</span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ DETAIL DE L'EXPEDITION ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1pt solid ${blueColor}`, marginBottom: '4pt' }}>
                <thead>
                    <tr>
                        <td colSpan={6} style={{ padding: '2pt 6pt', textAlign: 'center', fontWeight: 900, fontSize: '8.5pt', color: blueColor, textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: `0.5pt solid ${blueColor}`, background: '#e8eef8' }}>
                            Détail de l'Expédition
                            <span style={{ fontSize: '6pt', fontWeight: 400, fontStyle: 'italic', marginLeft: 4 }}>(Ne porter qu'une seule expédition sur cet ordre)</span>
                        </td>
                    </tr>
                    <tr>
                        <th style={thStyle}>MARQUES</th>
                        <th style={thStyle}>NUMÉROS</th>
                        <th style={{ ...thStyle, width: '8%' }}>Nbre<br />de colis</th>
                        <th style={{ ...thStyle, width: '10%' }}>POIDS</th>
                        <th style={{ ...thStyle, width: '32%' }}>NATURE DES MARCHANDISES<br />ET DE L'EMBALLAGE</th>
                        <th style={{ ...thStyle, width: '18%' }}>VALEUR<br />D'ASSURANCE</th>
                    </tr>
                </thead>
                <tbody>
                    {cert.expedition_items?.length > 0
                        ? cert.expedition_items.map((item, i) => (
                            <tr key={i} style={{ fontSize: '8pt' }}>
                                <td style={{ ...cell, height: '16pt' }}>{item.marks}</td>
                                <td style={cell}>{item.package_numbers}</td>
                                <td style={{ ...cell, textAlign: 'center' }}>{item.package_count}</td>
                                <td style={{ ...cell, textAlign: 'center' }}>{item.weight}</td>
                                <td style={cell}>{item.nature} — {item.packaging}</td>
                                <td style={{ ...cell, textAlign: 'right', fontWeight: 600 }}>
                                    {fmt(item.insured_value, cert.currency_code)}
                                </td>
                            </tr>
                        ))
                        : Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i}>
                                {Array.from({ length: 6 }).map((_, j) => (
                                    <td key={j} style={{ ...cell, height: '16pt' }} />
                                ))}
                            </tr>
                        ))
                    }

                    {/* Valeur totale + devise + cours */}
                    <tr style={{ borderTop: `1pt solid ${blueColor}` }}>
                        <td colSpan={2} style={{ ...cell, fontWeight: 700, color: blueColor, fontSize: '7.5pt' }}>
                            VALEUR D'ASSURANCE :<br />
                            <span style={{ fontWeight: 600, color: '#000', fontSize: '9pt' }}>{fmt(cert.insured_value, cert.currency_code)}</span>
                        </td>
                        <td colSpan={2} style={{ ...cell, fontWeight: 700, color: blueColor, fontSize: '7.5pt', textAlign: 'center' }}>
                            UNITÉ MONÉTAIRE :<br />
                            <span style={{ fontWeight: 600, color: '#000', fontSize: '9pt' }}>{cert.currency_code}</span>
                        </td>
                        <td colSpan={2} style={{ ...cell, fontWeight: 700, color: blueColor, fontSize: '7.5pt', textAlign: 'center' }}>
                            COURS :<br />
                            <span style={{ fontWeight: 600, color: '#000', fontSize: '9pt' }}>{cert.exchange_rate ?? '1'}</span>
                        </td>
                    </tr>
                    <tr>
                        <td colSpan={6} style={{ ...cell }}>
                            <span style={{ fontSize: '7.5pt', fontWeight: 700, color: blueColor }}>VALEUR TOTALE D'ASSURANCE (en lettres) : </span>
                            <span style={{ fontSize: '8pt', fontStyle: 'italic' }}>{cert.insured_value_letters}</span>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ TEXTE LÉGAL ══ */}
            <div style={{ fontSize: '6pt', color: '#333', lineHeight: 1.5, marginBottom: '5pt', padding: '0 2pt' }}>
                Conformément aux Conditions Générales, l'assureur pourra déduire de l'indemnité de sinistre lui incombant, la prime afférente
                aux risques garantis par le présent ordre si cette prime n'a pas été payée.
                Toutes indemnités pour pertes ou avaries seront payées entre les mains du porteur de l'original de l'ordre d'assurance et des
                pièces justificatives de la réclamation (voir au verso).
            </div>

            {/* ══ PARTIE BASSE ══ */}
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1pt solid ${blueColor}` }}>
                <tbody>
                    <tr>
                        {/* Cachets */}
                        <td style={{ width: '35%', borderRight: `1pt solid ${blueColor}`, padding: '6pt', verticalAlign: 'top' }}>
                            <div style={{ fontSize: '7pt', fontWeight: 700, color: blueColor, textAlign: 'center', marginBottom: '28pt' }}>
                                CACHET ET SIGNATURE<br />DE L'ASSURÉ
                            </div>
                            <div style={{ fontSize: '7pt', fontWeight: 700, color: blueColor, textAlign: 'center' }}>
                                CACHET ET SIGNATURE DE<br />L'ASSUREUR
                            </div>
                            <div style={{ width: 65, height: 65, border: '0.5pt dashed #aaa', borderRadius: '50%', margin: '5pt auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {cert.issued_by && (
                                    <div style={{ fontSize: '5.5pt', textAlign: 'center', color: '#555' }}>
                                        {cert.issued_by.first_name}<br />{cert.issued_by.last_name}
                                    </div>
                                )}
                            </div>
                        </td>

                        {/* Décompte de prime */}
                        <td style={{ width: '65%', padding: 0, verticalAlign: 'top' }}>
                            <div style={{ padding: '3pt 6pt 2pt', textAlign: 'center', fontWeight: 900, fontSize: '9pt', color: blueColor, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `0.5pt solid ${blueColor}`, background: '#e8eef8' }}>
                                Décompte de Prime
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5pt' }}>
                                <thead>
                                    <tr style={{ background: '#f0f4fb', fontWeight: 700, color: blueColor, fontSize: '7pt' }}>
                                        <th style={{ border: `0.5pt solid #aaa`, padding: '2pt 5pt', width: '55%', textAlign: 'left' }}></th>
                                        <th style={{ border: `0.5pt solid #aaa`, padding: '2pt 5pt', width: '22%', textAlign: 'center' }}>TAUX %</th>
                                        <th style={{ border: `0.5pt solid #aaa`, padding: '2pt 5pt', width: '23%', textAlign: 'center' }}>MONTANT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { label: 'RO / CFA',          line: ro },
                                        { label: 'RG / CFA',          line: rg },
                                        { label: 'SURPRIME',           line: surprime },
                                    ].map(({ label: lbl2, line }) => (
                                        <tr key={lbl2}>
                                            <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt' }}>{lbl2}</td>
                                            <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', textAlign: 'right' }}>{line ? fmtRate(line.rate) : ''}</td>
                                            <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', textAlign: 'right', fontWeight: 600 }}>{line ? fmt(line.amount, cert.currency_code) : ''}</td>
                                        </tr>
                                    ))}
                                    <tr style={{ borderTop: `0.5pt solid ${blueColor}` }}>
                                        <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', fontWeight: 700 }}>TOTAL</td>
                                        <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt' }}></td>
                                        <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', textAlign: 'right', fontWeight: 700 }}>{primeNette ? fmt(primeNette.amount, cert.currency_code) : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt' }}>COÛT DE POLICE</td>
                                        <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', textAlign: 'right' }}>{coutPolice ? fmtRate(coutPolice.rate) : ''}</td>
                                        <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', textAlign: 'right', fontWeight: 600 }}>{coutPolice ? fmt(coutPolice.amount, cert.currency_code) : ''}</td>
                                    </tr>
                                    <tr>
                                        <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt' }}>TAXES</td>
                                        <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', textAlign: 'right' }}>{taxe ? fmtRate(taxe.rate) : ''}</td>
                                        <td style={{ border: '0.5pt solid #ccc', padding: '3pt 5pt', textAlign: 'right', fontWeight: 600 }}>{taxe ? fmt(taxe.amount, cert.currency_code) : ''}</td>
                                    </tr>
                                    <tr style={{ background: '#e8eef8', borderTop: `1pt solid ${blueColor}` }}>
                                        <td style={{ border: `0.5pt solid ${blueColor}`, padding: '3pt 5pt', fontWeight: 700, color: blueColor }}>PRIME A PAYER</td>
                                        <td style={{ border: `0.5pt solid ${blueColor}`, padding: '3pt 5pt' }}></td>
                                        <td style={{ border: `0.5pt solid ${blueColor}`, padding: '3pt 5pt', textAlign: 'right', fontWeight: 900, fontSize: '9pt' }}>
                                            {fmt(primeAPayer, cert.currency_code)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* ══ IMPORTANT ══ */}
            <div style={{ marginTop: '5pt', padding: '3pt 6pt', fontSize: '7pt', textAlign: 'center', color: blueColor }}>
                <strong>IMPORTANT</strong> — LE PRÉSENT ORDRE D'ASSURANCE NE VAUT CERTIFICAT D'ASSURANCE QUE REVÊTU DE LA SIGNATURE ET DU CACHET DE L'ASSUREUR.
            </div>

        </div>
    );
}
