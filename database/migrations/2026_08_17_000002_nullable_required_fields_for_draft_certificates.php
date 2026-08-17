<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * « Stocker le Certificat » enregistre un brouillon avec des informations
 * potentiellement manquantes (cf. CertificateController::storeDraft()) —
 * ces colonnes doivent donc accepter NULL, alors qu'elles étaient NOT NULL
 * depuis la création initiale de la table (flux "Créer le Certificat"
 * uniquement, toujours entièrement validé).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->string('insured_name', 200)->nullable()->change();
            $table->date('voyage_date')->nullable()->change();
            $table->string('voyage_from', 150)->nullable()->change();
            $table->string('voyage_to', 150)->nullable()->change();
            $table->decimal('insured_value', 20, 2)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('certificates', function (Blueprint $table) {
            $table->string('insured_name', 200)->nullable(false)->change();
            $table->date('voyage_date')->nullable(false)->change();
            $table->string('voyage_from', 150)->nullable(false)->change();
            $table->string('voyage_to', 150)->nullable(false)->change();
            $table->decimal('insured_value', 20, 2)->nullable(false)->change();
        });
    }
};
