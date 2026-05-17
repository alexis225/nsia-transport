<?php

namespace App\Console\Commands;

use App\Models\Certificate;
use App\Models\InsuranceContract;
use App\Models\Tenant;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * US-049 — Génération KPIs automatiques (scheduler)
 * Calcule et met en cache les KPIs de chaque filiale + globaux.
 * Planification : daily à 06:00 (voir routes/console.php).
 */
class GenerateKpiSnapshots extends Command
{
    protected $signature   = 'nsia:generate-kpi-snapshots';
    protected $description = 'Génère et met en cache les snapshots KPI par filiale (US-049)';

    public function handle(): int
    {
        $this->info('[KPI] Génération des snapshots — ' . now()->toDateTimeString());

        $tenants = Tenant::where('is_active', true)->get(['id', 'name', 'code']);

        foreach ($tenants as $tenant) {
            $snapshot = $this->buildSnapshot($tenant->id);
            Cache::put("kpi_snapshot_{$tenant->id}", $snapshot, now()->addHours(25));
            $this->line("  ✓ {$tenant->code}");
        }

        // Snapshot global (toutes filiales)
        $global = $this->buildSnapshot(null);
        Cache::put('kpi_snapshot_global', $global, now()->addHours(25));
        $this->info('[KPI] Global calculé.');

        $this->info("[KPI] Terminé — {$tenants->count()} filiales + global.");
        return self::SUCCESS;
    }

    private function buildSnapshot(?string $tenantId): array
    {
        $certBase = Certificate::when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId));
        $contBase = InsuranceContract::when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId));

        return [
            'generated_at'   => now()->toIso8601String(),
            'issued_month'   => (clone $certBase)->where('status', 'ISSUED')
                                    ->whereMonth('issued_at', now()->month)
                                    ->whereYear('issued_at', now()->year)->count(),
            'issued_ytd'     => (clone $certBase)->where('status', 'ISSUED')
                                    ->whereYear('issued_at', now()->year)->count(),
            'submitted'      => (clone $certBase)->where('status', 'SUBMITTED')->count(),
            'prime_month'    => (float)(clone $certBase)->where('status', 'ISSUED')
                                    ->whereMonth('issued_at', now()->month)
                                    ->whereYear('issued_at', now()->year)->sum('prime_total'),
            'contracts_active'  => (clone $contBase)->where('status', 'ACTIVE')->count(),
            'contracts_expiring_30' => (clone $contBase)->where('status', 'ACTIVE')
                                    ->whereDate('expiry_date', '<=', now()->addDays(30))->count(),
            'monthly_issued' => $this->monthlyIssued($tenantId),
        ];
    }

    private function monthlyIssued(?string $tenantId): array
    {
        $raw = Certificate::where('status', 'ISSUED')
            ->when($tenantId, fn ($q) => $q->where('tenant_id', $tenantId))
            ->where('issued_at', '>=', now()->subMonths(11)->startOfMonth())
            ->selectRaw("TO_CHAR(issued_at, 'YYYY-MM') as m, COUNT(*) as cnt")
            ->groupBy('m')
            ->orderBy('m')
            ->pluck('cnt', 'm')
            ->toArray();

        $result = [];
        for ($i = 11; $i >= 0; $i--) {
            $key      = now()->subMonths($i)->format('Y-m');
            $result[] = (int)($raw[$key] ?? 0);
        }
        return $result;
    }
}
