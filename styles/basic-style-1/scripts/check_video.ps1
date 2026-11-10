param([Parameter(Mandatory)][string]$Video, [string]$OutDir = (Split-Path $Video))
# Cek file MP4 final: stream, loudness/puncak audio, dan contact sheet dari video asli (bukan dari renderer).
$env:Path = [Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels:format=duration,size -of default=nw=1 "$Video"
$dur = [double](ffprobe -v error -show_entries format=duration -of csv=p=0 "$Video")
Write-Output "--- audio (target: puncak di bawah -1 dBTP) ---"
$ErrorActionPreference = 'Continue'
$log = cmd /c "ffmpeg -hide_banner -nostats -i `"$Video`" -af ebur128=peak=true -f null - 2>&1"
$log | Select-Object -Last 12
Write-Output "--- contact sheet ---"
$fps = [math]::Round(24 / $dur, 4)
$sheet = Join-Path $OutDir 'contact_sheet.jpg'
ffmpeg -hide_banner -loglevel error -y -i "$Video" -vf "fps=$fps,scale=240:-1,tile=8x3" -frames:v 1 -q:v 3 "$sheet"
Write-Output $sheet
