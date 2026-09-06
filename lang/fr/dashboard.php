<?php

/**
 * Libellés du tableau de bord rendus côté serveur (props Inertia).
 *
 * Le reste de la page vit dans resources/js/locales/<code>/dashboard.json :
 * seules les chaînes calculées par le contrôleur passent par ici.
 */
return [
    'kpis' => [
        'certificates_issued' => 'Certificats émis',
        'premiums_issued'     => 'Primes émises',
        'contracts_active'    => 'Contrats actifs',
        'brokers_active'      => 'Courtiers actifs',
    ],
    'periods' => [
        'this_month' => 'Ce mois',
        'total'      => 'Total',
    ],
];
