<?php

namespace App\Http\Controllers\Admin;
 
use App\Http\Controllers\Controller;
use App\Models\Broker;
use App\Models\CommissionRule;
use App\Models\CommissionTransaction;
use App\Models\InsuranceContract;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
 
class CommissionController extends Controller
{
    public function rules(Request $request): Response
    {
        $user  = $request->user();
        $isSA  = $user->hasRole('super_admin');
 
        $rules = CommissionRule::with(['broker:id,name,code', 'contract:id,contract_number', 'createdBy:id,first_name,last_name'])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->broker_id, fn ($q) => $q->where('broker_id', $request->broker_id))
            ->orderBy('effective_date', 'desc')
            ->paginate(20)
            ->withQueryString();
 
        $brokers = Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->orderBy('name')->get(['id', 'name', 'code']);
 
        $contracts = InsuranceContract::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->where('status', 'ACTIVE')
            ->orderBy('contract_number')
            ->get(['id', 'contract_number', 'insured_name', 'broker_id']);
 
        return Inertia::render('admin/commissions/rules', [
            'rules'     => $rules,
            'brokers'   => $brokers,
            'contracts' => $contracts,
            'baseTypes' => \App\Models\CommissionRule::BASE_TYPE_LABELS,
            'filters'   => $request->only(['broker_id']),
            'isSA'      => $isSA,
        ]);
    }
 
    public function storeRule(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(! ($user->hasRole('admin_filiale') || $user->hasRole('super_admin')), 403);
 
        $request->validate([
            'broker_id'      => ['required', 'uuid', 'exists:brokers,id'],
            'contract_id'    => ['nullable', 'uuid', 'exists:insurance_contracts,id'],
            'rate_pct'            => ['required', 'numeric', 'min:0', 'max:100'],
            'base_type'           => ['required', 'string', 'in:prime_total,insured_value,custom_amount'],
            'custom_base_amount'  => ['nullable', 'numeric', 'min:0', 'required_if:base_type,custom_amount'],
            'effective_date'      => ['required', 'date'],
            'end_date'            => ['nullable', 'date', 'after:effective_date'],
            'notes'               => ['nullable', 'string', 'max:255'],
        ]);
 
        CommissionRule::create([
            'tenant_id'      => $user->tenant_id,
            'broker_id'      => $request->broker_id,
            'contract_id'    => $request->contract_id,
            'rate_pct'           => $request->rate_pct,
            'base_type'          => $request->base_type ?? 'prime_total',
            'custom_base_amount' => $request->custom_base_amount,
            'effective_date'     => $request->effective_date,
            'end_date'       => $request->end_date,
            'is_active'      => true,
            'notes'          => $request->notes,
            'created_by'     => $user->id,
        ]);
 
        return back()->with('status', 'Règle de commission créée.');
    }
 
    public function toggleRule(Request $request, CommissionRule $rule): RedirectResponse
    {
        $this->authorizeTenant($rule->tenant_id);
        $rule->update(['is_active' => ! $rule->is_active]);
        return back()->with('status', $rule->is_active ? 'Règle activée.' : 'Règle désactivée.');
    }
 
    // ── US-040 : Bordereau commissions ────────────────────────
    public function bordereau(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');
 
        $request->validate([
            'period_from' => ['nullable', 'date'],
            'period_to'   => ['nullable', 'date', 'after_or_equal:period_from'],
            'broker_id'   => ['nullable', 'uuid'],
        ]);
 
        $periodFrom = $request->period_from ?? now()->startOfMonth()->toDateString();
        $periodTo   = $request->period_to   ?? now()->endOfMonth()->toDateString();
 
        $query = CommissionTransaction::with([
                'certificate:id,certificate_number,voyage_date,insured_name',
                'contract:id,contract_number',
                'broker:id,name,code',
            ])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->broker_id, fn ($q) => $q->where('broker_id', $request->broker_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->whereHas('certificate', fn ($q) =>
                $q->whereBetween('issued_at', [$periodFrom . ' 00:00:00', $periodTo . ' 23:59:59'])
            )
            ->orderBy('period_month', 'desc')
            ->paginate(25)
            ->withQueryString();
 
        // Totaux
        $totalsQuery = CommissionTransaction::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->broker_id, fn ($q) => $q->where('broker_id', $request->broker_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->whereHas('certificate', fn ($q) =>
                $q->whereBetween('issued_at', [$periodFrom . ' 00:00:00', $periodTo . ' 23:59:59'])
            );
 
        $totals = [
            'prime_brute' => (float) $totalsQuery->sum('prime_brute'),
            'commission'  => (float) $totalsQuery->sum('commission'),
            'prime_nette' => (float) $totalsQuery->sum('prime_nette'),
            'count'       => $totalsQuery->count(),
        ];
 
        $brokers = Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->orderBy('name')->get(['id', 'name', 'code']);
 
        return Inertia::render('admin/commissions/bordereau', [
            'transactions' => $query,
            'totals'       => $totals,
            'brokers'      => $brokers,
            'filters'      => $request->only(['period_from', 'period_to', 'broker_id', 'status']),
            'isSA'         => $isSA,
        ]);
    }
 
    // ── Export ────────────────────────────────────────────────
    public function export(Request $request, string $format): \Symfony\Component\HttpFoundation\Response
    {
        $user       = $request->user();
        $isSA       = $user->hasRole('super_admin');
        $periodFrom = $request->period_from ?? now()->startOfMonth()->toDateString();
        $periodTo   = $request->period_to   ?? now()->endOfMonth()->toDateString();
 
        $transactions = CommissionTransaction::with([
                'certificate:id,certificate_number,voyage_date,insured_name',
                'contract:id,contract_number',
                'broker:id,name,code',
            ])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->broker_id, fn ($q) => $q->where('broker_id', $request->broker_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->whereHas('certificate', fn ($q) =>
                $q->whereBetween('issued_at', [$periodFrom . ' 00:00:00', $periodTo . ' 23:59:59'])
            )
            ->orderBy('period_month')
            ->get();
 
        $filename = "bordereau_commissions_{$periodFrom}_{$periodTo}";
 
        return match ($format) {
            'csv'   => $this->exportCsv($transactions, $filename),
            'xlsx'  => $this->exportXlsx($transactions, $filename),
            'pdf'   => $this->exportPdf($transactions, $filename, $periodFrom, $periodTo, $user),
            default => abort(400, 'Format non supporté.'),
        };
    }
 
    private function exportCsv($transactions, string $filename): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        return response()->streamDownload(function () use ($transactions) {
            $out = fopen('php://output', 'w');
            // BOM UTF-8 pour Excel
            fputs($out, "\xEF\xBB\xBF");
            fputcsv($out, [
                'N° Certificat', 'Assuré', 'Date émission', 'N° Contrat',
                'Courtier', 'Devise', 'Prime brute', 'Taux (%)', 'Commission', 'Prime nette', 'Période', 'Statut',
            ], ';');
            foreach ($transactions as $t) {
                fputcsv($out, [
                    $t->certificate?->certificate_number,
                    $t->certificate?->insured_name,
                    $t->certificate?->voyage_date,
                    $t->contract?->contract_number,
                    $t->broker?->name,
                    $t->currency_code,
                    number_format($t->prime_brute, 2, ',', ' '),
                    number_format($t->rate_pct, 2, ',', ''),
                    number_format($t->commission, 2, ',', ' '),
                    number_format($t->prime_nette, 2, ',', ' '),
                    $t->period_month,
                    $t->status,
                ], ';');
            }
            fclose($out);
        }, "{$filename}.csv", ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
 
    private function exportXlsx($transactions, string $filename): \Symfony\Component\HttpFoundation\Response
    {
        // Utilise PhpSpreadsheet (composer require phpoffice/phpspreadsheet)
        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();
        $sheet       = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Bordereau commissions');
 
        $headers = [
            'N° Certificat', 'Assuré', 'Date émission', 'N° Contrat',
            'Courtier', 'Devise', 'Prime brute', 'Taux (%)', 'Commission', 'Prime nette', 'Période', 'Statut',
        ];
        $sheet->fromArray([$headers], null, 'A1');
 
        // Style entête
        $sheet->getStyle('A1:L1')->applyFromArray([
            'font'      => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill'      => ['fillType' => 'solid', 'startColor' => ['argb' => 'FF1E3A8A']],
            'alignment' => ['horizontal' => 'center'],
        ]);
 
        $row = 2;
        foreach ($transactions as $t) {
            $sheet->fromArray([[
                $t->certificate?->certificate_number,
                $t->certificate?->insured_name,
                $t->certificate?->voyage_date,
                $t->contract?->contract_number,
                $t->broker?->name,
                $t->currency_code,
                (float) $t->prime_brute,
                (float) $t->rate_pct,
                (float) $t->commission,
                (float) $t->prime_nette,
                $t->period_month,
                $t->status,
            ]], null, "A{$row}");
            $row++;
        }
 
        // Auto-width
        foreach (range('A', 'L') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }
 
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $path   = storage_path("app/temp/{$filename}.xlsx");
        @mkdir(dirname($path), 0755, true);
        $writer->save($path);
 
        return response()->download($path, "{$filename}.xlsx")->deleteFileAfterSend();
    }
 
    private function exportPdf($transactions, string $filename, string $from, string $to, $user): \Symfony\Component\HttpFoundation\Response
    {
        $totals = [
            'prime_brute' => $transactions->sum('prime_brute'),
            'commission'  => $transactions->sum('commission'),
            'prime_nette' => $transactions->sum('prime_nette'),
        ];
 
        $html = view('commissions.bordereau-pdf', compact('transactions', 'totals', 'from', 'to', 'user'))->render();
 
        $dompdf = new \Dompdf\Dompdf(['isRemoteEnabled' => true]);
        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();
 
        return response($dompdf->output(), 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}.pdf\"",
        ]);
    }
 
    private function authorizeTenant(string $tenantId): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        if ((string) $user->tenant_id !== (string) $tenantId) abort(403);
    }

}