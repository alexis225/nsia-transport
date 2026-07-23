<?php

/**
 * ============================================================
 * MIGRATION — élargissement des colonnes chiffrées (US-051)
 * ============================================================
 * Les casts `encrypted` produisent un payload base64/JSON bien
 * plus long que la valeur en clair (~150-250+ caractères même
 * pour une valeur courte). Les colonnes varchar(30)/varchar(100)
 * d'origine ne peuvent pas contenir ce payload — passage en text.
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('brokers', function (Blueprint $table) {
            $table->text('phone')->nullable()->change();
            $table->text('registration_number')->nullable()->change();
        });

        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->text('insured_phone')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('brokers', function (Blueprint $table) {
            $table->string('phone', 30)->nullable()->change();
            $table->string('registration_number', 100)->nullable()->change();
        });

        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->string('insured_phone', 30)->nullable()->change();
        });
    }
};
