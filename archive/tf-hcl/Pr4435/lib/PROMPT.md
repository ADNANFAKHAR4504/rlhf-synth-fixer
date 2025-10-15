# AWS Infrastructure Security & Compliance Requirements

We are moving to a multi-account, multi-region AWS setup and need to define our infrastructure as code using Terraform. The goal is to ensure our AWS environments (development, staging, production) are secure, compliant, and auditable.

## Requirements

- All S3 buckets must be private, versioned, encrypted with KMS, and tagged with `Environment`, `Owner`, and `CostCenter`. Only allow access from approved IP ranges.
- IAM roles should restrict access by IP where possible and follow least privilege.
- Enable CloudTrail in all regions for API logging. Set up alarms for failed logins and suspicious activity.
- WAF must have logging enabled.
- EC2 instances should use the latest AMIs and be properly tagged.
- RDS must not be publicly accessible and must enforce SSL.
- Lambda functions must run in a VPC with restricted subnets and have concurrency limits.
- API Gateway endpoints must require IAM authorization.


## Implementation

- Deliver a single Terraform file (`tap_stack.tf`) that creates all required AWS resources (no provider or backend blocks).
- The configuration should be region-agnostic and support multi-region deployment.
- Ensure all services are connected as needed (e.g., Lambda in VPC can reach RDS).
- All resources must meet the security, tagging, and compliance requirements above.
- The configuration should pass automated validation and integration tests.

_Category: Security Configuration as Code_