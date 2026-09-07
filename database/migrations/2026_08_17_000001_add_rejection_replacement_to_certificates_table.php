<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Statuts de certificat étendus : DRAFT/SUBMITTED/ISSUED/CANCELLED
 * (« Stocké »/« Soumis »/« Approuvé »/« Annulé ») + REJECTED (« Rejeté »,
 * avec motif structuré) + REPLACED (« Remplacé », avec référence au
 * certificat qui l'a remplacé).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->text('rejection_reason')->nullable()->after('cancellation_reason');
            $table->timestamp('rejected_at')->nullable()->after('cancelled_at');
            $table->timestamp('replaced_at')->nullable()->after('rejected_at');
            $table->foreignUuid('replaced_by_certificate_id')->nullable()->after('replaced_at')
                ->constrained('certificates')->nullOnDelete();
        });

        DB::statement('ALTER TABLE certificates DROP CONSTRAINT IF EXISTS cert_status_check');
        DB::statement("ALTER TABLE certificates ADD CONSTRAINT cert_status_check
            CHECK (status IN ('DRAFT','SUBMITTED','REJECTED','ISSUED','REPLACED','CANCELLED'))");
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE certificates DROP CONSTRAINT IF EXISTS cert_status_check');
        DB::statement("ALTER TABLE certificates ADD CONSTRAINT cert_status_check
            CHECK (status IN ('DRAFT','SUBMITTED','ISSUED','CANCELLED'))");

        Schema::table('certificates', function (Blueprint $table) {
            $table->dropConstrainedForeignId('replaced_by_certificate_id');
            $table->dropColumn(['rejection_reason', 'rejected_at', 'replaced_at']);
        });
    }
};
