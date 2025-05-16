#!/bin/bash

set -euo pipefail

while true; do
  bash ./fetch_missing_epochs.sh
  sleep 600  # wait 10 minutes before next check
done
