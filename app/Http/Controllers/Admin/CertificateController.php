<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ApprovalRequest;
use App\Models\AuditLog;
use App\Models\Broker;
use App\Models\Certificate;
use App\Models\CertificatePrintTemplate;
use App\Models\CertificateTemplate;
use App\Models\Country;
use App\Models\Currency;
use App\Models\InsuranceContract;
use App\Models\Notification;
use App\Models\TaxRule;
use App\Models\TenantGuaranteeRate;
use App\Models\TransportMode;
use App\Models\User;
use App\Services\ApprovalWorkflowService;
use App\Services\CertificatePdfService;
use App\Services\CertificatePrePrintedService;
use App\Services\CertificateQrService;
use App\Services\ExchangeRateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response as HttpResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

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
            'rejected'  => (clone $statsQuery)->where('status', Certificate::STATUS_REJECTED)->count(),
            'replaced'  => (clone $statsQuery)->where('status', Certificate::STATUS_REPLACED)->count(),
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
        $contracts = InsuranceContract::with([
                'tenant:id,name,code',
                'broker:id,name,code,commission_rate',
                'subscriber:id,first_name,last_name',
                'transportMode:id,code,name_fr',
            ])
            // Certificats non annulés déjà émis sous ce contrat — permet de
            // détecter côté front qu'un contrat "Au voyage" est déjà utilisé.
            ->withCount(['certificates as active_certificates_count' => function ($q) {
                $q->where('status', '!=', Certificate::STATUS_CANCELLED);
            }])
            ->where('status', InsuranceContract::STATUS_ACTIVE)
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->orderBy('contract_number')
            ->get(['id', 'contract_number', 'insured_name', 'insured_address', 'insured_email', 'insured_phone',
                   'tenant_id', 'broker_id', 'subscriber_id', 'currency_code', 'type', 'coverage_type',
                   'transport_mode_id', 'conditioning_types',
                   'rate_ro', 'rate_rg', 'accessories_amount', 'rate_tax',
                   'subscription_limit', 'used_limit', 'plein', 'certificates_limit', 'certificates_count']);

        // Pré-sélection contrat depuis query string — mêmes relations/colonnes
        // que la liste ci-dessus pour que le front reçoive une forme identique.
        $selectedContract = null;
        if ($request->contract_id) {
            $selectedContract = InsuranceContract::with([
                    'tenant:id,name,code',
                    'broker:id,name,code,commission_rate',
                    'subscriber:id,first_name,last_name',
                    'transportMode:id,code,name_fr',
                ])
                ->withCount(['certificates as active_certificates_count' => function ($q) {
                    $q->where('status', '!=', Certificate::STATUS_CANCELLED);
                }])
                ->find($request->contract_id);
        }

        return Inertia::render('admin/certificates/create', [
            'countries'        => Country::orderBy('name_fr')->get(['code', 'name_fr']),
            'currencies'       => Currency::active()->orderBy('code')->get(['code', 'name', 'symbol']),
            'contracts'        => $contracts,
            'selectedContract' => $selectedContract,
            'defaultTenantId'  => $user->tenant_id,
        ]);
    }

    // ── Taux de change du jour (Devise cotation → devise locale) ──
    public function exchangeRate(Request $request, ExchangeRateService $exchangeRates): JsonResponse
    {
        $request->validate([
            'from' => ['required', 'string', 'size:3'],
            'to'   => ['required', 'string', 'size:3'],
        ]);

        try {
            $rate = $exchangeRates->dailyRate(strtoupper($request->from), strtoupper($request->to));

            if ($rate === null) {
                return response()->json(['success' => false, 'message' => "Taux indisponible — merci de le saisir manuellement."], 422);
            }

            return response()->json(['success' => true, 'rate' => $rate]);
        } catch (Throwable) {
            return response()->json(['success' => false, 'message' => "Conversion automatique indisponible — merci de saisir le taux manuellement."], 422);
        }
    }

    // ── US-016 : Stocker (brouillon) ─────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateCertificate($request);

        $contract = InsuranceContract::with('tenant')->findOrFail($validated['contract_id']);
        $this->authorizeTenant($contract->tenant_id);

        // Les plafonds cumulés (NN300 / nombre de certificats) ne bloquent plus
        // la création — leur dépassement déclenche une escalade hiérarchique à
        // la soumission (cf. submit() → ApprovalWorkflowService::triggerIfNeeded()).
        abort_if(! $contract->isActiveAndValid(), 422,
            'Ce contrat ne permet pas l\'émission de nouveaux certificats (inactif ou expiré).');

        // Un contrat "Au voyage" ne couvre qu'un seul déplacement : refuser
        // un second certificat tant que le premier n'est pas annulé.
        if ($contract->type === InsuranceContract::TYPE_VOYAGE) {
            $hasCertificate = Certificate::where('contract_id', $contract->id)
                ->where('status', '!=', Certificate::STATUS_CANCELLED)
                ->exists();

            abort_if($hasCertificate, 422,
                'Ce contrat "Au voyage" a déjà un certificat associé — un contrat de ce type ne couvre qu\'un seul déplacement.');
        }

        // Récupérer le template de la filiale
        $template = CertificateTemplate::where('tenant_id', $contract->tenant_id)
            ->where('is_active', true)->first();

        // Générer le numéro de certificat
        $certNumber = $template
            ? Certificate::generateNumber($template)
            : 'CERT-' . now()->format('YmdHis');

        // Construire le décompte de prime depuis les taux du contrat (R.O./
        // R.G.) + Divers/Surprime saisis sur ce certificat + le référentiel
        // de taxes (filiale × mode de transport × pays)
        $primeBreakdown = $this->buildPrimeBreakdown(
            $contract, $validated['insured_value'], $template,
            $validated['transport_type'] ?? null, $validated['destination_country_code'] ?? null,
            (float) ($validated['rate_divers'] ?? 0), (float) ($validated['rate_surprime'] ?? 0)
        );
        [$primeTotal, $primeNette] = $this->extractPrimeTotals($primeBreakdown);

        $certificate = Certificate::create([
            ...$validated,
            'tenant_id'          => $contract->tenant_id,
            'certificate_number' => $certNumber,
            'policy_number'      => $contract->contract_number,
            'template_id'        => $template?->id,
            'currency_code'      => $contract->currency_code,
            'prime_breakdown'    => $primeBreakdown,
            'prime_total'        => $primeTotal,
            'prime_nette'        => $primeNette,
            'status'             => Certificate::STATUS_DRAFT,
            'created_by'         => $request->user()->id,
        ]);

        $this->log($certificate, $request, 'certificate.created');

        return redirect()->route('admin.certificates.show', $certificate)
            ->with('status', "Certificat {$certificate->certificate_number} créé.");
    }

    // ── Stocker le Certificat — brouillon à validation allégée (permet
    // d'enregistrer même avec des informations manquantes, pour y revenir
    // plus tard). Statut Stocké (DRAFT), identique à store() sur ce point.
    public function storeDraft(Request $request): RedirectResponse
    {
        $validated = $this->validateCertificate($request, null, draft: true);

        $contract = InsuranceContract::with('tenant')->findOrFail($validated['contract_id']);
        $this->authorizeTenant($contract->tenant_id);

        $template  = CertificateTemplate::where('tenant_id', $contract->tenant_id)
            ->where('is_active', true)->first();
        $certNumber = $template
            ? Certificate::generateNumber($template)
            : 'CERT-' . now()->format('YmdHis');

        // Valeur assurée manquante → pas de décompte de prime calculable
        // pour l'instant, laissé null (complété plus tard à l'édition).
        $hasInsuredValue = isset($validated['insured_value']);
        $primeBreakdown  = null;
        $primeTotal      = null;
        $primeNette      = null;

        if ($hasInsuredValue) {
            $primeBreakdown = $this->buildPrimeBreakdown(
                $contract, (float) $validated['insured_value'], $template,
                $validated['transport_type'] ?? null, $validated['destination_country_code'] ?? null,
                (float) ($validated['rate_divers'] ?? 0), (float) ($validated['rate_surprime'] ?? 0)
            );
            [$primeTotal, $primeNette] = $this->extractPrimeTotals($primeBreakdown);
        }

        $certificate = Certificate::create([
            ...$validated,
            'tenant_id'          => $contract->tenant_id,
            'certificate_number' => $certNumber,
            'policy_number'      => $contract->contract_number,
            'template_id'        => $template?->id,
            'currency_code'      => $contract->currency_code,
            'prime_breakdown'    => $primeBreakdown,
            'prime_total'        => $primeTotal,
            'prime_nette'        => $primeNette,
            'status'             => Certificate::STATUS_DRAFT,
            'created_by'         => $request->user()->id,
        ]);

        $this->log($certificate, $request, 'certificate.stored_draft');

        return redirect()->route('admin.certificates.edit', $certificate)
            ->with('status', "Certificat {$certificate->certificate_number} enregistré en brouillon (Stocké) — complétez-le puis soumettez-le quand vous serez prêt.");
    }

    // ── US-017 : Détail ──────────────────────────────────────
    public function show(Certificate $certificate): Response
    {
        $this->authorizeTenant($certificate->tenant_id);

        $certificate->load([
            'tenant:id,name,code',
            'contract:id,contract_number,insured_name,coverage_type',
            'template',
            'destinationCountry:code,name_fr',
            'submittedBy:id,first_name,last_name',
            'issuedBy:id,first_name,last_name',
            'createdBy:id,first_name,last_name',
            'replacement:id,certificate_number',
            'replaces:id,certificate_number,replaced_at',
        ]);

        return Inertia::render('admin/certificates/show', [
            'certificate' => $certificate,
            'can'         => [
                'edit'     => auth()->user()->can('certificates.create'),
                'validate' => auth()->user()->can('certificates.validate'),
                'cancel'   => auth()->user()->can('certificates.cancel'),
            ],
            // Modèles disposant d'un positionnement FPDF calibré — soit
            // codé en dur (config/certificate_layouts.php), soit une
            // surcharge enregistrée depuis /admin/certificate-print-templates
            // (édition JSON manuelle ou import du calibreur, cf.
            // CertificatePrePrintedService::resolveLayout()) — seuls
            // ceux-ci proposent le bouton « Imprimer sur souche ».
            'printOnFormTemplates' => array_unique(array_merge(
                array_keys(config('certificate_layouts', [])),
                CertificatePrintTemplate::pluck('template_id')->all(),
            )),
        ]);
    }

    // ── Impression carnet ─────────────────────────────────────
    public function print(Request $request, Certificate $certificate): Response
    {
        $this->authorizeTenant($certificate->tenant_id);

        $certificate->load([
            'tenant',
            'contract:id,contract_number,insured_name,insured_address,coverage_type,rate_ro,rate_rg,accessories_amount,rate_tax',
            'template:id,name,is_bilingual',
            'issuedBy:id,first_name,last_name',
        ]);

        // Présélection du modèle de souche selon la filiale du certificat
        // (cf. resources/js/pages/admin/certificates/print-templates/registry.ts
        // — tenu synchronisé manuellement avec le champ tenantCode de chaque
        // entrée), sauf si un ?template= explicite est fourni.
        $templateByTenantCode = [
            'GN' => 'guinee-conakry',
            'GA' => 'gabon',
            'TG' => 'togo',
            'SN' => 'senegal',
            'CM' => 'cameroun',
            'CG' => 'congo',
            'BJ' => 'benin',
        ];
        $defaultTemplate = $templateByTenantCode[$certificate->tenant?->code] ?? 'guinee-conakry';
        $templateId      = $request->query('template', $defaultTemplate);

        // Coordonnées mm surchargées depuis l'admin (cf.
        // CertificatePrintTemplateController) — absence de ligne = le
        // composant du pays garde ses coordonnées codées en dur.
        $positionsOverride = CertificatePrintTemplate::where('template_id', $templateId)->value('positions');

        return Inertia::render('admin/certificates/print', [
            'certificate'       => $certificate,
            'templateId'        => $templateId,
            'calibrate'         => $request->boolean('calibrate'),
            'positionsOverride' => $positionsOverride,
        ]);
    }

    public function printModels(): Response
    {
        return Inertia::render('admin/certificates/print-models');
    }

    // ── Impression sur souche physique pré-imprimée (FPDF) ────
    // Génère un PDF positionné aux coordonnées (mm) de
    // config/certificate_layouts.php — à imprimer directement
    // par-dessus le carnet NSIA déjà chargé dans l'imprimante.
    public function printOnForm(Request $request, Certificate $certificate, CertificatePrePrintedService $service): HttpResponse
    {
        $this->authorizeTenant($certificate->tenant_id);

        $templateByTenantCode = [
            'GN' => 'guinee-conakry',
            'GA' => 'gabon',
            'TG' => 'togo',
            'SN' => 'senegal',
            'CM' => 'cameroun',
            'CG' => 'congo',
            'BJ' => 'benin',
        ];
        $defaultTemplate = $templateByTenantCode[$certificate->tenant?->code] ?? 'guinee-conakry';
        $templateId      = $request->query('template', $defaultTemplate);
        $calibrate       = $request->boolean('calibrate');
        $preview         = $request->boolean('preview');

        // Décalage propre à un poste/une imprimante (mm), réglé et conservé
        // côté navigateur (localStorage — cf. show.tsx) : compense
        // l'enregistrement/le bac papier d'une imprimante donnée sans
        // toucher au calibrage maître. Bornes larges mais sûres — un
        // décalage aberrant ne doit pas produire un rendu totalement
        // hors-page.
        $offsetX = max(-30, min(30, (float) $request->query('offset_x', 0)));
        $offsetY = max(-30, min(30, (float) $request->query('offset_y', 0)));

        // Requête de navigation directe (lien <a target="_blank">, pas un
        // appel Inertia) — une exception de configuration (positionnement
        // ou PDF de fond manquant pour ce template) doit donc afficher un
        // message clair, pas la page de debug Laravel brute.
        try {
            if ($preview) {
                $pdf    = $service->preview($certificate, $templateId, $offsetX, $offsetY);
                $suffix = 'apercu';
            } else {
                $pdf    = $service->generate($certificate, $templateId, $calibrate, $offsetX, $offsetY);
                $suffix = $calibrate ? 'calibrage' : $templateId;
            }
        } catch (InvalidArgumentException $e) {
            return response(
                '<!doctype html><meta charset="utf-8">'.
                '<div style="font-family:Arial,sans-serif;max-width:560px;margin:60px auto;padding:24px;border:1px solid #fecaca;background:#fef2f2;border-radius:10px;color:#991b1b;">'.
                '<strong>Impression sur souche indisponible</strong><p style="margin:10px 0 0;font-size:14px;">'.e($e->getMessage()).'</p></div>',
                404,
                ['Content-Type' => 'text/html; charset=UTF-8']
            );
        }

        return response($pdf, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => 'inline; filename="certificat-'.$certificate->certificate_number.'-'.$suffix.'.pdf"',
        ]);
    }

    // ── US-017 : Formulaire modification ─────────────────────
    // Éditable en Stocké (DRAFT) ou Rejeté (REJECTED) — corriger un
    // certificat rejeté puis le sauvegarder le repasse en Stocké (cf.
    // update() ci-dessous) pour permettre une nouvelle soumission.
    public function edit(Request $request, Certificate $certificate): Response
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if(! in_array($certificate->status, [Certificate::STATUS_DRAFT, Certificate::STATUS_REJECTED]), 403,
            'Seul un certificat Stocké ou Rejeté peut être modifié.');

        $certificate->load(['contract', 'template']);
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $contracts = InsuranceContract::with([
                'tenant:id,name,code',
                'broker:id,name,code,commission_rate',
                'subscriber:id,first_name,last_name',
                'transportMode:id,code,name_fr',
            ])
            ->withCount(['certificates as active_certificates_count' => function ($q) {
                $q->where('status', '!=', Certificate::STATUS_CANCELLED);
            }])
            ->where('status', InsuranceContract::STATUS_ACTIVE)
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->orderBy('contract_number')
            ->get(['id', 'contract_number', 'insured_name', 'insured_address', 'insured_email', 'insured_phone',
                   'tenant_id', 'broker_id', 'subscriber_id', 'currency_code', 'type', 'coverage_type',
                   'transport_mode_id', 'conditioning_types',
                   'rate_ro', 'rate_rg', 'accessories_amount', 'rate_tax',
                   'subscription_limit', 'used_limit', 'plein', 'certificates_limit', 'certificates_count']);

        return Inertia::render('admin/certificates/edit', [
            'certificate' => $certificate,
            'contracts'   => $contracts,
            'countries'   => Country::orderBy('name_fr')->get(['code', 'name_fr']),
            'currencies'  => Currency::active()->orderBy('code')->get(['code', 'name', 'symbol']),
        ]);
    }

    // ── US-017 : Modifier ────────────────────────────────────
    public function update(Request $request, Certificate $certificate): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if(! in_array($certificate->status, [Certificate::STATUS_DRAFT, Certificate::STATUS_REJECTED]), 403);

        $validated = $this->validateCertificate($request, $certificate->id);

        // Recalculer la prime (+ taxe depuis le référentiel filiale ×
        // mode de transport × pays)
        $contract       = InsuranceContract::find($validated['contract_id']);
        $primeBreakdown = $this->buildPrimeBreakdown(
            $contract, $validated['insured_value'], $certificate->template,
            $validated['transport_type'] ?? null, $validated['destination_country_code'] ?? null,
            (float) ($validated['rate_divers'] ?? 0), (float) ($validated['rate_surprime'] ?? 0)
        );
        [$primeTotal, $primeNette] = $this->extractPrimeTotals($primeBreakdown);

        $wasRejected = $certificate->status === Certificate::STATUS_REJECTED;

        $certificate->update([
            ...$validated,
            'prime_breakdown' => $primeBreakdown,
            'prime_total'     => $primeTotal,
            'prime_nette'     => $primeNette,
            // Corriger un certificat rejeté le repasse en Stocké, prêt à
            // être resoumis.
            ...($wasRejected ? [
                'status'           => Certificate::STATUS_DRAFT,
                'rejection_reason' => null,
                'rejected_at'      => null,
            ] : []),
        ]);

        return redirect()->route('admin.certificates.show', $certificate)
            ->with('status', $wasRejected ? 'Certificat corrigé et repassé en Stocké.' : 'Certificat mis à jour.');
    }

    // ── US-017 : Supprimer ───────────────────────────────────
    public function destroy(Certificate $certificate): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if(! in_array($certificate->status, [Certificate::STATUS_DRAFT, Certificate::STATUS_REJECTED]), 403);

        $number = $certificate->certificate_number;
        $certificate->delete();

        return redirect()->route('admin.certificates.index')
            ->with('status', "Certificat {$number} supprimé.");
    }

    // ══════════════════════════════════════════════════════════
    // US-016 : WORKFLOW SOUMISSION
    // ══════════════════════════════════════════════════════════

    public function submit(Request $request, Certificate $certificate, ApprovalWorkflowService $approvalWorkflow): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if($certificate->status !== Certificate::STATUS_DRAFT, 422);

        $certificate->update([
            'status'       => Certificate::STATUS_SUBMITTED,
            'submitted_at' => now(),
            'submitted_by' => $request->user()->id,
        ]);

        $this->log($certificate, $request, 'certificate.submitted');

        // Escalade NN300 automatique si la valeur assurée dépasse le seuil
        // configuré (% du "plein" du contrat) — cf. ApprovalWorkflowConfig.
        $contract   = InsuranceContract::find($certificate->contract_id);
        $escalated  = $contract && $approvalWorkflow->triggerIfNeeded($certificate, $contract, $request->user());

        // Plafond Traité dépassé : alerte informative (placement en
        // réassurance facultative à envisager) — non bloquant, distinct de
        // l'escalade NN300 ci-dessus.
        if ($contract && $contract->exceedsTreatyLimit((float) $certificate->insured_value)) {
            $this->alertTreatyLimitExceeded($certificate, $contract);
        }

        return back()->with('status', $escalated
            ? 'Certificat soumis — une limite contractuelle est dépassée, une validation NN300 est requise avant émission.'
            : 'Certificat soumis pour émission.');
    }

    // ══════════════════════════════════════════════════════════
    // US-018 : WORKFLOW VALIDATION
    // ══════════════════════════════════════════════════════════

    public function issue(Request $request, Certificate $certificate): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if(! $request->user()->can('certificates.validate'), 403);
        abort_if($certificate->status !== Certificate::STATUS_SUBMITTED, 422);

        // Une escalade NN300 en cours doit être validée via /admin/approvals,
        // pas contournée par une émission directe. ValidationException (pas
        // abort_if) pour qu'Inertia affiche l'erreur normalement au lieu de
        // basculer sur sa page de secours (réponse non-Inertia).
        if (ApprovalRequest::where('entity_type', 'CERTIFICATE')
            ->where('entity_id', $certificate->id)
            ->where('status', ApprovalRequest::STATUS_PENDING)
            ->exists()) {
            throw ValidationException::withMessages([
                'certificate' => 'Ce certificat est en cours de validation NN300 — voir Escalades NN300.',
            ]);
        }

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
        $this->authorizeTenant($certificate->tenant_id);
        abort_if(! $request->user()->can('certificates.validate'), 403);
        abort_if($certificate->status !== Certificate::STATUS_SUBMITTED, 422);

        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $certificate->update([
            'status'           => Certificate::STATUS_REJECTED,
            'rejected_at'      => now(),
            'rejection_reason' => $request->reason,
        ]);

        $this->log($certificate, $request, 'certificate.rejected', ['reason' => $request->reason], 'WARNING');

        return back()->with('status', 'Certificat rejeté.');
    }

    // ── Remplacement — certificat Approuvé (ISSUED) modifié après coup :
    // génère un nouveau certificat (nouveau numéro, statut Stocké) et
    // marque l'ancien Remplacé avec une référence vers le nouveau.
    public function replace(Request $request, Certificate $certificate): RedirectResponse
    {
        $this->authorizeTenant($certificate->tenant_id);
        abort_if(! $request->user()->can('certificates.create'), 403);
        abort_if($certificate->status !== Certificate::STATUS_ISSUED, 422,
            'Seul un certificat Approuvé peut être remplacé.');

        $template  = $certificate->template_id ? CertificateTemplate::find($certificate->template_id) : null;
        $newNumber = $template ? Certificate::generateNumber($template) : 'CERT-' . now()->format('YmdHis');

        $replacement = DB::transaction(function () use ($certificate, $newNumber, $request) {
            $new = Certificate::create([
                'tenant_id'                 => $certificate->tenant_id,
                'contract_id'               => $certificate->contract_id,
                'template_id'               => $certificate->template_id,
                'certificate_number'        => $newNumber,
                'policy_number'             => $certificate->policy_number,
                'insured_name'              => $certificate->insured_name,
                'insured_ref'               => $certificate->insured_ref,
                'voyage_date'               => $certificate->voyage_date,
                'voyage_from'               => $certificate->voyage_from,
                'voyage_to'                 => $certificate->voyage_to,
                'voyage_via'                => $certificate->voyage_via,
                'origin_country_code'       => $certificate->origin_country_code,
                'destination_country_code'  => $certificate->destination_country_code,
                'transport_type'            => $certificate->transport_type,
                'vessel_name'               => $certificate->vessel_name,
                'flight_number'             => $certificate->flight_number,
                'voyage_mode'               => $certificate->voyage_mode,
                'expedition_items'          => $certificate->expedition_items,
                'currency_code'             => $certificate->currency_code,
                'insured_value'             => $certificate->insured_value,
                'insured_value_letters'     => $certificate->insured_value_letters,
                'guarantee_mode'            => $certificate->guarantee_mode,
                'rate_divers'               => $certificate->rate_divers,
                'rate_surprime'             => $certificate->rate_surprime,
                'prime_breakdown'           => $certificate->prime_breakdown,
                'prime_total'               => $certificate->prime_total,
                'prime_nette'               => $certificate->prime_nette,
                'exchange_currency'         => $certificate->exchange_currency,
                'exchange_rate'             => $certificate->exchange_rate,
                'status'                    => Certificate::STATUS_DRAFT,
                'created_by'                => $request->user()->id,
            ]);

            $certificate->update([
                'status'                     => Certificate::STATUS_REPLACED,
                'replaced_at'                => now(),
                'replaced_by_certificate_id' => $new->id,
            ]);

            // Le certificat remplacé n'est plus comptabilisé dans le cumul
            // du contrat — libéré comme lors d'une annulation, pour éviter
            // un double comptage si le remplaçant est ensuite approuvé.
            InsuranceContract::where('id', $certificate->contract_id)->update([
                'certificates_count' => DB::raw('GREATEST(0, certificates_count - 1)'),
                'used_limit'         => DB::raw("GREATEST(0, used_limit - {$certificate->insured_value})"),
            ]);

            return $new;
        });

        $this->log($certificate, $request, 'certificate.replaced', ['replacement_id' => $replacement->id], 'WARNING');

        return redirect()->route('admin.certificates.edit', $replacement)
            ->with('status', "Certificat {$certificate->certificate_number} remplacé — modifiez le nouveau certificat {$replacement->certificate_number}.");
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

    // Extrait (Prime TTC, Prime Nette) depuis le décompte — ce sont des
    // sous-totaux portés par leurs propres lignes ('prime_total'/
    // 'prime_totale' et 'prime_nette'), PAS la somme de toutes les lignes
    // du tableau (qui compterait ces sous-totaux en double).
    private function extractPrimeTotals(array $primeBreakdown): array
    {
        $byKey = collect($primeBreakdown)->keyBy('key');

        $primeTotal = $byKey->get('prime_total')['amount'] ?? $byKey->get('prime_totale')['amount'] ?? 0;
        $primeNette = $byKey->get('prime_nette')['amount'] ?? 0;

        return [$primeTotal, $primeNette];
    }

    // ── Calcul décompte prime ─────────────────────────────────
    // Formule :
    //   Prime Nette = Prime(RO) + Prime(RG) + Prime(Divers) + Prime(Surprime)
    //   Taxe        = Taux de taxe × (Prime Nette + Accessoires)
    //   Prime TTC   = Prime Nette + Accessoires + Taxe
    // Prime Nette et Prime TTC sont donc des sous-totaux, pas des lignes
    // "taux × valeur assurée" comme RO/RG/Divers/Surprime/Accessoires.
    // R.O. et R.G. viennent du CONTRAT (taux fixes pour toute sa durée).
    // Divers et Surprime se saisissent au cas par cas à l'établissement du
    // CERTIFICAT ($rateDivers/$rateSurprime). Accessoires n'est plus un
    // taux mais un montant fixe porté par le contrat (accessories_amount).
    private function buildPrimeBreakdown(
        InsuranceContract $contract,
        float $insuredValue,
        ?CertificateTemplate $template,
        ?string $transportType = null,
        ?string $destinationCountryCode = null,
        float $rateDivers = 0,
        float $rateSurprime = 0
    ): array {
        // Utiliser les lignes du template si disponibles — Prime Nette
        // positionnée juste avant Accessoires (cf. modèles filiale).
        $lines = $template?->prime_breakdown_lines ?? [
            ['key' => 'ro',           'label' => 'R.O.',        'label_en' => null],
            ['key' => 'rg',           'label' => 'R.G.',        'label_en' => null],
            ['key' => 'divers',       'label' => 'Divers',      'label_en' => null],
            ['key' => 'surprime',     'label' => 'Surprime',    'label_en' => null],
            ['key' => 'prime_nette',  'label' => 'Prime Nette', 'label_en' => null],
            ['key' => 'accessories',  'label' => 'Access.',     'label_en' => null],
            ['key' => 'tax',          'label' => 'Taxe',        'label_en' => null],
            ['key' => 'prime_total',  'label' => 'Prime Totale','label_en' => null],
        ];

        // Taxe résolue automatiquement depuis le référentiel filiale ×
        // mode de transport × pays (TaxRule) — ne se saisit plus
        // manuellement sur le contrat (InsuranceContract::rate_tax).
        $transportMode = $transportType
            ? TransportMode::where('code', $transportType)->first()
            : null;

        $taxRule    = TaxRule::findApplicable($contract->tenant_id, $transportMode?->id, $destinationCountryCode);
        $taxRatePct = (float) ($taxRule->rate_pct ?? 0);

        $rateOf = fn (string $field): float => (float) ($contract->{$field} ?? 0);
        $lineAmount = fn (float $rate): float => $rate > 0 ? round($insuredValue * $rate / 100, 2) : 0;

        $ro       = $lineAmount($rateOf('rate_ro'));
        $rg       = $lineAmount($rateOf('rate_rg'));
        $divers   = $lineAmount($rateDivers);
        $surprime = $lineAmount($rateSurprime);
        $primeNette = round($ro + $rg + $divers + $surprime, 2);

        // Prime nette minimum réglementaire par filiale × garantie (cf.
        // TenantGuaranteeRate) : contrairement au taux/accessoires (saisis
        // par l'utilisateur sur le contrat, bloqués en dessous du plancher
        // à la validation), la prime nette est un montant CALCULÉ à partir
        // de la valeur assurée — on applique donc un plancher transparent
        // (prime minimum perçue) plutôt qu'un rejet, conformément à la
        // pratique du marché.
        $minGuarantee = TenantGuaranteeRate::minimumsFor($contract->tenant_id, $contract->coverage_type);
        if ($minGuarantee && $primeNette < (float) $minGuarantee->min_net_premium) {
            $primeNette = (float) $minGuarantee->min_net_premium;
        }

        // Accessoires : montant fixe défini sur le contrat (pas un taux).
        $accessoires = (float) ($contract->accessories_amount ?? 0);
        $taxe        = round(($primeNette + $accessoires) * $taxRatePct / 100, 2);
        $primeTotale = round($primeNette + $accessoires + $taxe, 2);

        // Alias FR/EN : les lignes des templates filiale utilisent des clés
        // françaises (divers/accessoires/taxe/prime_totale) alors que les
        // lignes par défaut ci-dessus utilisent l'anglais — les deux
        // doivent résoudre vers le même montant, sans quoi la ligne
        // affiche 0.
        $amounts = [
            'ro'          => ['rate' => $rateOf('rate_ro'), 'amount' => $ro],
            'rg'          => ['rate' => $rateOf('rate_rg'), 'amount' => $rg],
            'divers'      => ['rate' => $rateDivers,        'amount' => $divers],
            'surprime'    => ['rate' => $rateSurprime,      'amount' => $surprime],
            'prime_nette' => ['rate' => null,               'amount' => $primeNette],
            'accessories' => ['rate' => null,               'amount' => $accessoires],
            'accessoires' => ['rate' => null,               'amount' => $accessoires],
            'tax'         => ['rate' => $taxRatePct,        'amount' => $taxe],
            'taxe'        => ['rate' => $taxRatePct,        'amount' => $taxe],
            'prime_total'  => ['rate' => null, 'amount' => $primeTotale],
            'prime_totale' => ['rate' => null, 'amount' => $primeTotale],
        ];

        $breakdown = [];
        foreach ($lines as $line) {
            $entry = $amounts[$line['key']] ?? ['rate' => 0, 'amount' => 0];

            $breakdown[] = [
                'key'      => $line['key'],
                'label'    => $line['label'],
                'label_en' => $line['label_en'] ?? null,
                'rate'     => $entry['rate'],
                'amount'   => $entry['amount'],
            ];
        }

        return $breakdown;
    }

    // ── Validation ───────────────────────────────────────────
    // $draft = true (bouton « Stocker le Certificat ») : validation allégée,
    // seul le contrat est requis, pour permettre d'enregistrer un brouillon
    // avec des informations manquantes et le compléter plus tard.
    private function validateCertificate(Request $request, ?string $ignoreId = null, bool $draft = false): array
    {
        $req = fn (string $strict) => $draft ? 'nullable' : $strict;

        return $request->validate([
            'contract_id'           => ['required', 'uuid', 'exists:insurance_contracts,id'],
            'insured_name'          => [$req('required'), 'string', 'max:200'],
            'insured_ref'           => ['nullable', 'string', 'max:200'],
            'voyage_date'           => [$req('required'), 'date'],
            'voyage_from'           => [$req('required'), 'string', 'max:150'],
            'voyage_to'             => [$req('required'), 'string', 'max:150'],
            'voyage_via'            => ['nullable', 'string', 'max:150'],
            'origin_country_code'      => ['nullable', 'string', 'size:2', 'exists:countries,code'],
            'destination_country_code' => ['nullable', 'string', 'size:2', 'exists:countries,code'],
            'transport_type'        => ['nullable', 'in:SEA,AIR,ROAD,RAIL,MULTIMODAL,RIVER'],
            'vessel_name'           => ['nullable', 'string', 'max:150'],
            'flight_number'         => ['nullable', 'string', 'max:50'],
            'voyage_mode'           => ['nullable', 'string', 'max:50'],
            'expedition_items'      => [$req('required'), 'array', $draft ? 'min:0' : 'min:1'],
            'expedition_items.*.marks'          => ['nullable', 'string'],
            'expedition_items.*.package_count'  => ['nullable', 'integer', 'min:0'],
            'expedition_items.*.weight'         => ['nullable', 'string'],
            'expedition_items.*.nature'         => [$req('required'), 'string'],
            'expedition_items.*.packaging'      => ['nullable', 'string'],
            'expedition_items.*.insured_value'  => [$req('required'), 'numeric', 'min:0'],
            'insured_value'         => [$req('required'), 'numeric', 'min:0'],
            'insured_value_letters' => ['nullable', 'string'],
            'guarantee_mode'        => ['nullable', 'string', 'max:100'],
            // Divers et Surprime se précisent au cas par cas sur chaque
            // certificat (plus au niveau du contrat).
            'rate_divers'           => ['nullable', 'numeric', 'min:0', 'max:100'],
            'rate_surprime'         => ['nullable', 'numeric', 'min:0', 'max:100'],
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

    // Alerte informative (non bloquante) : le cumul du contrat dépasse le
    // Plafond Traité — signale un besoin potentiel de placement en
    // réassurance facultative, à la charge des approbateurs de la filiale.
    private function alertTreatyLimitExceeded(Certificate $certificate, InsuranceContract $contract): void
    {
        $approvers = User::whereHas('roles', fn ($q) => $q->whereIn('name', ['admin_filiale', 'super_admin']))
            ->where(fn ($q) => $q->where('tenant_id', $contract->tenant_id)->orWhereHas('roles', fn ($q) => $q->where('name', 'super_admin')))
            ->get()
            ->filter(fn ($u) => ! Notification::alreadySentToday($u, 'PlafondTraiteAlert', $contract->id));

        if ($approvers->isEmpty()) return;

        Notification::sendToMany(
            $approvers,
            'PlafondTraiteAlert',
            'Plafond Traité dépassé',
            "Contrat {$contract->contract_number} — le cumul assuré dépasse le Plafond Traité, un placement en réassurance facultative est à envisager.",
            [
                'icon'            => 'alert-triangle',
                'color'           => 'warning',
                'url'             => route('admin.contracts.show', $contract),
                'entity_id'       => $contract->id,
                'contract_number' => $contract->contract_number,
            ]
        );
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


    public function duplicate(Request $request, Certificate $certificate): RedirectResponse{
        $this->authorizeTenant($certificate->tenant_id);
    
        // Seul un certificat ISSUED peut être dupliqué
        abort_if(! $certificate->isIssued(), 422,
            'Seul un certificat émis peut faire l\'objet d\'un duplicata.');
    
        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);
    
        // Incrémenter le compteur sur l'original
        $original = $certificate->isOriginal() ? $certificate : $certificate->parent;
        $original->increment('duplicate_count');
        $dupIndex = $original->duplicate_count;
    
        // Créer le duplicata en copiant toutes les données
        $duplicate = Certificate::create([
            // Données copiées de l'original
            'tenant_id'              => $original->tenant_id,
            'contract_id'            => $original->contract_id,
            'template_id'            => $original->template_id,
            'policy_number'          => $original->policy_number,
            'insured_name'           => $original->insured_name,
            'insured_ref'            => $original->insured_ref,
            'voyage_date'            => $original->voyage_date,
            'voyage_from'            => $original->voyage_from,
            'voyage_to'              => $original->voyage_to,
            'voyage_via'             => $original->voyage_via,
            'transport_type'         => $original->transport_type,
            'vessel_name'            => $original->vessel_name,
            'flight_number'          => $original->flight_number,
            'voyage_mode'            => $original->voyage_mode,
            'expedition_items'       => $original->expedition_items,
            'currency_code'          => $original->currency_code,
            'insured_value'          => $original->insured_value,
            'insured_value_letters'  => $original->insured_value_letters,
            'guarantee_mode'         => $original->guarantee_mode,
            'prime_breakdown'        => $original->prime_breakdown,
            'prime_total'            => $original->prime_total,
            'exchange_currency'      => $original->exchange_currency,
            'exchange_rate'          => $original->exchange_rate,
    
            // Numéro avec suffixe -D
            'certificate_number'     => $original->getDuplicateNumber($dupIndex),
    
            // Statut : directement ISSUED
            'status'                 => Certificate::STATUS_ISSUED,
            'issued_at'              => $original->issued_at,
            'issued_by'              => $original->issued_by,
            'submitted_by'           => $original->submitted_by,
            'validation_notes'       => $original->validation_notes,
    
            // Métadonnées duplicata
            'parent_id'              => $original->id,
            'document_type'          => Certificate::DOC_TYPE_DUPLICATA,
            'reissued_at'            => now(),
            'reissued_by'            => $request->user()->id,
            'reissue_reason'         => $request->reason,
            'created_by'             => $request->user()->id,
        ]);
    
        // Générer le PDF avec filigrane DUPLICATA
        app(CertificatePdfService::class)->generate($duplicate);
    
        // Notification
        $creator = \App\Models\User::find($original->created_by);
        if ($creator && $creator->id !== $request->user()->id) {
            Notification::send(
                $creator,
                'CertificateDuplicated',
                'Duplicata émis',
                "Duplicata {$duplicate->certificate_number} créé",
                [
                    'icon'  => 'copy',
                    'color' => 'info',
                    'url'   => route('admin.certificates.show', $duplicate),
                ]
            );
        }
    
        $this->log($duplicate, $request, 'certificate.duplicated', [
            'original_id'     => $original->id,
            'original_number' => $original->certificate_number,
            'reason'          => $request->reason,
        ]);
    
        return redirect()->route('admin.certificates.show', $duplicate)
            ->with('status', "Duplicata {$duplicate->certificate_number} créé avec succès.");
    }
}