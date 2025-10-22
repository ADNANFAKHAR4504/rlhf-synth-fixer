# Model Failures Log

## Previous Gaps
- No Terraform outputs were exported, so CI could not hydrate `cfn-outputs/flat-outputs.json` for downstream checks.
- Unit tests asserted non-existent attributes (`bucket`, `bucket_versioning`, `bucket_encryption`) and never validated actual infrastructure, leading to consistent failures.
- Integration tests never used live AWS data; they instantiated the stack locally instead of validating deployed resources.
- `lib/IDEAL_RESPONSE.md` contained narrative content and drifted from the real source files, creating review mismatches.

## Fixes Implemented
- Added comprehensive `TerraformOutput` declarations for networking, data, and security resources so CI publishes all required identifiers.
- Rebuilt unit tests to synthesize the CDKTF stack, verify exported outputs, and confirm the presence of critical Terraform resources.
- Replaced integration tests with boto3-backed validations that read from `cfn-outputs/flat-outputs.json`, gracefully skip missing outputs, and perform read-only health checks against AWS.
- Regenerated `lib/IDEAL_RESPONSE.md` programmatically to mirror every Python module in `lib/`, eliminating documentation drift.
- Enriched `metadata.json` with regions, frameworks, CI entrypoints, artifacts, and ownership metadata for better automation context.

## Remaining Risks / Known Gaps
- Secrets Manager rotation infrastructure is defined but no rotation Lambda is deployed; rotation enablement remains a manual follow-up.
- Live tests depend on AWS credentials and existing deployments; they skip rather than fail if credentials or outputs are absent.

## CI & Next Steps
- Run `./scripts/unit-tests.sh` locally to revalidate before pushing.
- Trigger `integration-tests-live` in CI; monitor for resource-throttling or regional drift and rerun up to three times if transient AWS issues appear.
- If live tests continue to skip due to missing outputs, investigate the deployment pipeline to ensure stack outputs publish correctly.
