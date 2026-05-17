# NSIA Transport — Contexte projet

## Rôle
Expert fullstack Laravel 12 + React 19 + TypeScript + Inertia.js v2 spécialisé dans le projet NSIA Transport.
Code prêt à l'emploi, sans explication superflue. Respecter les décisions architecturales ci-dessous.

---

## Stack technique
- **Backend** : Laravel 12, PHP 8.2+, PostgreSQL 16
- **Frontend** : React 19, TypeScript, Inertia.js v2, ShadCN/UI (Radix UI), Tailwind CSS v4
- **Auth** : Laravel Fortify + Spatie Permission (teams=true)
- **Queue** : driver `database` (table `jobs`) — Redis non configuré
- **PDF** : DomPDF (isRemoteEnabled=true)
- **Excel** : PhpSpreadsheet
- **Notifications** : Table custom `notifications` (driver Eloquent)

---

## Décisions architecturales critiques

### 1. Notifications
```php
// ✅ CORRECT
\App\Models\Notification::send($user, $type, $title, $body, $data);
// ❌ INTERDIT — conflit avec trait Notifiable
$user->notify(...)
```

### 2. Audit Log
```php
AuditLog::create(['entity_type' => 'Certificate', 'entity_id' => $cert->id, ...]);
// entity_type (PAS auditable_type)
```

### 3. Permissions & Gate
```php
// AppServiceProvider::boot()
Gate::before(function ($user, $ability) {
    if ($user->hasRole('super_admin')) return true;
    if (UserRoleGrant::hasGrantedPermission($user, $ability)) return true;
    return null;
});
// Événement LoginFailed → RecordFailedLogin::class (US-050)
Event::listen(LoginFailed::class, RecordFailedLogin::class);
```

### 4. Délégations
- Table `user_role_grants` — délégation par **rôle entier**
- `public $timestamps = false;` sur `UserRoleGrant`
- Filtre par `tenant_id` dans `hasGrantedPermission()` pour isolation filiale

### 5. Escalade NN300
- `approval_workflows` = config (règles, steps_config JSON)
- `approval_requests` = instances (une par certificat)
- `approval_decisions` = décisions par étape
- Seuil défaut : 15% valeur contrat (`escalade_threshold_pct`)

### 6. Commissions
- Observer `CertificateObserver::updated()` → `CommissionService::calculate()` à l'émission
- Priorité taux : contrat > courtier (général)

### 7. CSRF Frontend
```tsx
// ✅ axios gère X-XSRF-TOKEN automatiquement
import axios from 'axios';
await axios.patch(`/admin/notifications/feed/${id}/read`);
// ❌ ÉVITER fetch natif (problèmes CSRF)
```

### 8. Export asynchrone (US-047)
- Modèle `ReportExecution` (table `report_executions`) — statuts : QUEUED | PROCESSING | COMPLETED | FAILED
- Job `AsyncCertificateExportJob` — chunk(500) → CSV local dans `storage/app/exports/`
- Expiration 24h, nettoyage via `nsia:archive-certificates`
- Dispatcher : `POST /admin/exports/certificates` → JSON `{execution_id}`
- Polling status : `GET /admin/exports/{execution}/status`

### 9. Chiffrement données sensibles (US-051)
```php
// AsEncryptedString cast sur champs PII non-queryables :
// Broker : address, phone, registration_number
// InsuranceContract : insured_address, insured_phone
// ⚠️ Exécuter UNE FOIS en prod : php artisan nsia:encrypt-sensitive-fields
// NE PAS chiffrer : email (utilisé pour login/recherche)
```

### 10. Row Level Security PostgreSQL (US-052)
```php
// Middleware SetTenantContext (alias 'tenant.context') :
DB::statement("SET app.current_tenant_id = ?", [$tenantId]);
// Fonction PostgreSQL : current_tenant_id() → lit app.current_tenant_id
// Migration 2026_06_01_000001_enable_row_level_security.php
// Tables couvertes : certificates, insurance_contracts, commission_transactions,
//                   commission_rules, approval_requests
```

