#!/bin/bash

set -euo pipefail

EPOCH=$1
JSON_DIR="./json"
DEST_BASE="./rewards"
TEMP_BASE="./rewards-tmp"
FINAL_DIR="${DEST_BASE}/epoch=${EPOCH}"
TEMP_DIR="${TEMP_BASE}/epoch=${EPOCH}"
JSON_FILE="${JSON_DIR}/epoch_${EPOCH}.json"
PARQUET_FILE="part.parquet"
TEMP_JSON=$(mktemp)

# Clean up any leftover temp directory for this epoch
if [ -d "$TEMP_DIR" ]; then
  echo "🧹 Cleaning up leftover temp directory: $TEMP_DIR"
  rm -rf "$TEMP_DIR"
fi

# Check if epoch data already exists
if [ -f "${FINAL_DIR}/${PARQUET_FILE}" ]; then
  echo "✅ Epoch ${EPOCH} already exists at ${FINAL_DIR}/${PARQUET_FILE} — skipping."
  exit 0
fi

# Ensure directories exist
mkdir -p "$JSON_DIR"
mkdir -p "$TEMP_BASE"

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
  SELECT DISTINCT ON (epoch, identity_pubkey)
    epoch,
    identity_pubkey,
    CAST(validator_inflation_reward AS DOUBLE) AS validator_inflation_reward,
    CAST(delegator_inflation_reward AS DOUBLE) AS delegator_inflation_reward,
    CAST(total_inflation_reward AS DOUBLE) AS total_inflation_reward,
    CAST(mev_to_validator AS DOUBLE) AS mev_to_validator,
    CAST(mev_to_stakers AS DOUBLE) AS mev_to_stakers,
    CAST(mev_earned AS DOUBLE) AS mev_earned,
    CAST(validator_priority_fees AS DOUBLE) AS validator_priority_fees,
    CAST(validator_signature_fees AS DOUBLE) AS validator_signature_fees,
    CAST(mev_to_jito_block_engine AS DOUBLE) AS mev_to_jito_block_engine,
    CAST(mev_to_jito_tip_router AS DOUBLE) AS mev_to_jito_tip_router,
    CAST(mev_commission AS DOUBLE) AS mev_commission,
    CAST(total_block_rewards_after_burn AS DOUBLE) AS total_block_rewards_after_burn,
    CAST(total_block_rewards_before_burn AS DOUBLE) AS total_block_rewards_before_burn,
    CAST(vote_cost AS DOUBLE) AS vote_cost,
    CAST(rewards AS DOUBLE) AS rewards
  FROM read_json_auto('${JSON_FILE}')
) TO '${TEMP_DIR}/${PARQUET_FILE}' (FORMAT PARQUET);
"

# Atomic rename
mv "$TEMP_DIR" "$FINAL_DIR"

echo "✅ Epoch ${EPOCH} imported to ${FINAL_DIR}/${PARQUET_FILE}"
