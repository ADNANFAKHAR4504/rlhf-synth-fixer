Environment:
The target infrastructure involves two environments, one in 'us-east-1' (Virginia) and another in 'eu-central-1' (Frankfurt). Resources must be deployed consistently across these regions, enforcing deterministic behavior, while still allowing conditional divergence for region-specific compliance, failover, and regulatory constraints. All deployments must adhere strictly to both centralized and environment-specific policies, even when they conflict at the module or provider level.

projectName: IaC - AWS Nova Model Breaking

Constraints Items:
Ensure no cross-region traffic for resources, except globally-distributed services and services with latency thresholds under 100ms, provided traffic does not persist outside local state contexts.

All configurations must use local state storage due to security policies, but must also allow shared drift detection logic and state locking across regions without using remote backends.

Separate environments must follow the exact same networking design principles while using distinct, non-overlapping VPC CIDR blocks and synchronized route propagation behaviors.

Deploy infrastructure only in us-east-1 and eu-central-1, but ensure modules are region-agnostic and can be hot-swapped into any AWS region without introducing changes to current infrastructure.

Ensure consistent IAM role configurations across environments, while supporting regional override blocks and conditional logic based on trust boundaries unique to each region.

Use CDK for Terraform (CDKTF) modules written in Python to abstract reusable infrastructure, while supporting deep module overrides, dependency injection, and mutable environment behavior.

Enforce strict environment-specific tagging across all resources, including those dynamically created during plan-time evaluation and nested module instantiations.

Apply access logging settings for all S3 buckets and CloudFront distributions, ensuring region-specific replication configurations do not violate the no-cross-region rule.

All RDS instances must have automated backups (7-day retention) and enforce both immutable snapshot scheduling and manual backup locking, even across failover scenarios.

Utilize KMS for encryption of sensitive data in transit and at rest, while enabling audit replication of keys between regions without allowing key usage outside the origin region.

Enable VPC flow logs in all environments and centralize log ingestion to a third region (e.g., af-south-1) without violating security constraints or introducing direct traffic.

Maintain configuration file separation for each environment, with a unified core construct library and consistent naming enforcement across dynamically loaded modules.

Restrict SSH access to EC2 instances via SSM only, ensuring CloudTrail trails capture all session metadata across both environments using regionless observability rules.

Use cdktf synth and cdktf diff before applying changes and enforce symmetrical diff parity between regions, even if infrastructure changes are environment-specific.

Set up CloudWatch alarms with deterministic threshold evaluation that supports alarm deduplication across environments, without creating suppression windows or alert gaps.

Apply strict security group rules minimizing open ports and CIDR ranges, while supporting peer-to-peer traffic within the same environment using abstracted networking constructs.

No hardcoding of sensitive information; use a secret management strategy that supports dynamic secret versioning per environment and injects secrets at plan time without storing them in code.

Use SNS notifications for any infrastructure change triggered through CDKTF, ensuring topic subscriptions are regionally unique but globally consistent in behavior.

Problem Difficulty: hard

Proposed Statement:
Your goal is to design and implement a multi-environment infrastructure setup using CDK for Terraform with Python, ensuring architectural consistency and security compliance while navigating ambiguous, conflicting, and conditional constraints. Specifically:

Both environments in 'us-east-1' and 'eu-central-1' must mirror VPC and networking configurations using reusable CDKTF modules, while preventing shared CIDR overlaps and supporting future hot-swap to any AWS region.

IAM roles must be designed for least privilege access, maintain structural consistency across regions, and include override logic for trust and scope deviations.

All S3 buckets and RDS backups must be encrypted and logged, with monitoring rules that account for region-specific behaviors while maintaining audit trail integrity.

Infrastructure as code must enforce no cross-region communication except for qualified low-latency global resources, without violating local execution boundaries or Terraform plan idempotency.

Secure instance access must exclude all public key usage and rely solely on regionless SSM session controls and auditable logging pipelines.

Employ cdktf synth and cdktf diff to confirm the infrastructure's shape and behavior prior to deployment, and generate environment parity reports for validation purposes.

Expected output:
You should provide a set of CDK for Terraform (CDKTF) configuration files written in Python, capable of producing the described infrastructure setup consistently across the specified regions. Your solution must demonstrate advanced configuration practices, such as multi-environment separation, secure secret injection, compliance enforcement, and logical diff parity—testable via cdktf synth, cdktf diff, and cdktf deploy.