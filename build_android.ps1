$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-17.0.17.10-hotspot"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
Write-Host "Java Home set to: $env:JAVA_HOME"
npx expo run:android
