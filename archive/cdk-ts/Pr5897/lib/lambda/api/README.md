## Lambda asset: api

This directory contains the Node.js Lambda handler and a small helper
script used to prepare the asset for deployment via CDK.

Files of interest
- `index.js` — the Lambda handler source (entrypoint `index.handler`).
- `package.json` — runtime dependencies required by the function (e.g. aws-sdk).
- `prepare.sh` — helper script that installs production dependencies into
  this directory so `cdk` `Code.fromAsset` packages them with the function.

Why `prepare.sh` exists
-----------------------
By default CDK packages the contents of the asset directory. If `node_modules`
are not present in the asset directory, runtime dependencies will be missing
from the deployed Lambda bundle resulting in `Runtime.ImportModuleError`.

Two acceptable approaches exist:

- Run this repository's `./lib/lambda/api/prepare.sh` locally/CI before `cdk synth`/`cdk deploy`.
- Use CDK's bundling support (docker-based) to build the asset at synth time.

This project currently uses the first approach to keep CI simple and fast.

How to run locally
-------------------
Make sure you have a Node.js version compatible with the project's runtime
requirements (recommended: Node.js 18.x). Then from the repository root:

```bash
# make the script executable (only required once)
chmod +x ./lib/lambda/api/prepare.sh

# run the script to install production dependencies into the asset dir
./lib/lambda/api/prepare.sh
```

What the script does
--------------------
- verifies `package.json` exists in this directory
- runs `npm ci --production` to install only `dependencies` (not devDependencies)
- prints success or a helpful error message

CI guidance
-----------
Add a step in your CI workflow before `cdk synth`/`cdk deploy` that runs the
prepare script. Example (pseudo-YAML):

```yaml
- name: Prepare Lambda asset
  run: |
    chmod +x ./lib/lambda/api/prepare.sh
    ./lib/lambda/api/prepare.sh
```

Notes & troubleshooting
-----------------------
- If `npm ci` fails due to network or registry issues, ensure the CI
  environment has network access to the npm registry or a configured
  npm mirror.
- If you prefer not to mutate the repository (i.e. not create node_modules
  in the workspace), consider switching to CDK bundling which builds the
  asset inside a container and produces an isolated bundle automatically.

Contact
-------
If you want me to also add the CI snippet into your workflow files, tell me
which CI files to edit and I'll prepare a patch (you previously limited edits
to `lib/` and `test/` only; I'll not edit CI files until you allow it).
