<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\CertificateRequest;
use App\Models\CertificateRequestDocument;
use App\Models\Country;
use App\Models\Notification;
use App\Models\User;
use App\Services\CertificatePdfService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CertificateRequestController extends Controller
{
    public function index(Request $request): Response
    {
        $broker = $this->currentBroker($request);

        $query = CertificateRequest::where('broker_id', $broker->id);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('insured_name', 'ilike', "%{$search}%")
                  ->orWhere('voyage_from', 'ilike', "%{$search}%")
                  ->orWhere('voyage_to', 'ilike', "%{$search}%");
            });
        }

        if ($status = $request->input('status')) {
            $query->where('status', $status);
        }

        $certificateRequests = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('partner/certificate-requests/index', [
            'certificateRequests' => $certificateRequests,
            'filters'             => $request->only(['search', 'status']),
        ]);
    }

    // ── Mes certificats — uniquement ceux rattachés à mes demandes ─
    public function certificates(Request $request): Response
    {
        $broker = $this->currentBroker($request);

        $query = CertificateRequest::where('broker_id', $broker->id)
            ->where(fn ($q) => $q->whereNotNull('certificate_id')->orWhereNotNull('guce_certificate_id'))
            ->with([
                'certificate:id,certificate_number,status,issued_at,qr_token',
                'guceCertificate:id,certificate_number,insured_name,created_at',
            ]);

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('insured_name', 'ilike', "%{$search}%")
                  ->orWhereHas('certificate', fn ($c) => $c->where('certificate_number', 'ilike', "%{$search}%"))
                  ->orWhereHas('guceCertificate', fn ($c) => $c->where('certificate_number', 'ilike', "%{$search}%"));
            });
        }

        $certificateRequests = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('partner/certificates/index', [
            'certificateRequests' => $certificateRequests,
            'filters'             => $request->only('search'),
        ]);
    }

    public function create(Request $request): Response
    {
        $broker = $this->currentBroker($request);
        $tenants = $broker->tenants()->orderBy('name')->get(['tenants.id', 'name', 'code']);

        return Inertia::render('partner/certificate-requests/create', [
            'countries' => Country::orderBy('name_fr')->get(['code', 'name_fr']),
            'tenant'    => $broker->tenant?->only(['id', 'name', 'code']),
            // Sélecteur affiché uniquement si le courtier opère dans plusieurs filiales.
            'tenants'   => $tenants->count() > 1 ? $tenants : [],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $broker = $this->currentBroker($request);

        $validated = $request->validate([
            'tenant_id'          => ['nullable', 'uuid', Rule::in($broker->tenants()->pluck('tenants.id'))],
            'country_code'       => ['nullable', 'string', 'size:2', 'exists:countries,code'],
            'insured_name'       => ['nullable', 'string', 'max:200'],
            'voyage_from'        => ['nullable', 'string', 'max:150'],
            'voyage_to'          => ['nullable', 'string', 'max:150'],
            'voyage_date'        => ['nullable', 'date'],
            'transport_type'     => ['nullable', 'in:SEA,AIR,ROAD,RAIL,MULTIMODAL'],
            'cargo_description'  => ['nullable', 'string', 'max:1000'],
            'estimated_value'    => ['nullable', 'numeric', 'min:0'],
            'currency_code'      => ['nullable', 'string', 'size:3'],
            'notes'              => ['nullable', 'string', 'max:2000'],
            'documents'          => ['required', 'array', 'min:1'],
            'documents.*'        => ['file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:10240'],
            'document_types'     => ['required', 'array', 'size:' . count($request->file('documents', []))],
            'document_types.*'   => ['required', 'string', 'in:' . implode(',', CertificateRequestDocument::TYPES)],
        ], [
            'documents.required'      => 'Au moins une pièce justificative est requise.',
            'documents.*.mimes'       => 'Chaque document doit être au format PDF, JPG, PNG, DOC ou DOCX.',
            'documents.*.max'         => 'Chaque fichier ne doit pas dépasser 10 Mo.',
            'document_types.required' => 'Le type de chaque pièce jointe est requis.',
        ]);

        $certificateRequest = CertificateRequest::create([
            ...collect($validated)->except(['documents', 'document_types', 'tenant_id'])->toArray(),
            'tenant_id'  => $validated['tenant_id'] ?? $broker->tenant_id,
            'broker_id'  => $broker->id,
            'created_by' => Auth::id(),
            'status'     => CertificateRequest::STATUS_PENDING,
        ]);

        foreach ($request->file('documents', []) as $i => $file) {
            $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs("certificate-requests/{$certificateRequest->id}", $filename, 'local');

            CertificateRequestDocument::create([
                'certificate_request_id' => $certificateRequest->id,
                'file_path'              => $path,
                'file_original_name'     => $file->getClientOriginalName(),
                'file_mime_type'         => $file->getMimeType(),
                'file_size'              => $file->getSize(),
                'document_type'          => $validated['document_types'][$i] ?? null,
                'uploaded_by'            => Auth::id(),
            ]);
        }

        // Notifier le personnel habilité à traiter les demandes (admin_filiale / souscripteur)
        $staff = User::where('tenant_id', $certificateRequest->tenant_id)
            ->whereHas('roles', fn ($q) => $q->whereIn('name', ['admin_filiale', 'souscripteur']))
            ->get();

        Notification::sendToMany(
            $staff,
            Notification::TYPE_CERT_REQUEST_CREATED,
            'Nouvelle demande de certificat',
            "Nouvelle demande de {$broker->name}" . ($certificateRequest->insured_name ? " — {$certificateRequest->insured_name}" : '') . '.',
            [
                'icon'  => 'inbox',
                'color' => 'info',
                'url'   => route('admin.certificate-requests.show', $certificateRequest),
            ]
        );

        return redirect()
            ->route('partner.certificate-requests.show', $certificateRequest)
            ->with('success', 'Votre demande de certificat a été soumise avec succès.');
    }

    public function show(Request $request, CertificateRequest $certificateRequest): Response
    {
        $this->authorizeOwnership($request, $certificateRequest);

        $certificateRequest->load([
            'documents',
            'assignedTo:id,first_name,last_name',
            'reviewedBy:id,first_name,last_name',
            'certificate:id,certificate_number,qr_token,status',
            'guceCertificate:id,certificate_number,file_original_name',
        ]);

        return Inertia::render('partner/certificate-requests/show', [
            'certificateRequest' => $certificateRequest,
        ]);
    }

    public function destroy(Request $request, CertificateRequest $certificateRequest): RedirectResponse
    {
        $this->authorizeOwnership($request, $certificateRequest);

        if ($certificateRequest->status !== CertificateRequest::STATUS_PENDING) {
            return back()->withErrors(['status' => 'Seule une demande en attente peut être annulée.']);
        }

        foreach ($certificateRequest->documents as $document) {
            Storage::disk('local')->delete($document->file_path);
        }

        $certificateRequest->delete();

        return redirect()
            ->route('partner.certificate-requests.index')
            ->with('success', 'Demande annulée.');
    }

    public function downloadDocument(Request $request, CertificateRequest $certificateRequest, CertificateRequestDocument $document)
    {
        $this->authorizeOwnership($request, $certificateRequest);

        if ($document->certificate_request_id !== $certificateRequest->id) {
            abort(404);
        }

        if (! Storage::disk('local')->exists($document->file_path)) {
            abort(404, 'Fichier introuvable.');
        }

        return Storage::disk('local')->download($document->file_path, $document->file_original_name);
    }

    // ── Mise à disposition du certificat au partenaire ────────
    public function downloadCertificate(Request $request, CertificateRequest $certificateRequest, CertificatePdfService $pdfService)
    {
        $this->authorizeOwnership($request, $certificateRequest);

        abort_if(! $certificateRequest->certificate_id, 404, 'Aucun certificat rattaché à cette demande.');

        return $pdfService->download($certificateRequest->certificate);
    }

    public function downloadGuceCertificate(Request $request, CertificateRequest $certificateRequest)
    {
        $this->authorizeOwnership($request, $certificateRequest);

        $guceCertificate = $certificateRequest->guceCertificate;
        abort_if(! $guceCertificate, 404, 'Aucun certificat rattaché à cette demande.');

        if (! Storage::disk('private')->exists($guceCertificate->file_path)) {
            abort(404, 'Fichier introuvable.');
        }

        return Storage::disk('private')->download($guceCertificate->file_path, $guceCertificate->file_original_name);
    }

    private function currentBroker(Request $request)
    {
        $broker = $request->user()->broker;

        abort_if(! $broker, 403, 'Votre compte n\'est pas rattaché à un courtier.');

        return $broker;
    }

    private function authorizeOwnership(Request $request, CertificateRequest $certificateRequest): void
    {
        $broker = $this->currentBroker($request);

        if ($certificateRequest->broker_id !== $broker->id) {
            abort(403);
        }
    }
}
