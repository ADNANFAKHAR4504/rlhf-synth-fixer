Layer usage

This folder (`lib/lambda_layer/nodejs`) contains the code packaged into the Lambda layer asset.

Important:
- Do NOT commit `node_modules/` from this folder. The CI/pipeline is responsible for installing dependencies and publishing the layer asset.

How to prepare locally (developer only):

```bash
cd lib/lambda_layer/nodejs
npm ci
# Run tests locally that depend on the layer by using a local bundling or by mocking.
```

Pipeline note:
- The pipeline must run `npm ci` in `lib/lambda_layer/nodejs` before packaging the layer so the runtime modules (e.g., `jmespath`) are included in the published layer.
