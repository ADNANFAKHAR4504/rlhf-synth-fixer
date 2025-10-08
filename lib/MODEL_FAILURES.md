# MODEL_FAILURES.md

## Critical Deployment Errors
- **Invalid KMS alias**: The encryption key alias omits the required `alias/` prefix, causing CloudFormation validation to fail.
- **Unsupported Lambda property**: Each Lambda definition sets a `logGroup` property that CDK rejects, preventing synthesis.
- **Missing CloudWatch action import**: CloudWatch alarms instantiate `SnsAction` without importing it from the proper module, breaking compilation.
- **Region mismatch**: The `REGION` constant is declared but never enforced; without `env` on the stack or `cdk.json`, resources may deploy to the caller’s default region instead of `us-west-2`.

## Functional Gaps
- **SNS publish denied**: Lambda roles never receive permission to publish to the notification topic, so runtime notifications fail.
- **Unusable validation script**: Resource lookups rely on malformed API names and wildcard Lambda identifiers, causing validation to exit with errors even when resources exist.
- **Incomplete microservice code**: Only the user-service handler is defined; product and order handlers are absent from the deliverable.
- **Hard-coded secrets**: Lambdas depend on a Secrets Manager secret but no seed value or rotation workflow is provided, so deployments surface empty secrets.

## Security & Best-Practice Violations
- **Deprecated Lambda runtime**: All functions target Node.js 14, which is out of support and violates the requirement to use the latest runtimes.
- **Overprivileged IAM role**: The shared Lambda role uses the broad `AWSLambdaBasicExecutionRole` managed policy without scope-down statements, failing the least-privilege mandate.
