import duckdb from 'duckdb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import vegaSpecFn from './vega_spec.js';
import * as vl from 'vega-lite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new duckdb.Database(':memory:');
const SQL = `
  SELECT 
    epoch, 
    mev_earned,
    rewards
  FROM read_parquet('rewards/epoch=[0-9]*[0-9]/part.parquet')
  WHERE identity_pubkey = '9pBHfuE19q7PRbupJf8CZAMwv6RHjasdyMN9U9du7Nx2'
  ORDER BY epoch DESC
  LIMIT 50
`;

db.all(SQL, (err, rows) => {
  if (err) throw err;

  // Pass data directly to the Vega spec
  const dataset = rows.map(row => ({
    epoch: Number(row.epoch),
    mev_earned: Number(row.mev_earned),
    rewards: Number(row.rewards)
  }));

  // Generate the Vega-Lite spec
  const vegaLiteSpec = vegaSpecFn(dataset);
  
  // Compile Vega-Lite to Vega
  const vegaSpec = vl.compile(vegaLiteSpec).spec;
  
  // Ensure the charts directory exists
  const outputDir = path.join(__dirname, 'charts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write to h2o-latest.json file (Vega spec)
  const outputFile = path.join(outputDir, 'h2o-latest.json');
  fs.writeFileSync(outputFile, JSON.stringify(vegaSpec));
  
  console.log(`Vega spec written to ${outputFile}`);
});
