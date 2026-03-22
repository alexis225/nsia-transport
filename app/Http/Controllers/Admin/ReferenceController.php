<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\Currency;
use App\Models\Incoterm;
use App\Models\MerchandiseCategory;
use App\Models\TransportMode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * ReferenceController — US-012
 * ============================================================
 * Gestion des données de référence.
 * Utilise les modèles Eloquent réels du projet.
 *
 * Tables / Modèles :
 *   countries          → Country          (PK: code string)
 *   currencies         → Currency         (PK: code string)
 *   incoterms          → Incoterm         (PK: code string)
 *   transport_modes    → TransportMode    (PK: id auto-int, no timestamps)
 *   merchandise_categories → MerchandiseCategory (UUID, tenant_id nullable)
 * ============================================================
 */
class ReferenceController extends Controller
{
    // ── Index ────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $tab = $request->get('tab', 'countries');

        if (! in_array($tab, ['countries','currencies','incoterms','transport_modes','merchandise_categories'])) {
            $tab = 'countries';
        }

        $data = match ($tab) {
            'countries'               => $this->getCountries($request),
            'currencies'              => $this->getCurrencies($request),
            'incoterms'               => $this->getIncoterms($request),
            'transport_modes'         => $this->getTransportModes($request),
            'merchandise_categories'  => $this->getMerchandiseCategories($request),
        };

        return Inertia::render('admin/reference/index', [
            'tab'     => $tab,
            'data'    => $data,
            'filters' => $request->only(['search']),
            'counts'  => [
                'countries'              => Country::count(),
                'currencies'             => Currency::count(),
                'incoterms'              => Incoterm::count(),
                'transport_modes'        => TransportMode::count(),
                'merchandise_categories' => MerchandiseCategory::whereNull('tenant_id')->count(),
            ],
        ]);
    }

    // ── Données par onglet ───────────────────────────────────
    private function getCountries(Request $request)
    {
        return Country::when($request->search, fn ($q) =>
                $q->where('name_fr', 'ilike', "%{$request->search}%")
                  ->orWhere('name_en', 'ilike', "%{$request->search}%")
                  ->orWhere('code',    'ilike', "%{$request->search}%")
            )
            ->orderBy('region')->orderBy('name_fr')
            ->paginate(30)->withQueryString();
    }

    private function getCurrencies(Request $request)
    {
        return Currency::when($request->search, fn ($q) =>
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('code', 'ilike', "%{$request->search}%")
            )
            ->orderBy('code')
            ->paginate(30)->withQueryString();
    }

    private function getIncoterms(Request $request)
    {
        return Incoterm::when($request->search, fn ($q) =>
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('code', 'ilike', "%{$request->search}%")
            )
            ->orderBy('code')
            ->paginate(30)->withQueryString();
    }

    private function getTransportModes(Request $request)
    {
        return TransportMode::when($request->search, fn ($q) =>
                $q->where('name_fr', 'ilike', "%{$request->search}%")
                  ->orWhere('code',    'ilike', "%{$request->search}%")
            )
            ->orderBy('code')
            ->paginate(30)->withQueryString();
    }

    private function getMerchandiseCategories(Request $request)
    {
        return MerchandiseCategory::with('parent:id,code,name')
            ->whereNull('tenant_id')
            ->when($request->search, fn ($q) =>
                $q->where('name', 'ilike', "%{$request->search}%")
                  ->orWhere('code', 'ilike', "%{$request->search}%")
            )
            ->orderBy('code')
            ->paginate(30)->withQueryString();
    }

    // ── Toggle actif/inactif ─────────────────────────────────
    public function toggle(Request $request, string $tab, string $id): RedirectResponse
    {
        match ($tab) {
            'currencies' => tap(Currency::findOrFail($id), fn ($m) => $m->update(['is_active' => ! $m->is_active])),
            'merchandise_categories' => tap(MerchandiseCategory::findOrFail($id), fn ($m) => $m->update(['is_active' => ! $m->is_active])),
            default => abort(422, 'Toggle non supporté pour ce type.'),
        };

        return back()->with('status', 'Statut mis à jour.');
    }

    // ── Créer ────────────────────────────────────────────────
    public function store(Request $request, string $tab): RedirectResponse
    {
        match ($tab) {
            'countries' => Country::create($request->validate([
                'code'    => ['required', 'size:2', 'unique:countries,code'],
                'name_fr' => ['required', 'string', 'max:100'],
                'name_en' => ['required', 'string', 'max:100'],
                'region'  => ['nullable', 'string', 'max:100'],
            ])),

            'currencies' => Currency::create($request->validate([
                'code'      => ['required', 'size:3', 'unique:currencies,code'],
                'name'      => ['required', 'string', 'max:100'],
                'symbol'    => ['nullable', 'string', 'max:10'],
                'is_active' => ['boolean'],
            ])),

            'incoterms' => Incoterm::create($request->validate([
                'code'             => ['required', 'string', 'max:5', 'unique:incoterms,code'],
                'name'             => ['required', 'string', 'max:100'],
                'description'      => ['nullable', 'string'],
                'compatible_modes' => ['nullable', 'array'],
            ])),

            'transport_modes' => TransportMode::create($request->validate([
                'code'    => ['required', 'string', 'max:20'],
                'name_fr' => ['required', 'string', 'max:100'],
                'name_en' => ['required', 'string', 'max:100'],
                'icon'    => ['nullable', 'string', 'max:50'],
            ])),

            'merchandise_categories' => MerchandiseCategory::create($request->validate([
                'code'       => ['required', 'string', 'max:20'],
                'name'       => ['required', 'string', 'max:150'],
                'parent_id'  => ['nullable', 'uuid', 'exists:merchandise_categories,id'],
                'risk_level' => ['integer', 'min:1', 'max:3'],
            ]) + ['tenant_id' => null, 'is_active' => true]),

            default => abort(404),
        };

        return back()->with('status', 'Entrée créée.');
    }

    // ── Modifier ─────────────────────────────────────────────
    public function update(Request $request, string $tab, string $id): RedirectResponse
    {
        match ($tab) {
            'countries' => Country::findOrFail($id)->update($request->validate([
                'name_fr' => ['required', 'string', 'max:100'],
                'name_en' => ['required', 'string', 'max:100'],
                'region'  => ['nullable', 'string', 'max:100'],
            ])),

            'currencies' => Currency::findOrFail($id)->update($request->validate([
                'name'      => ['required', 'string', 'max:100'],
                'symbol'    => ['nullable', 'string', 'max:10'],
                'is_active' => ['boolean'],
            ])),

            'incoterms' => Incoterm::findOrFail($id)->update($request->validate([
                'name'             => ['required', 'string', 'max:100'],
                'description'      => ['nullable', 'string'],
                'compatible_modes' => ['nullable', 'array'],
            ])),

            'transport_modes' => TransportMode::findOrFail($id)->update($request->validate([
                'name_fr' => ['required', 'string', 'max:100'],
                'name_en' => ['required', 'string', 'max:100'],
                'icon'    => ['nullable', 'string', 'max:50'],
            ])),

            'merchandise_categories' => MerchandiseCategory::findOrFail($id)->update($request->validate([
                'name'       => ['required', 'string', 'max:150'],
                'parent_id'  => ['nullable', 'uuid', 'exists:merchandise_categories,id'],
                'risk_level' => ['integer', 'min:1', 'max:3'],
                'is_active'  => ['boolean'],
            ])),

            default => abort(404),
        };

        return back()->with('status', 'Entrée mise à jour.');
    }
}