#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION="${1:-}"

if [[ -z "${VERSION}" ]]; then
  echo "Usage: bun run packaging -- <version>"
  echo "Example: bun run packaging -- v0.1.0"
  exit 1
fi

RELEASE_DIR="${ROOT_DIR}/release"
PACKAGE_DIR="${RELEASE_DIR}/rxRadio"
ARCHIVE_PATH="${RELEASE_DIR}/rxRadio-${VERSION}.zip"

cd "${ROOT_DIR}"

echo "Building frontend..."
BUN_INSTALL="${BUN_INSTALL:-/tmp/bun-install}" \
BUN_TMPDIR="${BUN_TMPDIR:-/tmp/bun-tmp}" \
bun run build

rm -rf "${PACKAGE_DIR}" "${ARCHIVE_PATH}"
mkdir -p "${PACKAGE_DIR}"

cp -R client "${PACKAGE_DIR}/"
cp -R module "${PACKAGE_DIR}/"
cp -R server "${PACKAGE_DIR}/"
cp -R shared "${PACKAGE_DIR}/"
cp -R web "${PACKAGE_DIR}/"
cp fxmanifest.lua "${PACKAGE_DIR}/"
cp README.md "${PACKAGE_DIR}/"
cp LICENSE "${PACKAGE_DIR}/"

bsdtar -a -cf "${ARCHIVE_PATH}" -C "${RELEASE_DIR}" rxRadio

echo "Created ${ARCHIVE_PATH}"