### 11. IP Blacklist (US-050)
- Middleware `CheckIpBlacklist` — global dans web stack, cache 5 min par IP
- Opérateur CIDR PostgreSQL : `WHERE '1.2.3.4'::inet <<= ip_range`
- `RecordFailedLogin` : 5 échecs → `locked_until = now() + 30min`
- Admin UI : `GET /admin/security/ip-blacklist` (super_admin only)

### 12. InsuranceContract::certificates()
```php
// Relation décommentée (US-045) — était commentée avec note "// US-017"
public function certificates(): HasMany
{
    return $this->hasMany(Certificate::class, 'contract_id');
}
```

### 13. Microsoft OAuth
```env
MICROSOFT_TENANT_ID=uuid-spécifique  # PAS 'common' — app single-tenant
```

---

## Routes principales (complètes)

```
# Dashboard
GET  /admin/dashboard              → DashboardController::index()
GET  /dashboard/pending            → DashboardController::pending() [certificates.validate]
GET  /admin/dashboard/kpi          → KpiDashboardController [certificates.view]
GET  /admin/dashboard/dtag         → DtagDashboardController [role:super_admin]

# Rapports
GET  /admin/reports/certificates   → CertificateReportController [certificates.view]
GET  /admin/reports/contracts      → ContractReportController [contracts.view]
GET  /admin/reports/intermediaries → IntermediaryReportController [brokers.view]

# Certificats
GET  /admin/certificates           → CertificateController::index() [certificates.view]
GET  /admin/certificates/search    → CertificateSearchController [certificates.view]
GET  /admin/certificates/export    → CertificateController::export() [certificates.view]
POST /admin/certificates           → CertificateController::store() [certificates.create]
GET  /admin/certificates/{id}      → CertificateController::show() [certificates.view]

# Export asynchrone
GET    /admin/exports                      → AsyncExportController::index()
POST   /admin/exports/certificates         → AsyncExportController::dispatchCertificates()
GET    /admin/exports/{id}/download        → AsyncExportController::download()
GET    /admin/exports/{id}/status          → AsyncExportController::status()
DELETE /admin/exports/{id}                 → AsyncExportController::destroy()

# Contrats
GET  /contracts                    → InsuranceContractController::index() [contracts.view]
GET  /contracts/{id}               → InsuranceContractController::show()

# Commissions
GET  /admin/commissions/rules      → CommissionController::rules()
GET  /admin/commissions/bordereau  → CommissionController::bordereau()

# Notifications
GET  /admin/notifications/feed     → NotificationController (JSON polling)
GET  /admin/notifications          → NotificationCenterController (Inertia)

# Approbations / Délégations
GET  /admin/approvals              → ApprovalWorkflowController::index()
GET  /admin/delegations            → DelegationController::index()

# Sécurité (super_admin)
GET    /admin/security/ip-blacklist     → IpBlacklistController::index()
POST   /admin/security/ip-blacklist     → IpBlacklistController::store()
DELETE /admin/security/ip-blacklist/{id}→ IpBlacklistController::destroy()
PATCH  /admin/security/ip-blacklist/unlock/{userId} → unlockUser()

# Audit
GET  /admin/audit-logs             → AuditLogController::index() [audit_logs.view]
```

---

## Scheduler (routes/console.php)
```php
Schedule::command('nsia:check-contracts')->dailyAt('08:00');
Schedule::command('nsia:check-escalades')->hourly();
Schedule::command('nsia:check-delegations')->hourly();
Schedule::command('nsia:generate-kpi-snapshots')->dailyAt('06:00');   // US-049
Schedule::command('nsia:archive-certificates', ['--years=5'])         // US-053
         ->monthlyOn(1, '02:00');
```

---

## Commandes Artisan disponibles
```bash
nsia:check-contracts              # alertes expiration contrats
nsia:check-escalades              # vérification seuils NN300
nsia:check-delegations            # alertes délégations expirantes
nsia:generate-kpi-snapshots       # cache KPIs par filiale (US-049)
nsia:archive-certificates         # archivage et purge (US-053)
nsia:encrypt-sensitive-fields     # migration PII → chiffré (US-051, 1 fois)
```

---

