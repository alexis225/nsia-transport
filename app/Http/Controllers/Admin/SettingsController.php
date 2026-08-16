<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * ============================================================
 * SettingsController — Paramètres généraux de l'Application
 * ============================================================
 * Réservé super_admin — plafond NN300 et Plafond/limite Traité,
 * uniques pour toute l'application (plus de saisie par contrat).
 * ============================================================
 */
class SettingsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/settings/index', [
            'nn300Ceiling' => (float) Setting::get(Setting::KEY_NN300_CEILING, 2_000_000_000),
            'treatyLimit'  => (float) Setting::get(Setting::KEY_TREATY_LIMIT, 6_000_000_000),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'nn300_ceiling' => ['required', 'numeric', 'min:1'],
            'treaty_limit'  => ['required', 'numeric', 'min:1', 'gte:nn300_ceiling'],
        ], [
            'treaty_limit.gte' => 'Le Plafond Traité doit être supérieur ou égal au plafond NN300.',
        ]);

        Setting::set(Setting::KEY_NN300_CEILING, (string) $validated['nn300_ceiling']);
        Setting::set(Setting::KEY_TREATY_LIMIT, (string) $validated['treaty_limit']);

        return back()->with('status', 'Paramètres mis à jour.');
    }
}
