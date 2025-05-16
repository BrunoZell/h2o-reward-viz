const duckdb = require('duckdb');

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
  const sanitized = rows.map(row =>
    Object.fromEntries(
      Object.entries(row).map(([k, v]) => [k, typeof v === 'bigint' ? Number(v) : v])
    )
  );

  const vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega/v5.json",
    "description": "Staking rewards over epochs",
    "width": 800,
    "height": 400,
    "data": [
      {
        "name": "rewards",
        "values": sanitized
      }
    ],
    "mark": "line",
    "encoding": {
      "x": { "field": "epoch", "type": "ordinal" },
      "y": { "field": "total_inflation_reward", "type": "quantitative" }
    }
  };

  console.log(JSON.stringify(vegaSpec));
});
