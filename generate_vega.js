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

  const vegaSpec = {
    "$schema": "https://vega.github.io/schema/vega/v6.json",
    "description": "Validator Rewards per Epoch",
    "width": 800,
    "height": 400,
    "autosize": { "type": "fit", "contains": "padding" },
    "padding": 10,
    "background": "#1A1A1A",
    
    "data": [
      {
        "name": "rewards",
        "values": sanitized
      }
    ],
    
    "scales": [
      {
        "name": "xscale",
        "type": "band",
        "domain": {"data": "rewards", "field": "epoch"},
        "range": "width",
        "padding": 0.1
      },
      {
        "name": "yscale",
        "type": "linear",
        "domain": {"data": "rewards", "field": "rewards"},
        "range": "height",
        "nice": true,
        "zero": true
      }
    ],
    
    "axes": [
      {
        "orient": "bottom",
        "scale": "xscale",
        "title": "Epoch",
        "titleColor": "#EEEEEE",
        "labelColor": "#CCCCCC",
        "grid": false,
        "domain": true
      },
      {
        "orient": "left",
        "scale": "yscale",
        "title": "SOL Rewards",
        "titleColor": "#EEEEEE",
        "labelColor": "#CCCCCC",
        "grid": true,
        "gridColor": "#333333",
        "format": ".4f"
      }
    ],
    
    "signals": [
      {
        "name": "tooltip",
        "value": {},
        "on": [
          {"events": "rect:mouseover", "update": "datum"},
          {"events": "rect:mouseout", "update": "{}"}
        ]
      }
    ],
    
    "marks": [
      {
        "type": "rect",
        "from": {"data": "rewards"},
        "encode": {
          "enter": {
            "x": {"scale": "xscale", "field": "epoch"},
            "width": {"scale": "xscale", "band": 1},
            "y": {"scale": "yscale", "field": "rewards"},
            "y2": {"scale": "yscale", "value": 0},
            "fill": {"value": "#5546FF"}
          },
          "hover": {
            "fill": {"value": "#6E61FF"}
          }
        }
      },
      {
        "type": "text",
        "encode": {
          "enter": {
            "align": {"value": "center"},
            "baseline": {"value": "bottom"},
            "fill": {"value": "#EEEEEE"}
          },
          "update": {
            "x": {"scale": "xscale", "signal": "tooltip.epoch", "band": 0.5},
            "y": {"scale": "yscale", "signal": "tooltip.rewards", "offset": -5},
            "text": {
              "signal": "tooltip.rewards ? format(tooltip.rewards, '.6f') : ''"
            },
            "fillOpacity": { "signal": "tooltip.rewards ? 1 : 0" }
          }
        }
      }
    ],
    
    "legends": []
  };

  console.log(JSON.stringify(vegaSpec));
});
