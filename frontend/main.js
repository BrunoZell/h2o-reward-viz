import * as grpcWeb from 'grpc-web';

// Use dynamic import as specified in the documentation
const run = async () => {
  const { vegaFusionEmbed, makeGrpcSendMessageFn } = await import("vegafusion-wasm");

  // Connect to forwarded VegaFusion gRPC server
  const hostname = "http://localhost:50051";
  const client = new grpcWeb.GrpcWebClientBase({ format: "binary" });
  const send_message_grpc = makeGrpcSendMessageFn(client, hostname);

  // Sample data instead of using parquet files
  const sampleData = [
    { "epoch": 1, "mev_to_validator": 10, "mev_to_stakers": 20, "validator_inflation_reward": 5, "delegator_inflation_reward": 15, "validator_priority_fees": 3, "validator_signature_fees": 2, "vote_cost": 1 },
    { "epoch": 2, "mev_to_validator": 15, "mev_to_stakers": 25, "validator_inflation_reward": 6, "delegator_inflation_reward": 18, "validator_priority_fees": 4, "validator_signature_fees": 3, "vote_cost": 1 },
    { "epoch": 3, "mev_to_validator": 12, "mev_to_stakers": 22, "validator_inflation_reward": 7, "delegator_inflation_reward": 17, "validator_priority_fees": 5, "validator_signature_fees": 2, "vote_cost": 2 }
  ];

  // Vega-Lite spec with embedded data
  const spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "data": {
      "values": sampleData
    },
    "transform": [
      { "calculate": "datum.mev_to_validator + datum.mev_to_stakers", "as": "mev" },
      {
        "calculate":
          "datum.validator_inflation_reward + datum.delegator_inflation_reward + datum.validator_priority_fees + datum.validator_signature_fees - datum.vote_cost",
        "as": "staking"
      },
      { "fold": ["mev", "staking"], "as": ["type", "value"] }
    ],
    "mark": "bar",
    "encoding": {
      "x": { "field": "epoch", "type": "ordinal" },
      "y": { "field": "value", "type": "quantitative", "stack": "zero" },
      "color": { "field": "type", "type": "nominal" },
      "tooltip": [
        { "field": "epoch" },
        { "field": "type" },
        { "field": "value", "format": ".2f" }
      ]
    }
  };

  const config = {
    verbose: true, // Enable verbose mode for debugging
    debounce_wait: 30,
    debounce_max_wait: 60,
    embed_opts: { 
      mode: "vega-lite", 
      renderer: "svg", // Set explicit renderer
      logLevel: 2 // Add log level for debugging
    }
  };

  const element = document.getElementById("vega-chart");
  
  try {
    // Use await with the vegaFusionEmbed call
    console.log("Attempting to render chart with spec:", JSON.stringify(spec));
    const chart = await vegaFusionEmbed(element, spec, config, send_message_grpc);
    console.log("Chart rendered successfully");
  } catch (error) {
    console.error("Error rendering chart:", error);
    // Try embedded runtime as fallback (without gRPC)
    try {
      console.log("Trying embedded runtime...");
      const chart = await vegaFusionEmbed(element, spec, config);
      console.log("Chart rendered successfully with embedded runtime");
    } catch (fallbackError) {
      console.error("Fallback rendering also failed:", fallbackError);
    }
  }
};

// Start the application
run().catch(error => console.error("Startup error:", error));
