Failures in modules.ts

Hard-coded AZs and CIDR blocks

Public/private subnets are tied to us-west-2a and us-west-2b. This breaks portability and HA across regions.

CIDRs are static, not configurable via variables.

Unstable S3 bucket name

Uses Math.random() → every synth/apply produces a new bucket name → drift, resource re-creation, and failed updates.

Production should use deterministic names with TerraformVariable or a hash.

IAM Role/Policy anti-patterns

Custom policy directly references sensitive KMS + S3 actions but no least privilege principle.

Missing AWS managed policies like AmazonSSMManagedInstanceCore for EC2 → can’t use SSM Session Manager (more secure than SSH).

Security group ingress is unsafe

Allows port 22 (SSH) from arbitrary allowedIpRanges.

Best practice → remove SSH entirely, rely on SSM.

RDS Database credentials

Passed directly via config.dbUsername and config.dbPassword.

Should be sourced from Secrets Manager or SSM Parameter Store.

Storing in plain variables is insecure and non-compliant.

Monitoring gaps

Only CPU and memory alarms.

No storage, network, or availability checks.

No SNS notifications for alarms.

EC2 setup issues

Uses a single EC2 instance (not in ASG or behind ALB) → not highly available or scalable.

userData starts CloudWatch agent but doesn’t configure proper logging.

Missing ALB/NLB → app is exposed directly on EC2’s public IP.

Failures in tap-stack.ts

Invalid variable validation

Broken conditional logic

Provider default tags wrong type

Region hard-coded

Always us-west-2. Should allow multi-region support via variables for portability.

Outputs missing critical values

No output for ALB DNS, private subnet IDs, or KMS key ARN.

These are essential for app integration and troubleshooting.