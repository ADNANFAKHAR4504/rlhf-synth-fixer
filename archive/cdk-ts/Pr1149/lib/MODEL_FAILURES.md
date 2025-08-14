1. Region handling and tagging

- Issue: Requirement expects a default hardcoded region for compliance.
- Fix: Updated `bin/tap.ts` and `IDEAL_RESPONSE` so `env.region` defaults to `us-west-2` when `CDK_DEFAULT_REGION` is not set. Tags preserved.

2. VPC design for Lambda

- Issue: Initial approach could have used public/NAT subnets or egress. Requirement is private-only with endpoints.
- Fix: Implemented `Vpc` with `PRIVATE_ISOLATED` subnets and no NAT.

3. S3 security and bucket policy

- Issue: Overly broad or invalid S3 actions in deny policy caused failures and could block control-plane ops.
- Fix: Restrict deny to valid object actions only: `s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`; apply to `arn:...:bucket/*`; use `StringNotEqualsIfExists` on `aws:SourceVpce`; keep separate TLS-only deny. Ensure bucket is fully destroyable with `autoDeleteObjects: true` and `RemovalPolicy.DESTROY`.

4. DynamoDB configuration

- Issue: Used deprecated `pointInTimeRecovery` and unspecified removal; potential retain behavior.
- Fix: Switched to `pointInTimeRecoverySpecification` with PITR enabled and `RemovalPolicy.DESTROY`.

5. Lambda logging deprecation

- Issue: Used deprecated `logRetention` option.
- Fix: Created explicit `logs.LogGroup` and attached via `logGroup`.

6. API type and access logging

- Issue: Original response used REST API; we standardized on HTTP API (v2) with explicit routes.
- Fix: Switched to `HttpApi` with `/`, `/health`, `/data` routes and added access logging via `CfnStage` to a LogGroup.

7. Endpoints for private access

- Issue: Missing CloudWatch Logs interface endpoint for logging from isolated subnets.
- Fix: Added `InterfaceVpcEndpoint` for CloudWatch Logs; created Gateway endpoints for S3 and DynamoDB.

8. Minimal but compliant Lambda code

- Issue: Handler initially tried to use external clients; unnecessary and increases blast radius.
- Fix: Inlined minimal handler returning `{ ok: true }`, with least-privilege grants to S3/DynamoDB; VPC-only networking.

9. Test coverage and CI compatibility

- Issue: Unit tests missing and integration tests brittle due to single output source.
- Fix: Added unit tests for core resources and policies. Integration tests now resolve outputs from env, file, or CloudFormation to support local and CI.
