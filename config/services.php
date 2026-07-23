<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],
     'google' => [
       'client_id'     => env('GOOGLE_CLIENT_ID'),
       'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect'      => env('GOOGLE_REDIRECT_URI'),
   ],
    'microsoft' => [
        'client_id'     => env('MICROSOFT_CLIENT_ID'),
        'client_secret' => env('MICROSOFT_CLIENT_SECRET'),
        'redirect'      => env('MICROSOFT_REDIRECT_URI'),
        'tenant'        => env('MICROSOFT_TENANT_ID'),
    ],

    // Extraction automatique des certificats GUCE (Mindee API Builder —
    // https://developers.mindee.com/docs/php-api-builder). Le modèle
    // "GUCE" doit être créé côté tableau de bord Mindee avec des champs
    // portant les mêmes noms que 'field_map' ci-dessous (colonne de
    // gauche = champ GuceCertificate local, colonne de droite = nom du
    // champ tel que défini dans le modèle Mindee).
    'mindee' => [
        'api_key'  => env('MINDEE_V2_API_KEY'),
        'model_id' => env('MINDEE_GUCE_MODEL_ID'),
        // NB (2026-07-21) : le modèle Mindee "Insurance Certificate" ne
        // fournit nativement que policy_holder_name/policy_number/
        // insurer_name/effective_date/expiration_date/type_of_coverage/
        // premium_amount/certificate_issue_date. Les champs GUCE
        // spécifiques ci-dessous (guce_reference, insured_address,
        // cargo_description, weight, marks, vessel, origin, destination,
        // transit_date, insured_value, currency, fdi_reference) doivent
        // être ajoutés dans l'onglet "Schéma de données" du modèle sur
        // app.mindee.com, avec un label anglais dont le slug généré
        // correspond exactement à la clé ci-dessous (ex: label "Cargo
        // Description" → slug "cargo_description").
        // NB (2026-07-21) : seul le champ 'marks' a été créé côté Mindee
        // sous son nom français ("marques" — cf. "Nom du champ" dans
        // Mindee). Tous les autres, y compris guce_reference et
        // currency, utilisent bien leur slug anglais — vérifié via les
        // clés brutes journalisées dans storage/logs/laravel.log.
        'field_map' => [
            'guce_reference'     => 'guce_reference',
            'certificate_number' => 'certificate_number',
            'policy_number'      => 'policy_number',
            'insured_name'       => 'policy_holder_name',
            'insured_address'    => 'insured_address',
            'cargo_description'  => 'cargo_description',
            'weight'             => 'weight',
            'marks'              => 'marques',
            'vessel'             => 'vessel',
            'origin'             => 'origin',
            'destination'        => 'destination',
            'transit_date'       => 'transit_date',
            'insured_value'      => 'insured_value',
            'currency'           => 'currency',
            'net_premium'        => 'net_premium',
            'total_premium'      => 'premium_amount',
            'fdi_reference'      => 'fdi_reference',
        ],
    ],

];
