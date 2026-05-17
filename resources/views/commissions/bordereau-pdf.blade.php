<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Bordereau de commissions</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 9px; color: #1e293b; }
        /* Header */
        .header { background: #1e3a8a; color: #fff; padding: 12px 16px; margin-bottom: 14px; }
        .header-title { font-size: 14px; font-weight: bold; }
        .header-sub { font-size: 9px; color: rgba(255,255,255,0.7); margin-top: 3px; }
        .header-meta { font-size: 8px; color: rgba(255,255,255,0.6); margin-top: 6px; }
        /* KPIs */
        .kpi-row { display: table; width: 100%; margin-bottom: 12px; }
        .kpi-cell { display: table-cell; width: 25%; padding: 8px 10px; border: 1px solid #e2e8f0; text-align: center; }
        .kpi-val { font-size: 12px; font-weight: bold; color: #1e293b; }
        .kpi-val.blue { color: #1d4ed8; }
        .kpi-val.green { color: #15803d; }
        .kpi-lbl { font-size: 8px; color: #94a3b8; text-transform: uppercase; margin-top: 2px; }
        /* Table */
        table { width: 100%; border-collapse: collapse; }
        thead { background: #1e3a8a; color: #fff; }
        th { padding: 6px 8px; font-size: 8px; font-weight: bold; text-align: left; }
        th.r { text-align: right; }
        td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9; font-size: 8px; }
        td.r { text-align: right; font-family: monospace; }
        td.bold { font-weight: bold; }
        tr:nth-child(even) td { background: #f8fafc; }
        /* Footer table */
        tfoot td { background: #f1f5f9 !important; font-weight: bold; border-top: 2px solid #1e3a8a; font-family: monospace; }
        /* Page footer */
        .page-footer { position: fixed; bottom: 10px; left: 0; right: 0; text-align: center; font-size: 7px; color: #94a3b8; }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-title">NSIA Transport — Bordereau de Commissions</div>
        <div class="header-sub">Primes brutes, commissions et primes nettes</div>
        <div class="header-meta">
            Période : {{ \Carbon\Carbon::parse($from)->format('d/m/Y') }} au {{ \Carbon\Carbon::parse($to)->format('d/m/Y') }}
            &nbsp;|&nbsp; Généré le {{ now()->format('d/m/Y à H:i') }}
            &nbsp;|&nbsp; Par : {{ $user->first_name }} {{ $user->last_name }}
        </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-row">
        <div class="kpi-cell">
            <div class="kpi-val">{{ $transactions->count() }}</div>
            <div class="kpi-lbl">Certificats</div>
        </div>
        <div class="kpi-cell">
            <div class="kpi-val">{{ number_format($totals['prime_brute'], 2, ',', ' ') }}</div>
            <div class="kpi-lbl">Prime brute totale</div>
        </div>
        <div class="kpi-cell">
            <div class="kpi-val blue">{{ number_format($totals['commission'], 2, ',', ' ') }}</div>
            <div class="kpi-lbl">Commission totale</div>
        </div>
        <div class="kpi-cell">
            <div class="kpi-val green">{{ number_format($totals['prime_nette'], 2, ',', ' ') }}</div>
            <div class="kpi-lbl">Prime nette totale</div>
        </div>
    </div>

    <!-- Table -->
    <table>
        <thead>
            <tr>
                <th>N° Certificat</th>
                <th>Assuré</th>
                <th>Contrat</th>
                <th>Courtier</th>
                <th>Devise</th>
                <th>Période</th>
                <th class="r">Prime brute</th>
                <th class="r">Taux</th>
                <th class="r">Commission</th>
                <th class="r">Prime nette</th>
                <th>Statut</th>
            </tr>
        </thead>
        <tbody>
            @foreach($transactions as $tx)
            <tr>
                <td class="bold" style="font-family: monospace;">
                    {{ $tx->certificate?->certificate_number ?? '—' }}
                </td>
                <td>{{ \Str::limit($tx->certificate?->insured_name ?? '—', 25) }}</td>
                <td>{{ $tx->contract?->contract_number ?? '—' }}</td>
                <td>{{ $tx->broker?->name ?? '—' }}</td>
                <td>{{ $tx->currency_code }}</td>
                <td>{{ $tx->period_month }}</td>
                <td class="r">{{ number_format($tx->prime_brute, 2, ',', ' ') }}</td>
                <td class="r">{{ number_format($tx->rate_pct, 2, ',', '') }}%</td>
                <td class="r" style="color: #1d4ed8;">{{ number_format($tx->commission, 2, ',', ' ') }}</td>
                <td class="r" style="color: #15803d;">{{ number_format($tx->prime_nette, 2, ',', ' ') }}</td>
                <td>{{ $tx->status }}</td>
            </tr>
            @endforeach
        </tbody>
        <tfoot>
            <tr>
                <td colspan="6">TOTAL</td>
                <td class="r">{{ number_format($totals['prime_brute'], 2, ',', ' ') }}</td>
                <td></td>
                <td class="r" style="color: #1d4ed8;">{{ number_format($totals['commission'], 2, ',', ' ') }}</td>
                <td class="r" style="color: #15803d;">{{ number_format($totals['prime_nette'], 2, ',', ' ') }}</td>
                <td></td>
            </tr>
        </tfoot>
    </table>

    <div class="page-footer">
        NSIA Transport — Confidentiel — Page <span class="pagenum"></span>
    </div>
</body>
</html>