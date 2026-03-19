<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Réinitialisation mot de passe — NSIA Transport</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
    <tr>
        <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

                {{-- Logo --}}
                <tr>
                    <td align="center" style="padding-bottom:24px;">
                        <table cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="background:#1e2fa0;border-radius:12px;width:44px;height:44px;text-align:center;vertical-align:middle;">
                                    <span style="color:#fff;font-size:20px;font-weight:700;line-height:44px;display:block;">N</span>
                                </td>
                                <td style="padding-left:10px;">
                                    <div style="font-size:18px;font-weight:700;color:#1e293b;line-height:1.2;">NSIA Transport</div>
                                    <div style="font-size:11px;color:#94a3b8;line-height:1.4;">Certificats d'assurance</div>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>

                {{-- Card --}}
                <tr>
                    <td style="background:#fff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

                        {{-- Header --}}
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:28px 32px 22px;border-bottom:1px solid #f1f5f9;">
                                    <div style="font-size:28px;margin-bottom:14px;">🔐</div>
                                    <h1 style="margin:0 0 8px;font-size:20px;font-weight:600;color:#1e293b;line-height:1.3;">
                                        Réinitialisation du mot de passe
                                    </h1>
                                    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
                                        Bonjour <strong style="color:#1e293b;">{{ $user->first_name ?? $user->name }}</strong>,<br>
                                        vous recevez cet email car une demande de réinitialisation de mot de passe
                                        a été effectuée pour votre compte.
                                    </p>
                                </td>
                            </tr>
                        </table>

                        {{-- Body --}}
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:28px 32px;">

                                    <p style="margin:0 0 24px;font-size:13px;color:#475569;line-height:1.6;">
                                        Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.
                                        Ce lien expirera dans <strong>{{ $expiry }} minutes</strong>.
                                    </p>

                                    {{-- CTA --}}
                                    <table cellpadding="0" cellspacing="0" style="margin:0 auto 28px;">
                                        <tr>
                                            <td style="background:#1e3a8a;border-radius:10px;text-align:center;">
                                                <a href="{{ $url }}"
                                                   style="display:inline-block;padding:13px 32px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:.01em;line-height:1;">
                                                    Réinitialiser mon mot de passe
                                                </a>
                                            </td>
                                        </tr>
                                    </table>

                                    {{-- Lien texte --}}
                                    <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;text-align:center;">
                                        Si le bouton ne fonctionne pas, copiez ce lien :
                                    </p>
                                    <p style="margin:0 0 24px;text-align:center;word-break:break-all;">
                                        <a href="{{ $url }}" style="font-size:11px;color:#3b82f6;text-decoration:underline;">
                                            {{ $url }}
                                        </a>
                                    </p>

                                    {{-- Avertissement --}}
                                    <table width="100%" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td style="background:#fef9c3;border:1px solid #fde68a;border-radius:9px;padding:12px 16px;">
                                                <p style="margin:0;font-size:12px;color:#854d0e;line-height:1.5;">
                                                    ⚠ Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
                                                    Votre mot de passe restera inchangé.
                                                </p>
                                            </td>
                                        </tr>
                                    </table>

                                </td>
                            </tr>
                        </table>

                        {{-- Footer card --}}
                        <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                                <td style="padding:16px 32px;border-top:1px solid #f1f5f9;text-align:center;">
                                    <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                                        Ce lien expirera dans {{ $expiry }} minutes.<br>
                                        Cet email a été envoyé à <strong>{{ $user->email }}</strong>
                                    </p>
                                </td>
                            </tr>
                        </table>

                    </td>
                </tr>

                {{-- Footer global --}}
                <tr>
                    <td style="padding-top:24px;text-align:center;">
                        <p style="margin:0;font-size:11px;color:#94a3b8;line-height:1.6;">
                            © {{ date('Y') }} NSIA Transport · Plateforme de certificats d'assurance<br>
                            NSIA Holding Assurances — Abidjan, Côte d'Ivoire
                        </p>
                    </td>
                </tr>

            </table>
        </td>
    </tr>
</table>

</body>
</html>