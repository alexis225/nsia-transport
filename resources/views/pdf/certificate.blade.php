<!DOCTYPE html>
<html lang="{{ $template?->is_bilingual ? 'fr' : 'fr' }}">
<head>
    <meta charset="UTF-8"/>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>{{ $certificate->certificate_number }}</title>
    <style>
        /* ── Reset ── */
        * { margin:0; padding:0; box-sizing:border-box; }
        body {
            font-family: 'DejaVu Sans', Arial, sans-serif;
            font-size: 9pt;
            color: #1a1a2e;
            background: #fff;
        }

        /* ── Page ── */
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm 12mm;
            position: relative;
            page-break-after: always;
        }
        .verso-page {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm 12mm;
            position: relative;
        }

        /* ── Filigrane ORIGINAL ASSURE ── */
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 52pt;
            font-weight: 900;
            color: rgba(30, 58, 138, 0.05);
            white-space: nowrap;
            z-index: 0;
            letter-spacing: 0.1em;
            pointer-events: none;
        }

        /* Filigrane latéral (ordres d'assurance) */
        .watermark-side {
            position: fixed;
            left: 5mm;
            top: 50%;
            transform: translateY(-50%) rotate(-90deg);
            font-size: 8pt;
            font-weight: 700;
            color: rgba(30, 58, 138, 0.12);
            letter-spacing: 0.3em;
            white-space: nowrap;
            z-index: 0;
            text-transform: uppercase;
        }

        .content { position: relative; z-index: 1; }

        /* ── En-tête ── */
        .header {
            display: table;
            width: 100%;
            border-bottom: 2pt solid #1e3a8a;
            padding-bottom: 6mm;
            margin-bottom: 5mm;
        }
        .header-logo  { display: table-cell; width: 35%; vertical-align: top; }
        .header-title { display: table-cell; width: 40%; vertical-align: middle; text-align: center; }
        .header-num   { display: table-cell; width: 25%; vertical-align: top; text-align: right; }

        .logo-img { max-width: 100px; max-height: 55px; }
        .logo-placeholder {
            display: inline-block;
            border: 1pt solid #6366f1;
            background: #e0e7ff;
            padding: 4pt 8pt;
            font-size: 10pt;
            font-weight: 700;
            color: #4f46e5;
            border-radius: 3pt;
        }
        .company-info { font-size: 7pt; color: #475569; line-height: 1.5; margin-top: 3pt; }
        .company-name { font-weight: 700; font-size: 8.5pt; color: #1a1a2e; }

        .cert-title {
            font-size: 14pt;
            font-weight: 700;
            color: #1e3a8a;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .cert-subtitle { font-size: 8pt; color: #64748b; margin-top: 2pt; }
        .cert-obligation { font-size: 7.5pt; color: #64748b; margin-top: 3pt; }
        .cert-city { font-size: 9pt; margin-top: 4pt; }
        .cert-police { font-size: 8.5pt; margin-top: 3pt; }

        .cert-num { font-size: 18pt; font-weight: 700; color: #1e3a8a; letter-spacing: 0.1em; }
        .cert-num-label { font-size: 7.5pt; color: #64748b; }
        .cert-original { font-size: 7pt; color: #64748b; font-style: italic; margin-top: 3pt; line-height: 1.4; border: 0.5pt solid #e2e8f0; padding: 2pt 4pt; }

        /* ── Sections ── */
        .section {
            border: 0.7pt solid #94a3b8;
            margin-bottom: 4pt;
        }
        .section-title {
            background: #1e3a8a;
            color: #fff;
            padding: 2pt 6pt;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .section-body { padding: 4pt 6pt; }

        /* ── Grille 2 colonnes ── */
        .grid2 { display: table; width: 100%; }
        .grid2-cell { display: table-cell; width: 50%; padding: 2pt 4pt; border-right: 0.5pt solid #e2e8f0; vertical-align: top; }
        .grid2-cell:last-child { border-right: none; }

        .field-label { font-size: 7pt; color: #64748b; margin-bottom: 2pt; }
        .field-value { border-bottom: 0.5pt solid #94a3b8; min-height: 12pt; font-size: 8.5pt; padding-bottom: 1pt; }
        .field-value-filled { font-size: 8.5pt; font-weight: 500; color: #1a1a2e; }

        /* ── Voyage ── */
        .voyage-wrap { display: table; width: 100%; }
        .voyage-label {
            display: table-cell;
            width: 18mm;
            vertical-align: middle;
            font-size: 13pt;
            font-weight: 700;
            color: #1e3a8a;
            letter-spacing: 0.1em;
            border-right: 0.5pt solid #e2e8f0;
            padding-right: 4pt;
            writing-mode: vertical-rl;
            text-orientation: mixed;
        }
        .voyage-content { display: table-cell; vertical-align: top; }

        .voyage-row { padding: 2pt 4pt; border-bottom: 0.5pt solid #f1f5f9; }
        .voyage-row:last-child { border-bottom: none; }
        .voyage-mode-row {
            padding: 4pt 6pt;
            font-size: 8pt;
        }
        .checkbox {
            display: inline-block;
            width: 8pt;
            height: 8pt;
            border: 0.7pt solid #475569;
            vertical-align: middle;
            margin-right: 2pt;
        }
        .checkbox-checked { background: #1e3a8a; }
        .mode-option { margin-right: 8pt; font-size: 8pt; }

        /* ── Tableau expédition ── */
        .exp-table { width: 100%; border-collapse: collapse; font-size: 8pt; }
        .exp-table th {
            background: #f1f5f9;
            border: 0.5pt solid #e2e8f0;
            padding: 3pt 4pt;
            font-size: 7pt;
            font-weight: 700;
            color: #475569;
            text-align: left;
        }
        .exp-table td {
            border: 0.5pt solid #e2e8f0;
            padding: 4pt 4pt;
            vertical-align: top;
        }
        .exp-table .total-row td {
            font-weight: 700;
            background: #f8fafc;
        }

        /* ── Bas de page : signatures + prime ── */
        .bottom-wrap { display: table; width: 100%; margin-top: 5pt; }
        .bottom-left  { display: table-cell; width: 45%; vertical-align: top; padding-right: 6pt; }
        .bottom-right { display: table-cell; width: 55%; vertical-align: top; }

        .sign-box {
            border: 0.7pt solid #94a3b8;
            padding: 4pt 6pt;
            margin-bottom: 5pt;
            min-height: 25mm;
        }
        .sign-label { font-size: 7pt; font-weight: 700; color: #64748b; text-transform: uppercase; text-align: center; }

        /* Décompte prime */
        .prime-box { border: 0.7pt solid #94a3b8; }
        .prime-title {
            background: #1e3a8a;
            color: #fff;
            padding: 2pt 6pt;
            font-size: 7.5pt;
            font-weight: 700;
            text-transform: uppercase;
        }
        .prime-table { width: 100%; border-collapse: collapse; }
        .prime-table th {
            background: #f8fafc;
            border-bottom: 0.5pt solid #e2e8f0;
            padding: 2pt 4pt;
            font-size: 7pt;
            font-weight: 700;
            color: #475569;
        }
        .prime-table td {
            padding: 2pt 4pt;
            font-size: 8pt;
            border-bottom: 0.5pt solid #f1f5f9;
            border-right: 0.5pt solid #f1f5f9;
        }
        .prime-table td:last-child { border-right: none; }
        .prime-table .total-row td { font-weight: 700; background: #f8fafc; }

        /* ── Footer important ── */
        .footer-important {
            margin-top: 5pt;
            padding: 4pt 6pt;
            background: #f8fafc;
            border: 0.5pt solid #e2e8f0;
            font-size: 7pt;
            color: #475569;
            line-height: 1.5;
        }
        .footer-important strong { color: #1e293b; }

        /* ══════════════════════════════════
           VERSO
        ══════════════════════════════════ */
        .verso-header {
            text-align: center;
            border-bottom: 1.5pt solid #1e3a8a;
            padding-bottom: 5pt;
            margin-bottom: 8pt;
        }
        .verso-header-title { font-size: 11pt; font-weight: 700; color: #1e3a8a; text-transform: uppercase; }

        .verso-highlight {
            border: 0.7pt solid #bae6fd;
            background: #f0f9ff;
            padding: 5pt 8pt;
            margin-bottom: 8pt;
            font-size: 8pt;
            line-height: 1.6;
        }

        .verso-avarie {
            text-align: center;
            border: 1pt solid #1e3a8a;
            border-radius: 2pt;
            padding: 5pt 8pt;
            margin-bottom: 8pt;
            font-size: 8.5pt;
        }
        .verso-avarie-title { font-weight: 700; color: #1e3a8a; font-size: 9pt; margin-bottom: 3pt; }

        .verso-grid { display: table; width: 100%; }
        .verso-col  { display: table-cell; width: 50%; vertical-align: top; padding-right: 6pt; }
        .verso-col:last-child { padding-right: 0; padding-left: 6pt; }

        .verso-section-title {
            font-size: 8.5pt;
            font-weight: 700;
            color: #1e3a8a;
            text-transform: uppercase;
            border-bottom: 1pt solid #1e3a8a;
            padding-bottom: 2pt;
            margin-bottom: 5pt;
            letter-spacing: 0.04em;
        }
        .verso-subtitle { font-size: 8pt; font-weight: 700; text-decoration: underline; margin: 5pt 0 3pt; }
        .verso-text { font-size: 8pt; color: #334155; line-height: 1.6; margin-bottom: 4pt; }
        .verso-text ul { padding-left: 10pt; }
        .verso-text li { margin-bottom: 2pt; }

        .verso-footer {
            margin-top: 8pt;
            padding-top: 5pt;
            border-top: 1pt solid #1e3a8a;
            text-align: center;
            font-size: 7.5pt;
            color: #64748b;
        }
    </style>
</head>
<body>

{{-- ═══════════════════════════════════════════════
     RECTO
═══════════════════════════════════════════════ --}}
<div class="page">

    {{-- Filigranes --}}
    <div class="watermark">ORIGINAL ASSURE</div>
    @if($template?->type === 'ordre_assurance')
        <div class="watermark-side">ORIGINAL ASSURE</div>
    @endif

    <div class="content">

        {{-- En-tête --}}
        <div class="header">
            <div class="header-logo">
                @if($logoBase64)
                    <img src="{{ $logoBase64 }}" class="logo-img" alt="Logo"/>
                @else
                    <div class="logo-placeholder">NSIA<br/>{{ $certificate->tenant?->code }}</div>
                @endif
                @if($template)
                    <div class="company-info" style="margin-top: 4pt;">
                        <div class="company-name">{{ $template->company_name }}</div>
                        @if($template->company_address) <div>{{ $template->company_address }}</div> @endif
                        @if($template->company_phone)   <div>Tél : {{ $template->company_phone }}</div> @endif
                        @if($template->company_email)   <div>{{ $template->company_email }}</div> @endif
                        @if($template->company_rccm)    <div>N° {{ $template->company_rccm }}</div> @endif
                        @if($template->legal_framework)
                            <div style="margin-top: 2pt; font-style: italic; font-size: 6.5pt;">{{ $template->legal_framework }}</div>
                        @endif
                    </div>
                @endif
            </div>

            <div class="header-title">
                @if($template?->type === 'certificat_assurance')
                    <div class="cert-title">CERTIFICAT D'ASSURANCE</div>
                    @if($template->is_bilingual)
                        <div class="cert-subtitle">CERTIFICATE OF INSURANCE</div>
                    @endif
                @else
                    <div class="cert-title">ORDRE D'ASSURANCE</div>
                    <div class="cert-obligation">VALANT CERTIFICAT D'ASSURANCE OBLIGATOIRE</div>
                @endif

                @if($template?->city)
                    <div class="cert-city">
                        A {{ $template->city }}, LE &nbsp;
                        <span style="display: inline-block; width: 50pt; border-bottom: 0.7pt solid #000;">
                            {{ $certificate->issued_at?->format('d/m/Y') ?? '' }}
                        </span>
                    </div>
                @endif
                <div class="cert-police">
                    Suivant POLICE N° &nbsp;
                    <strong>{{ $certificate->policy_number }}</strong>
                </div>
            </div>

            <div class="header-num">
                <div class="cert-num-label">{{ $template?->number_prefix ?? 'N°' }}</div>
                <div class="cert-num">{{ $certificate->certificate_number }}</div>
                @if($template?->type === 'certificat_assurance')
                    <div class="cert-original">
                        Sauf indication contraire, le présent certificat est<br/>
                        établi en un seul exemplaire <strong>ORIGINAL</strong>
                        @if($template->is_bilingual)
                            <br/><em style="font-size: 6pt;">Unless otherwise stated, this certificate constitutes the sole original document</em>
                        @endif
                    </div>
                @endif
                @if($template?->company_capital)
                    <div style="font-size: 6.5pt; color: #94a3b8; margin-top: 4pt; text-align: right;">
                        S.A. au Capital de {{ $template->company_capital }}<br/>entièrement libéré
                    </div>
                @endif
            </div>
        </div>

        {{-- Assuré --}}
        <div class="section">
            <div class="section-body">
                <table style="width: 100%;">
                    <tr>
                        <td style="width: 65%; vertical-align: top;">
                            <div style="font-size: 8pt; font-weight: 700; color: #1e3a8a; margin-bottom: 2pt;">
                                {{ $template?->is_bilingual ? 'ASSURÉ / INSURED' : 'ASSURE' }}
                            </div>
                            <div style="font-size: 7.5pt; color: #475569; margin-bottom: 3pt;">
                                {{ $template?->is_bilingual
                                    ? 'Agissant tant pour son compte que pour le compte de qui il appartiendra / Acting for his own account as well as for account of whom it may concern'
                                    : 'Agissant tant pour son compte que pour celui de qui il appartiendra' }}
                            </div>
                            <div class="field-value-filled" style="font-size: 10pt;">
                                {{ $certificate->insured_name }}
                            </div>
                            @if($certificate->insured_ref)
                                <div style="font-size: 7.5pt; color: #64748b; margin-top: 2pt;">
                                    Réf. : {{ $certificate->insured_ref }}
                                </div>
                            @endif
                        </td>
                        @if($template?->type === 'certificat_assurance')
                        <td style="width: 35%; vertical-align: top; padding-left: 8pt; border-left: 0.5pt solid #e2e8f0;">
                            <div class="field-label">{{ $template->is_bilingual ? 'Application à la police N° / Application to open cover' : 'Application à la police N°' }}</div>
                            <div class="field-value">{{ $certificate->policy_number }}</div>
                            <div class="field-label" style="margin-top: 5pt;">Date</div>
                            <div class="field-value">{{ $certificate->voyage_date?->format('d/m/Y') }}</div>
                        </td>
                        @endif
                    </tr>
                </table>
            </div>
        </div>

        {{-- Voyage --}}
        <div class="section">
            <div class="voyage-wrap">
                <div class="voyage-label">VOYAGE</div>
                <div class="voyage-content">
                    <div class="voyage-row">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 50%;">
                                    <span class="field-label">{{ $template?->is_bilingual ? 'Date de l\'expédition / Date of shipment' : 'Date de l\'expédition' }}</span><br/>
                                    <strong>{{ $certificate->voyage_date?->format('d/m/Y') }}</strong>
                                </td>
                                <td style="width: 50%; padding-left: 8pt;">
                                    <span class="field-label">Réf. Assuré</span><br/>
                                    {{ $certificate->insured_ref ?? '—' }}
                                </td>
                            </tr>
                        </table>
                    </div>
                    <div class="voyage-row">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 50%;">
                                    <span class="field-label">DE</span><br/>
                                    <strong>{{ $certificate->voyage_from }}</strong>
                                </td>
                                <td style="width: 50%; padding-left: 8pt;">
                                    <span class="field-label">À</span><br/>
                                    <strong>{{ $certificate->voyage_to }}</strong>
                                </td>
                            </tr>
                        </table>
                    </div>
                    @if($certificate->voyage_via)
                        <div class="voyage-row">
                            <span class="field-label">VIA</span>&nbsp; <strong>{{ $certificate->voyage_via }}</strong>
                        </div>
                    @endif

                    {{-- Mode transport --}}
                    @if($template?->has_flight_number || $template?->has_vessel_name)
                        <div class="voyage-row">
                            @if($template->has_vessel_name)
                                <span class="checkbox {{ $certificate->transport_type === 'SEA' ? 'checkbox-checked' : '' }}"></span>
                                <span class="mode-option">NAVIRE S/S {{ $certificate->vessel_name ? '— ' . $certificate->vessel_name : '' }}</span>
                            @endif
                            @if($template->has_flight_number)
                                <span class="checkbox {{ $certificate->transport_type === 'AIR' ? 'checkbox-checked' : '' }}"></span>
                                <span class="mode-option">AVION VOL N° {{ $certificate->flight_number ?? '' }}</span>
                            @endif
                        </div>
                    @endif

                    @if($template?->has_container_options)
                        <div class="voyage-mode-row">
                            @foreach([
                                'CONTAINER'    => 'CONTAINER',
                                'BOUT_EN_BOUT' => 'BOUT EN BOUT',
                                'GROUPAGE'     => 'GROUPAGE',
                                'CONVENTIONNEL'=> 'CONVENTIONNEL',
                            ] as $key => $label)
                                <span class="checkbox {{ $certificate->voyage_mode === $key ? 'checkbox-checked' : '' }}"></span>
                                <span class="mode-option">{{ $label }}</span>
                            @endforeach
                        </div>
                    @endif
                </div>
            </div>
        </div>

        {{-- Détail expédition --}}
        <div class="section">
            <div class="section-title" style="text-align: center;">
                {{ $template?->is_bilingual ? 'DÉTAIL DE L\'EXPÉDITION / DESCRIPTION OF CARGO' : 'DETAIL DE L\'EXPEDITION' }}
                <span style="font-weight: 400; font-size: 7pt; margin-left: 6pt;">
                    {{ $template?->is_bilingual ? '(One shipment only per certificate)' : '(Ne porter qu\'une seule expédition sur cet ordre)' }}
                </span>
            </div>
            <div class="section-body" style="padding: 0;">
                <table class="exp-table">
                    <thead>
                        <tr>
                            <th>{{ $template?->is_bilingual ? 'Marques / Marks' : 'Marques' }}</th>
                            <th>{{ $template?->is_bilingual ? 'Numéros colis / Packages' : 'Numéros et nombres de colis' }}</th>
                            <th>{{ $template?->is_bilingual ? 'Poids / Weight' : 'Poids' }}</th>
                            <th>{{ $template?->is_bilingual ? 'Nature marchandises / Description of cargo' : 'Nature des marchandises et de l\'emballage' }}</th>
                            <th style="text-align: right;">{{ $template?->is_bilingual ? 'Valeur / Insured value' : 'Valeur d\'assurance' }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($certificate->expedition_items ?? [] as $item)
                            <tr>
                                <td>{{ $item['marks'] ?? '' }}</td>
                                <td>{{ $item['package_numbers'] ?? '' }}
                                    @if(!empty($item['package_count'])) ({{ $item['package_count'] }}) @endif
                                </td>
                                <td>{{ $item['weight'] ?? '' }}</td>
                                <td>
                                    {{ $item['nature'] ?? '' }}
                                    @if(!empty($item['packaging'])) — {{ $item['packaging'] }} @endif
                                </td>
                                <td style="text-align: right; font-family: monospace;">
                                    {{ number_format($item['insured_value'] ?? 0, 0, ',', ' ') }}
                                </td>
                            </tr>
                        @endforeach
                        {{-- Lignes vides --}}
                        @for($i = count($certificate->expedition_items ?? []); $i < 4; $i++)
                            <tr><td>&nbsp;</td><td></td><td></td><td></td><td></td></tr>
                        @endfor
                    </tbody>
                </table>

                {{-- Valeur totale --}}
                <div style="padding: 4pt 6pt; border-top: 0.5pt solid #e2e8f0;">
                    <table style="width: 100%;">
                        <tr>
                            <td style="font-size: 8pt; font-weight: 700;">
                                {{ $template?->is_bilingual ? 'VALEUR TOTALE D\'ASSURANCE (en lettres) / TOTAL INSURED VALUE (in letters)' : 'VALEUR TOTALE D\'ASSURANCE (en lettres) :' }}
                            </td>
                            <td style="text-align: right; font-family: monospace; font-weight: 700; font-size: 10pt;">
                                {{ number_format((float)$certificate->insured_value, 0, ',', ' ') }} {{ $certificate->currency_code }}
                            </td>
                        </tr>
                        @if($certificate->insured_value_letters)
                            <tr>
                                <td colspan="2" style="font-size: 8pt; font-style: italic; color: #475569; padding-top: 3pt;">
                                    {{ $certificate->insured_value_letters }}
                                </td>
                            </tr>
                        @endif
                    </table>
                </div>

                {{-- Togo : Unité monétaire + Cours --}}
                @if($template?->has_currency_rate && $certificate->exchange_currency)
                    <div style="padding: 4pt 6pt; border-top: 0.5pt solid #e2e8f0;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="width: 33%; font-size: 8pt; font-weight: 700;">VALEUR D'ASSURANCE</td>
                                <td style="width: 33%; font-size: 8pt; font-weight: 700;">UNITÉ MONÉTAIRE</td>
                                <td style="width: 33%; font-size: 8pt; font-weight: 700;">COURS</td>
                            </tr>
                            <tr>
                                <td style="font-family: monospace;">{{ number_format((float)$certificate->insured_value, 0, ',', ' ') }}</td>
                                <td>{{ $certificate->exchange_currency }}</td>
                                <td>{{ $certificate->exchange_rate }}</td>
                            </tr>
                        </table>
                    </div>
                @endif
            </div>
        </div>

        {{-- Bas de page : signatures + décompte prime --}}
        <div class="bottom-wrap">
            {{-- Signatures --}}
            <div class="bottom-left">
                <div class="sign-box">
                    <div class="sign-label">
                        {{ $template?->is_bilingual ? 'Cachet et signature de l\'Assuré / Commercial stamp and signature of the Insured' : 'CACHET COMMERCIAL ET SIGNATURE DE L\'ASSURE' }}
                    </div>
                    @if($certificate->guarantee_mode)
                        <div style="margin-top: 8pt; font-size: 8pt;">
                            MODE DE GARANTIE : <strong>{{ $certificate->guarantee_mode }}</strong>
                        </div>
                    @endif
                </div>
                <div class="sign-box">
                    <div class="sign-label">
                        {{ $template?->is_bilingual ? 'Signature et cachet de l\'Assureur / Signature and stamp of the Insurer' : 'CACHET COMMERCIAL ET SIGNATURE DE L\'ASSUREUR' }}
                    </div>
                    @if($certificate->issuedBy)
                        <div style="margin-top: 5pt; font-size: 7.5pt; color: #64748b; text-align: center;">
                            Émis par {{ $certificate->issuedBy->first_name }} {{ $certificate->issuedBy->last_name }}<br/>
                            le {{ $certificate->issued_at?->format('d/m/Y à H:i') }}
                        </div>
                    @endif
                </div>
            </div>

            {{-- Décompte de prime --}}
            <div class="bottom-right">
                @if(!empty($certificate->prime_breakdown))
                    <div class="prime-box">
                        <div class="prime-title">
                            {{ $template?->is_bilingual ? 'DÉCOMPTE DE PRIME / PREMIUM BREAKDOWN' : 'DECOMPTE DE PRIME' }}
                        </div>
                        <table class="prime-table">
                            <thead>
                                <tr>
                                    <th style="text-align: left;">{{ $template?->is_bilingual ? 'Libellé / Label' : 'Libellé' }}</th>
                                    <th style="text-align: center;">{{ $template?->is_bilingual ? 'TAUX / RATE' : 'TAUX' }}</th>
                                    <th style="text-align: right;">{{ $template?->is_bilingual ? 'MONTANT / AMOUNT' : 'MONTANT' }}</th>
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($certificate->prime_breakdown as $line)
                                    <tr>
                                        <td>
                                            {{ $template?->is_bilingual && !empty($line['label_en'])
                                                ? $line['label'] . ' / ' . $line['label_en']
                                                : $line['label'] }}
                                        </td>
                                        <td style="text-align: center; font-family: monospace; font-size: 7.5pt;">
                                            {{ $line['rate'] > 0 ? number_format($line['rate'], 4) . '%' : '—' }}
                                        </td>
                                        <td style="text-align: right; font-family: monospace;">
                                            {{ $line['amount'] > 0 ? number_format($line['amount'], 0, ',', ' ') : '—' }}
                                        </td>
                                    </tr>
                                @endforeach
                                <tr class="total-row">
                                    <td colspan="2" style="text-align: right; font-size: 8.5pt;">
                                        {{ $template?->is_bilingual ? 'TOTAL / TOTAL PREMIUM' : 'TOTAL' }}
                                    </td>
                                    <td style="text-align: right; font-family: monospace; font-size: 9pt;">
                                        {{ number_format((float)$certificate->prime_total, 0, ',', ' ') }}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                @endif
            </div>
        </div>

        {{-- Footer IMPORTANT --}}
        @if($template?->footer_text)
            <div class="footer-important">
                <strong>IMPORTANT : </strong>{{ $template->footer_text }}
            </div>
        @endif

    </div>{{-- end content --}}
</div>{{-- end page --}}


{{-- ═══════════════════════════════════════════════
     VERSO — Formalités sinistre
═══════════════════════════════════════════════ --}}
<div class="verso-page">

    <div class="watermark" style="font-size: 60pt; color: rgba(30,58,138,0.03);">VERSO</div>

    <div class="content">

        {{-- Titre --}}
        <div class="verso-header">
            <div class="verso-header-title">TEMPS ET LIEU DES RISQUES ASSURÉS</div>
        </div>

        {{-- Texte risques --}}
        <div class="verso-highlight">
            <p style="margin-bottom: 4pt;">Les risques des assureurs commencent au moment où les facultés assurées conditionnées pour l'expédition quittent les magasins au point extrême de départ du <strong>Voyage Assuré</strong> et finissent au moment où elles entrent dans les magasins du destinataire ou de ses représentants ou ayants droit au lieu de destination dudit voyage.</p>
            <p style="margin-bottom: 4pt;">Sont considérés comme magasins du destinataire, de ses représentants ou ayants droit tout endroit, leur appartenant ou non, où ils font déposer les facultés à leur arrivée.</p>
            <p>Toute prise de livraison des objets garantis effectués par l'assuré, par l'expéditeur, par le destinataire ou par leurs représentants ou ayants droit, avant le moment où les risques doivent se terminer normalement aux termes du présent avenant, fait cesser les risques pour les assureurs.</p>
        </div>

        {{-- En cas d'avarie --}}
        <div class="verso-avarie">
            <div class="verso-avarie-title">EN CAS D'AVARIE À DESTINATION</div>
            <div>Pour les constatations, s'adresser à un <strong>COMMISSAIRE D'AVARIES AGRÉÉ</strong></div>
        </div>

        {{-- 2 colonnes --}}
        <div class="verso-grid">
            {{-- Gauche : Formalités --}}
            <div class="verso-col">
                <div class="verso-section-title">Rappel des formalités essentielles à remplir en cas de sinistre</div>

                <div class="verso-text">
                    <p><strong>1°</strong> Prendre, provoquer ou requérir toutes les mesures conservatoires ou de sauvetage que nécessite la situation pour protéger les biens assurés ou limiter les dommages dont ils sont atteints.</p>
                    <p style="margin-top: 4pt;"><strong>2°</strong> Requérir l'intervention du commissaire d'avaries <strong>au plus tard dans un délai de 30 jours</strong> après que les marchandises auront été déchargées du navire ou du véhicule de transport, ce délai étant réduit à 15 jours lorsque le lieu de destination est un point de l'intérieur.</p>
                    <p style="margin-top: 4pt;"><strong>3°</strong> Conserver tous droits et recours contre les transporteurs et/ou tous autres tiers responsables pour y subroger les assureurs.</p>
                    <p style="margin-top: 4pt;"><strong>4°</strong> Présenter la réclamation aux assureurs dans les plus brefs délais et en tout cas avant l'expiration de la prescription prévue au contrat.</p>
                </div>

                <div class="verso-subtitle">Conservation des recours</div>
                <div class="verso-text">
                    <p>Se conformer aux lois, usages et règlements locaux.</p>
                </div>

                <div class="verso-subtitle">1° En cas de dommages apparents</div>
                <div class="verso-text">
                    <p><strong>a)</strong> Avant de prendre livraison, faire sur le reçu de livraison des réserves précises.</p>
                    <p><strong>b)</strong> Au plus tard dans les 24 heures, confirmer ces réserves par lettre recommandée.</p>
                </div>

                <div class="verso-subtitle">2° En cas de dommages après la livraison</div>
                <div class="verso-text">
                    <p><strong>a)</strong> Arrêter aussitôt le déballage et convoquer le commissaire d'avaries.</p>
                    <p><strong>b)</strong> Expédier sans délai une lettre de réserves recommandée au transporteur.</p>
                </div>

                <div class="verso-subtitle">3° Dans tous les cas</div>
                <div class="verso-text">
                    <p>Convoquer l'expertise, au besoin par lettre recommandée, le transporteur et/ou autre tiers responsable.</p>
                </div>
            </div>

            {{-- Droite : Pièces à fournir --}}
            <div class="verso-col">
                <div class="verso-section-title">Rappel des pièces à fournir à l'appui de la réclamation</div>

                <div class="verso-subtitle">Pour toute réclamation :</div>
                <div class="verso-text">
                    <ul>
                        <li>Certificat d'assurance original</li>
                        <li>Copie des factures d'origine de la marchandise et des frais divers engagés</li>
                        <li>Titre de transport original</li>
                    </ul>
                </div>

                <div class="verso-subtitle">1° Avaries particulières</div>
                <div class="verso-text">
                    <ul>
                        <li>Certificat du commissaire d'avaries</li>
                        <li>Éventuellement : constat du transporteur, notes de poids, etc.</li>
                        <li>Correspondance relative aux réserves faites contre les responsables</li>
                    </ul>
                </div>

                <div class="verso-subtitle">2° Colis non délivrés</div>
                <div class="verso-text">
                    <ul>
                        <li>Attestation de non-livraison délivrée par le tiers présumé responsable</li>
                    </ul>
                </div>

                <div class="verso-subtitle">3° Avarie commune</div>
                <div class="verso-text">
                    <p><em>a) Contribution provisoire :</em></p>
                    <ul>
                        <li>Reçu de contribution provisoire régulièrement endossé en blanc</li>
                    </ul>
                    <p style="margin-top: 3pt;"><em>b) Contribution définitive :</em></p>
                    <ul>
                        <li>Extrait "parte in qua" du règlement d'avarie commune signé du dispacheur</li>
                        <li>Reçu de contribution définitive</li>
                    </ul>
                </div>

                <div class="verso-subtitle">4° Perte totale d'une cargaison</div>
                <div class="verso-text">
                    <ul>
                        <li>Lettre de l'armement avisant le destinataire de la perte du navire</li>
                        <li>Extrait du manifeste établissant que les marchandises se trouvaient bien à bord</li>
                    </ul>
                </div>

                <div class="verso-subtitle">Avarie commune</div>
                <div class="verso-text">
                    <p>Signer le compromis ou engagement à contribuer, en faisant précéder la signature de la mention manuscrite suivante : <em>"sous réserve de contester s'il y a lieu le principe même de l'avarie commune et les chiffres"</em></p>
                </div>
            </div>
        </div>

        {{-- Footer verso --}}
        <div class="verso-footer">
            {{ $template?->company_name }} — {{ $template?->company_address }}
            @if($template?->company_phone) — {{ $template->company_phone }} @endif
        </div>

    </div>
</div>

</body>
</html>