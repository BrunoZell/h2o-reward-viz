#!/bin/bash

set -euo pipefail

RPC_URL="https://api.mainnet-beta.solana.com"
REWARDS_DIR="./rewards"
SCRIPT_TO_TRIGGER="./fetch_epoch.sh"

get_current_epoch() {
  curl -s "$RPC_URL" -X POST \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","id":1,"method":"getEpochInfo"}' | jq '.result.epoch'
}

get_last_stored_epoch() {
  duckdb -c "
    COPY (
      SELECT MAX(epoch)
      FROM read_parquet('${REWARDS_DIR}/epoch=*/part.parquet')
    ) TO STDOUT (FORMAT CSV, HEADER FALSE);
  "
}

current_mainnet_epoch=$(get_current_epoch)
last_fetched_epoch=$(get_last_stored_epoch | grep -Eo '^[0-9]+$' || echo 600)

echo "Current mainnet epoch: $current_mainnet_epoch"
echo "Last fetched epoch: $last_fetched_epoch"

# Only fetch completed epochs (exclude current active epoch)
target_epoch=$((current_mainnet_epoch - 1))

if [ "$target_epoch" -gt "$last_fetched_epoch" ]; then
  echo "Epoch has advanced from $last_fetched_epoch to $target_epoch"
  for ((e=last_fetched_epoch+1; e<=target_epoch; e++)); do
    echo "Fetching epoch $e"
    if ! bash "$SCRIPT_TO_TRIGGER" "$e"; then
      echo "⚠️ Fetching epoch $e failed — continuing..."
    fi
  done
else
  echo "No completed new epochs to fetch."
fi
