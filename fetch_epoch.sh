#!/bin/bash

set -euo pipefail

EPOCH=$1
JSON_DIR="./json"
DEST_BASE="./rewards"
FINAL_DIR="${DEST_BASE}/epoch=${EPOCH}"
TEMP_DIR="${DEST_BASE}/epoch=${EPOCH}.tmp"
JSON_FILE="${JSON_DIR}/epoch_${EPOCH}.json"
PARQUET_FILE="part.parquet"
TEMP_JSON=$(mktemp)

# Ensure JSON folder exists
mkdir -p "$JSON_DIR"

# Fetch JSON with status check
echo "Fetching epoch ${EPOCH}..."
HTTP_STATUS=$(curl -s -w "%{http_code}" -o "$TEMP_JSON" "https://api.trillium.so/validator_rewards/${EPOCH}")

if [ "$HTTP_STATUS" != "200" ]; then
  echo "⚠️ Epoch ${EPOCH} not available (HTTP $HTTP_STATUS) — skipping."
  rm -f "$TEMP_JSON"
  exit 0
fi

# Save valid JSON
mv "$TEMP_JSON" "$JSON_FILE"

# Write to Parquet in a temp directory
rm -rf "$TEMP_DIR"
mkdir -p "$TEMP_DIR"

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

# Atomic rename
mv "$TEMP_DIR" "$FINAL_DIR"

echo "✅ Epoch ${EPOCH} imported to ${FINAL_DIR}/${PARQUET_FILE}"
