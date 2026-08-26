<?php

/**
 * ============================================================
 * MIGRATION — approval_decisions.approver_id nullable
 * ============================================================
 * L'auto-escalade sur timeout (ApprovalWorkflowService::checkExpired())
 * enregistre une décision DELEGATED sans approbateur humain
 * (approver_id => null). La colonne était NOT NULL, ce qui faisait
 * échouer systématiquement cette insertion (violation de contrainte).
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE approval_decisions ALTER COLUMN approver_id DROP NOT NULL');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE approval_decisions ALTER COLUMN approver_id SET NOT NULL');
    }
};
