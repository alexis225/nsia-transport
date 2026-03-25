<?php

namespace App\Services;

use App\Models\Certificate;
use Illuminate\Support\Str;

/**
 * ============================================================
 * CertificateQrService — US-021
 * ============================================================
 * Génère un QR code pointant vers l'URL de vérification
 * publique du certificat.
 *
 * Stratégie : URL externe via api.qrserver.com
 * → Zéro dépendance PHP supplémentaire
 * → DomPDF fetch l'image avec isRemoteEnabled = true
 * → show.tsx utilise la même URL directement
 * ============================================================
 */
class CertificateQrService
{
    /**
     * Génère ou récupère le token unique du certificat.
     * Le token est généré une seule fois à l'émission
     * et ne change que si explicitement regénéré.
     */
    public function ensureToken(Certificate $certificate): string
    {
        if (! $certificate->qr_token) {
            // Token 48 chars : 32 aléatoires + 16 dérivés du certificat
            $token = Str::random(32) . substr(
                md5($certificate->id . $certificate->certificate_number . now()->timestamp),
                0, 16
            );
            $certificate->update(['qr_token' => $token]);
            $certificate->refresh();
        }

        return $certificate->qr_token;
    }

    /**
     * Retourne l'URL publique de vérification
     * ex: https://nsia-transport.com/verify/a1b2c3...
     */
    public function getVerifyUrl(Certificate $certificate): string
    {
        $token = $this->ensureToken($certificate);
        return url("/verify/{$token}");
    }

    /**
     * Retourne l'URL de l'image QR code via api.qrserver.com
     * Compatible DomPDF (isRemoteEnabled = true) et navigateur web.
     *
     * @param  int  $size  Taille en pixels (défaut 120)
     */
    public function generateBase64(Certificate $certificate, int $size = 120): string
    {
        $verifyUrl = $this->getVerifyUrl($certificate);

        return 'https://api.qrserver.com/v1/create-qr-code/?'
            . http_build_query([
                'size'        => "{$size}x{$size}",
                'data'        => $verifyUrl,
                'ecc'         => 'M',   // correction d'erreur Medium
                'margin'      => 4,
                'format'      => 'png',
            ]);
    }

    /**
     * Enregistre une vérification publique (analytics)
     */
    public function recordVerification(Certificate $certificate): void
    {
        $certificate->increment('verification_count');
        $certificate->update(['last_verified_at' => now()]);
    }

    /**
     * Invalide le token actuel et en génère un nouveau.
     * Utile si le QR code a été compromis ou doit être
     * reémis avec un nouveau lien de vérification.
     */
    public function regenerateToken(Certificate $certificate): string
    {
        $certificate->update(['qr_token' => null]);
        $certificate->refresh();
        return $this->ensureToken($certificate);
    }
}