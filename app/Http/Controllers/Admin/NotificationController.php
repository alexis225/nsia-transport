<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * ============================================================
 * NotificationController — US-025
 * ============================================================
 * API JSON pour les notifications in-app.
 * Polled toutes les 30s depuis le frontend.
 * ============================================================
 */
class NotificationController extends Controller
{
    // ── Liste des notifications (non lues + récentes) ─────────
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = $user->notifications()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn ($n) => [
                'id'         => $n->id,
                'type'       => $n->data['type'] ?? 'info',
                'icon'       => $n->data['icon'] ?? 'bell',
                'color'      => $n->data['color'] ?? 'info',
                'title'      => $this->buildTitle($n->data),
                'body'       => $this->buildBody($n->data),
                'url'        => $n->data['url'] ?? null,
                'read'       => ! is_null($n->read_at),
                'created_at' => $n->created_at->diffForHumans(),
                'created_ts' => $n->created_at->toISOString(),
            ]);

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $user->unreadNotifications()->count(),
        ]);
    }

    // ── Marquer une notification comme lue ────────────────────
    public function markRead(Request $request, string $id): JsonResponse
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();
        return response()->json(['ok' => true]);
    }

    // ── Marquer toutes comme lues ─────────────────────────────
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();
        return response()->json(['ok' => true]);
    }

    // ── Supprimer une notification ────────────────────────────
    public function destroy(Request $request, string $id): JsonResponse
    {
        $request->user()->notifications()->findOrFail($id)->delete();
        return response()->json(['ok' => true]);
    }

    // ── Helpers : titre et corps ──────────────────────────────
    private function buildTitle(array $data): string
    {
        return match($data['type'] ?? '') {
            'certificate.submitted'  => "Certificat en attente",
            'certificate.issued'     => "Certificat émis",
            'certificate.rejected'   => "Certificat rejeté",
            'certificate.cancelled'  => "Certificat annulé",
            'contract.expiring'      => "Contrat expire bientôt",
            'contract.limit_reached' => "Alerte plafond NN300",
            default                  => "Notification",
        };
    }

    private function buildBody(array $data): string
    {
        return match($data['type'] ?? '') {
            'certificate.submitted'  => "N° {$data['certificate_number']} — {$data['insured_name']}",
            'certificate.issued'     => "N° {$data['certificate_number']} émis avec succès",
            'certificate.rejected'   => "N° {$data['certificate_number']} — {$data['reason']}",
            'certificate.cancelled'  => "N° {$data['certificate_number']} annulé",
            'contract.expiring'      => "{$data['contract_number']} expire dans {$data['days_left']} jours",
            'contract.limit_reached' => "{$data['contract_number']} — plafond à {$data['usage_percent']}%",
            default                  => "",
        };
    }
}