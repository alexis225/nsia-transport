<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>{{ $subject ?? 'Notification NSIA Transport' }}</title>
    <style>
        body { margin: 0; padding: 0; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; }
        .wrapper { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
        .header { background: #1e3a8a; padding: 24px 32px; display: flex; align-items: center; gap: 12px; }
        .header-logo { width: 36px; height: 36px; }
        .header-title { color: #fff; font-size: 16px; font-weight: 700; letter-spacing: .04em; }
        .header-sub { color: rgba(255,255,255,0.5); font-size: 11px; margin-top: 1px; }
        .body { padding: 32px; }
        .greeting { font-size: 15px; font-weight: 600; color: #1e293b; margin-bottom: 16px; }
        .line { font-size: 14px; color: #475569; line-height: 1.7; margin-bottom: 12px; }
        .line strong { color: #1e293b; }
        .btn { display: inline-block; margin: 20px 0; padding: 12px 24px; background: #1e3a8a; color: #fff !important; text-decoration: none; border-radius: 8px; font-size: 14px; font-weight: 600; }
        .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #f1f5f9; font-size: 11px; color: #94a3b8; text-align: center; line-height: 1.6; }
        .divider { border: none; border-top: 1px solid #f1f5f9; margin: 20px 0; }
    </style>
</head>
<body>
<div class="wrapper">
    <div class="header">
        <svg class="header-logo" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6V12C4 16.4 7.4 20.5 12 22C16.6 20.5 20 16.4 20 12V6L12 2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M9 12L11 14L15 10" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div>
            <div class="header-title">NSIA TRANSPORT</div>
            <div class="header-sub">Plateforme de certificats d'assurance</div>
        </div>
    </div>

    <div class="body">
        @isset($greeting)
            <div class="greeting">{{ $greeting }}</div>
        @endisset

        @foreach ($introLines as $line)
            <p class="line">{!! $line !!}</p>
        @endforeach

        @isset($actionText)
            <a href="{{ $actionUrl }}" class="btn">{{ $actionText }}</a>
        @endisset

        @foreach ($outroLines as $line)
            <p class="line">{!! $line !!}</p>
        @endforeach

        @isset($salutation)
            <hr class="divider"/>
            <p class="line" style="color: #94a3b8; font-size: 12px;">{{ $salutation }}</p>
        @endisset
    </div>

    <div class="footer">
        NSIA Assurances Transport — Groupe NSIA<br/>
        Vous recevez cet email car vous êtes membre de la plateforme.<br/>
        © {{ date('Y') }} NSIA Transport. Tous droits réservés.
    </div>
</div>
</body>
</html>