<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IpBlacklist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * US-050 — Gestion de la blacklist IP
 * Réservé aux super_admin.
 */
class IpBlacklistController extends Controller
{
    public function index(Request $request): Response
    {
        $entries = IpBlacklist::with('blockedByUser:id,first_name,last_name')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($e) => [
                'id'          => $e->id,
                'ip_range'    => $e->ip_range,
                'reason'      => $e->reason,
                'is_active'   => $e->isActive(),
                'expires_at'  => $e->expires_at?->format('d/m/Y H:i'),
                'created_at'  => $e->created_at?->format('d/m/Y H:i'),
                'blocked_by'  => $e->blockedByUser
                    ? $e->blockedByUser->first_name . ' ' . $e->blockedByUser->last_name
                    : 'Système',
            ]);

        // Stats failed logins (depuis User model)
        $suspiciousUsers = \App\Models\User::where('failed_login_attempts', '>', 3)
            ->orderByDesc('failed_login_attempts')
            ->limit(10)
            ->get(['id', 'first_name', 'last_name', 'email', 'failed_login_attempts', 'last_login_ip', 'locked_until']);

        return Inertia::render('admin/security/ip-blacklist', [
            'entries'         => $entries,
            'suspiciousUsers' => $suspiciousUsers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'ip_range'   => ['required', 'string', 'max:50'],
            'reason'     => ['nullable', 'string', 'max:255'],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        // Vérifier que la plage CIDR est valide via PostgreSQL
        try {
            \Illuminate\Support\Facades\DB::statement(
                "SELECT ?::cidr", [$request->ip_range]
            );
        } catch (\Exception) {
            return response()->json(['message' => 'Plage IP/CIDR invalide.'], 422);
        }

        $entry = IpBlacklist::create([
            'ip_range'   => $request->ip_range,
            'reason'     => $request->reason,
            'blocked_by' => $request->user()->id,
            'expires_at' => $request->expires_at,
        ]);

        return response()->json(['message' => 'IP bloquée.', 'id' => $entry->id]);
    }

    public function destroy(string $id): JsonResponse
    {
        $entry = IpBlacklist::findOrFail($id);
        $entry->delete();

        return response()->json(['message' => 'Entrée supprimée.']);
    }

    // Débloquer un utilisateur verrouillé
    public function unlockUser(Request $request, string $userId): JsonResponse
    {
        $user = \App\Models\User::findOrFail($userId);
        $user->update([
            'failed_login_attempts' => 0,
            'locked_until'          => null,
        ]);

        return response()->json(['message' => "Utilisateur {$user->email} déverrouillé."]);
    }
}
