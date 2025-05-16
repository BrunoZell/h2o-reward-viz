# H2O Validator Rewards Vizualization

## 🧱 System Architecture Overview

This repository implements a full data pipeline for visualizing Solana validator reward data as a Vega chart, rendered in a React web frontend. All components run on a single Linux host, managed via `systemd`.

---

### 📂 Project Structure (Top-Level)

```
solviz/
├── charts/                # Output directory for final Vega chart JSON (e.g., h2o-latest.json)
├── json/                  # Raw epoch JSON files fetched from the Trillium API
├── rewards/               # DuckDB-compatible Parquet files (one per epoch)
├── fetch_epoch.sh         # Downloads and imports reward data for a given epoch
├── fetch_missing_epochs.sh# Helper script to backfill missing epochs
├── generate_vega.js       # Queries DuckDB and generates a full Vega spec with embedded data
├── orchestrator.sh        # Polls for new epochs and triggers data ingestion + chart generation
├── orchestrator.service   # systemd unit definition for running orchestrator.sh on boot and failure
├── orchestrator-setup.sh  # Script to symlink + enable the systemd service
├── orchestrator-cleanup.sh# Script to disable + remove the service
├── nginx/                 # (Optional) Nginx site configuration
├── frontend-minimal/      # Minimal React app with VegaEmbed chart rendering
└── vega_spec.js           # Reusable Vega chart template (used by generate_vega.js)
```

---

### 🔄 Data Flow

```
┌────────────────────┐
│   Trillium API     │
└────────┬───────────┘
         ▼
┌────────────────────────────┐
│ fetch_epoch.sh (per epoch)│
│  → saves .json + .parquet │
└────────┬───────────────────┘
         ▼
┌──────────────────────────┐
│  generate_vega.js        │
│  → queries DuckDB        │
│  → emits h2o-latest.json │
└────────┬─────────────────┘
         ▼
┌────────────────────────┐
│ React frontend (via    │
│ VegaEmbed component)   │
│ loads h2o-latest.json  │
└────────────────────────┘
```

---

### 🧠 Automation & Service

* **orchestrator.sh** runs in a loop:

  * Queries the Trillium API for the latest epoch
  * Skips if already fetched
  * Downloads + inserts new data
  * Triggers chart regeneration
* **orchestrator.service** is a `systemd` unit:

  * Starts on boot
  * Automatically retries on failure
  * Logs to `/var/log/h2o-orchestrator.log`

---

### 📡 Chart Output and Serving

* Final Vega chart spec is saved as:

  ```
  charts/h2o-latest.json
  ```
* This JSON file is:

  * Fully self-contained (inline data)
  * Ready for loading in the browser
* Frontend uses `vegaEmbed` to fetch and render it

## Query DuckDB

This command reads all staking reward records of the H2O validator node:

```bash
duckdb -c "
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
FROM read_parquet('rewards/epoch=*/part.parquet')
WHERE identity_pubkey = '9pBHfuE19q7PRbupJf8CZAMwv6RHjasdyMN9U9du7Nx2'
ORDER BY epoch;
"
```

## Download Validator Data

```bash
chmod +x fetch_epoch.sh
./fetch_epoch.sh 784
```

You could easily loop this for a range:

```bash
for EPOCH in $(seq 780 790); do ./fetch_epoch.sh $EPOCH; done
```

You'll have a folder structure like:

```bash
/rewards/
  epoch=784/part.parquet
  epoch=785/part.parquet
  ...
```

* Each `epoch=XXX/` is a **folder**
* Each folder contains one `part.parquet` file for that epoch
* DuckDB can **globbing-read** across them:

```sql
SELECT * FROM read_parquet('/rewards/epoch=*/part.parquet');
```

---

## ✅ Why This Architecture Is Great

This design leverages simple, robust tools in combination to create a maintainable and efficient data pipeline. Here’s why it works so well:

### 🧱 **Append-Only File Layout**

* Each epoch is written once to `epoch=XXX/part.parquet`
* Easy to reason about: no mutable global state
* Enables atomic updates (write to temp, then `mv` into place)

### ⚡ **Safe for Concurrent Reads**

* DuckDB’s `read_parquet` supports globbing and partitions
* Query performance scales naturally with the number of epochs
* No write locks or risk of corruption while reading

### 🤖 **Automated and Fully Headless**

* `systemd` handles scheduling, crash recovery, and boot persistence
* No cron or external workflow engine required
* Easy to restart, inspect, and manage with familiar Linux tools

### 🧩 **Modular by Design**

* Every step is isolated and scriptable (`fetch`, `query`, `build`, `serve`)
* Easy to test or replace individual components
* You can substitute the data source or chart engine with minimal impact

### 📈 **Frontend-Ready and Self-Contained**

* The final chart (`h2o-latest.json`) is fully embedded and ready to render
* Compatible with `vegaEmbed`, CDN-hosted Vega.js, or static-site hosting
* React frontend is decoupled from pipeline complexity

### 🔁 **Incremental and Backfillable**

* New data is added incrementally (e.g., `epoch 791`)
* Missing epochs can be fetched later without special logic
* Backfilling or reprocessing is as simple as re-running `fetch_epoch.sh`

### 🧹 **Easy Cleanup and Archival**

* Delete a folder to remove data
* Archive old epochs by zipping `epoch=XXX/`
* Storage stays predictable and segmentable

### 📦 **DuckDB as the Embedded Engine**

* No running services, no admin — just one binary
* Fast SQL over Parquet with zero setup
* Scales vertically and performs like a real OLAP engine
