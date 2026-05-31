<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\GuceCertificate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class GuceCertificateController extends Controller
{
    public function index(Request $request): Response
    {
        $tenantId = Auth::user()->tenant_id;

        $query = GuceCertificate::where('tenant_id', $tenantId)
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
        if ($cert->tenant_id !== Auth::user()->tenant_id) {
            abort(403);
        }
    }
}
