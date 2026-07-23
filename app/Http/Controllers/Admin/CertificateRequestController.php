<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateRequest;
use App\Models\GuceCertificate;
use App\Models\Notification;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CertificateRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();
        $isSA = $user->hasRole('super_admin');

        $base = CertificateRequest::query()->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id));

        // Compteurs par statut — alimentent la file d'attente (onglets)
        $counts = (clone $base)
            ->select('status', DB::raw('count(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $query = (clone $base)->with('broker:id,name,code');

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('insured_name', 'ilike', "%{$search}%")
                  ->orWhereHas('broker', fn ($b) => $b->where('name', 'ilike', "%{$search}%"));
            });
        }

        // File d'attente : PENDING/IN_REVIEW en tête (plus anciennes d'abord), puis le reste
        $certificateRequests = $query
            ->orderByRaw("CASE status
                WHEN 'PENDING' THEN 0
                WHEN 'IN_REVIEW' THEN 1
                WHEN 'APPROVED' THEN 2
                WHEN 'REJECTED' THEN 3
                ELSE 4 END")
            ->orderBy('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/certificate-requests/index', [
            'certificateRequests' => $certificateRequests,
            'filters'             => $request->only(['status', 'search']),
            'counts'              => [
                'PENDING'    => $counts['PENDING'] ?? 0,
                'IN_REVIEW'  => $counts['IN_REVIEW'] ?? 0,
                'APPROVED'   => $counts['APPROVED'] ?? 0,
                'REJECTED'   => $counts['REJECTED'] ?? 0,
            ],
        ]);
    }

    public function show(CertificateRequest $certificateRequest): Response
    {
        $this->authorizeTenant($certificateRequest);

        $certificateRequest->load([
            'broker',
            'createdBy:id,first_name,last_name,email',
            'assignedTo:id,first_name,last_name',
            'reviewedBy:id,first_name,last_name',
            'certificate:id,certificate_number,status,qr_token',
            'guceCertificate:id,certificate_number,insured_name',
            'documents',
        ]);

        $availableCertificates = collect();
        $availableGuceCertificates = collect();

        if ($certificateRequest->status === CertificateRequest::STATUS_APPROVED && ! $certificateRequest->isFulfilled()) {
            $availableCertificates = Certificate::where('tenant_id', $certificateRequest->tenant_id)
                ->where('status', 'ISSUED')
                ->orderByDesc('issued_at')
                ->limit(50)
                ->get(['id', 'certificate_number', 'insured_name']);

            $availableGuceCertificates = GuceCertificate::where('tenant_id', $certificateRequest->tenant_id)
                ->orderByDesc('created_at')
                ->limit(50)
                ->get(['id', 'certificate_number', 'insured_name']);
        }

        return Inertia::render('admin/certificate-requests/show', [
            'certificateRequest'        => $certificateRequest,
            'availableCertificates'     => $availableCertificates,
            'availableGuceCertificates' => $availableGuceCertificates,
        ]);
    }

    // ── Prise en charge — US PENDING → IN_REVIEW ──────────────
    public function assign(CertificateRequest $certificateRequest): RedirectResponse
    {
        $this->authorizeTenant($certificateRequest);

        abort_if($certificateRequest->status !== CertificateRequest::STATUS_PENDING, 422, 'Cette demande a déjà été prise en charge.');

        $certificateRequest->update([
            'status'      => CertificateRequest::STATUS_IN_REVIEW,
            'assigned_to' => Auth::id(),
            'assigned_at' => now(),
        ]);

        if ($certificateRequest->createdBy) {
            Notification::send(
                $certificateRequest->createdBy,
                Notification::TYPE_CERT_REQUEST_IN_REVIEW,
                'Demande en cours de traitement',
                "Votre demande" . ($certificateRequest->insured_name ? " ({$certificateRequest->insured_name})" : '') . ' est en cours de traitement.',
                [
                    'icon'  => 'clock',
                    'color' => 'info',
                    'url'   => route('partner.certificate-requests.show', $certificateRequest),
                ]
            );
        }

        return back()->with('success', 'Demande prise en charge.');
    }

    public function approve(Request $request, CertificateRequest $certificateRequest): RedirectResponse
    {
        $this->authorizeTenant($certificateRequest);

        abort_if(
            ! in_array($certificateRequest->status, [CertificateRequest::STATUS_PENDING, CertificateRequest::STATUS_IN_REVIEW], true),
            422,
            'Cette demande a déjà été traitée.'
        );

        $validated = $request->validate([
            'review_notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $certificateRequest->update([
            'status'       => CertificateRequest::STATUS_APPROVED,
            'reviewed_by'  => Auth::id(),
            'reviewed_at'  => now(),
            'review_notes' => $validated['review_notes'] ?? null,
        ]);

        return back()->with('success', 'Demande approuvée. Une fois le certificat émis depuis un contrat actif, rattachez-le à cette demande pour clore le suivi.');
    }

    public function reject(Request $request, CertificateRequest $certificateRequest): RedirectResponse
    {
        $this->authorizeTenant($certificateRequest);

        abort_if(
            ! in_array($certificateRequest->status, [CertificateRequest::STATUS_PENDING, CertificateRequest::STATUS_IN_REVIEW], true),
            422,
            'Cette demande a déjà été traitée.'
        );

        $validated = $request->validate([
            'review_notes' => ['required', 'string', 'max:2000'],
        ]);

        $certificateRequest->update([
            'status'       => CertificateRequest::STATUS_REJECTED,
            'reviewed_by'  => Auth::id(),
            'reviewed_at'  => now(),
            'review_notes' => $validated['review_notes'],
        ]);

        if ($certificateRequest->createdBy) {
            Notification::send(
                $certificateRequest->createdBy,
                Notification::TYPE_CERT_REQUEST_REJECTED,
                'Demande de certificat rejetée',
                "Votre demande" . ($certificateRequest->insured_name ? " ({$certificateRequest->insured_name})" : '') . " a été rejetée : {$validated['review_notes']}",
                [
                    'icon'  => 'x-circle',
                    'color' => 'danger',
                    'url'   => route('partner.certificate-requests.show', $certificateRequest),
                ]
            );
        }

        return back()->with('success', 'Demande rejetée.');
    }

    // ── Rattachement au certificat réellement disponible ──────
    // (génération classique OU importation GUCE — l'une des deux)
    public function linkCertificate(Request $request, CertificateRequest $certificateRequest): RedirectResponse
    {
        $this->authorizeTenant($certificateRequest);

        abort_if($certificateRequest->status !== CertificateRequest::STATUS_APPROVED, 422, 'Seule une demande approuvée peut être rattachée à un certificat.');

        $validated = $request->validate([
            'certificate_id'      => ['required_without:guce_certificate_id', 'nullable', 'uuid', 'exists:certificates,id'],
            'guce_certificate_id' => ['required_without:certificate_id', 'nullable', 'uuid', 'exists:guce_certificates,id'],
        ]);

        $certificateNumber = null;

        if (! empty($validated['certificate_id'])) {
            $certificate = Certificate::findOrFail($validated['certificate_id']);
            abort_if($certificate->tenant_id !== $certificateRequest->tenant_id, 403);

            $certificateRequest->update(['certificate_id' => $certificate->id]);
            $certificateNumber = $certificate->certificate_number;
        } else {
            $guceCertificate = GuceCertificate::findOrFail($validated['guce_certificate_id']);
            abort_if($guceCertificate->tenant_id !== $certificateRequest->tenant_id, 403);

            $certificateRequest->update(['guce_certificate_id' => $guceCertificate->id]);
            $certificateNumber = $guceCertificate->certificate_number;
        }

        if ($certificateRequest->createdBy) {
            Notification::send(
                $certificateRequest->createdBy,
                Notification::TYPE_CERT_ISSUED,
                'Certificat disponible',
                "Le certificat N° {$certificateNumber} lié à votre demande" . ($certificateRequest->insured_name ? " ({$certificateRequest->insured_name})" : '') . " est maintenant disponible.",
                [
                    'icon'  => 'check-circle',
                    'color' => 'success',
                    'url'   => route('partner.certificate-requests.show', $certificateRequest),
                ]
            );
        }

        return back()->with('success', "Demande rattachée au certificat {$certificateNumber}. Le partenaire a été notifié.");
    }

    public function downloadDocument(CertificateRequest $certificateRequest, string $document)
    {
        $this->authorizeTenant($certificateRequest);

        $doc = $certificateRequest->documents()->findOrFail($document);

        if (! Storage::disk('local')->exists($doc->file_path)) {
            abort(404, 'Fichier introuvable.');
        }

        return Storage::disk('local')->download($doc->file_path, $doc->file_original_name);
    }

    private function authorizeTenant(CertificateRequest $certificateRequest): void
    {
        $user = Auth::user();

        if ($user->hasRole('super_admin')) {
            return;
        }

        if ($certificateRequest->tenant_id !== $user->tenant_id) {
            abort(403);
        }
    }
}
