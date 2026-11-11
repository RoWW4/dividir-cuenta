#!/bin/sh
# Sube la versión de los archivos (para que los móviles no usen los antiguos guardados) y publica.
# Uso: sh publicar.sh "qué se ha cambiado"
set -e
cd "$(dirname "$0")"
V=$(date +%Y%m%d%H%M)
sed -i -E "s#<script src=\"(calculo|avatares|app)\.js(\?v=[0-9]+)?\"></script>#<script src=\"\1.js?v=$V\"></script>#g" index.html
git add -A
git commit -m "$1"
git push origin main
