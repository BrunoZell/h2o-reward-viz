#!/bin/bash

set -euo pipefail

SERVICE_NAME="h2o-orchestrator"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
UNIT_SRC="${REPO_DIR}/orchestrator.service"
UNIT_DST="/etc/systemd/system/${SERVICE_NAME}.service"

# Symlink the unit file
echo "Linking orchestrator.service to ${UNIT_DST}..."
sudo ln -sf "${UNIT_SRC}" "${UNIT_DST}"

# Reload and enable the service
echo "Reloading systemd..."
sudo systemctl daemon-reexec
sudo systemctl daemon-reload

echo "Enabling and starting ${SERVICE_NAME}.service..."
sudo systemctl enable "${SERVICE_NAME}.service"
sudo systemctl restart "${SERVICE_NAME}.service"

echo "✅ ${SERVICE_NAME} is set up and running."
