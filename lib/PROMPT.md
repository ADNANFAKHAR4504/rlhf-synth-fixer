You're an expert Pulumi engineer. Build a highly available, secure, multi-region AWS environment using Pulumi Python. Only edit these three files:

- lib/tap_stack.py - main Pulumi stack with all resource code
- tests/unit/test_tap_stack.py - unit tests with mocks
- tests/integration/test_tap_stack.py - integration tests with mocks

Don't touch anything else. If you need a variable, use Pulumi config with sensible defaults.

## High-level Goal

Create "IaC - AWS Nova Model Breaking" - a production-ready, multi-region AWS setup with VPCs, autoscaling compute, managed DB with PITR, IAM roles, monitoring, encryption, tagging, and logging.

## Required Inputs

Replace these when running:
- TeamName - team prefix like Nova
- Environment - prod, stg, or dev
- AWS_REGIONS - comma-separated list of at least 3 regions like us-east-1,us-west-2,eu-west-1

Also need Pulumi config: projectName = "IaC - AWS Nova Model Breaking" and AWS credentials in the environment.

## Naming & Tagging

Strict format: TeamName-Environment-ServiceName. Example: Nova-prod-vpc

Every resource needs these tags:
- Owner
- Purpose
- Environment

Tag everything that supports it: EC2, ASG, RDS, S3, ALB, CloudWatch Log Groups, you name it.

## Multi-Region Design

Deploy networking and at least one compute stack across 3+ regions. Use the same naming pattern everywhere like Team-Env-vpc-region where it makes sense.

Design for failover - the app should be able to fail over between regions. DNS or ALB-level failover works, stub out the DNS config if Route53 isn't included.

## Networking

Per region:
- Custom VPC with public and private subnets across at least 2 AZs
- NAT gateways or instances for private subnet outbound - avoid single points of failure
- Route tables separating public/private traffic
- Security groups with least-privilege rules
- Restrict SSH/RDP to an allowed IP CIDR from Pulumi config
- Open app ports only as needed

## Compute

Use managed autoscaling compute:
- Auto Scaling Group with Launch Template is preferred - or EKS/managed compute if you choose
- Must autoscale on CPU/network thresholds
- At least one ASG per region with Launch Template using an AMI from config
- Scale up/out when CPU > 60% for X minutes, scale down on low utilization
- Launch instances into private subnets behind a load balancer
- Put public ALB in public subnets
- Wire up health checks between ALB and targets

## Data Persistence

Use managed database with automated backups and PITR:
- Amazon RDS Multi-AZ is preferred - or Aurora Global DB
- Enable storage encryption with KMS
- Automated backups retention configurable
- Multi-AZ failover enabled
- PITR enabled
- Snapshot retention and backup window configurable via Pulumi config

## Security & IAM

- IAM roles and policies with least privilege for compute, database access, and logging
- Use managed policies where appropriate, inline policies only when necessary
- Encryption at rest: EBS, RDS
- Encryption in transit: ALB HTTPS listener - provide self-signed cert if ACM isn't available, prefer ACM with region-aware issuance
- Security Groups restrict traffic to authorized CIDR ranges from Pulumi config
- DDoS protection: attach AWS Shield Advanced if allowed, otherwise enable WAF rules - at least show WAF web ACL attached to ALB

## Observability & Logging

- CloudWatch logs for compute and load balancers
- CloudWatch log groups with retention configurable
- CloudWatch dashboards or at least metrics and alarms for CPU, network, ALB target health, and DB metrics
- SNS topic and alarms for critical thresholds
- Log groups and S3 buckets encrypted and properly tagged

## CI/CD & Automation

Provide a CI/CD skeleton as comments in lib/tap_stack.py showing GitHub Actions workflow that:
- Runs unit tests
- Runs pulumi preview and pulumi up --yes with safe policies
- Shows how secrets and AWS creds are injected via GitHub Actions secrets

Keep the actual pipeline file out of repo changes - just include a clear, ready-to-paste workflow snippet in comments.

## Cost & Compliance

- Use managed services: RDS, ALB, CloudWatch
- Add cost-control guardrails: tags for cost center, configurable min and max instance counts for ASGs
- GDPR/HIPAA controls: encryption enabled, restrict public access to data stores, enable CloudTrail audit logs with encryption

## Tests & Acceptance

Update both test files so CI can validate:

**Unit tests** - tests/unit/test_tap_stack.py

Import the Pulumi program and assert logical properties without creating real AWS resources. Use pulumi.runtime.set_mocks:
- Assert resource names match TeamName-Environment-ServiceName pattern
- Assert tags Owner, Purpose, Environment exist on VPC, ASG/compute, and DB resources
- Assert DB has encryption and backup/PITR config fields set
- Assert AutoScalingGroup resource exists and has scaling policy attached
- Assert security groups restrict SSH to configured CIDR
- Tests must run quickly and deterministically

**Integration tests** - tests/integration/test_tap_stack.py

Use Pulumi Mocks to simulate resources and validate wiring like ALB target group registered with autoscaling group:
- Validate at least 3 region stacks exist with consistent naming and tagging
- Don't call AWS APIs - run with Pulumi test mocks
- Tests must fail if strict naming/tagging requirements aren't met

Tests must run locally with pytest and pulumi package installed. Assert concrete fields to catch regressions.

## Code Organization

- All resource code in lib/tap_stack.py as TapStack class or function that returns/exports resources
- Keep logic modular with helper functions in the same file - no new modules
- Use typed Pulumi resource options
- Validate Pulumi config at startup - fail fast with clear error messages
- Single-file stack implementation, minimal extra imports, don't modify package.json

## Edge Cases & Safety

- If fewer than 3 regions provided, fail with clear error
- If required Pulumi config missing - team, environment, allowed CIDR - raise config error with instructions
- Use safe defaults for scaling and instance counts: min=1, max=3
- No hard-coded credentials or secrets

## Output Format

Return only the three modified files' contents with clear file path headers like === lib/tap_stack.py ===

No narrative explanation. Only brief inline comments where helpful.

Unit and integration tests run with pytest using Pulumi mocks.

Final lib/tap_stack.py must define an entrypoint Pulumi expects - creating TapStack() or exporting outputs so pulumi preview/up works.

## What I'll Check

- Stack deploys logically in mocks and passes unit tests
- Names strictly follow TeamName-Environment-ServiceName
- Tags Owner, Purpose, Environment on core resources
- VPC with public/private subnets in 3+ regions and 2+ AZs per region
- Compute autoscales behind ALB with health checks and scaling policies
- DB is RDS-like with encryption, PITR, backups enabled
- IAM roles/policies with least privilege
- CloudWatch logging/alarms/dashboards or skeletons created
- CI/CD workflow snippet in comments
- Tests deterministic, fast, and pass with mocks

## Example Config

Put these in Pulumi config or environment:
- teamName = "TeamName"
- environment = "Environment"
- aws:regions = "AWS_REGIONS" - comma-separated
- allowed_ssh_cidr = "203.0.113.0/32" - must be set
- db_backup_retention_days = 7

## Final Note

If anything's ambiguous, fail with explicit config error in the Pulumi program rather than guessing.

Only produce code for the three files listed. Don't produce or modify cloud config, GitHub workflow files, or other repo files - just include a commented CI skeleton inside lib/tap_stack.py.
