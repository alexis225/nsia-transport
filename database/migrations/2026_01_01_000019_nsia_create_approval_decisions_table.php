<?php

/**
 * ============================================================
 * MIGRATION 21 — approval_decisions
 * Décisions enregistrées par étape et par approbateur.
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_decisions', function (Blueprint $table) {
            $table->uuid('id')->primary()->default(DB::raw('gen_random_uuid()'));

            $table->foreignUuid('request_id')
                  ->constrained('approval_requests')
                  ->cascadeOnDelete();

            $table->unsignedSmallInteger('step_number');

            $table->foreignUuid('approver_id')
                  ->constrained('users');

            $table->string('decision', 20); // APPROVED | REJECTED | DELEGATED

            $table->text('comment')->nullable();
            $table->timestamp('decided_at')->useCurrent();
        });

        DB::statement("ALTER TABLE approval_decisions ADD CONSTRAINT ad_decision_check
            CHECK (decision IN ('APPROVED','REJECTED','DELEGATED'))");

        DB::statement('CREATE INDEX idx_decisions_request ON approval_decisions(request_id, step_number)');
        DB::statement('CREATE INDEX idx_decisions_approver ON approval_decisions(approver_id, decided_at DESC)');
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_decisions');
    }
};
