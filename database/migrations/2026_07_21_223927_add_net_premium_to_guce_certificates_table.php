<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('guce_certificates', function (Blueprint $table) {
            $table->decimal('net_premium', 15, 2)->nullable()->after('insured_value')
                ->comment('Prime nette (distincte de la prime totale)');
        });
    }

    public function down(): void
    {
        Schema::table('guce_certificates', function (Blueprint $table) {
            $table->dropColumn('net_premium');
        });
    }
};
