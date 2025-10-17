# Failures

- **Lambda runtime outdated**  
  Functions default to `python3.9` while the prompt asked for the latest runtime (e.g., Python 3.11).

- **IAM role scoping too broad / managed policy used**  
  Each Lambda role attaches the managed `AWSLambdaBasicExecutionRole` instead of showing tightly scoped, minimal inline policies. This violates the "tightly scoped IAM roles" requirement.

- **Lambda environment variables assigned incorrectly**  
  `environment_vars = { "variables": get_function_environment(...) }` is passed directly to `aws.lambda_.Function.environment`. Pulumi expects a `FunctionEnvironmentArgs(variables=...)` mapping — the code will produce the wrong shape.

- **SSM parameter usage returns parameter resource name, not secret value**  
  `get_function_environment` places `ssm_params[param].name` into env vars (the SSM resource name), rather than wiring the Lambda to securely fetch/decrypt the parameter value at runtime or using a Secrets Manager-style reference.

- **Function lookup mapping uses `Output` keys (unusable as dict keys)**  
  `function_map = { f.name.apply(lambda name: name.split('-')[-1]) : f for f in functions }` creates `Output` keys instead of plain strings, so later `function_map[function_name]` lookups (with plain strings) will fail at runtime.

- **S3 buckets lack explicit public-access-block and encryption enforcement**  
  Buckets are created without server-side encryption (SSE-KMS or SSE-S3) is enforced consistently — fails the "secure storage" guidance.

- **Policy JSON construction mixes `Output`s and raw strings (fragile/invalid)**  
  Several IAM/S3 policies are built using `pulumi.Output.concat`/`Output.json_dumps` inside policy documents. Embedding unresolved `Output`s into policy JSON risks invalid JSON or policies with unresolved placeholders.

- **CORS default allows `*` — security concern**  
  API CORS defaults to `allow_origins: ["*"]` which is insecure for many production APIs and contradicts the prompt's emphasis on security.

- **API Gateway route wiring brittle / may fail**  
  Route creation uses `function_map` (see above) and stringly lookups (`route_config["function"]`) that will break because function_map keys are Outputs; integration and permission wiring is therefore unreliable.

- **API URL / attribute mutation is non-idiomatic and brittle**  
  The code sets `api.url = pulumi.Output.concat(...)` on the API object instead of returning a clear output value; this nonstandard mutation may confuse callers and tooling.

- **Region-agnostic claim not implemented concretely**  
  The solution relies on Pulumi stack config/`aws.get_region()` but provides no automation or examples for deploying the same stack across multiple regions without manual stack/region management or drift prevention (no multi-region provider pattern).

- **Packaging / CI reproducibility not addressed**  
  `FileArchive` points at local function folders with no deterministic build or CI packaging steps for dependencies — not production-ready for reproducible deployments.

- **Some resource naming and access assumptions risk collisions**  
  Bucket names and resource naming patterns do not include account/stack suffixes consistently, risking collisions in multi-account or multi-stack usage.

- **Metric/alarm creation incomplete / truncated in places**  
  Monitoring code for metric filters and alarms is partially implemented/truncated and lacks full, validated alarm wiring (e.g., alarm actions, notification targets).
