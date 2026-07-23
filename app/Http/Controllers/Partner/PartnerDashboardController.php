<?php

namespace App\Http\Controllers\Partner;

use App\Http\Controllers\Controller;
use App\Models\CertificateRequest;
use App\Models\Notification;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PartnerDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $broker = $request->user()->broker;
        $notifications = $this->unreadNotifications($request);

        if (! $broker) {
            return Inertia::render('partner/dashboard', [
                'broker'            => null,
                'counts'            => null,
                'certificateCounts' => null,
                'notifications'     => $notifications,
            ]);
        }

        $counts = CertificateRequest::where('broker_id', $broker->id)
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        $certificateRequestsBase = CertificateRequest::where('broker_id', $broker->id);

        return Inertia::render('partner/dashboard', [
            'broker' => $broker->only(['id', 'name', 'code', 'type']),
            'tenant' => $broker->tenant?->only(['id', 'name', 'code']),
            'counts' => [
                'pending'    => $counts['PENDING'] ?? 0,
                'in_review'  => $counts['IN_REVIEW'] ?? 0,
                'approved'   => $counts['APPROVED'] ?? 0,
                'rejected'   => $counts['REJECTED'] ?? 0,
            ],
            'certificateCounts' => [
                'issued' => (clone $certificateRequestsBase)->whereNotNull('certificate_id')->count(),
                'guce'   => (clone $certificateRequestsBase)->whereNotNull('guce_certificate_id')->count(),
            ],
            'notifications' => $notifications,
        ]);
    }

    private function unreadNotifications(Request $request)
    {
        return Notification::forUser($request->user()->id)
            ->inApp()
            ->unread()
            ->latest()
            ->limit(5)
            ->get()
            ->map(fn (Notification $n) => [
                'id'    => $n->id,
                'title' => $n->data['title'] ?? 'Notification',
                'body'  => $n->data['body']  ?? '',
                'url'   => $n->data['url']   ?? null,
            ]);
    }
}
