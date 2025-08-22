You are an expert AWS serverless infrastructure engineer. Implement a Pulumi (Python) program that migrates an existing serverless application from one AWS region to another with zero downtime, while enabling future multi-region deployments.

Only modify these files:

lib/tap_stack.py — Pulumi stack implementation

tests/unit/test_tap_stack.py — unit tests with Pulumi mocks

tests/integration/test_tap_stack.py — integration tests with Pulumi mocks

Do not touch other files. If a CI/CD or deployment snippet is needed, include it as a comment in lib/tap_stack.py.

1) Objective
Migrate an AWS serverless application — composed of API Gateway, Lambda functions, S3 buckets for static assets, and DynamoDB — from its current region to a target region (from Pulumi config), without downtime, using blue-green deployment or canary release.

2) Hard requirements
Language: Python with Pulumi SDK

AWS Services:

API Gateway → Lambda integration

Lambda → DynamoDB read/write

S3 → static website hosting or asset delivery

IAM: all roles/policies must follow least privilege principle

Migration strategy:

Blue-green or canary release so traffic gradually shifts to new region

Ability to roll back to old region if needed

Data sync:

DynamoDB replication across regions until cut-over

S3 cross-region replication for assets

Monitoring/logging:

CloudWatch Logs for Lambda, API Gateway access logs enabled

Detailed error logging during migration

Metrics & alarms for API Gateway latency/errors, Lambda errors, DynamoDB replication lag

Multi-region readiness:

Parameterize regions in Pulumi config for future deployments

Support simultaneous deployments in ≥2 regions

3) Tests
Unit tests (tests/unit/test_tap_stack.py)
Must run with pytest + Pulumi mocks

Assert:

API Gateway exists & is connected to Lambda

Lambda has correct IAM role (least privilege)

DynamoDB table has cross-region replication enabled

S3 bucket has replication configuration set

All resource names follow <TeamName>-<Environment>-<ServiceName> pattern

Logs and alarms exist for API Gateway & Lambda

Integration tests (tests/integration/test_tap_stack.py)
Must run with Pulumi mocks and validate wiring:

API Gateway → Lambda → DynamoDB path works in new region

Traffic shift configuration (blue-green or canary) is present

S3 replication destinations point to correct region bucket

DynamoDB streams or global tables correctly configured

Rollback simulation works in mocks

4) Delivery format
Output must only include:

=== lib/tap_stack.py ===

=== tests/unit/test_tap_stack.py ===

=== tests/integration/test_tap_stack.py ===

No extra explanation outside inline code comments

Code must pass pytest locally without AWS calls (Pulumi mocks only)

5) Extra implementation rules
All names follow <TeamName>-<Environment>-<ServiceName>

Tag all resources with:

Owner

Purpose

Environment

Fail fast if required configs missing:

source_region

target_region

allowed_cidr (for API Gateway or Lambda if applicable)

Default traffic shift: 10% increments over 10 minutes (configurable)

Keep all helper functions inside lib/tap_stack.py

Include commented example CI/CD snippet showing:

Deploy new region (green)

Gradually shift traffic via Route53 weighted routing or API Gateway stages

Monitor metrics

Cut-over or rollback

Final note to assistant:

No hardcoded credentials; sensitive data handled via AWS Secrets Manager or Pulumi config

Use infrastructure-as-code best practices, safe defaults, and deterministic tests