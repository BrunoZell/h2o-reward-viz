/**
 * Generate a Vega specification for validator rewards visualization
 * @param {Array} dataset - Array of reward data objects
 * @returns {Object} - Vega specification object
 */
function vegaSpec(dataset) {
  return {
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
        "values": dataset
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
}

module.exports = vegaSpec; 