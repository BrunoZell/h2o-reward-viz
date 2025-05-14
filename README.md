
Start the server in the repo root directory so the `./rewards/` folder is in scope.

This limits the Cache to 500MB:

```bash
$ ./vegafusion-server --host 127.0.0.1 --port 50051 --web --memory-limit 524288000
 ```


Also copy vega_utils to `/frontend-minimal/node_modules/vegafusion-wasm/snippets/vegafusion-wasm-f7e76dd0896f3e00/js/vega_utils.js` for webpack to compile:

```bash
mkdir -p frontend-minimal/node_modules/vegafusion-wasm/snippets/vegafusion-wasm-f7e76dd0896f3e00/js && cp vega_utils.js frontend-minimal/node_modules/vegafusion-wasm/snippets/vegafusion-wasm-f7e76dd0896f3e00/js/vega_utils.js
```
