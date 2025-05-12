#!/bin/bash

set -euo pipefail

EPOCH=$1
DEST_DIR="./rewards/epoch=${EPOCH}"
JSON_DIR="./json"
TEMP_PARQUET="part.parquet.temp"
FINAL_PARQUET="part.parquet"
JSON_FILE="${JSON_DIR}/epoch_${EPOCH}.json"

# Create destination folders
mkdir -p "${JSON_DIR}"
mkdir -p "${DEST_DIR}"

# Download raw Trillium JSON
echo "Fetching epoch ${EPOCH}..."
curl -s -o "$JSON_FILE" "https://api.trillium.so/validator_rewards/${EPOCH}"

# Selectively extract useful fields (no aggregation)
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
) TO '${DEST_DIR}/${TEMP_PARQUET}' (FORMAT PARQUET);
"

# Atomically move into place
mv "${DEST_DIR}/${TEMP_PARQUET}" "${DEST_DIR}/${FINAL_PARQUET}"

echo "Epoch ${EPOCH} imported to ${DEST_DIR}/${FINAL_PARQUET}"
