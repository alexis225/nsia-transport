<?php


use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;


Schedule::command('nsia:check-contracts')->dailyAt('08:00');
Schedule::command('nsia:check-escalades')->hourly();
Schedule::command('nsia:check-delegations')->hourly();
// US-049 — Snapshots KPI quotidiens
Schedule::command('nsia:generate-kpi-snapshots')->dailyAt('06:00');
// US-053 — Archivage mensuel (1er du mois à 02:00)
Schedule::command('nsia:archive-certificates', ['--years=5'])->monthlyOn(1, '02:00');