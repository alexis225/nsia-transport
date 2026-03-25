<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CertificateTemplate;
use App\Models\Tenant;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * CertificateTemplateController — US-013
 * ============================================================
 */
class CertificateTemplateController extends Controller
{
    // ── Liste ────────────────────────────────────────────────
    public function index(): Response
    {
        $templates = CertificateTemplate::with('tenant:id,name,code')
            ->orderBy('created_at')
            ->get();

        $tenantsWithoutTemplate = Tenant::whereNotIn(
            'id',
            $templates->pluck('tenant_id')
        )->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('admin/certificate-templates/index', [
            'templates'              => $templates,
            'tenantsWithoutTemplate' => $tenantsWithoutTemplate,
        ]);
    }

    // ── Formulaire création ──────────────────────────────────
    public function create(): Response
    {
        $tenants = Tenant::whereNotIn(
            'id',
            CertificateTemplate::pluck('tenant_id')
        )->orderBy('name')->get(['id', 'name', 'code']);

        return Inertia::render('admin/certificate-templates/create', [
            'tenants' => $tenants,
        ]);
    }

    // ── Créer ────────────────────────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        // Décoder les champs JSON envoyés en FormData
        $this->decodeFormData($request);

        $validated = $this->validateTemplate($request);

        // Upload logo si fourni
        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('logos/certificates', 'public');
        }

        $template = CertificateTemplate::create([
            ...$validated,
            'logo_path'  => $logoPath,
            'created_by' => $request->user()->id,
        ]);

        return redirect()->route('admin.certificate-templates.show', ['certificateTemplate' => $template->id])
            ->with('status', 'Modèle de certificat créé.')
            ->with('templateId', $template->id); // pour upload logo post-création
    }

    // ── Décoder les champs FormData (booléens + arrays JSON) ──
    private function decodeFormData(Request $request): void
    {
        // Booléens — FormData envoie "true"/"false" comme strings
        foreach (['is_bilingual','has_container_options','has_flight_number','has_vessel_name','has_currency_rate','is_active'] as $bool) {
            if ($request->has($bool)) {
                $request->merge([$bool => filter_var($request->input($bool), FILTER_VALIDATE_BOOLEAN)]);
            }
        }

        // Arrays JSON — prime_breakdown_lines peut arriver en string JSON
        if ($request->has('prime_breakdown_lines') && is_string($request->input('prime_breakdown_lines'))) {
            $decoded = json_decode($request->input('prime_breakdown_lines'), true);
            $request->merge(['prime_breakdown_lines' => $decoded ?? []]);
        }

        // Entiers
        if ($request->has('number_padding')) {
            $request->merge(['number_padding' => (int) $request->input('number_padding')]);
        }
    }

    // ── Détail + Prévisualisation ────────────────────────────
    public function show(CertificateTemplate $certificateTemplate): Response
    {
        $certificateTemplate->load('tenant');

        return Inertia::render('admin/certificate-templates/show', [
            'template' => $certificateTemplate,
        ]);
    }

    // ── Formulaire modification ──────────────────────────────
    public function edit(CertificateTemplate $certificateTemplate): Response
    {
        $certificateTemplate->load('tenant');

        return Inertia::render('admin/certificate-templates/edit', [
            'template' => $certificateTemplate,
            'tenants'  => Tenant::orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    // ── Modifier ─────────────────────────────────────────────
    public function update(Request $request, CertificateTemplate $certificateTemplate): RedirectResponse
    {
        $validated = $this->validateTemplate($request, $certificateTemplate->id);
        $certificateTemplate->update($validated);

        return redirect()->route('admin.certificate-templates.index')
            ->with('status', 'Modèle mis à jour.');
    }

    // ── Supprimer ────────────────────────────────────────────
    public function destroy(CertificateTemplate $certificateTemplate): RedirectResponse
    {
        $certificateTemplate->delete();

        return redirect()->route('admin.certificate-templates.index')
            ->with('status', 'Modèle supprimé.');
    }

    // ── Upload logo ──────────────────────────────────────────
    public function updateLogo(Request $request, CertificateTemplate $certificateTemplate): RedirectResponse
    {
        $request->validate([
            'logo' => ['required', 'file', 'image', 'mimes:jpeg,png,webp,svg', 'max:2048'],
        ]);

        if ($certificateTemplate->logo_path) {
            \Storage::disk('public')->delete($certificateTemplate->logo_path);
        }

        $path = $request->file('logo')->store('logos/certificates', 'public');
        $certificateTemplate->update(['logo_path' => $path]);

        return back()->with('status', 'Logo mis à jour.');
    }

    // ── Validation commune ───────────────────────────────────
    private function validateTemplate(Request $request, ?string $ignoreId = null): array
    {
        return $request->validate([
            'tenant_id'              => ['required', 'uuid', 'exists:tenants,id'],
            'name'                   => ['required', 'string', 'max:150'],
            'code'                   => ['required', 'string', 'max:20'],
            'type'                   => ['required', 'in:ordre_assurance,certificat_assurance'],
            'company_name'           => ['required', 'string', 'max:150'],
            'company_address'        => ['nullable', 'string', 'max:255'],
            'company_phone'          => ['nullable', 'string', 'max:100'],
            'company_email'          => ['nullable', 'email'],
            'company_website'        => ['nullable', 'string', 'max:150'],
            'company_rccm'           => ['nullable', 'string', 'max:100'],
            'company_capital'        => ['nullable', 'string', 'max:100'],
            'legal_framework'        => ['nullable', 'string'],
            'police_prefix'          => ['nullable', 'string', 'max:20'],
            'currency_code'          => ['required', 'size:3'],
            'city'                   => ['nullable', 'string', 'max:100'],
            'is_bilingual'           => ['boolean'],
            'has_container_options'  => ['boolean'],
            'has_flight_number'      => ['boolean'],
            'has_vessel_name'        => ['boolean'],
            'has_currency_rate'      => ['boolean'],
            'prime_breakdown_lines'  => ['nullable', 'array'],
            'prime_breakdown_lines.*.key'      => ['required', 'string'],
            'prime_breakdown_lines.*.label'    => ['required', 'string'],
            'prime_breakdown_lines.*.label_en' => ['nullable', 'string'],
            'footer_text'            => ['nullable', 'string'],
            'claims_text'            => ['nullable', 'string'],
            'conditions_text'        => ['nullable', 'string'],
            'number_prefix'          => ['nullable', 'string', 'max:10'],
            'number_padding'         => ['integer', 'min:4', 'max:10'],
            'is_active'              => ['boolean'],
            'logo'                   => ['nullable', 'file', 'image', 'mimes:jpeg,png,webp,svg', 'max:2048'],
        ]);
    }
}