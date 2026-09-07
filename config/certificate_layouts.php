<?php

/**
 * ============================================================
 * certificate_layouts
 * ============================================================
 * Positionnement (mm, coin haut-gauche de la page A4) des champs
 * imprimés par CertificatePrePrintedService (FPDF) par-dessus une
 * souche physique pré-imprimée par NSIA (numérotation de sécurité,
 * cadres, mentions légales déjà présents sur le papier — seules
 * les valeurs variables du certificat sont imprimées).
 *
 * Une clé par template_id (cf. resources/js/pages/admin/certificates/
 * print-templates/registry.ts pour la liste des pays). Chaque champ :
 *   'key' => ['top' => mm, 'left' => mm, 'width' => mm (optionnel),
 *             'fontSize' => pt (défaut 9), 'align' => L|C|R (défaut L),
 *             'bold' => bool]
 *
 * ⚠️ Sert de FALLBACK uniquement — une surcharge en base (table
 * certificate_print_templates, éditable depuis /admin/certificate-
 * print-templates ou via le calibreur public/tools/calibreur_nsia_togo.html)
 * prime toujours sur ce fichier (cf. CertificatePrePrintedService::
 * resolveLayout()). Tenu synchronisé manuellement avec la surcharge
 * active à chaque recalibrage pour rester une référence fiable.
 *
 * 'togo' ci-dessous = état de la surcharge active au 2026-08-20, après
 * correction de insured_name_and_address (top 71→65 : chevauchait
 * "Agissant tant pour son compte que", confirmé identique en preview
 * TCPDF ET en impression physique réelle — donc bien un problème de
 * coordonnée, pas une différence FPDF/TCPDF).
 *
 * ⚠️ À vérifier : le bloc DECOMPTE DE PRIME (rate_ro…prime_total) est
 * passé de align 'R' à align 'C' et a perdu son 'bold' sur
 * amount_prime_nette/prime_total lors d'un recalibrage manuel récent
 * (probablement un artefact du calibreur visuel) — pas encore confirmé
 * si voulu ou à corriger.
 * ============================================================
 */
