<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * - Pays de provenance sur le certificat (miroir de destination_country_code).
 * - Mode de transport fluvial/lagunaire (RIVER), ajouté au référentiel
 *   transport_modes et à la contrainte CHECK de certificates.transport_type.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->char('origin_country_code', 2)->nullable()->after('voyage_from');
            $table->foreign('origin_country_code')
                ->references('code')->on('countries')
                ->nullOnDelete();
        });

        DB::statement('ALTER TABLE certificates DROP CONSTRAINT cert_transport_check');
        DB::statement("ALTER TABLE certificates ADD CONSTRAINT cert_transport_check
            CHECK (transport_type IS NULL OR transport_type IN ('SEA','AIR','ROAD','RAIL','MULTIMODAL','RIVER'))");

        DB::table('transport_modes')->updateOrInsert(
            ['code' => 'RIVER'],
            ['name_fr' => 'Fluvial / Lagunaire', 'name_en' => 'River / Lagoon', 'icon' => 'waves']
        );
    }

    public function down(): void
    {
        DB::table('transport_modes')->where('code', 'RIVER')->delete();

        DB::statement('ALTER TABLE certificates DROP CONSTRAINT cert_transport_check');
        DB::statement("ALTER TABLE certificates ADD CONSTRAINT cert_transport_check
            CHECK (transport_type IS NULL OR transport_type IN ('SEA','AIR','ROAD','RAIL','MULTIMODAL'))");

        Schema::table('certificates', function (Blueprint $table) {
            $table->dropForeign(['origin_country_code']);
            $table->dropColumn('origin_country_code');
        });
    }
};
