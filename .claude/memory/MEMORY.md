# NSIA Transport - Mémoire Projet

## Vue d'ensemble
Plateforme d'émission de certificats d'assurance transport pour le Groupe NSIA (présent dans 12 pays d'Afrique).

## Stack technique
- **Backend**: Laravel 12, PHP 8.2+, PostgreSQL
- **Frontend**: React 19 + TypeScript, Inertia.js v2, Tailwind CSS v4, ShadCN/ui (Radix UI)
- **Auth**: Laravel Fortify (2FA incluse)
- **Build**: Vite
- **Tests**: Pest PHP

## État du projet (mai 2026)
Modules implémentés :
- Authentification + settings utilisateur
- IAM multi-tenant (spatie/laravel-permission, teams=true)
- Gestion Tenants/Filiales (CRUD + settings d'impression)
- Contrats d'assurance (CRUD + workflow)
- Certificats de transport (émission, validation, annulation, QR, PDF)
- Workflow de validation (soumission → approbation → émission)
- Recherche avancée certificats
- Import certificats GUCE (PDF/Word, stockage disque `private`)
- Impression multi-templates (Guinée Conakry, Gabon, Togo)
- Page "Modèles d'impression" dans la sidebar

## Architecture cible (MCD)
34 tables au total : 5 spatie + 29 métier

### Domaines fonctionnels
1. IAM (spatie/laravel-permission avec multi-tenancy via teams=true)
2. Organisation (Tenants/Filiales, Courtiers, Coassureurs, Experts)
3. Référentiel (Pays, Devises, Incoterms, Modes transport, Catégories marchandises)
4. Contrats d'assurance
5. Certificats de transport
6. Workflow de validation
7. Commissions courtiers
8. Reporting & KPIs
9. Notifications
10. Audit & Sécurité

## Rôles utilisateurs
- SUPER_ADMIN (DTAG) — tenant_id = NULL
- admin_filiale
- souscripteur
- courtier_local
- partenaire_etranger
- client

## Conventions de code
- UUIDs pour toutes les PKs (`HasUuids`)
- `foreignUuid()` pour toutes les FK (PAS `foreignId()`)
- Soft delete (`deleted_at`) sur toutes les entités métier
- Multi-tenancy via `tenant_id` sur toutes les tables critiques
- Audit trail centralisé (`audit_logs`)
- Inertia render paths en **minuscules avec tirets** : `admin/certificates/print-models`
- Fichiers sensibles sur disque `private` (pas `public`)

## Système d'impression des certificats
- Registry pattern : `registry.ts` (métadonnées), `types.ts` (interfaces partagées), un fichier `.tsx` par pays
- Templates disponibles : `guinee-conakry`, `gabon`, `togo`
- Sélection du template via modal dans `show.tsx` avant impression
- Header d'impression configuré via `tenant.settings` (JSON column)

## Champs tenant.settings (impression)
siege_social, phone, website, email, capital, rccm, regulator, payment_address, surveyor_name, surveyor_address, city

## Import GUCE
- Stockage : `guce-certificates/{uuid}.ext` sur disque `private`
- Table : `guce_certificates` (UUID PK, foreignUuid pour tenant_id et imported_by)
- Téléchargement via endpoint dédié (pas d'URL publique)

## DB
- PostgreSQL, db_transport, user=postgres, password=root, port=5432

## Chemins importants
- Projet : `c:\wamp64\www\nsia-transport\`
- Mémoire git : `.claude/memory/MEMORY.md` (ce fichier)
- Mémoire système : `C:\Users\{user}\.claude\projects\c--wamp64-www-nsia-transport\memory\`
