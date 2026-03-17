<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Actions\DisableTwoFactorAuthentication;
use Laravel\Fortify\Actions\EnableTwoFactorAuthentication;
use Laravel\Fortify\Actions\GenerateNewRecoveryCodes;

/**
 * ============================================================
 * MfaSetupController — US-002
 * ============================================================
 * Fortify expose déjà nativement :
 *   POST   /user/two-factor-authentication   → activer
 *   DELETE /user/two-factor-authentication   → désactiver
 *   GET    /user/two-factor-qr-code          → QR SVG
 *   GET    /user/two-factor-secret-key       → clé secrète
 *   POST   /user/two-factor-recovery-codes   → regénérer codes
 *   POST   /two-factor-challenge             → valider code TOTP
 *
 * Ce controller gère la page de setup Inertia + audit logs.
 * ============================================================
 * Prérequis config/fortify.php :
 *   Features::twoFactorAuthentication([
 *       'confirm'         => true,
 *       'confirmPassword' => true,
 *   ]),
 * ============================================================
 */
class MfaSetupController extends Controller
{
    // ── Page setup MFA ───────────────────────────────────────
    public function show(Request $request): Response
    {
        $user        = $request->user();
        $mfaEnabled  = $user->two_factor_confirmed_at !== null;
        $mfaPending  = ! $mfaEnabled && $user->two_factor_secret !== null;

        return Inertia::render('auth/mfa-setup', [
            'mfaEnabled'    => $mfaEnabled,
            'mfaPending'    => $mfaPending,
            'qrCodeSvg'     => $mfaPending ? $user->twoFactorQrCodeSvg() : null,
            'secretKey'     => $mfaPending ? decrypt($user->two_factor_secret) : null,
            'recoveryCodes' => $mfaEnabled ? $user->recoveryCodes() : [],
        ]);
    }

    // ── Activer (génère secret + QR) ─────────────────────────
    public function enable(
        Request $request,
        EnableTwoFactorAuthentication $enable,
    ): RedirectResponse {
        $enable($request->user());

        $this->auditLog($request, 'mfa_enable_initiated');

        return redirect()->route('mfa.setup')->with('status', 'Scannez le QR code avec Google Authenticator.');
    }

    // ── Désactiver ───────────────────────────────────────────
    public function disable(
        Request $request,
        DisableTwoFactorAuthentication $disable,
    ): RedirectResponse {
        $disable($request->user());

        $this->auditLog($request, 'mfa_disabled');

        return redirect()->route('mfa.setup')->with('status', 'Authentification à deux facteurs désactivée.');
    }

    // ── Regénérer codes de récupération ──────────────────────
    public function regenerateRecoveryCodes(
        Request $request,
        GenerateNewRecoveryCodes $generate,
    ): RedirectResponse {
        $generate($request->user());

        $this->auditLog($request, 'mfa_recovery_codes_regenerated');

        return redirect()->route('mfa.setup')->with('status', 'Codes de récupération régénérés.');
    }

    // ── Audit log helper ─────────────────────────────────────
    private function auditLog(Request $request, string $action): void
    {
        AuditLog::create([
            'tenant_id'      => $request->user()->tenant_id,
            'user_id'        => $request->user()->id,
            'action'         => $action,
            'auditable_type' => 'user',
            'auditable_id'   => $request->user()->id,
            'ip_address'     => $request->ip(),
            'user_agent'     => $request->userAgent(),
        ]);
    }
}