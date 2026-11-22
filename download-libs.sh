#!/usr/bin/env bash
# Tải Three.js và OrbitControls về thư mục libs/ để chạy offline.
set -euo pipefail

VERSION="0.160.0"
BASE="https://unpkg.com/three@${VERSION}"

mkdir -p libs/addons/controls

echo "→ Downloading three.module.js ..."
curl -fsSL "${BASE}/build/three.module.js" -o libs/three.module.js

echo "→ Downloading OrbitControls.js ..."
curl -fsSL "${BASE}/examples/jsm/controls/OrbitControls.js" \
  -o libs/addons/controls/OrbitControls.js

# OrbitControls imports 'three' — that import will resolve via importmap.
echo ""
echo "✅ Xong. Cập nhật importmap trong index.html:"
echo ""
echo '  "three": "./libs/three.module.js",'
echo '  "three/addons/": "./libs/addons/"'