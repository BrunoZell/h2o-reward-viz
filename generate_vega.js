const duckdb = require('duckdb');
const fs = require('fs');
const path = require('path');
const vegaSpec = require('./vega_spec');

const db = new duckdb.Database(':memory:');
const SQL = `
  SELECT epoch, total_inflation_reward, mev_to_validator, vote_cost
  FROM read_parquet('rewards/epoch=*/part.parquet')
  WHERE identity_pubkey = '9pBHfuE19q7PRbupJf8CZAMwv6RHjasdyMN9U9du7Nx2'
  ORDER BY epoch
`;

db.all(SQL, (err, rows) => {
  if (err) throw err;

  // Convert BigInts to Numbers
  const sanitized = rows.map(row => {
    // Convert values and format data
    const epochNum = Number(row.epoch);
    // Create a simple timestamp (placeholder - replace with actual dates if available)
    const timestamp = new Date(2023, 0, 1 + epochNum).toISOString();
    
    return {
      epoch: epochNum,
      timestamp: timestamp,
      rewards: Number(row.total_inflation_reward) / 1000000000, // Convert lamports to SOL
      mev: Number(row.mev_to_validator) / 1000000000,
      vote_cost: Number(row.vote_cost) / 1000000000
    };
  });

  // Generate the Vega spec using the imported function
  const spec = vegaSpec(sanitized);
  
  // Ensure the charts directory exists
  const outputDir = path.join(__dirname, 'charts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write to h2o-latest.json file
  const outputFile = path.join(outputDir, 'h2o-latest.json');
  fs.writeFileSync(outputFile, JSON.stringify(spec, null, 2));
  
  console.log(`Vega spec written to ${outputFile}`);
});
