<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * subscriber_address/subscriber_phone sont castées 'encrypted' — le
 * ciphertext base64 dépasse largement string(30)/string(255) (cf. le
 * même correctif déjà appliqué à insured_phone dans
 * 2026_07_20_000006_widen_encrypted_columns.php).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->text('subscriber_address')->nullable()->change();
            $table->text('subscriber_phone')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('insurance_contracts', function (Blueprint $table) {
            $table->string('subscriber_address')->nullable()->change();
            $table->string('subscriber_phone', 30)->nullable()->change();
        });
    }
};
