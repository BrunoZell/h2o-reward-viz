import embed from 'vega-embed';
import { VegaFusionWasmClient } from 'vegafusion-wasm';

const vlSpec = {
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

async function render() {
  // Create the WASM client
  const client = await VegaFusionWasmClient.create();

  // Compile and evaluate using WASM
  const { compiled_spec } = await client.compileAndEvaluate(vlSpec);

  // Use vega-embed to render
  embed('#vis', compiled_spec);
}

render();
