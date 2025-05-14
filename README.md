# H20Viz

## Download Validator Data

```bash
chmod +x fetch_epoch.sh
./fetch_epoch.sh 784
```

You could easily loop this for a range:

```bash
for EPOCH in $(seq 780 790); do ./fetch_epoch.sh $EPOCH; done
```

You'll have a folder structure like:

```bash
/rewards/
  epoch=784/part.parquet
  epoch=785/part.parquet
  ...
```

* Each `epoch=XXX/` is a **folder**
* Each folder contains one `part.parquet` file for that epoch
* DuckDB can **globbing-read** across them:

```sql
SELECT * FROM read_parquet('/rewards/epoch=*/part.parquet');
```

---

## ✅ Why This Is Great

* 🧱 **Append-friendly**: Just drop a new folder+file
* ⚡ **Safe for concurrent reads**: Existing files are never changed
* 🤖 **Easy automation**: Each file is a standalone artifact
* 🧹 **Easy cleanup**: Delete `epoch=XXX/` to remove a row group


## Start VegaFusion Server

Start the server in the repo root directory so the `./rewards/` folder is in scope.

This limits the Cache to 500MB:

```bash
$ ./vegafusion-server --host 127.0.0.1 --port 50051 --web --memory-limit 524288000
 ```

 Or with logging:

```bash
RUST_LOG=debug ./vegafusion-server --host 127.0.0.1 --port 50051 --web --memory-limit 524288000
```

### **Installation steps**

```bash
wget https://github.com/vega/vegafusion/releases/download/v2.0.2/vegafusion-server-linux-64.zip
unzip vegafusion-server-linux-64.zip -d .
chmod +x vegafusion-server
```


## Web Client Build

Also copy vega_utils to `/frontend-minimal/node_modules/vegafusion-wasm/snippets/vegafusion-wasm-f7e76dd0896f3e00/js/vega_utils.js` for webpack to compile:

```bash
mkdir -p frontend-minimal/node_modules/vegafusion-wasm/snippets/vegafusion-wasm-f7e76dd0896f3e00/js && cp vega_utils.js frontend-minimal/node_modules/vegafusion-wasm/snippets/vegafusion-wasm-f7e76dd0896f3e00/js/vega_utils.js
```


