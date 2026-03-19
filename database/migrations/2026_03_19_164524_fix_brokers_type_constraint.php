<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE brokers DROP CONSTRAINT IF EXISTS brokers_type_check");
        DB::statement("ALTER TABLE brokers ADD CONSTRAINT brokers_type_check 
            CHECK (type IN ('courtier_local', 'partenaire_etranger'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
