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
last_fetched_epoch=$(get_last_stored_epoch)

echo "Current mainnet epoch: $current_mainnet_epoch"
echo "Last fetched epoch: $last_fetched_epoch"

if [ "$current_mainnet_epoch" -gt "$last_fetched_epoch" ]; then
  echo "Epoch has advanced from $last_fetched_epoch to $current_mainnet_epoch"
  for ((e=last_fetched_epoch+1; e<=current_mainnet_epoch; e++)); do
    echo "Fetching epoch $e"
    bash "$SCRIPT_TO_TRIGGER" "$e"
  done
else
  echo "No new epochs. Current: $current_mainnet_epoch, Last stored: $last_fetched_epoch"
fi
