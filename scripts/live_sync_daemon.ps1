# Live Sync Daemon: Refleja cambios en vivo de Google Drive a SSD Local para Fast Refresh (HMR)
$src = "G:\Mi unidad\Proyecto personal\VYFITH"
$dst = "C:\Users\Luis\AndroidStudioProjects\VYFITH"

Write-Host "Live Sync Daemon activo [$src -> $dst]"
while ($true) {
    robocopy $src $dst /e /xo /xd .git node_modules .next .next-dev .agents /njh /njs /ndl /nc /ns /np *>$null
    Start-Sleep -Milliseconds 1200
}
