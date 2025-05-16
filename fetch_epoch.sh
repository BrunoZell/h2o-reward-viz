#!/bin/bash

set -euo pipefail

EPOCH=$1
JSON_DIR="./json"
DEST_BASE="./rewards"
FINAL_DIR="${DEST_BASE}/epoch=${EPOCH}"
TEMP_DIR="${DEST_BASE}/epoch=${EPOCH}.tmp"
JSON_FILE="${JSON_DIR}/epoch_${EPOCH}.json"
PARQUET_FILE="part.parquet"

# Create necessary temp dirs
mkdir -p "$JSON_DIR"
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

# Download Trillium JSON
echo "Fetching epoch ${EPOCH}..."
curl -s -o "$JSON_FILE" "https://api.trillium.so/validator_rewards/${EPOCH}"

# Write to Parquet in temp dir
duckdb -c "
COPY (
  SELECT
    epoch,
    identity_pubkey,
    validator_inflation_reward,
    delegator_inflation_reward,
    total_inflation_reward,
    mev_to_validator,
    mev_to_stakers,
    mev_earned,
    validator_priority_fees,
    validator_signature_fees,
    vote_cost,
    rewards
  FROM read_json_auto('${JSON_FILE}')
) TO '${TEMP_DIR}/${PARQUET_FILE}' (FORMAT PARQUET);
"

# Atomically rename temp dir to final epoch dir
mv "$TEMP_DIR" "$FINAL_DIR"

echo "Epoch ${EPOCH} imported to ${FINAL_DIR}/${PARQUET_FILE}"
