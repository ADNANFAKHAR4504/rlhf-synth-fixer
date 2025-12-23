You are an expert Pulumi engineer. Produce a single Pulumi implementation in Python that meets the high-availability, security, compliance, and automation requirements below. You must only edit these three files in the repository:

lib/tap_stack.py — the Pulumi stack implementation (the only file that can contain resource code)

tests/unit/test_tap_stack.py — unit tests (must be updated/created to validate logic)

tests/integration/test_tap_stack.py — integration tests (must be updated/created to validate resource wiring)

DO NOT modify any other files (no package.json, no repo-level config changes). If a required variable is missing, declare it as a Pulumi config variable and use sensible defaults.

1) High-level goal (one sentence)
Create a highly available, secure, multi-region AWS environment named IaC - AWS Nova Model Breaking using Pulumi (Python), implementing VPCs, subnets, autoscaling compute, managed DB with PITR & backups, IAM roles, monitoring, encryption, tagging, logging, and a CI/CD-friendly deployment layout.

2) Required inputs (replace placeholders when running)
<TeamName> — team prefix (e.g., Nova)

<Environment> — env name (e.g., prod, stg, dev)

<AWS_REGIONS> — comma-separated list of at least three AWS regions (e.g., us-east-1, us-west-2, eu-west-1)

Pulumi config or env: projectName = "IaC - AWS Nova Model Breaking" and required AWS credentials must be available in the environment.

3) Naming & tagging rules (strict)
All resources must follow naming format: <TeamName>-<Environment>-<ServiceName>. Example: Nova-prod-vpc.

Each resource must include tags: Owner, Purpose, Environment.

Use tags on every supported managed resource (EC2, ASG, RDS, S3, ALB, CloudWatch Log Groups, etc.).

4) Regions & multi-region design
Deploy required networking (VPC and subnets) and at least one compute stack across three or more specified regions.

Use the same logical naming and config across regions (e.g., <Team>-<Env>-vpc-<region> where helpful).

Plan for failover: design the architecture so the application can fail over between regions (DNS or ALB-level failover is acceptable; stub DNS config if Route53 is not created).

5) Networking
Create a custom VPC per-region with both public and private subnets across at least two AZs per region.

NAT gateways (or NAT instances) for private subnet outbound access (minimize single points of failure).

Route tables to separate public/private traffic.

Security groups: least-privilege rules; restrict SSH/RDP to an allowed IP CIDR input (Pulumi config), open app ports only as required.

6) Compute
Use managed/autoscaling compute:

Preferred: Auto Scaling Group + Launch Template (or EKS/managed compute if chosen). Must be autoscaling on CPU/network thresholds.

Minimum: one ASG per region with a Launch Template that uses an AMI from config. Use scaling policies (scale up/out on CPU > 60% for X minutes, scale down on low utilization).

Ensure instances are launched into private subnets behind a load balancer (ALB), with public ALB in public subnets.

Health checks wired between ALB and targets.

7) Data persistence
Use a managed database service with automated backups and point-in-time recovery (PITR):

Preferred: Amazon RDS (Multi-AZ) for relational DB (or Aurora Global DB if chosen).

Enable storage encryption (KMS), automated backups retention (configurable), multi-AZ failover, and PITR.

Snapshot retention and backup window configurable via Pulumi config.

8) Security & IAM
Create IAM roles and policies with principle of least privilege for compute services, database access, and logging.

Use managed policies only where appropriate and put inline policies only when necessary.

Enforce encryption at rest (EBS, RDS) and in transit (ALB HTTPS listener; provide self-signed cert if ACM or real cert not available — prefer ACM with region-aware issuance).

Define Security Groups to restrict traffic to authorized CIDR ranges (configurable via Pulumi config).

Add DDoS protection recommendations: attach AWS Shield Advanced if allowed, otherwise enable WAF rules (at least show WAF web ACL attached to ALB).

9) Observability & logging
Enable CloudWatch logs for compute and load balancers; create CloudWatch log groups with retention (configurable).

Create CloudWatch dashboards (or at least metrics and alarms) for CPU, network, ALB target health, and DB metrics. Add SNS topic and alarms for critical thresholds.

Ensure log groups and S3 buckets (if any) are encrypted and properly tagged.

10) CI/CD & automation
Provide a CI/CD skeleton (GitHub Actions workflow file content as a comment in lib/tap_stack.py) that:

Runs unit tests

