#!/bin/bash

set -euo pipefail

EPOCH=$1
DEST_DIR="./rewards/epoch=${EPOCH}"
TEMP_PARQUET="part.parquet.temp"
FINAL_PARQUET="part.parquet"
JSON_FILE="epoch_${EPOCH}.json"

# Download raw Trillium JSON
echo "Fetching epoch ${EPOCH}..."
curl -s -o "$JSON_FILE" "https://api.trillium.so/validator_rewards/${EPOCH}"

# Create destination folder
mkdir -p "${DEST_DIR}"

# Convert to Parquet using DuckDB
duckdb -c "
COPY (
  SELECT
    epoch,
    mev_to_validator + mev_to_stakers AS mev_reward,
    validator_inflation_reward + delegator_inflation_reward +
    validator_priority_fees + validator_signature_fees - vote_cost AS staking_reward
  FROM read_json_auto('${JSON_FILE}')
) TO '${DEST_DIR}/${TEMP_PARQUET}' (FORMAT PARQUET);
"

# Atomically move it into place
mv "${DEST_DIR}/${TEMP_PARQUET}" "${DEST_DIR}/${FINAL_PARQUET}"

echo "Epoch ${EPOCH} processed."
