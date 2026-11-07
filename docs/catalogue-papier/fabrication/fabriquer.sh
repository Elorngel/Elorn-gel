#!/bin/zsh
# Fabrique les PDF du catalogue à partir de catalogue.json (textes, prix, photos).
# Utilisation (dans le Terminal, depuis ce dossier) :  ./fabriquer.sh
cd "$(dirname "$0")"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
for FP in 0 3; do
  node generer.mjs $FP || exit 1
  H=catalogue$([ $FP = 3 ] && echo -fp)
  "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --allow-file-access-from-files \
    --user-data-dir="$(mktemp -d)" --print-to-pdf="$PWD/$H.pdf" "file://$PWD/$H.html" 2>/dev/null
  rm -f "./$H.html"
done
echo "PDF fabriqués : catalogue.pdf (A4) et catalogue-fp.pdf (fond perdu 3 mm)"
