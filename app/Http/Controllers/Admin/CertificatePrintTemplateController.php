<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CertificatePrintTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * CertificatePrintTemplateController
 * ============================================================
 * Permet de modifier directement, depuis l'admin, le JSON des
 * positions (mm) de chaque carnet — sans passer par un déploiement
 * de code — ainsi que le PDF de souche scannée servant de repère
 * visuel pour le calibrage.
 * ============================================================
 */
class CertificatePrintTemplateController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/certificates/print-positions/index', [
            'overrides' => CertificatePrintTemplate::all()->keyBy('template_id'),
        ]);
    }

    public function edit(string $templateId): Response
    {
        return Inertia::render('admin/certificates/print-positions/edit', [
            'templateId' => $templateId,
            'override' => CertificatePrintTemplate::where('template_id', $templateId)->first(),
        ]);
    }

    // ── Enregistrer le JSON (+ PDF de référence optionnel) ─────
    public function update(Request $request, string $templateId): RedirectResponse
    {
        // Le JSON arrive en tant que champ FormData (nécessaire pour
        // pouvoir joindre le PDF dans la même requête) — décodé avant
        // validation, même principe que CertificateTemplateController::
        // decodeFormData() pour prime_breakdown_lines.
        $positions = json_decode((string) $request->input('positions'), true);
        $request->merge(['positions' => is_array($positions) ? $positions : null]);

        $validated = $request->validate([
            'positions' => ['required', 'array', 'min:1'],
            'positions.*.key' => ['required', 'string'],
            'positions.*.top' => ['required', 'numeric'],
            'positions.*.left' => ['required', 'numeric'],
            'positions.*.width' => ['nullable', 'numeric'],
            'positions.*.fontSize' => ['nullable', 'numeric'],
            'positions.*.align' => ['nullable', 'in:left,center,right'],
            'positions.*.bold' => ['nullable', 'boolean'],
            'base_pdf' => ['nullable', 'file', 'mimes:pdf', 'max:10240'],
        ], [
            'positions.required' => 'Le JSON des positions est invalide ou vide.',
        ]);

        $template = CertificatePrintTemplate::firstOrNew(['template_id' => $templateId]);

        if ($request->hasFile('base_pdf')) {
            if ($template->base_pdf_path) {
                Storage::disk('public')->delete($template->base_pdf_path);
            }
            $template->base_pdf_path = $request->file('base_pdf')->store('certificate-print-templates', 'public');
        }

        $template->template_id = $templateId;
        $template->positions = $validated['positions'];
        $template->updated_by = $request->user()->id;
        $template->save();

        return back()->with('status', 'Positions mises à jour.');
    }

    // ── Revenir aux coordonnées par défaut codées dans le composant ─
    public function destroy(string $templateId): RedirectResponse
    {
        $template = CertificatePrintTemplate::where('template_id', $templateId)->first();

        if ($template) {
            if ($template->base_pdf_path) {
                Storage::disk('public')->delete($template->base_pdf_path);
            }
            $template->delete();
        }

        return back()->with('status', 'Positions réinitialisées aux valeurs par défaut.');
    }
}
