# Synchronise la memoire Claude depuis le repo vers le dossier systeme
# A executer sur un nouveau PC apres avoir clone le projet

$source = "$PSScriptRoot\memory"
$dest   = "$env:USERPROFILE\.claude\projects\c--wamp64-www-nsia-transport\memory"

New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item -Path "$source\*" -Destination $dest -Recurse -Force

Write-Host "Memoire copiee vers : $dest"
