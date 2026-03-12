<?php

/**
 * ============================================================
 * MIGRATION 16 — certificates
 * TABLE CENTRALE — partitionnée par année (RANGE created_at)
 *
 * ⚠️  Doit être créée via SQL raw : Laravel Blueprint
 *     ne supporte pas le PARTITION BY natif PostgreSQL.
 *
 * Partitions créées automatiquement :
 *   certificates_2024, certificates_2025, certificates_2026
 *
 * Un Artisan Command crée la partition de l'année suivante
 * chaque 1er décembre (voir CreateYearlyPartitions.php).
 * ============================================================
 */

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ── Création de la table partitionnée ────────────────
        DB::statement("
            CREATE TABLE IF NOT EXISTS certificates (
                id                       UUID         NOT NULL DEFAULT gen_random_uuid(),
                tenant_id                UUID         NOT NULL REFERENCES tenants(id),
                contract_id              UUID         NOT NULL REFERENCES insurance_contracts(id),
                broker_id                UUID         REFERENCES brokers(id),
                template_id              UUID         REFERENCES certificate_templates(id),

                -- Numérotation (sans collision via certificate_sequences)
                certificate_number       VARCHAR(100) NOT NULL,
                sequence_number          BIGINT       NOT NULL,

                -- Type
                type                     VARCHAR(30)  NOT NULL DEFAULT 'ORIGINAL'
                                         CHECK (type IN ('ORIGINAL','DUPLICATE','ENDORSEMENT','CANCELLATION')),
                parent_id                UUID,   -- référence duplicata / avenant (pas de FK cross-partition)

                -- Expéditeur
                shipper_name             VARCHAR(255) NOT NULL,
                shipper_address          TEXT,
                shipper_country          CHAR(2)      REFERENCES countries(code),

                -- Destinataire
                consignee_name           VARCHAR(255) NOT NULL,
                consignee_address        TEXT,
                consignee_country        CHAR(2)      REFERENCES countries(code),

                -- Transport
                transport_mode_id        SMALLINT     REFERENCES transport_modes(id),
                vessel_name              VARCHAR(255),
                voyage_number            VARCHAR(100),
                bill_of_lading           VARCHAR(255),
                flight_number            VARCHAR(50),
                container_number         VARCHAR(100),

                -- Itinéraire
                loading_port             VARCHAR(255) NOT NULL,
                discharge_port           VARCHAR(255) NOT NULL,
                place_of_delivery        VARCHAR(255),
                departure_date           DATE,
                arrival_date             DATE,

                -- Marchandise
                merchandise_description  TEXT         NOT NULL,
                merchandise_category_id  UUID         REFERENCES merchandise_categories(id),
                packing_type             VARCHAR(100),
                quantity                 NUMERIC(15,3),
                quantity_unit            VARCHAR(30),
                gross_weight             NUMERIC(15,3),
                weight_unit              VARCHAR(10)  DEFAULT 'KG',
                marks_and_numbers        TEXT,

                -- Financier
                currency_code            CHAR(3)      NOT NULL REFERENCES currencies(code),
                insured_value            NUMERIC(20,2) NOT NULL,
                premium_amount           NUMERIC(20,2),
                incoterm_code            VARCHAR(5)   REFERENCES incoterms(code),
                invoice_number           VARCHAR(100),
                invoice_amount           NUMERIC(20,2),
                invoice_currency         CHAR(3)      REFERENCES currencies(code),

                -- Garantie
                coverage_type            VARCHAR(50),
                clauses                  JSONB        DEFAULT '[]',
                special_conditions       TEXT,

                -- Authenticité
                qr_code_data             TEXT,           -- URL encodée dans le QR
                qr_code_path             TEXT,           -- chemin S3 image QR
                digital_signature        TEXT,           -- token HMAC-SHA256
                seal_path                TEXT,           -- cachet filiale S3

                -- PDF
                pdf_path                 TEXT,
                pdf_generated_at         TIMESTAMPTZ,

                -- Plateforme étatique (GUCE, GUOT, ORBUS...)
                state_platform_ref       VARCHAR(255),
                state_platform_issued_at TIMESTAMPTZ,

                -- Workflow
                status                   VARCHAR(30)  NOT NULL DEFAULT 'DRAFT'
                                         CHECK (status IN (
                                             'DRAFT','SUBMITTED','PENDING_APPROVAL',
                                             'APPROVED','ISSUED','CANCELLED','EXPIRED'
                                         )),
                issued_at                TIMESTAMPTZ,
                cancelled_at             TIMESTAMPTZ,
                cancellation_reason      TEXT,
                expiry_date              DATE,

                -- Méta
                notes                    TEXT,
                metadata                 JSONB        DEFAULT '{}',

                created_by               UUID         REFERENCES users(id),
                updated_by               UUID         REFERENCES users(id),
                created_at               TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
                updated_at               TIMESTAMPTZ           DEFAULT NOW(),
                deleted_at               TIMESTAMPTZ,

                PRIMARY KEY (id, created_at)   -- clé composite requise pour PARTITION BY RANGE
            ) PARTITION BY RANGE (created_at)
        ");

        // ── Partitions annuelles ─────────────────────────────
        $currentYear = (int) date('Y');
        foreach (range(2024, $currentYear + 1) as $year) {
            $next = $year + 1;
            DB::statement("
                CREATE TABLE IF NOT EXISTS certificates_{$year}
                PARTITION OF certificates
                FOR VALUES FROM ('{$year}-01-01') TO ('{$next}-01-01')
            ");
        }

        // ── Index sur la table partitionnée ──────────────────
        // (PostgreSQL propage automatiquement aux partitions)
        //
        // ⚠️  RÈGLE POSTGRESQL PARTITIONNEMENT :
        // Toute contrainte UNIQUE doit inclure la colonne de partition (created_at).
        // On utilise donc (tenant_id, certificate_number, created_at) pour l'unicité.
        // L'unicité "pure" sur certificate_number est garantie applicativement
        // via CertificateNumberService (SELECT FOR UPDATE sur certificate_sequences).
        DB::statement('CREATE UNIQUE INDEX idx_cert_number_tenant  ON certificates(tenant_id, certificate_number, created_at)');
        DB::statement('CREATE INDEX idx_cert_tenant_status         ON certificates(tenant_id, status, created_at DESC)');
        DB::statement('CREATE INDEX idx_cert_contract              ON certificates(contract_id, created_at DESC)');
        DB::statement('CREATE INDEX idx_cert_broker                ON certificates(broker_id, created_at DESC)');
        DB::statement('CREATE INDEX idx_cert_bl                    ON certificates(bill_of_lading) WHERE bill_of_lading IS NOT NULL');
        DB::statement('CREATE INDEX idx_cert_signature             ON certificates(digital_signature) WHERE digital_signature IS NOT NULL');

        // ── Index GIN full-text (recherche < 500 ms) ─────────
        DB::statement("
            CREATE INDEX idx_cert_fulltext ON certificates
            USING GIN (
                to_tsvector('french',
                    coalesce(certificate_number,'')    || ' ' ||
                    coalesce(shipper_name,'')           || ' ' ||
                    coalesce(consignee_name,'')         || ' ' ||
                    coalesce(merchandise_description,'')|| ' ' ||
                    coalesce(bill_of_lading,'')         || ' ' ||
                    coalesce(invoice_number,'')
                )
            )
        ");

        // ── Row-Level Security (défense en profondeur) ───────
        DB::statement('ALTER TABLE certificates ENABLE ROW LEVEL SECURITY');

        DB::statement("
            CREATE POLICY cert_tenant_isolation ON certificates
            USING (
                tenant_id = current_setting('app.current_tenant_id', true)::uuid
                OR current_setting('app.current_tenant_id', true) = ''
            )
        ");
    }

    public function down(): void
    {
        DB::statement('DROP TABLE IF EXISTS certificates CASCADE');
    }
};
