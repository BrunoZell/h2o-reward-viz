/**
 * Generate a Vega-Lite specification for validator rewards visualization
 * @param {Array} dataset - Array of reward data objects
 * @returns {Object} - Vega-Lite specification object
 */
function vegaSpec(dataset) {
  return {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "description": "Validator Rewards per Epoch",
    "width": 800,
    "height": 400,
    "background": "#1A1A1A",
    "data": {
      "values": dataset
    },
    "transform": [
      {
        "fold": ["VR", "MEV"],
        "as": ["Reward Type", "Value"]
      }
    ],
    "mark": "bar",
    "encoding": {
      "x": {
        "field": "epoch",
        "type": "ordinal",
        "title": "Epoch",
        "axis": {
          "titleColor": "#EEEEEE",
          "labelColor": "#CCCCCC",
          "grid": false
        }
      },
      "y": {
        "field": "Value",
        "type": "quantitative",
        "title": "SOL Rewards",
        "stack": "zero",
        "axis": {
          "titleColor": "#EEEEEE",
          "labelColor": "#CCCCCC",
          "grid": true,
          "gridColor": "#333333",
          "format": ".8f"
        }
      },
      "color": {
        "field": "Reward Type",
        "type": "nominal",
        "scale": {
          "domain": ["VR", "MEV"],
          "range": ["#5546FF", "#FF4672"]
        },
        "legend": {
          "title": "Reward Type",
          "titleColor": "#EEEEEE",
          "labelColor": "#CCCCCC"
        }
      },
      "tooltip": [
        {"field": "epoch", "type": "ordinal", "title": "Epoch"},
        {"field": "Reward Type", "type": "nominal"},
        {"field": "Value", "type": "quantitative", "format": ".8f", "title": "Reward"}
      ]
    },
    "config": {
      "view": {
        "stroke": "transparent"
      },
      "bar": {
        "strokeWidth": 0
      }
    }
  };
}

export default vegaSpec; 