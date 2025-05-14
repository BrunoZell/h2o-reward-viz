import { vegaFusionEmbed, makeGrpcSendMessageFn } from 'vegafusion-wasm';
import * as grpcWeb from 'grpc-web';
import * as vegaLite from 'vega-lite';

const vegaLiteSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
  data: {
    url: 'file:rewards/',
    format: {
      type: 'parquet',
      backend: 'datafusion'
    }
  },
  transform: [
    { calculate: 'datum.total_inflation_reward', as: 'noop' }  // ✅ server-compatible
  ],
  mark: 'bar',
  encoding: {
    x: { field: 'epoch', type: 'ordinal', sort: 'ascending' },
    y: { field: 'total_inflation_reward', type: 'quantitative' }
  }
};

try {
  console.log("Embedding chart...");

  const hostname = 'http://127.0.0.1:50051';
  const client = new grpcWeb.GrpcWebClientBase({ format: 'binary' });
  const send_message_grpc = makeGrpcSendMessageFn(client, hostname);
  
  const config = {
    verbose: true,
    debounce_wait: 30,
    debounce_max_wait: 60,
    embed_opts: {
      mode: 'vega'
    }
  };

  const vegaSpec = vegaLite.compile(vegaLiteSpec).spec;
  const domElement = document.getElementById('vega-chart');
  await vegaFusionEmbed(domElement, vegaSpec, config, send_message_grpc);

  console.log("Chart embedded successfully");
} catch (err) {
  console.error("Failed to embed chart:", err);
}