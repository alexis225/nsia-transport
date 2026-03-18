<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserBlockController extends Controller
{
    public function block(Request $request, User $user): RedirectResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        // 1. Auto-blocage
        if ($user->getKey() == $request->user()->getKey()) {
            return back()->withErrors(['user' => 'Vous ne pouvez pas vous bloquer vous-même.']);
        }

        // 2. Super admin intouchable
        if ($user->fresh()->hasRole('super_admin')) {
            return back()->withErrors(['user' => 'Impossible de bloquer un super administrateur.']);
        }

        // 3. Isolation tenant
        $this->authorizeTenantAccess($user);

        $user->update([
            'is_active'      => false,
            'blocked_by'     => $request->user()->id,
            'blocked_at'     => now(),
            'blocked_reason' => $request->reason,
        ]);

        // Invalider les sessions actives
        DB::table('sessions')->where('user_id', $user->id)->delete();

        $this->auditLog($request, $user, 'user_blocked', [
            'reason'     => $request->reason,
            'blocked_by' => (string) $request->user()->id,
        ]);

        return back()->with('status', "L'utilisateur {$user->first_name} {$user->last_name} a été bloqué.");
    }

    public function unblock(Request $request, User $user): RedirectResponse
    {
        $user->update([
            'is_active'             => true,
            'blocked_by'            => null,
            'blocked_at'            => null,
            'blocked_reason'        => null,
            'failed_login_attempts' => 0,
            'locked_until'          => null,
        ]);

        $this->auditLog($request, $user, 'user_unblocked', [
            'unblocked_by' => (string) $request->user()->id,
        ]);

        return back()->with('status', "L'utilisateur {$user->first_name} {$user->last_name} a été débloqué.");
    }

    private function authorizeTenantAccess(User $target): void
    {
        $currentUser = auth()->user();

        if ($currentUser->hasRole('super_admin')) {
            return;
        }

        if ((string) $currentUser->tenant_id !== (string) $target->tenant_id) {
            abort(403, 'Vous ne pouvez pas gérer les utilisateurs d\'une autre filiale.');
        }
    }

    private function auditLog(Request $request, User $target, string $action, array $metadata = []): void
    {
        AuditLog::create([
            'tenant_id'   => $target->tenant_id,
            'user_id'     => $request->user()->id,
            'action'      => $action,
            'entity_type' => 'user',
            'entity_id'   => $target->id,
            'ip_address'  => $request->ip(),
            'user_agent'  => $request->userAgent(),
            'new_values'  => $metadata,
            'old_values'  => ['is_active' => $action === 'user_blocked' ? true : false],
        ]);
    }
}