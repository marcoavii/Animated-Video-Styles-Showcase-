param([string]$Root, [int]$Port = 8765)
# Minimal static server + POST /save?name=x (body = data URL, or raw bytes with &raw=1)
$l = New-Object System.Net.HttpListener
$l.Prefixes.Add("http://localhost:$Port/")
$l.Start()
$out = Join-Path $Root 'frames'
New-Item -ItemType Directory -Force $out | Out-Null
$types = @{ '.mp4' = 'video/mp4'; '.html' = 'text/html'; '.js' = 'text/javascript'; '.json' = 'application/json'; '.mp3' = 'audio/mpeg' }
while ($l.IsListening) {
  $ctx = $l.GetContext(); $req = $ctx.Request; $res = $ctx.Response
  try {
    if ($req.HttpMethod -eq 'POST') {
      $name = [IO.Path]::GetFileName($req.QueryString['name'])
      $dest = Join-Path $out $name
      if ($req.QueryString['raw'] -eq '1') {
        $fs = [IO.File]::Create($dest); $req.InputStream.CopyTo($fs); $fs.Close()
      } else {
        $body = (New-Object IO.StreamReader($req.InputStream)).ReadToEnd()
        $b64 = $body.Substring($body.IndexOf(',') + 1)
        [IO.File]::WriteAllBytes($dest, [Convert]::FromBase64String($b64))
      }
      $res.StatusCode = 200
    } else {
      $p = Join-Path $Root ($req.Url.AbsolutePath.TrimStart('/'))
      if (Test-Path $p -PathType Leaf) {
        $bytes = [IO.File]::ReadAllBytes($p)
        $ext = [IO.Path]::GetExtension($p)
        $res.ContentType = if ($types.ContainsKey($ext)) { $types[$ext] } else { 'application/octet-stream' }
        $res.Headers.Add('Cache-Control', 'no-store')
        $res.ContentLength64 = $bytes.Length
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
      } else { $res.StatusCode = 404 }
    }
  } catch { $res.StatusCode = 500 }
  $res.Close()
}
