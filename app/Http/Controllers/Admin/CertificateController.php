<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Broker;
use App\Models\Certificate;
use App\Models\CertificateTemplate;
use App\Models\InsuranceContract;
use App\Services\CertificatePdfService;
use App\Services\CertificateQrService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * CertificateController — US-016/017/018
 * ============================================================
 * US-016 : Soumission (create + store + submit)
 * US-017 : CRUD (index + show + edit + update + destroy)
 * US-018 : Validation (issue + reject + cancel)
 * ============================================================
 */
class CertificateController extends Controller
{
    public function index(Request $request): Response{
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');
    
        $query = Certificate::with([
                'tenant:id,name,code',
                'contract:id,contract_number,insured_name',
                'submittedBy:id,first_name,last_name',
                'issuedBy:id,first_name,last_name',
            ])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id));
    
        // ── Filtres de base ───────────────────────────────────────
        $query->when($request->search, fn ($q) =>
            $q->where(fn ($q) =>
                $q->where('certificate_number', 'ilike', "%{$request->search}%")
                ->orWhere('insured_name',      'ilike', "%{$request->search}%")
                ->orWhere('voyage_from',        'ilike', "%{$request->search}%")
                ->orWhere('voyage_to',          'ilike', "%{$request->search}%")
                ->orWhere('policy_number',      'ilike', "%{$request->search}%")
            )
        )
        ->when($request->status,         fn ($q) => $q->where('status', $request->status))
        ->when($request->transport_type, fn ($q) => $q->where('transport_type', $request->transport_type))
        ->when($request->contract_id,    fn ($q) => $q->where('contract_id', $request->contract_id))
        ->when($request->date_from,      fn ($q) => $q->where('voyage_date', '>=', $request->date_from))
        ->when($request->date_to,        fn ($q) => $q->where('voyage_date', '<=', $request->date_to));
    
        // ── Filtres avancés ───────────────────────────────────────
        $query->when($request->tenant_id && $isSA, fn ($q) => $q->where('tenant_id', $request->tenant_id))
            ->when($request->issued_from, fn ($q) => $q->where('issued_at', '>=', $request->issued_from))
            ->when($request->issued_to,   fn ($q) => $q->where('issued_at', '<=', $request->issued_to))
            ->when($request->value_min,   fn ($q) => $q->where('insured_value', '>=', $request->value_min))
            ->when($request->value_max,   fn ($q) => $q->where('insured_value', '<=', $request->value_max))
            ->when($request->broker_id,   fn ($q) =>
                $q->whereHas('contract', fn ($q) =>
                    $q->where('broker_id', $request->broker_id)
                )
            );
    
        // ── Stats pour la barre de résumé ─────────────────────────
        $statsQuery = Certificate::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id));
        $stats = [
            'total'     => $statsQuery->count(),
            'issued'    => $statsQuery->where('status', Certificate::STATUS_ISSUED)->count(),
            'submitted' => (clone $statsQuery)->where('status', Certificate::STATUS_SUBMITTED)->count(),
            'draft'     => (clone $statsQuery)->where('status', Certificate::STATUS_DRAFT)->count(),
            'cancelled' => (clone $statsQuery)->where('status', Certificate::STATUS_CANCELLED)->count(),
        ];
    
        $certificates = $query->orderBy('created_at', 'desc')->paginate(20)->withQueryString();
    
        // ── Données pour les selects ───────────────────────────────
        $tenants = $isSA ? \App\Models\Tenant::orderBy('name')->get(['id','name','code']) : collect();
        $brokers = Broker::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
                        ->orderBy('name')->get(['id','name','code']);
        $contracts = InsuranceContract::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
                        ->orderBy('contract_number')->get(['id','contract_number','insured_name']);
        return Inertia::render('admin/certificates/index', [
            'certificates' => $certificates,
            'filters'      => $request->only([
                'search', 'status', 'transport_type', 'tenant_id', 'broker_id',
                'contract_id', 'date_from', 'date_to', 'issued_from', 'issued_to',
                'value_min', 'value_max',
            ]),
            'isSA'      => $isSA,
            'tenants'   => $tenants,
            'brokers'   => $brokers,
            'contracts' => $contracts,
            'stats'     => $stats,
            'can'       => [
                'create'   => $user->can('certificates.create'),
                'validate' => $user->can('certificates.validate'),
                'cancel'   => $user->can('certificates.cancel'),
                'export'   => $user->can('certificates.view'),
            ],
        ]);
    }

    // ── US-016 : Formulaire création ─────────────────────────
    public function create(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        // Contrats actifs disponibles
        $contracts = InsuranceContract::with('tenant:id,name,code')
            ->where('status', InsuranceContract::STATUS_ACTIVE)
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->orderBy('contract_number')
            ->get(['id', 'contract_number', 'insured_name', 'tenant_id', 'currency_code',
                   'rate_ro', 'rate_rg', 'rate_surprime', 'rate_accessories', 'rate_tax',
                   'subscription_limit', 'used_limit']);

        // Pré-sélection contrat depuis query string
        $selectedContract = null;
        if ($request->contract_id) {
            $selectedContract = InsuranceContract::with('tenant')->find($request->contract_id);
        }

        return Inertia::render('admin/certificates/create', [
            'contracts'        => $contracts,
            'selectedContract' => $selectedContract,
            'defaultTenantId'  => $user->tenant_id,
        ]);
    }

    // ── US-016 : Stocker (brouillon) ─────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateCertificate($request);

        $contract = InsuranceContract::with('tenant')->findOrFail($validated['contract_id']);
        $this->authorizeTenant($contract->tenant_id);

        abort_if(! $contract->canIssue(), 422,
            'Ce contrat ne permet pas l\'émission de nouveaux certificats (inactif, expiré ou plafond atteint).');

        // Récupérer le template de la filiale
        $template = CertificateTemplate::where('tenant_id', $contract->tenant_id)
            ->where('is_active', true)->first();

        // Générer le numéro de certificat
        $certNumber = $template
            ? Certificate::generateNumber($template)
            : 'CERT-' . now()->format('YmdHis');

        // Construire le décompte de prime depuis les taux du contrat
        $primeBreakdown = $this->buildPrimeBreakdown($contract, $validated['insured_value'], $template);
        $primeTotal     = collect($primeBreakdown)->sum('amount');

        $certificate = Certificate::create([
            ...$validated,
            'tenant_id'          => $contract->tenant_id,
            'certificate_number' => $certNumber,
            'policy_number'      => $contract->contract_number,
            'template_id'        => $template?->id,
            'currency_code'      => $contract->currency_code,
            'prime_breakdown'    => $primeBreakdown,
            'prime_total'        => $primeTotal,
            'status'             => Certificate::STATUS_DRAFT,
            'created_by'         => $request->user()->id,
        ]);

        $this->log($certificate, $request, 'certificate.created');

        return redirect()->route('admin.certificates.show', $certificate)
            ->with('status', "Certificat {$certificate->certificate_number} créé.");
    }

    // ── US-017 : Détail ──────────────────────────────────────
    public function show(Certificate $certificate): Response
    {
        $this->authorizeTenant($certificate->tenant_id);

        $certificate->load([
            'tenant:id,name,code',
            'contract:id,contract_number,insured_name,coverage_type',
            'template',
            'submittedBy:id,first_name,last_name',
            'issuedBy:id,first_name,last_name',
            'createdBy:id,first_name,last_name',
        ]);

        return Inertia::render('admin/certificates/show', [
            'certificate' => $certificate,
            'can'         => [
                'edit'     => auth()->user()->can('certificates.create'),
                'validate' => auth()->user()->can('certificates.validate'),
                'cancel'   => auth()->user()->can('certificates.cancel'),
            ],
        ]);
    }

    // ── US-017 : Formulaire modification ─────────────────────
    public function edit(Certificate $certificate): Response
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if(! in_array($certificate->status, [Certificate::STATUS_DRAFT]), 403,
            'Seul un certificat en brouillon peut être modifié.');

        $certificate->load(['contract', 'template']);

        return Inertia::render('admin/certificates/edit', [
            'certificate' => $certificate,
        ]);
    }

    // ── US-017 : Modifier ────────────────────────────────────
    public function update(Request $request, Certificate $certificate): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if($certificate->status !== Certificate::STATUS_DRAFT, 403);

        $validated = $this->validateCertificate($request, $certificate->id);

        // Recalculer la prime
        $contract       = InsuranceContract::find($certificate->contract_id);
        $primeBreakdown = $this->buildPrimeBreakdown($contract, $validated['insured_value'], $certificate->template);
        $primeTotal     = collect($primeBreakdown)->sum('amount');

        $certificate->update([
            ...$validated,
            'prime_breakdown' => $primeBreakdown,
            'prime_total'     => $primeTotal,
        ]);

        return redirect()->route('admin.certificates.show', $certificate)
            ->with('status', 'Certificat mis à jour.');
    }

    // ── US-017 : Supprimer ───────────────────────────────────
    public function destroy(Certificate $certificate): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if($certificate->status !== Certificate::STATUS_DRAFT, 403);

        $number = $certificate->certificate_number;
        $certificate->delete();

        return redirect()->route('admin.certificates.index')
            ->with('status', "Certificat {$number} supprimé.");
    }

    // ══════════════════════════════════════════════════════════
    // US-016 : WORKFLOW SOUMISSION
    // ══════════════════════════════════════════════════════════

    public function submit(Request $request, Certificate $certificate): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if($certificate->status !== Certificate::STATUS_DRAFT, 422);

        $certificate->update([
            'status'       => Certificate::STATUS_SUBMITTED,
            'submitted_at' => now(),
            'submitted_by' => $request->user()->id,
        ]);

        $this->log($certificate, $request, 'certificate.submitted');

        return back()->with('status', 'Certificat soumis pour émission.');
    }

    // ══════════════════════════════════════════════════════════
    // US-018 : WORKFLOW VALIDATION
    // ══════════════════════════════════════════════════════════

    public function issue(Request $request, Certificate $certificate): RedirectResponse
    {
        abort_if(! $request->user()->can('certificates.validate'), 403);
        abort_if($certificate->status !== Certificate::STATUS_SUBMITTED, 422);

        $request->validate(['notes' => ['nullable', 'string', 'max:500']]);

        DB::transaction(function () use ($certificate, $request) {
            $certificate->update([
                'status'           => Certificate::STATUS_ISSUED,
                'issued_at'        => now(),
                'issued_by'        => $request->user()->id,
                'validation_notes' => $request->notes,
            ]);

            // Incrémenter le compteur et le cumul du contrat
            InsuranceContract::where('id', $certificate->contract_id)->update([
                'certificates_count' => DB::raw('certificates_count + 1'),
                'used_limit'         => DB::raw("used_limit + {$certificate->insured_value}"),
            ]);
        });

        $this->log($certificate, $request, 'certificate.issued', ['notes' => $request->notes]);

        return back()->with('status', "Certificat {$certificate->certificate_number} émis.");
    }

    public function reject(Request $request, Certificate $certificate): RedirectResponse
    {
        abort_if(! $request->user()->can('certificates.validate'), 403);
        abort_if($certificate->status !== Certificate::STATUS_SUBMITTED, 422);

        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $certificate->update([
            'status'           => Certificate::STATUS_DRAFT,
            'submitted_at'     => null,
            'validation_notes' => 'REJETÉ : ' . $request->reason,
        ]);

        $this->log($certificate, $request, 'certificate.rejected', ['reason' => $request->reason], 'WARNING');

        return back()->with('status', 'Certificat rejeté — renvoyé en brouillon.');
    }

    public function cancel(Request $request, Certificate $certificate): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if(! in_array($certificate->status, [
            Certificate::STATUS_SUBMITTED,
            Certificate::STATUS_ISSUED,
        ]), 422);

        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        DB::transaction(function () use ($certificate, $request) {
            // Si déjà émis → décrémenter le cumul du contrat
            if ($certificate->status === Certificate::STATUS_ISSUED) {
                InsuranceContract::where('id', $certificate->contract_id)->update([
                    'certificates_count' => DB::raw('GREATEST(0, certificates_count - 1)'),
                    'used_limit'         => DB::raw("GREATEST(0, used_limit - {$certificate->insured_value})"),
                ]);
            }

            $certificate->update([
                'status'               => Certificate::STATUS_CANCELLED,
                'cancelled_at'         => now(),
                'cancellation_reason'  => $request->reason,
            ]);
        });

        $this->log($certificate, $request, 'certificate.cancelled', ['reason' => $request->reason], 'WARNING');

        return back()->with('status', 'Certificat annulé.');
    }

    // ── Calcul décompte prime ─────────────────────────────────
    private function buildPrimeBreakdown(InsuranceContract $contract, float $insuredValue, ?CertificateTemplate $template): array
    {
        $breakdown = [];

        // Utiliser les lignes du template si disponibles
        $lines = $template?->prime_breakdown_lines ?? [
            ['key' => 'ro',          'label' => 'R.O.',       'label_en' => null],
            ['key' => 'rg',          'label' => 'R.G.',       'label_en' => null],
            ['key' => 'surprime',    'label' => 'Surprime',   'label_en' => null],
            ['key' => 'accessories', 'label' => 'Access.',    'label_en' => null],
            ['key' => 'tax',         'label' => 'Taxe',       'label_en' => null],
        ];

        $rateMap = [
            'ro'          => (float) ($contract->rate_ro ?? 0),
            'rg'          => (float) ($contract->rate_rg ?? 0),
            'surprime'    => (float) ($contract->rate_surprime ?? 0),
            'accessories' => (float) ($contract->rate_accessories ?? 0),
            'tax'         => (float) ($contract->rate_tax ?? 0),
        ];

        foreach ($lines as $line) {
            $rate   = $rateMap[$line['key']] ?? 0;
            $amount = $rate > 0 ? round($insuredValue * $rate / 100, 2) : 0;

            $breakdown[] = [
                'key'      => $line['key'],
                'label'    => $line['label'],
                'label_en' => $line['label_en'] ?? null,
                'rate'     => $rate,
                'amount'   => $amount,
            ];
        }

        return $breakdown;
    }

    // ── Validation ───────────────────────────────────────────
    private function validateCertificate(Request $request, ?string $ignoreId = null): array
    {
        return $request->validate([
            'contract_id'           => ['required', 'uuid', 'exists:insurance_contracts,id'],
            'insured_name'          => ['required', 'string', 'max:200'],
            'insured_ref'           => ['nullable', 'string', 'max:200'],
            'voyage_date'           => ['required', 'date'],
            'voyage_from'           => ['required', 'string', 'max:150'],
            'voyage_to'             => ['required', 'string', 'max:150'],
            'voyage_via'            => ['nullable', 'string', 'max:150'],
            'transport_type'        => ['nullable', 'in:SEA,AIR,ROAD,RAIL,MULTIMODAL'],
            'vessel_name'           => ['nullable', 'string', 'max:150'],
            'flight_number'         => ['nullable', 'string', 'max:50'],
            'voyage_mode'           => ['nullable', 'string', 'max:50'],
            'expedition_items'      => ['required', 'array', 'min:1'],
            'expedition_items.*.marks'          => ['nullable', 'string'],
            'expedition_items.*.package_numbers'=> ['nullable', 'string'],
            'expedition_items.*.package_count'  => ['nullable', 'integer', 'min:0'],
            'expedition_items.*.weight'         => ['nullable', 'string'],
            'expedition_items.*.nature'         => ['required', 'string'],
            'expedition_items.*.packaging'      => ['nullable', 'string'],
            'expedition_items.*.insured_value'  => ['required', 'numeric', 'min:0'],
            'insured_value'         => ['required', 'numeric', 'min:0'],
            'insured_value_letters' => ['nullable', 'string'],
            'guarantee_mode'        => ['nullable', 'string', 'max:100'],
            'exchange_currency'     => ['nullable', 'size:3'],
            'exchange_rate'         => ['nullable', 'numeric', 'min:0'],
        ]);
    }

    private function log(Certificate $cert, Request $request, string $action, array $extra = [], string $severity = 'INFO'): void
    {
        AuditLog::create([
            'tenant_id'   => $cert->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => $action,
            'entity_type' => 'Certificate',
            'entity_id'   => $cert->id,
            'severity'    => $severity,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => $extra ?: null,
        ]);
    }

    private function authorizeTenant(string $tenantId): void
    {
        $user = auth()->user();
        if ($user->hasRole('super_admin')) return;
        if ((string) $user->tenant_id !== $tenantId) abort(403);
    }

    // ── Télécharger le PDF ───────────────────────────────────────
    public function downloadPdf(Certificate $certificate, CertificatePdfService $pdfService)
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if($certificate->status !== Certificate::STATUS_ISSUED, 422,
            'Le PDF n\'est disponible que pour les certificats émis.');
    
        return $pdfService->download($certificate);
    }
    
    // ── Afficher le PDF dans le navigateur ───────────────────────
    public function streamPdf(Certificate $certificate, CertificatePdfService $pdfService)
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if($certificate->status !== Certificate::STATUS_ISSUED, 422,
            'Le PDF n\'est disponible que pour les certificats émis.');
    
        return $pdfService->stream($certificate);
    }
    
    // ── Regénérer le PDF ─────────────────────────────────────────
    public function generatePdf(Request $request, Certificate $certificate, CertificatePdfService $pdfService): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if($certificate->status !== Certificate::STATUS_ISSUED, 422);
    
        $path = $pdfService->generate($certificate);
    
        $this->log($certificate, $request, 'certificate.pdf_generated', ['path' => $path]);
    
        return back()->with('status', 'PDF regénéré avec succès.');
    }

    // ── Regénérer le QR token ─────────────────────────────────────
    public function regenerateQr(Request $request,Certificate $certificate,CertificateQrService $qrService): RedirectResponse {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if($certificate->status !== Certificate::STATUS_ISSUED, 422,
            'Le QR code n\'est disponible que pour les certificats émis.');
        // Invalider l'ancien token et en générer un nouveau
        $certificate->update(['qr_token' => null]);
        $qrService->ensureToken($certificate);
    
        // Regénérer le PDF avec le nouveau QR
        app(CertificatePdfService::class)->generate($certificate);
    
        $this->log($certificate, $request, 'certificate.qr_regenerated', [], 'WARNING');
    
        return back()->with('status', 'QR code regénéré. Le PDF a été mis à jour.');
    }

    public function export(Request $request): \Illuminate\Http\Response {
        $this->authorizeTenant($request->user()->tenant_id ?? '');
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');
    
        $certificates = Certificate::with(['contract:id,contract_number', 'tenant:id,code', 'issuedBy:id,first_name,last_name'])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->status,         fn ($q) => $q->where('status', $request->status))
            ->when($request->transport_type, fn ($q) => $q->where('transport_type', $request->transport_type))
            ->when($request->date_from,      fn ($q) => $q->whereDate('voyage_date', '>=', $request->date_from))
            ->when($request->date_to,        fn ($q) => $q->whereDate('voyage_date', '<=', $request->date_to))
            ->when($request->value_min,      fn ($q) => $q->where('insured_value', '>=', $request->value_min))
            ->when($request->value_max,      fn ($q) => $q->where('insured_value', '<=', $request->value_max))
            ->orderBy('created_at', 'desc')
            ->limit(10000)
            ->get();
    
        $csv  = "\xEF\xBB\xBF"; // BOM UTF-8 pour Excel
        $csv .= "N° Certificat;Police;Assuré;De;À;Date Voyage;Transport;Valeur Assurée;Devise;Prime Totale;Statut;Date Émission;Émis par;Filiale\n";
    
        foreach ($certificates as $c) {
            $csv .= implode(';', [
                $c->certificate_number,
                $c->policy_number,
                $c->insured_name,
                $c->voyage_from,
                $c->voyage_to,
                $c->voyage_date?->format('d/m/Y'),
                $c->transport_type ?? '',
                number_format((float) $c->insured_value, 2, ',', ' '),
                $c->currency_code,
                $c->prime_total ? number_format((float) $c->prime_total, 2, ',', ' ') : '',
                $c->status,
                $c->issued_at?->format('d/m/Y H:i') ?? '',
                $c->issuedBy ? $c->issuedBy->first_name . ' ' . $c->issuedBy->last_name : '',
                $c->tenant?->code ?? '',
            ]) . "\n";
        }
    
        $filename = 'certificats_' . now()->format('Ymd_His') . '.csv';
    
        return \Illuminate\Support\Facades\Response::make($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }
}