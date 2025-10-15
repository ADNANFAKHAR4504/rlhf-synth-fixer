# Failures

- **AWS provider handling is broken / inconsistent**  
  regions.get_provider returns the aws module for the primary region and an aws.Provider instance for others. Resources expect a provider instance — returning the module for the primary region is incorrect and will break multi-region provisioning.

- **Resources don't consistently use provider (brittle per-region deployment)**  
  The code repeatedly does opts=ResourceOptions(provider=provider if region != "us-east-1" else None). That conditional is fragile, hardcodes the primary region string, and results in inconsistent provider scoping (many resources end up using the default provider rather than the intended per-region provider).

- **Lambda runtime not meeting prompt ("latest", e.g. Python 3.11)**  
  Lambdas are created with runtime="python3.9". The prompt asked for the latest runtime (e.g., Python 3.11). This is an explicit mismatch.

- **X-Ray tracing not enabled on Lambda functions**  
  The prompt required AWS X-Ray tracing for all Lambdas. The Lambdas have no tracing_config set — tracing is missing.

- **IAM least-privilege not convincingly enforced**  
  The generated IAM policy allows broad DynamoDB actions and uses wildcard ARNs (table/{app_name}-{environment}-\*). There is no demonstrated scoping to exact table ARNs, index ARNs, or fine-grained conditions — this fails the least-privilege requirement.

- **DynamoDB encryption semantics ambiguous / missing AWS-managed CMK**  
  The DynamoDB table enables server-side encryption but does not explicitly use or document AWS-managed CMK (KMS) as required. The prompt asked for AWS-managed keys for encryption and clear proof of that configuration.

- **Per-region EventBridge provider/resource usage is brittle**  
  Event bus / rule / target resources are created with mixed provider logic and manual opts conditionals. The result is fragile region mapping and a high risk the secondary region resources will be mis-scoped or fail to deploy.

- **Service integration patterns for targets & permissions are fragile**  
  Permissions and targets are wired using direct rule ARN references and lambda\_.Permission entries that assume specific ARNs/names. The code constructs source_arn and target ARNs in brittle ways that may not match the exact execute-api/eventbridge ARN formats required by AWS — this can cause invocation/permission failures.

- **Global table / replica creation OK but lacks explicit cross-region validation**  
  Replicas are listed, but there's no validation or post-provision check to confirm the global table has active replicas in both regions (the prompt demanded cross-region replication guarantees and operational validation).

- **Error/alert thresholds and alarm configuration too generic**  
  Alarms are created with low-level thresholds (e.g., threshold=1) but the prompt required specific SLO/alert behavior and sensible thresholds; there's no grouping/notification targets (SNS) tied to alarms for operational alerting.

- **Hardcoded example CIDRs / non-configurable values**  
  Several values (region checks, names, CIDRs used elsewhere in other modules) are hardcoded rather than passed via config — reduces reusability and violates "modular, configurable" requirement.

- **Packaging / asset handling and CI readiness not addressed**  
  Lambdas reference local FileArchive paths but there's no CI / packaging guidance for reproducible artifacts (native deps, deterministic builds), which is important for production multi-region deployments.
