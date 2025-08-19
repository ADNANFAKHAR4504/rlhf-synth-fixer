# Model Failures and Fixes (Infrastructure)

- Missing/blocked TLS (ACM) configuration
  - Failure: Attempted to provision ACM and HTTPS listeners where certificates or validation were not usable in the target account.
  - Fix: Removed ACM and HTTPS listeners; ALB is HTTP-only. Left Route53 and TLS as opt-in for environments that can supply `domainName` and `hostedZoneId`.

- In-account CodeCommit/CodePipeline with repository restrictions
  - Failure: Creating a CodeCommit repository failed (OperationNotAllowedException) due to org/account policy.
  - Fix: Replaced CodeCommit source with an S3 Source + CodeBuild + CodePipeline. A dummy `source.zip` in an encrypted S3 source bucket can trigger the pipeline.

- AWS Config recorder/rules not permitted
  - Failure: Config resources failed (NoAvailableConfigurationRecorder and policy not attachable).
  - Fix: Removed AWS Config resources entirely to meet account constraints.

- KMS key policy insufficient for CloudWatch Logs
  - Failure: LogGroup creation failed with “KMS key does not exist or is not allowed” when using a customer-managed key for Logs encryption.
  - Fix: Added KMS resource policies allowing `logs.<region>.amazonaws.com` to Encrypt/Decrypt/GenerateDataKey/DescribeKey and CreateGrant with appropriate conditions.

- Target group re-association across ALB updates
  - Failure: Update errors “target groups cannot be associated with more than one load balancer”.
  - Fix: Switched to `alb.addListener(...).addTargets(...)` so each update creates the target group via the listener, avoiding reusing a TG across LBs.

- Hard-coded ALB name with unresolved tokens
  - Failure: Synth/unit tests failed validation because explicit `loadBalancerName` contained unresolved tokens.
  - Fix: Removed explicit LB name. Let CloudFormation generate a valid name.

- Unconditional Route53 records
  - Failure: DNS resources attempted without a domain/hosted zone in constrained environments.
  - Fix: Route53 failover A-records and health checks are conditional on context (`domainName`, `hostedZoneId`).

- Data retention on destructive test stacks
  - Failure: Buckets and DB could be retained, leaving stray resources.
  - Fix: Set `autoDeleteObjects: true` and `removalPolicy: DESTROY` for S3; `deletionProtection: false` + `removalPolicy: DESTROY` for RDS; destroy generated Secrets; destroy KMS with pending window.

- Partial requirements coverage
  - Failure: Gaps in HA/multi-region, monitoring, and encryption-at-rest.
  - Fix: Implemented two regional stacks (us-east-1, us-west-2), CloudWatch alarms (ASG CPU, ALB 5xx, RDS CPU), single KMS key reused by S3/RDS/Logs with rotation.

- Tests and outputs alignment
  - Failure: Tests did not match stack naming and output patterns; low branch coverage.
  - Fix: Added/updated unit tests with CDK assertions; added integration tests consuming `cfn-outputs/flat-outputs.json`; corrected stack name predicate to `TapStack-<suffix>` and covered Route53 branch to raise branch coverage over threshold.
