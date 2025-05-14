import { vegaFusionEmbed, makeGrpcSendMessageFn } from 'vegafusion-wasm';
import * as grpcWeb from 'grpc-web';

try {
    console.log("Embedding chart...");
  const spec = {
    $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
    data: {
      values: [
        { category: 'A', amount: 30 },
        { category: 'B', amount: 55 }
      ]
    },
    mark: 'bar',
    encoding: {
      x: { field: 'category', type: 'ordinal' },
      y: { field: 'amount', type: 'quantitative' }
    }
  };
  
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
  
  // await vegaFusionEmbed(
  //   document.getElementById('vega-chart'),
  //   spec,
  //   config,
  //   send_message_grpc
  // );
  const element = document.getElementById('vega-chart');
  await vegaFusionEmbed(element, spec, config, send_message_grpc);
  console.log("Chart embedded successfully");
} catch (err) {
  console.error("Failed to embed chart:", err);
}