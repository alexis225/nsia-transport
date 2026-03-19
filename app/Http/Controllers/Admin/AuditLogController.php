<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class AuditLogController extends Controller
{
    // ── Liste ────────────────────────────────────────────────
    public function index(Request $request): InertiaResponse
    {
        $user  = $request->user();
        $isSA  = $user->hasRole('super_admin');

        $query = AuditLog::with(['user:id,first_name,last_name,email', 'tenant:id,name,code'])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->search, fn ($q) =>
                $q->where(fn ($q) =>
                    $q->whereHas('user', fn ($q) =>
                        $q->where('email', 'ilike', "%{$request->search}%")
                          ->orWhere('first_name', 'ilike', "%{$request->search}%")
                          ->orWhere('last_name',  'ilike', "%{$request->search}%")
                    )->orWhere('action', 'ilike', "%{$request->search}%")
                     ->orWhere('ip_address', 'ilike', "%{$request->search}%")
                )
            )
            ->when($request->action, fn ($q) =>
                $q->where('action', $request->action)
            )
            ->when($request->entity_type, fn ($q) =>
                $q->where('entity_type', $request->entity_type)
            )
            ->when($request->tenant_id && $isSA, fn ($q) =>
                $q->where('tenant_id', $request->tenant_id)
            )
            ->when($request->date_from, fn ($q) =>
                $q->whereDate('created_at', '>=', $request->date_from)
            )
            ->when($request->date_to, fn ($q) =>
                $q->whereDate('created_at', '<=', $request->date_to)
            )
            ->orderBy('created_at', 'desc')
            ->paginate(50)
            ->withQueryString();

        // Valeurs distinctes pour les filtres
        $actions      = AuditLog::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->distinct()->orderBy('action')->pluck('action');
        $entityTypes  = AuditLog::when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->distinct()->orderBy('entity_type')->pluck('entity_type');

        return Inertia::render('admin/audit-logs/index', [
            'logs'        => $query,
            'filters'     => $request->only(['search', 'action', 'entity_type', 'tenant_id', 'date_from', 'date_to']),
            'actions'     => $actions,
            'entityTypes' => $entityTypes,
            'isSA'        => $isSA,
        ]);
    }

    // ── Détail ───────────────────────────────────────────────
    public function show(Request $request, AuditLog $auditLog): InertiaResponse
    {
        $user = $request->user();

        if (! $user->hasRole('super_admin') && $auditLog->tenant_id !== $user->tenant_id) {
            abort(403);
        }

        $auditLog->load(['user:id,first_name,last_name,email', 'tenant:id,name,code']);

        return Inertia::render('admin/audit-logs/show', [
            'log' => $auditLog,
        ]);
    }

    // ── Export CSV ───────────────────────────────────────────
    public function export(Request $request): Response
    {
        $user = $request->user();
        $isSA = $user->hasRole('super_admin');

        $logs = AuditLog::with(['user:id,first_name,last_name,email', 'tenant:id,name,code'])
            ->when(! $isSA, fn ($q) => $q->where('tenant_id', $user->tenant_id))
            ->when($request->action,      fn ($q) => $q->where('action', $request->action))
            ->when($request->entity_type, fn ($q) => $q->where('entity_type', $request->entity_type))
            ->when($request->date_from,   fn ($q) => $q->whereDate('created_at', '>=', $request->date_from))
            ->when($request->date_to,     fn ($q) => $q->whereDate('created_at', '<=', $request->date_to))
            ->orderBy('created_at', 'desc')
            ->limit(10000)
            ->get();

        $csv = implode(',', ['Date', 'Utilisateur', 'Email', 'Action', 'Entité', 'ID Entité', 'IP', 'Filiale']) . "\n";

        foreach ($logs as $log) {
            $csv .= implode(',', [
                $log->created_at->format('Y-m-d H:i:s'),
                "\"{$log->user?->first_name} {$log->user?->last_name}\"",
                $log->user?->email ?? '',
                $log->action,
                $log->entity_type ?? '',
                $log->entity_id   ?? '',
                $log->ip_address  ?? '',
                $log->tenant?->name ?? '',
            ]) . "\n";
        }

        $filename = 'audit-logs-' . now()->format('Y-m-d') . '.csv';

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    // ── Purge ────────────────────────────────────────────────
    public function purge(Request $request): RedirectResponse
    {
        // Seul le super admin peut purger
        if (! $request->user()->hasRole('super_admin')) {
            abort(403);
        }

        $request->validate([
            'days' => ['required', 'integer', 'min:30', 'max:3650'],
        ]);

        $count = AuditLog::where('created_at', '<', now()->subDays($request->days))->count();
        AuditLog::where('created_at', '<', now()->subDays($request->days))->delete();

        return back()->with('status', "{$count} log(s) antérieurs à {$request->days} jours supprimés.");
    }
}