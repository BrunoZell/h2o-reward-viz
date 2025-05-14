import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  entry: './src/index.js',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist')
  },
  mode: 'development',
  devServer: {
    static: './public',
    port: 3000
  },
  experiments: {
    asyncWebAssembly: true,
    topLevelAwait: true
  },
  resolve: {
    fallback: {
      fs: false,
      path: 'path-browserify',
      stream: 'stream-browserify',
      util: 'util/'
    }
  },
  devServer: {
    static: './public',
    port: 3000,
    hot: false,        // 🔕 Disable Hot Module Replacement
    client: {
      logging: 'none', // 🔕 Suppress client log output in browser
      overlay: false   // 🔕 Don't show error overlay in browser
    }
  }
};
