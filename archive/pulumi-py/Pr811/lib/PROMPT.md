You are an expert Pulumi + AWS engineer. Build a Pulumi Python implementation that provisions a high-availability, multi-region web application infrastructure meeting the exact requirements below. Work only inside these three files and nowhere else:

lib/tap_stack.py

tests/unit/test_tap_stack.py

tests/integration/test_tap_stack.py

Project: IaC - AWS Nova Model Breaking

High-level objectives
Deploy identical infrastructure in us-east-1 and eu-west-1 that can serve production web traffic.

Each region must have an Application Load Balancer (ALB) distributing traffic across at least three EC2 instances deployed across multiple Availability Zones (spread across at least two AZs where possible).

Use Auto Scaling Groups (ASGs) per region to maintain minimum 3 healthy EC2 instances per region.

Ensure data resilience by creating an S3 bucket in each region and configuring Cross-Region Replication (CRR) so objects uploaded in either region are replicated to the other region.

Implement automated recovery: instance failures must be detected and recovered within one minute.

Follow IAM and security best practices: least privilege roles for instances and replication, secure security groups, no wide-open ports except as explicitly required.

Provide unit tests and integration tests that validate the important properties listed in the Acceptance Criteria.

Required implementation details / guidance
Use Pulumi Python idioms (class-based stack module in lib/tap_stack.py). Keep code modular and readable, but changes must be made only to the three files listed.

Create an ASG per region:

Desired/minimum capacity = 3.

Spread instances across multiple AZs in the region (availability_zones).

Health checks must use ELB health checks and Auto Scaling replacement.

Ensure health-check / grace period and CloudWatch alarms are configured so unhealthy instances are replaced quickly (within 1 minute). Implement a CloudWatch Alarm on EC2 instance status checks or ASG metrics that triggers replacement with a 1-minute evaluation window (or equivalent Auto Scaling configuration) — document why chosen mechanism guarantees recovery within 60s.

ALB per region:

Internet-facing ALB with listener(s) on port 80 and 443 (HTTPS optional — can add placeholder certificate ARN variable).

Target groups pointing to the ASG instances; health checks configured for HTTP / or /health.

Security groups: ALB security group allows inbound 80/443 from 0.0.0.0/0; instance security group allows inbound from ALB SG only and outbound as required.

S3:

Create a bucket in each region with versioning enabled and server-side encryption (SSE).

Configure Cross-Region Replication (CRR) between the two buckets using an IAM replication role with least privilege required for replication.

Ensure replication for new objects and that objects preserve ACL/metadata where appropriate.

IAM & instance profile:

Create an instance role & instance profile for EC2 with only the permissions required (S3 read/write for the app if needed, CloudWatch, and S3 replication role separate).

Create the S3 replication role (service principal s3.amazonaws.com) with the minimal policy required for CRR.

Avoid inline root-level policies. Use named policies where appropriate.

Security groups:

Instances: allow inbound only from ALB SG on app ports; allow SSH only from a placeholder ADMIN_CIDR variable (document how to set).

ALB: open 80/443 to public.

AMI / bootstrap:

Use a stable Linux AMI lookup (Amazon Linux 2) via Pulumi data lookup, or accept a variable AMI_ID with a sensible default fallback.

Provide a basic user-data script that starts a simple web server (e.g., Python http.server or nginx) and responds on /health.

Recovery within one minute:

Implement CloudWatch Alarm(s) that detect instance failure quickly (status check failed) and either:

Trigger an Auto Scaling group health replacement, or

Use a recovery action that restarts an instance (if using EC2 Auto-Recovery) — but include doc/comments explaining how the chosen approach meets the 1-minute recovery constraint.

Use 1-minute period/thresholds in the alarms. If there are AWS service constraints (minimum evaluation periods), document the exact configuration and provide reasoning that recovery time will be within 60 seconds.

Multi-region connectivity:

Keep the design simple: an ALB + ASG per region. If you include Route53 for global traffic distribution or failover, make it optional and document assumptions. (Main requirement is per-region HA + CRR for data.)

Tests:

tests/unit/test_tap_stack.py: Use Pulumi unit testing strategy (Pulumi Mocks) to validate resource shapes and key properties without provisioning. Unit tests must validate:

ASGs exist in each region with min_size = 3 (or equivalent property).

ALBs exist with listeners and target groups pointing to ASGs.

S3 buckets have versioning and replication rules (replication configuration exists and points to the peer bucket).

IAM roles exist for EC2 and replication with constrained policies.

Security groups block wide-open access (instances accept traffic only from ALB SG; ALB allows 80/443).

CloudWatch alarm(s) or ASG health check settings exist that aim at 60s recovery.

tests/integration/test_tap_stack.py: Integration tests (lighter-weight expectations) that run pulumi preview/pulumi up --dry-run style assertions or use the real Pulumi engine to ensure resources would be created. Integration tests must at least assert:

Each region would create an ALB + ASG + at least 3 instances.

S3 buckets configured with replication rules between regions.

IAM minimum privileges present.

Provide pytest-compatible tests and document how to run them. Use Pulumi's testing patterns so tests run in CI without real provisioning (mocks for unit; integration can be a preview).

Running and validation:

Explain the commands to run tests and run Pulumi previews:

pip install -r requirements.txt (assume Pulumi and pytest are in requirements)

pulumi preview -s <stack-name> --non-interactive

pytest -q

Include environment variable instructions for region and credentials (e.g., AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, ADMIN_CIDR, CERT_ARN).

Documentation & comments:

Add clear comments in lib/tap_stack.py explaining critical choices (how replication works, how recovery within 1-minute is achieved).

In tests, assert the important properties using clear messages.

Acceptance criteria (must pass)
Only the three files are changed (failing this requirement is grounds to reject).

Unit tests pass (use Pulumi mocks).

Integration test run (preview or dry-run) verifies that:

There are ASGs in both regions with min=3.

ALBs exist per region with listeners and target groups.

S3 buckets configured with versioning and cross-region replication.

CloudWatch alarm or ASG health-check config exists to ensure sub-60s recovery or replacement, with documented justification.

IAM roles use least privilege and instance roles are attached with an instance profile.

Security groups are not wide-open; SSH restricted to ADMIN_CIDR.

The code follows Pulumi best practices, is readable, and includes comments documenting any AWS limitations and why your design meets the 60s recovery constraint.

Constraints and non-goals
Do not modify any file other than the three listed.

Do not add new tests outside the two test files. You may add helper functions/classes inside lib/tap_stack.py.

You may assume credentials are provided to the Pulumi engine and environment variables are available to tests.

If you cannot absolutely guarantee 60-second recovery due to AWS limitations, implement the fastest possible automated replacement/recovery configuration and explicitly document the precise recovery timeline and reasoning.