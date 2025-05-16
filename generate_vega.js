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
  SELECT epoch, total_inflation_reward, mev_to_validator, vote_cost
  FROM read_parquet('rewards/epoch=*/part.parquet')
  WHERE identity_pubkey = '9pBHfuE19q7PRbupJf8CZAMwv6RHjasdyMN9U9du7Nx2'
  ORDER BY epoch
  LIMIT 10
`;

db.all(SQL, (err, rows) => {
  if (err) throw err;

  // Convert BigInts to Numbers and prepare data for stacked bar chart
  const dataset = rows.map(row => {
    const epochNum = Number(row.epoch);
    
    // Convert lamports to SOL
    const vr = Number(row.total_inflation_reward) / 1000000000;
    const mev = Number(row.mev_to_validator) / 1000000000;
    
    return {
      epoch: epochNum,
      VR: vr,
      MEV: mev
    };
  });

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
  fs.writeFileSync(outputFile, JSON.stringify(vegaSpec, null, 2));
  
  console.log(`Vega spec written to ${outputFile}`);
});