## HandleInertiaRequests::share()
```php
'auth' => $user ? [
    'user' => array_merge($user->toArray(), [
        'permissions' => $user->getAllPermissions()->pluck('name')->values(),
        'roles'       => $user->getRoleNames()->values(),
        'tenant'      => $user->tenant?->only(['id', 'name', 'code']),
        'avatar_path' => $user->avatar_path ? asset('storage/' . $user->avatar_path) : null,
    ]),
] : null,
```

---

## Middleware enregistrés (bootstrap/app.php)
```php
// Web stack (global)
CheckIpBlacklist::class   // US-050 — bloque IPs blacklistées

// Alias
'permission'       => CheckPermission::class
'tenant.isolation' => EnsureTenantIsolation::class
'tenant.context'   => SetTenantContext::class    // US-052 RLS
'role'             => RoleMiddleware::class
```

---

## Progression backlog
- **Total** : 73 User Stories
- **Terminées** : 58 (US-001 → US-033, US-035 → US-059)
- **Skippée** : US-034 (non planifiée)
- **Restantes** : 14 (US-060 → US-073, hors US-065 et US-068 absentes du backlog)
- **Prochaine** : US-060

---

## US terminées (référence complète)

| Plage | Contenu |
|---|---|
| US-001 à US-010 | Auth, MFA, rôles, users, filiales, référentiels, courtiers |
| US-011 à US-020 | Tenants, templates certificats, contrats, certificats CRUD |
| US-021 à US-030 | PDF/QR, validation, notifications, audit, commissions |
| US-031 à US-033 | Historique, duplicata, amendements |
| US-035 à US-042 | Escalades, délégations, login Microsoft, workflow, coassureurs, experts |
| US-043 | Dashboard KPIs filiale |
| US-044 | État des certificats par période |
| US-045 | État des contrats |
| US-046 | État des intermédiaires (Courtiers / Coassureurs / Experts — 3 onglets) |
| US-047 | Export asynchrone grands volumes (queue + polling + download) |
| US-048 | Dashboard consolidé multi-filiales DTAG (super_admin) |
| US-049 | Génération KPIs automatiques (scheduler dailyAt 06:00) |
| US-050 | Blacklist IP & détection intrusion (middleware + UI admin) |
| US-051 | Chiffrement données sensibles (AsEncryptedString sur PII) |
| US-052 | Row Level Security PostgreSQL (migration + SetTenantContext) |
| US-053 | Politique de rétention et archivage (command mensuelle) |
| US-054 | Interface responsive mobile-first (media queries sur pages clés) |
| US-055 | Recherche avancée multi-critères certificats (14 filtres) |

---

## US restantes à implémenter

### Sprint 6 (terminé)
| US | Titre | Effort | MoSCoW | Statut |
|---|---|---|---|---|
| US-056 | Optimisation performances (cache & index) | 4 | Should Have | ✅ |
| US-057 | Mode sombre (Dark Mode) | 2 | Could Have | ✅ |
| US-058 | Tests unitaires & intégration backend | 5 | Must Have | ✅ |
| US-059 | Tests E2E (Playwright) | 4 | Must Have | ✅ |

### Sprints 7-8 (API & intégrations)
| US | Titre | Effort | MoSCoW |
|---|---|---|---|
| US-060 | API REST v1 — auth & docs | 5 | Must Have |
| US-061 | API REST — endpoints certificats | 3 | Must Have |
| US-062 | API REST — webhooks | 4 | Should Have |
| US-063 | Export vers système métier | 5 | Must Have |
| US-064 | Synchronisation plateforme étatique | 6 | Should Have |
| US-066 | Rapport audit sécurité OWASP | 5 | Must Have |
| US-067 | Conformité RGPD | 4 | Must Have |
| US-069 | Tests de charge | 5 | Must Have |
| US-070 | Architecture haute disponibilité | 6 | Must Have |
| US-071 | Documentation technique | 4 | Must Have |
| US-072 | Guide utilisateur & formation | 4 | Must Have |
| US-073 | Recette utilisateur UAT | 5 | Must Have |

---

*Mis à jour le 17/05/2026 — Session NSIA Transport Sprints 4-5-6*
