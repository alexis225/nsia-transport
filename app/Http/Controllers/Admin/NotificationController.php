<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * ============================================================
 * NotificationController — US-025
 * ============================================================
 */
class NotificationController extends Controller
{
    // ── Liste des notifications ───────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = \App\Models\Notification::forUser($user->id)
            ->inApp()
            ->latest()
            ->limit(20)
            ->get()
            ->map(fn (\App\Models\Notification $n) => [
                'id'         => $n->id,
                'type'       => $n->type,
                'icon'       => $n->data['icon']  ?? 'bell',
                'color'      => $n->data['color'] ?? 'info',
                'title'      => $n->data['title'] ?? 'Notification',
                'body'       => $n->data['body']  ?? '',
                'url'        => $n->data['url']   ?? null,
                'read'       => $n->isRead(),
                'created_at' => $n->created_at?->diffForHumans() ?? 'À l\'instant',
                'created_ts' => $n->created_at?->toISOString()   ?? now()->toISOString(),
            ]);

        $unreadCount = \App\Models\Notification::forUser($user->id)
            ->inApp()
            ->unread()
            ->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ]);
    }

    // ── Marquer une notification comme lue ────────────────────
    // DB::table évite tout problème de scope, cast UUID ou markAsRead()
    public function markRead(Request $request, string $id): JsonResponse
    {
       DB::table('notifications')
        ->whereRaw('id::text = ?', [$id])
        ->whereRaw('notifiable_id::text = ?', [(string) $request->user()->id])
        ->whereNull('read_at')
        ->update(['read_at' => now()]);
        return response()->json(['ok' => true]);
    }

    // ── Marquer toutes comme lues ─────────────────────────────
    public function markAllRead(Request $request): JsonResponse
    {
        DB::table('notifications')
            ->where('notifiable_id', $request->user()->id)
            ->where('notifiable_type', 'App\\Models\\User')
            ->where('channel', 'IN_APP')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return response()->json(['ok' => true]);
    }

    // ── Supprimer une notification ────────────────────────────
    public function destroy(Request $request, string $id): JsonResponse
    {
        DB::table('notifications')
            ->where('id', $id)
            ->where('notifiable_id', $request->user()->id)
            ->delete();

        return response()->json(['ok' => true]);
    }
}