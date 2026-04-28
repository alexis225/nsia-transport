<?php


namespace Database\Seeders;

use App\Models\ApprovalWorkflowConfig;
use App\Models\Tenant;
use Illuminate\Database\Seeder;

class ApprovalWorkflowSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Tenant::all() as $tenant) {
            ApprovalWorkflowConfig::firstOrCreate(
                [
                    'tenant_id'   => $tenant->id,
                    'entity_type' => 'CERTIFICATE',
                    'name'        => 'Escalade NN300 — ' . $tenant->name,
                ],
                [
                    'trigger_condition' => [
                        'insured_value_pct_of_contract' => ['>' => 15],
                        // Peut être surchargé par contrat via escalade_threshold_pct
                    ],
                    'steps_config' => [
                        [
                            'step'          => 1,
                            'role'          => 'admin_filiale',
                            'label'         => 'Approbation Admin Filiale',
                            'timeout_hours' => 48,
                        ],
                        [
                            'step'          => 2,
                            'role'          => 'super_admin',
                            'label'         => 'Approbation Super Admin (DTAG)',
                            'timeout_hours' => 48,
                        ],
                    ],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Workflows NN300 créés pour ' . Tenant::count() . ' filiale(s).');
    }
}