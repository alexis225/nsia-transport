<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\AsyncCertificateExportJob;
use App\Models\ReportExecution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * US-047 — Export asynchrone grands volumes
 */
class AsyncExportController extends Controller
{
    // Liste des exports de l'utilisateur courant
    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();

        $executions = ReportExecution::where('requested_by', $user->id)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get()
            ->map(fn ($e) => [
                'id'           => $e->id,
                'format'       => $e->format,
                'status'       => $e->status,
                'parameters'   => $e->parameters,
                'row_count'    => $e->row_count,
                'file_size'    => $e->file_size,
                'error_message'=> $e->error_message,
                'created_at'   => $e->created_at?->format('d/m/Y H:i'),
                'completed_at' => $e->completed_at?->format('d/m/Y H:i'),
                'expires_at'   => $e->expires_at?->format('d/m/Y H:i'),
                'is_expired'   => $e->isExpired(),
                'can_download' => $e->isCompleted() && ! $e->isExpired(),
            ]);

        return Inertia::render('admin/exports/index', [
            'executions' => $executions,
        ]);
    }

    // Dispatcher un export asynchrone certificats
    public function dispatchCertificates(Request $request): JsonResponse
    {
        $user = $request->user();

        // Créer l'entrée QUEUED
        $execution = ReportExecution::create([
            'tenant_id'    => $user->tenant_id,
            'requested_by' => $user->id,
            'format'       => 'CSV',
            'status'       => ReportExecution::STATUS_QUEUED,
            'parameters'   => array_merge(
                $request->only(['status', 'transport_type', 'date_from', 'date_to', 'broker_id', 'search']),
                [
                    'is_super_admin' => $user->hasRole('super_admin'),
                    'tenant_id'      => $user->tenant_id,
                ]
            ),
            'created_at'   => now(),
        ]);

        // Dispatcher le job
        AsyncCertificateExportJob::dispatch($execution->id);

        return response()->json([
            'message'      => 'Export lancé. Vous serez notifié à la fin.',
            'execution_id' => $execution->id,
        ]);
    }

    // Télécharger un export complété
    public function download(Request $request, string $execution): Response|\Illuminate\Http\RedirectResponse
    {
        $exec = ReportExecution::where('id', $execution)
            ->where('requested_by', $request->user()->id)
            ->firstOrFail();

        abort_if(! $exec->isCompleted(), 404, 'Export non disponible.');
        abort_if($exec->isExpired(), 410, 'Export expiré.');
        abort_if(! Storage::exists($exec->file_path), 404, 'Fichier introuvable.');

        $filename = 'certificats_' . $exec->created_at->format('Ymd_His') . '.csv';

        return response()->download(
            storage_path('app/' . $exec->file_path),
            $filename,
            ['Content-Type' => 'text/csv; charset=utf-8']
        );
    }

    // Polling status (JSON) — utilisé par le frontend
    public function status(Request $request, string $execution): JsonResponse
    {
        $exec = ReportExecution::where('id', $execution)
            ->where('requested_by', $request->user()->id)
            ->firstOrFail();

        return response()->json([
            'status'       => $exec->status,
            'row_count'    => $exec->row_count,
            'completed_at' => $exec->completed_at?->format('H:i'),
            'can_download' => $exec->isCompleted() && ! $exec->isExpired(),
        ]);
    }

    // Supprimer un export (et son fichier)
    public function destroy(Request $request, string $execution): JsonResponse
    {
        $exec = ReportExecution::where('id', $execution)
            ->where('requested_by', $request->user()->id)
            ->firstOrFail();

        if ($exec->file_path && Storage::exists($exec->file_path)) {
            Storage::delete($exec->file_path);
        }
        $exec->delete();

        return response()->json(['message' => 'Export supprimé.']);
    }
}