Runs pulumi preview and pulumi up --yes with safe policies (use Pulumi stack selections and environment variables)

Shows how secrets (Pulumi config) and AWS creds are injected via GitHub Actions secrets

Keep actual pipeline file out of repo changes, but include a clear, ready-to-paste workflow snippet in comments.

11) Cost & compliance guards
Use managed services where possible (RDS, ALB, CloudWatch).

Add cost-control guardrails (tags for cost center, allow configurable minimum and maximum instance counts for ASGs).

Include controls for GDPR/HIPAA: enable encryption, restrict public access to data stores, and enable CloudTrail (audit logs) with encryption.

12) Tests & acceptance criteria (exact)
Implement or update the two test files so CI can validate the Pulumi program:

Unit tests (tests/unit/test_tap_stack.py)
Should import the Pulumi program and assert logical properties (do not create real AWS resources). Use Pulumi's pulumi.runtime.set_mocks so tests run locally without AWS:

Assert resources created have names matching <TeamName>-<Environment>-<ServiceName> pattern.

Assert tags Owner, Purpose, Environment exist on at least VPC, ASG/compute, and DB resource objects.

Assert that the DB resource has encryption and backup/PITR configuration fields set.

Assert that an AutoScalingGroup (or equivalent) resource is configured and has a scaling policy attached.

Assert that security groups restrict SSH to the configured CIDR.

Tests must run quickly and deterministically.

Integration tests (tests/integration/test_tap_stack.py)
Use Pulumi’s Mocks but simulate more of the resources to validate wiring (e.g., ALB target group registered with autoscaling group).

Validate that at least three region stacks (or region-dependent resources) are represented and have consistent naming and tagging.

The integration tests should not actually call AWS APIs — run with Pulumi test mocks to emulate outputs.

Integration tests must fail if any strict naming/tagging requirement is not met.

Important: Tests must be runnable locally with pytest and the pulumi package installed. Make sure tests assert concrete fields so they catch regressions.

13) Code organization & style
All resource code must live in lib/tap_stack.py as a single TapStack class or function that returns/exports resources (follow project conventions).

Keep logic modular with helper functions inside the same file (no new modules).

Use typed Pulumi resource options and validate Pulumi config at startup (fail fast with human-readable messages).

Respect the user’s preference: single-file stack implementation, minimal extra imports, no modifications to package.json.

14) Edge cases & safety
If fewer than 3 regions are provided, fail with a clear error message.

If required Pulumi config (team, environment, allowed CIDR) missing, raise a configuration error with instructions.

Use safe defaults for scaling thresholds and instance counts that are cost-conscious (e.g., min=1, max=3).

Do not include any hard-coded credentials or secrets.

15) Output format and delivery rules for the assistant
Return only the three modified files' contents, clearly labeled with file path headers (e.g., === lib/tap_stack.py ===), no other files.

Do not provide narrative explanation. Only include brief inline comments in the code where helpful.

Ensure unit and integration tests run with pytest and use Pulumi mocks.

The final lib/tap_stack.py must define an entrypoint that Pulumi expects (e.g., creating TapStack() or exporting outputs so pulumi preview/up works).

16) Evaluation/QA checklist (what I will check)
 Stack deploys logically in mocks and passes unit tests with Pulumi mocks.

 Names strictly follow <TeamName>-<Environment>-<ServiceName>.

 Tags Owner, Purpose, Environment exist on core resources.

 VPC with public/private subnets created in ≥3 regions and ≥2 AZs per region.

 Compute is autoscaling behind an ALB with health checks and scaling policies.

 DB is RDS-like with encryption, PITR, backups enabled.

 IAM roles/policies created with least privilege patterns.

 CloudWatch logging/alarms/dashboards or skeletons created.

 CI/CD workflow snippet included as a comment.

 Tests deterministic, fast, and pass with Pulumi mocks.

17) Example minimal Pulumi config (for runner)
Place these in Pulumi config or environment when running:

teamName = "<TeamName>"

environment = "<Environment>"

aws:regions = "<AWS_REGIONS>" (comma-separated)

allowed_ssh_cidr = "203.0.113.0/32" (example — must be set)

db_backup_retention_days = 7

Final note to the assistant (strict)
If anything is ambiguous, fail with an explicit configuration error in the Pulumi program rather than guessing.

Only produce code for the three files listed. Do not produce or modify cloud config, GitHub workflow files, or other repo files — only include a commented CI skeleton inside lib/tap_stack.py.

