<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserRoleGrant;
use App\Models\User;
use App\Services\DelegationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DelegationController extends Controller
{
    public function __construct(private DelegationService $service) {}

    // ── Liste ─────────────────────────────────────────────────
    public function index(Request $request): Response
    {
        $user = $request->user();

        // Délégations accordées par cet admin (délégant)
        $granted = UserRoleGrant::with([
                'grantee:id,first_name,last_name,email',
                'revokedBy:id,first_name,last_name',
            ])
            ->where('granted_by', $user->id)
            ->orderBy('granted_at', 'desc')
            ->get()
            ->map(fn ($g) => $this->formatGrant($g));

        // Délégations reçues actives (délégataire)
        $received = UserRoleGrant::with(['grantor:id,first_name,last_name'])
            ->where('user_id', $user->id)
            ->active()
            ->orderBy('expires_at', 'asc')
            ->get()
            ->map(fn ($g) => $this->formatGrant($g));

        // ── CORRECTION : super_admin voit tous les users ──────
        $colleagues = User::when(
                ! $user->hasRole('super_admin'),
                fn ($q) => $q->where('tenant_id', $user->tenant_id)
            )
            ->where('id', '!=', $user->id)
            ->orderBy('first_name')
            ->get(['id', 'first_name', 'last_name', 'email', 'tenant_id']);

        // Rôles déléguables selon le rôle du délégant
        $delegatableRoles = $this->getDelegatableRoles($user);

        return Inertia::render('admin/delegations/index', [
            'granted'          => $granted,
            'received'         => $received,
            'colleagues'       => $colleagues,
            'delegatableRoles' => $delegatableRoles,
            'can'              => [
                'create' => $user->hasRole('admin_filiale') || $user->hasRole('super_admin'),
            ],
        ]);
    }

    // ── Créer ─────────────────────────────────────────────────
    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_if(! ($user->hasRole('admin_filiale') || $user->hasRole('super_admin')), 403);

        $delegatable = array_keys($this->getDelegatableRoles($user));

        $request->validate([
            'grantee_id' => ['required', 'uuid', 'exists:users,id', 'different:' . $user->id],
            'role_name'  => ['required', 'string', 'in:' . implode(',', $delegatable)],
            'expires_at' => ['required', 'date', 'after:today'],
            'reason'     => ['nullable', 'string', 'max:255'],
        ]);

        $grantee = User::findOrFail($request->grantee_id);

        // ── CORRECTION : restriction filiale sauf super_admin ─
        abort_if(
            ! $user->hasRole('super_admin')
            && (string) $grantee->tenant_id !== (string) $user->tenant_id,
            403, 'Le délégataire doit être dans la même filiale.'
        );

        // Vérifier doublon actif
        $existing = UserRoleGrant::where('user_id', $grantee->id)
            ->where('granted_by', $user->id)
            ->where('role_name', $request->role_name)
            ->active()
            ->first();

        if ($existing) {
            return back()->withErrors([
                'role_name' => "Une délégation active du rôle \"{$request->role_name}\" existe déjà pour cet utilisateur.",
            ]);
        }

        $this->service->create(
            $user, $grantee,
            $request->role_name,
            $request->expires_at,
            $request->reason
        );

        $roleLabel = UserRoleGrant::DELEGATABLE_ROLES[$request->role_name] ?? $request->role_name;
        return back()->with('status', "Rôle \"{$roleLabel}\" délégué à {$grantee->first_name} {$grantee->last_name}.");
    }

    // ── Révoquer ──────────────────────────────────────────────
    public function revoke(Request $request, UserRoleGrant $grant): RedirectResponse
    {
        $user = $request->user();

        abort_if(
            (string) $grant->granted_by !== (string) $user->id
            && ! $user->hasRole('super_admin'),
            403
        );

        abort_if($grant->isRevoked(), 422, 'Cette délégation est déjà révoquée.');

        $request->validate(['reason' => ['nullable', 'string', 'max:255']]);

        $this->service->revoke($grant, $user, $request->reason);

        return back()->with('status', 'Délégation révoquée.');
    }

    // ── Helpers ───────────────────────────────────────────────

    // ── CORRECTION : super_admin peut déléguer tous les rôles ─
    private function getDelegatableRoles(User $user): array
    {
        if ($user->hasRole('super_admin')) {
            return UserRoleGrant::DELEGATABLE_ROLES;
        }

        if ($user->hasRole('admin_filiale')) {
            return [
                'souscripteur'   => 'Souscripteur',
                'courtier_local' => 'Courtier local',
            ];
        }

        return [];
    }

    private function formatGrant(UserRoleGrant $g): array
    {
        return [
            'id'         => $g->id,
            'status'     => $g->status(),
            'is_active'  => $g->isActive(),
            'role_name'  => $g->role_name,
            'role_label' => UserRoleGrant::DELEGATABLE_ROLES[$g->role_name] ?? $g->role_name,
            'reason'     => $g->reason,
            'granted_at' => $g->granted_at?->toISOString(),
            'expires_at' => $g->expires_at?->toISOString(),
            'revoked_at' => $g->revoked_at?->toISOString(),
            'grantee'    => $g->grantee ? [
                'id'    => $g->grantee->id,
                'name'  => $g->grantee->first_name . ' ' . $g->grantee->last_name,
                'email' => $g->grantee->email,
            ] : null,
            'grantor'    => $g->grantor ? [
                'id'   => $g->grantor->id,
                'name' => $g->grantor->first_name . ' ' . $g->grantor->last_name,
            ] : null,
            'revoked_by' => $g->revokedBy ? [
                'name' => $g->revokedBy->first_name . ' ' . $g->revokedBy->last_name,
            ] : null,
        ];
    }
}