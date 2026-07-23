<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GuceCertificate;
use App\Services\GuceExtractionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class GuceCertificateController extends Controller
{
    public function index(Request $request): Response
    {
        $user = Auth::user();

        $query = GuceCertificate::query()
            ->when(! $user->hasRole('super_admin'), fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->with('importedBy:id,name')
            ->latest();

        if ($search = $request->input('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('guce_reference', 'ilike', "%{$search}%")
                  ->orWhere('certificate_number', 'ilike', "%{$search}%")
                  ->orWhere('policy_number', 'ilike', "%{$search}%")
                  ->orWhere('insured_name', 'ilike', "%{$search}%");
            });
        }

        $certificates = $query->paginate(15)->withQueryString();

        return Inertia::render('admin/guce-certificates/index', [
            'certificates' => $certificates,
            'filters' => $request->only('search'),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/guce-certificates/create');
    }

    // ── Extraction automatique (OCR/IA) du PDF avant soumission ─
    public function extract(Request $request, GuceExtractionService $extraction): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,doc,docx', 'max:10240'],
        ]);

        $tempPath = $request->file('file')->store('guce-certificates/tmp', 'private');

        try {
            $data = $extraction->extract(Storage::disk('private')->path($tempPath));

            return response()->json(['success' => true, 'data' => $data]);
        } catch (Throwable $e) {
            report($e);

            return response()->json([
                'success' => false,
                'message' => 'Extraction automatique indisponible — merci de compléter le formulaire manuellement.',
            ], 422);
        } finally {
            Storage::disk('private')->delete($tempPath);
        }
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'guce_reference'     => 'required|string|max:100|unique:guce_certificates,guce_reference',
            'certificate_number' => 'required|string|max:100',
            'policy_number'      => 'nullable|string|max:100',
            'fdi_reference'      => 'nullable|string|max:100',
            'insured_name'       => 'required|string|max:255',
            'insured_address'    => 'nullable|string|max:500',
            'cargo_description'  => 'nullable|string|max:1000',
            'weight'             => 'nullable|string|max:50',
            'marks'              => 'nullable|string|max:255',
            'vessel'             => 'nullable|string|max:255',
            'origin'             => 'nullable|string|max:255',
            'destination'        => 'nullable|string|max:255',
            'transit_date'       => 'nullable|date',
            'insured_value'      => 'nullable|numeric|min:0',
            'currency'           => 'nullable|string|max:10',
            'net_premium'        => 'nullable|numeric|min:0',
            'total_premium'      => 'nullable|numeric|min:0',
            'notes'              => 'nullable|string|max:2000',
            'file'               => 'required|file|mimes:pdf,doc,docx|max:10240',
        ], [
            'guce_reference.unique'  => 'Cette référence GUCE est déjà enregistrée.',
            'file.mimes'             => 'Le fichier doit être au format PDF, DOC ou DOCX.',
            'file.max'               => 'Le fichier ne doit pas dépasser 10 Mo.',
        ]);

        $file = $request->file('file');
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('guce-certificates', $filename, 'private');

        GuceCertificate::create([
            ...$validated,
            'tenant_id'         => Auth::user()->tenant_id,
            'imported_by'       => Auth::id(),
            'file_path'         => $path,
            'file_original_name' => $file->getClientOriginalName(),
            'file_mime_type'    => $file->getMimeType(),
            'currency'          => $validated['currency'] ?? 'XOF',
        ]);

        return redirect()
            ->route('admin.guce-certificates.index')
            ->with('success', 'Certificat GUCE importé avec succès.');
    }

    public function show(GuceCertificate $guceCertificate): Response
    {
        $this->authorizeTenant($guceCertificate);

        $guceCertificate->load('importedBy:id,name');

        return Inertia::render('admin/guce-certificates/show', [
            'certificate' => $guceCertificate,
        ]);
    }

    public function download(GuceCertificate $guceCertificate)
    {
        $this->authorizeTenant($guceCertificate);

        if (! Storage::disk('private')->exists($guceCertificate->file_path)) {
            abort(404, 'Fichier introuvable.');
        }

        return Storage::disk('private')->download(
            $guceCertificate->file_path,
            $guceCertificate->file_original_name
        );
    }

    public function destroy(GuceCertificate $guceCertificate): RedirectResponse
    {
        $this->authorizeTenant($guceCertificate);

        Storage::disk('private')->delete($guceCertificate->file_path);
        $guceCertificate->delete();

        return redirect()
            ->route('admin.guce-certificates.index')
            ->with('success', 'Certificat GUCE supprimé.');
    }

    private function authorizeTenant(GuceCertificate $cert): void
    {
        $user = Auth::user();

        if ($user->hasRole('super_admin')) {
            return;
        }

        if ($cert->tenant_id !== $user->tenant_id) {
            abort(403);
        }
    }
}
