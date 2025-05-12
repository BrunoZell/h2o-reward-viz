import * as grpcWeb from 'grpc-web';

// Use dynamic import as specified in the documentation
const run = async () => {
  const { vegaFusionEmbed, makeGrpcSendMessageFn } = await import("vegafusion-wasm");

  // Connect to forwarded VegaFusion gRPC server
  const hostname = "http://localhost:50051";
  const client = new grpcWeb.GrpcWebClientBase({ format: "binary" });
  const send_message_grpc = makeGrpcSendMessageFn(client, hostname);

  // Vega-Lite spec
  const spec = {
    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
    "data": {
      "url": "rewards/epoch=*/part.parquet",
      "format": { "type": "parquet" }
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
    verbose: false,
    debounce_wait: 30,
    debounce_max_wait: 60,
    embed_opts: { mode: "vega-lite" }
  };

  const element = document.getElementById("vega-chart");
  
  // Use await with the vegaFusionEmbed call
  const chart = await vegaFusionEmbed(element, spec, config, send_message_grpc);
  console.log("Chart rendered successfully");
};

// Start the application
run().catch(error => console.error("Error rendering chart:", error));
