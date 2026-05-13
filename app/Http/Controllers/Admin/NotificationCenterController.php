<?php

namespace App\Http\Controllers\Admin;
 
use App\Http\Controllers\Controller;
use App\Models\NotificationPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
 
class NotificationCenterController extends Controller
{
    // ── Centre de notifications ───────────────────────────────
    public function index(Request $request): Response
    {
        $user  = $request->user();
        $since = now()->subDays(90);
 
        $query = \App\Models\Notification::forUser($user->id)
            ->inApp()
            ->where('created_at', '>=', $since)
            ->when($request->type,   fn ($q) => $q->where('type', $request->type))
            ->when($request->status, function ($q) use ($request) {
                $request->status === 'unread'
                    ? $q->whereNull('read_at')
                    : $q->whereNotNull('read_at');
            })
            ->latest()
            ->paginate(25)
            ->withQueryString();
 
        $stats = [
            'total'  => \App\Models\Notification::forUser($user->id)->inApp()->where('created_at', '>=', $since)->count(),
            'unread' => \App\Models\Notification::forUser($user->id)->inApp()->unread()->count(),
            'today'  => \App\Models\Notification::forUser($user->id)->inApp()->whereDate('created_at', today())->count(),
        ];
 
        // Formater
        $notifications = $query->through(fn ($n) => [
            'id'         => $n->id,
            'type'       => $n->type,
            'icon'       => $n->data['icon']  ?? 'bell',
            'color'      => $n->data['color'] ?? 'info',
            'title'      => $n->data['title'] ?? 'Notification',
            'body'       => $n->data['body']  ?? '',
            'url'        => $n->data['url']   ?? null,
            'read'       => ! is_null($n->read_at),
            'created_at' => $n->created_at?->toISOString(),
            'created_hr' => $n->created_at?->diffForHumans(),
        ]);
 
        return Inertia::render('admin/notifications/index', [
            'notifications' => $notifications,
            'stats'         => $stats,
            'preferences'   => NotificationPreference::forUser($user),
            'eventTypes'    => NotificationPreference::EVENT_TYPES,
            'filters'       => $request->only(['type', 'status']),
        ]);
    }
 
    // ── Marquer toutes comme lues ─────────────────────────────
    public function markAllRead(Request $request): RedirectResponse
    {
        DB::table('notifications')
            ->where('notifiable_id', $request->user()->id)
            ->where('channel', 'IN_APP')
            ->whereNull('read_at')
            ->update(['read_at' => now()]);
 
        return back()->with('status', 'Toutes les notifications ont été marquées comme lues.');
    }
 
    // ── Supprimer toutes lues ─────────────────────────────────
    public function clearRead(Request $request): RedirectResponse
    {
        DB::table('notifications')
            ->where('notifiable_id', $request->user()->id)
            ->where('channel', 'IN_APP')
            ->whereNotNull('read_at')
            ->delete();
 
        return back()->with('status', 'Notifications lues supprimées.');
    }
 
    // ── Sauvegarder les préférences ───────────────────────────
    public function savePreferences(Request $request): JsonResponse
    {
        $user = $request->user();
 
        $request->validate([
            'preferences'             => ['required', 'array'],
            'preferences.*.event_type'=> ['required', 'string'],
            'preferences.*.in_app'    => ['required', 'boolean'],
            'preferences.*.email'     => ['required', 'boolean'],
        ]);
 
        foreach ($request->preferences as $pref) {
            NotificationPreference::updateOrCreate(
                [
                    'user_id'    => $user->id,
                    'event_type' => $pref['event_type'],
                ],
                [
                    'in_app' => $pref['in_app'],
                    'email'  => $pref['email'],
                ]
            );
        }
 
        return response()->json(['ok' => true, 'message' => 'Préférences sauvegardées.']);
    }
}
