You are an expert DevOps engineer. Implement the following AWS infrastructure and CI/CD pipeline logic using Pulumi with Python. Only edit these three files:

lib/tap_stack.py - infrastructure code for Pulumi stack

tests/unit/test_tap_stack.py - Pulumi mocks-based unit tests

tests/integration/test_tap_stack.py - Pulumi mocks-based integration tests

Do not touch other files including README or GitHub workflow files. If the pipeline configuration is needed, include it as a comment in lib/tap_stack.py.

1) Objective
Build a production-grade CI/CD-enabled AWS infrastructure using Pulumi with Python, fully deployable in us-east-1, with rollback capabilities, monitoring, security, and high availability.

2) Hard requirements
Region: us-east-1

Programming: Python with Pulumi SDK

CI/CD: GitHub Actions pipeline

Must include:

Linting & syntax validation of Pulumi templates before deploy

Unit & integration tests

Auto-deploy to production on merge to main

Rollback on failed deployment

Notifications to Slack using Webhook URL from GitHub Secret

AWS credentials stored in GitHub Secrets: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY

PR checks for all infra changes before merge

Infrastructure:

VPC in at least two AZs for high availability

Security groups with least privilege rules

S3 bucket with cross-region replication to a secondary region

CloudWatch monitoring for all major components

Logging enabled on all resources

Tags: every resource must have environment: production

Compliance & security:

Restrict inbound access by configurable CIDR from Pulumi config

Enable encryption at rest using KMS or AWS-managed keys, and in transit

Store logs in encrypted CloudWatch log groups

Ensure S3 replication target bucket has encryption enabled

Rollback:

Pipeline must revert to last known working infrastructure state on failure. Comment a workflow snippet showing how to pulumi cancel and re-deploy last commit.

3) Tests
Unit tests in tests/unit/test_tap_stack.py
Must run with pytest and Pulumi mocks

Assert:

VPC exists with at least 2 subnets in distinct AZs

Security group rules match CIDR from config

S3 bucket has replication and encryption enabled

All resources have environment: production tag

CloudWatch log groups exist and are encrypted

Integration tests in tests/integration/test_tap_stack.py
Run with Pulumi mocks but validate wiring between resources

Assert:

Replication is set from primary S3 bucket to secondary region bucket

Security group attached to correct resources

VPC subnets mapped to correct AZs

Rollback simulation test passes when mock rollback triggered

4) Delivery format
Output must only include:

=== lib/tap_stack.py ===

=== tests/unit/test_tap_stack.py ===

=== tests/integration/test_tap_stack.py ===

No additional narrative, only inline comments for clarity

Code must pass pytest locally without AWS calls using Pulumi mocks only

5) Extra implementation rules
Single-file lib/tap_stack.py with modular helpers inside the file

Fail fast if required Pulumi config like allowed_cidr or replication_region is missing

Default replication region: us-west-2, can be overridden

Commented GitHub Actions pipeline snippet showing:

Lint → Test → Preview → Deploy → Notify → Rollback

Minimal imports; do not modify dependency files

Ensure reproducibility and deterministic test results
