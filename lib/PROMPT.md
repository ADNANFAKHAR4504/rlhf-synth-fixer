# Deployment Notes

Team,

We’re setting up the driver location service with CDK for Terraform using TypeScript—please keep that stack in place and work in `us-east-1`. No alternate runtimes or frameworks for this one.

## Core build list

- API Gateway REST API (edge-optimized) with throttling at 10k requests/second and X-Ray tracing enabled.
- Three Lambda functions (Node.js 18) sitting in private subnets:
  1. Accept location updates (1 GB memory, 30 s timeout).
  2. Return the current driver location.
  3. Provide historical location lookups.
  Each function needs its own SQS dead-letter queue, least-privilege IAM role, explicit environment variables for the DynamoDB table name and region, and encryption/logging in line with our standards.
- DynamoDB table keyed on `driverId` (hash) and `timestamp` (range), on-demand billing with point-in-time recovery.
- Request validation on the POST endpoint so `driverId`, `latitude`, and `longitude` are always supplied.
- CloudWatch alarms that fire if Lambda error rates exceed 1% over a five-minute window.

## Guardrails and conventions

- Resource names/tags must carry the `environmentSuffix` so that multiple PR stacks can coexist.
- Do not create new Secrets Manager items; reuse the existing secrets.
- Everything should be easy to destroy during CI runs—avoid `Retain` unless there’s a clear business reason.
- Keep CloudWatch log retention at 7 days.
- Encryption at rest and in transit, plus least privilege, are non-negotiable.

## Testing notes

Integration tests read from `cfn-outputs/flat-outputs.json` and they hit real AWS resources. Make sure those outputs mirror what the stack deploys and that the API behaves as expected.

That’s the brief. Build the stack with CDKTF + TS in `us-east-1`, follow the production hardening points above, and we’ll be in good shape.
