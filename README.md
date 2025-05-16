# H2O Validator Rewards Visualization

## 🧱 System Architecture Overview

This repository implements a full data pipeline for visualizing Solana validator reward data as a Vega chart, rendered in a React web frontend. All components run on a single Linux host, managed via `systemd`. It focusses on a single validator _H2O_.

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
└── vega_spec.js           # Reusable Vega-Lite chart template
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

The system is fully automated using simple, composable shell scripts, a systemd service, and a Node.js Vega-Lite compiler step.

#### ✅ Key Components

* **`fetch_epoch.sh`**

  * Downloads and validates reward data for a specific epoch from the Trillium API
  * Converts JSON to Parquet format using DuckDB
  * Uses atomic writes and directory isolation to ensure data integrity
  * Stores files in `rewards/epoch=XXX/part.parquet`

* **`fetch_missing_epochs.sh`**

  * Determines the latest on-chain epoch and identifies which ones are missing locally
  * Skips the currently active epoch to avoid partial fetches
  * Backfills gaps by calling `fetch_epoch.sh`
  * Triggers chart regeneration automatically when new data is added

* **`generate_vega.js`**

  * Queries DuckDB for the latest reward data for a specific validator
  * Generates a **Vega-Lite spec** using `vega_spec.js`
  * Compiles that to a full **Vega spec** using the `vega-lite` compiler
  * Embeds all data inline and saves the output as `charts/h2o-latest.json`

* **`orchestrator.sh`**

  * Runs in a simple infinite loop with a 10-minute sleep
  * Calls `fetch_missing_epochs.sh` to update data
  * Logs all actions and errors
  * Lightweight and crash-tolerant

* **`orchestrator.service` (systemd unit)**

  * Boots with the system and restarts on failure
  * Logs output to `/var/log/h2o-orchestrator.log`
  * Sets the working directory and environment path for DuckDB
  * Configured for robustness and simplicity

* **`orchestrator-setup.sh`**

  * Symlinks the orchestrator service into systemd
  * Reloads daemon state and starts the unit
  * Can be removed with `orchestrator-cleanup.sh`

---

### 📡 Chart Output and Serving

* The final compiled Vega chart spec is written to:

  ```
  charts/h2o-latest.json
  ```

* This JSON file is:

  * Self-contained (includes data and spec)
  * Static and CDN-cacheable
  * Updated automatically after new data is ingested

* ✅ **It is publicly downloadable at:**
  **[http://semantic.bet/h2o-latest.json](http://semantic.bet/h2o-latest.json)**

* The React frontend renders this using `vegaEmbed`.

---

### 📊 Vega & Vega-Lite: Declarative Visualization That Works

Many visualization stacks are fragile: hardcoded, non-reusable, and deeply tied to UI logic. Vega and Vega-Lite solve this by offering a **declarative grammar of graphics** — a way to describe *what* to show, not *how* to draw it.

In this setup:

* Charts are authored in **Vega-Lite** (easier to write and maintain)
* Compiled to **Vega** server-side using Node.js
* Resulting chart specs are versionable, portable JSON
* Supports data transforms (e.g., fold, aggregate) inside the spec
* Rendering happens client-side via `vegaEmbed`, with full interactivity

This approach is part of the broader **declarative revolution** in data engineering, favoring reproducibility, transparency, and clean separation of concerns.

---

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
