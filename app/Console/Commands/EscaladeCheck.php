<?php

namespace App\Console\Commands;

use App\Services\ApprovalWorkflowService;
use Illuminate\Console\Command;

class EscaladeCheck extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-escalades';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vérifie les workflows d\'escalade NN300 expirés';

    /**
     * Execute the console command.
     */
    public function handle(ApprovalWorkflowService $service) : void
    {
        $count = $service->checkExpired();
        $this->info("{$count} workflow(s) traité(s).");
    }
}
