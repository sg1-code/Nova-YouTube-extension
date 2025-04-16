#!/bin/sh
# created by: raingart

# All .js compiled into a single one.
outFile="/tmp/nova-tube.user.js"

# Remove existing output file
rm -f "$outFile"

# Concatenate core files in order
cat ./Userscript/meta.js >> "$outFile"
cat ./Userscript/compatibility.js >> "$outFile"
cat ./Userscript/plugins-container.js >> "$outFile"

# Concatenate plugins without cleaning
find ./plugins/* -type f -name "*.js" ! -iname "-*" ! -iname "plugin_example.js" | xargs cat >> "$outFile"

# Concatenate plugins registration logic
# cat ./js/plugins.js >> "$outFile"
cat ./js/plugins.js | sed -e "/   list\:/,/   run: (/c\   run: ({ user_settings, app_ver }) => {" >> "$outFile"

# Concatenate user script logic
cat ./Userscript/user.js >> "$outFile"

# Open the generated output file
command -v VSCodium.AppImage >/dev/null && VSCodium.AppImage "$outFile" || open "$outFile"


# AFTER build:
# use one of
# - https://minifyjs.codeutility.io/
# - https://tools.simpletools.nl/minify-javascript-online.html
# - https://minify-js.com/
# OR in VScode
# 1. clear comments. regex - "//\s.*|/\*[\s\S\n]*?\*/"
# 2. For clear spaces use "Format Document".
# 3. replace "(\n\s{3,}|\n^\n+)" to "\n"