return [

    'togo' => [
        // ── En-tête ──
        'policy_number' => ['top' => 57.8,  'left' => 154.6, 'width' => 47.1],
        'issue_date' => ['top' => 44,    'left' => 144.4, 'width' => 36],

        // ── ASSURE (nom + adresse combinés) ──
        'insured_name_and_address' => ['top' => 65,    'left' => 30,    'width' => 91, 'fontSize' => 8],
        'insured_ref' => ['top' => 87.1,  'left' => 160.7, 'width' => 41.5],

        // ── VOYAGE (colonne gauche : Date expédition / DE / Via / N° Vol) ──
        'voyage_date' => ['top' => 85.4,  'left' => 94.9,  'width' => 40.8],
        'voyage_from' => ['top' => 89.8,  'left' => 62.1,  'width' => 73.6],
        'voyage_via' => ['top' => 95.9,  'left' => 64.1,  'width' => 73.3],
        'flight_number' => ['top' => 103.3, 'left' => 66.9,  'width' => 28,   'align' => 'C'],
        // ── VOYAGE (colonne droite : à / M-S / Mode de garantie) ──
        'voyage_to' => ['top' => 92,    'left' => 141.4, 'width' => 58.2],
        'vessel_name' => ['top' => 96,    'left' => 150.8, 'width' => 50],
        'guarantee_mode' => ['top' => 106.3, 'left' => 96.1,  'width' => 106.9],

        // ── Détail de l'expédition ──
        'marks' => ['top' => 139.9, 'left' => 16.5,  'width' => 29.3, 'align' => 'C'],
        'package_numbers' => ['top' => 139.5, 'left' => 51.5,  'width' => 27.8, 'align' => 'C'],
        'package_count' => ['top' => 140.5, 'left' => 80.9,  'width' => 11.6, 'align' => 'C'],
        'weight' => ['top' => 139.5, 'left' => 91.8,  'width' => 14.3, 'align' => 'C'],
        'nature' => ['top' => 139.1, 'left' => 109.3, 'width' => 64.9, 'align' => 'C'],
        'packaging' => ['top' => 143.9, 'left' => 109.1, 'width' => 66.2, 'align' => 'C'],
        'insured_value' => ['top' => 141.3, 'left' => 172.6, 'width' => 28.8],

        // ── Valeur d'assurance / Unité monétaire ──
        'currency_code' => ['top' => 176,   'left' => 148.2, 'width' => 22.5],
        'insured_value_letters' => ['top' => 184.2, 'left' => 89.1,  'width' => 107.2],

        // ── DECOMPTE DE PRIME (RO/RG/SURPRIME — pas de ligne Divers) ──
        'rate_ro' => ['top' => 221.3, 'left' => 135.7, 'width' => 19.8, 'align' => 'C'],
        'amount_ro' => ['top' => 221.3, 'left' => 151.7, 'width' => 43,   'align' => 'C'],
        'rate_rg' => ['top' => 225.4, 'left' => 136.1, 'width' => 20.4, 'align' => 'C'],
        'amount_rg' => ['top' => 225.4, 'left' => 152.7, 'width' => 42.5, 'align' => 'C'],
        'rate_surprime' => ['top' => 230.4, 'left' => 135.6, 'width' => 20.6, 'align' => 'C'],
        'amount_surprime' => ['top' => 230.4, 'left' => 152.4, 'width' => 43.6, 'align' => 'C'],

        // ── TOTAL / COUT DE POLICE / TAXES / PRIME A PAYER ──
        'amount_prime_nette' => ['top' => 240.2, 'left' => 149.6, 'width' => 46,   'align' => 'C'],
        'amount_accessoires' => ['top' => 246.8, 'left' => 148.3, 'width' => 45.2, 'align' => 'C'],
        'amount_taxe' => ['top' => 252.2, 'left' => 149.5, 'width' => 46,   'align' => 'C'],
        'prime_total' => ['top' => 258.7, 'left' => 150.3, 'width' => 44.5, 'align' => 'C', 'fontSize' => 11],
    ],

    // Converti depuis l'export JSON du Designer pdfme (calibrage visuel
    // sur le PDF réel de la souche) le 2026-09-03 — voir le commentaire
    // détaillé en tête de resources/js/pages/admin/certificates/
    // print-templates/benin.tsx, qui doit rester synchronisé avec ces
    // coordonnées. Pas encore vérifié sur un tirage papier réel.
    // Pas de tableau DECOMPTE DE PRIME sur cette souche (encart libre
    // "RESUME DES PRINCIPALES CONDITIONS D'ASSURANCE") : le calibrage
    // n'y place aucun champ de prime.
    'benin' => [
        'certificate_number' => ['top' => 60.7,   'left' => 126.74, 'width' => 67.47, 'fontSize' => 13],
        'policy_number' => ['top' => 83.62,  'left' => 140.89, 'width' => 28.57, 'fontSize' => 13],
        'voyage_date' => ['top' => 88.55,  'left' => 172.9,  'width' => 21.17, 'fontSize' => 13],
        'insured_name' => ['top' => 89.86,  'left' => 35.98,  'width' => 62.71, 'fontSize' => 13],
        'weight' => ['top' => 101.16, 'left' => 123.82, 'width' => 28.84, 'fontSize' => 13],
        'package_count' => ['top' => 110.69, 'left' => 61.91,  'width' => 37.57, 'fontSize' => 13],
        'nature' => ['top' => 111.03, 'left' => 16.67,  'width' => 43.92, 'fontSize' => 13],
        'marks' => ['top' => 113.94, 'left' => 117.21, 'width' => 75.94, 'fontSize' => 13],
        'voyage_via' => ['top' => 127.44, 'left' => 117.6,  'width' => 75.41, 'fontSize' => 13],
        'vessel_name' => ['top' => 134.7,  'left' => 17.06,  'width' => 81.76, 'fontSize' => 13],
        'insured_value_letters' => ['top' => 179.3,  'left' => 105.84, 'width' => 88.64, 'fontSize' => 13],
        'insured_value' => ['top' => 182.91, 'left' => 16.65,  'width' => 82.81, 'fontSize' => 13],
        'issue_date' => ['top' => 234.67, 'left' => 134.22, 'width' => 43.39, 'fontSize' => 13],
    ],

    // ── Ajouter les nouveaux modèles pays ici, calibrés via le
    //    calibreur (public/tools/calibreur_nsia_togo.html) ──

];
