<?php

namespace App\Console\Commands;

use App\Services\DelegationService;
use Illuminate\Console\Command;

class DelegationExpiryCheck extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'nsia:check-delegations';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Notifie les délégations de rôle arrivées à échéance';

    /**
     * Execute the console command.
     */
    public function handle(DelegationService $service): void
    {
        $count = $service->expireOverdue();
        $this->info("{$count} délégation(s) expirée(s) traitée(s).");
    }
}
