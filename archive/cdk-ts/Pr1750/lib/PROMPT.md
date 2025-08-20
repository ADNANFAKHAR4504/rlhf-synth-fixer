Goal: Generate a production-ready AWS CDK v2 (TypeScript) app for a security-centric environment named “IaC - AWS Nova Model Breaking”.
Important: Do not include AWS Config rules or CloudTrail anywhere in the solution.
Repo layout:

bin/tap.ts — CDK app entry that synthesizes a single stack.

lib/tapstack.ts — main stack implementation.

test/tapstack.test.ts — Jest tests.

Root has standard CDK project files (package.json, cdk.json, tsconfig.json, jest.config.js, etc.).

General requirements:

Use CDK v2 (aws-cdk-lib, constructs).

Region: us-east-1.

Stack name: TapStack. App name/project: “IaC - AWS Nova Model Breaking”.

Apply least-privilege IAM everywhere. No wildcard * permissions unless absolutely unavoidable, and then scope by resource + condition keys.

Tag all resources with:

Project=IaC - AWS Nova Model Breaking

Owner=Security

Environment=prod

Use SSM Parameter Store for any sensitive values (e.g., API keys). Do not hardcode credentials or secrets.

Provide clear CDK context/props to let me override names and network CIDRs without code changes.

Include helpful README notes (in comments) inside files explaining how to bootstrap/deploy and where to put SSM parameters.

Networking (VPC & Security Groups):

Create one VPC spanning three AZs in us-east-1.

Include public & private subnets with NAT gateways minimized (1 NAT per AZ or cost-optimized single NAT—make this a stack prop).

Create highly restrictive Security Groups:

Default egress = DENY (no wide-open 0.0.0.0/0 egress).

Allow only essential traffic between specific SGs and/or required AWS endpoints (S3, SSM, Logs, STS, etc.).

Provide at least one example SG that allows inbound HTTPS (443) from a configurable CIDR list and nothing else.

Add Interface/ Gateway VPC Endpoints for SSM, SSM Messages, EC2 Messages, S3, CloudWatch Logs, and KMS so private subnets can reach managed services without public egress.

S3 Security (Public Access Block & Encryption):

Create a secure S3 bucket for central app logs (can be reused by API Gateway and other services).

Enforce block public access (all four settings = true) and default encryption (SSE-S3; expose a prop to toggle SSE-KMS with a CMK).

Add a bucket policy to explicitly deny PutObject without encryption and to deny any public ACL/Policy.

IAM (least privilege + MFA enforcement):

Create a managed IAM policy that denies all actions when MFA is not present using "Bool": {"aws:MultiFactorAuthPresent": "false"} (Deny) with an exceptions list for necessary auth flows (e.g., iam:ListUsers if needed).

Attach that policy to an IAM Group (e.g., AllUsersRequireMFA).

Add minimal example IAM roles for:

A CI/CD deployment role limited to CDK deploy actions in this account/region with least privilege.

A read-only auditor role with limited Describe/List/Get permissions across key services.

Where IAM policies are required for service integrations (e.g., API Gateway logging), scope them to specific resources via ARNs.

GuardDuty (all regions):

Enable Amazon GuardDuty across all available regions.

Implement using a custom resource (Lambda-backed) that enumerates active regions and creates/updates GuardDuty detectors with enable=true.

Include idempotency and safe updates; the custom resource must be least privilege and only call GuardDuty APIs it needs.

Output the primary region detector ID.

AWS Systems Manager Parameter Store:

Read sensitive inputs (like an ApiKey) at deploy/runtime from SSM Parameter Store (SecureString preferred).

Reference them in constructs (e.g., API Gateway usage plan key or Lambda env var).

Provide stack props / context to specify the parameter names; validate existence via parameters or CloudFormation conditions.

API Gateway + CloudWatch Logs:

Create a REST API (minimal sample) with:

Stage-level access logging enabled to a dedicated CloudWatch Log Group, with retention set (e.g., 90 days) and resource policies as needed.

Execution logging and detailed metrics enabled.

Example method (GET) integrated with a mock or minimal Lambda.

Ensure the API role/permissions for logging are least-privilege and restricted to the specific log group.

Testing (Jest):

Add CDK assertions tests in test/tapstack.test.ts that verify:

VPC spans 3 AZs with expected subnets.

Security Groups have no wide-open egress and tightly scoped ingress.

S3 buckets have Block Public Access = true and default encryption enabled.

GuardDuty custom resource is present and configured.

API Gateway logging is enabled and a dedicated Log Group exists with retention.

IAM MFA deny policy exists and is attached to the AllUsersRequireMFA group.

Outputs:

Export VPC ID, private/public subnet IDs, API ID & Invoke URL, logging bucket name, API log group name, and GuardDuty detector ID for the primary region.

Non-functional & Quality:

No hardcoded ARNs/IDs—derive where possible.

Strong inline documentation comments explaining sensitive choices & how to extend safely.

All constructs follow AWS security best practices by default.

Deliverables:

bin/tap.ts (CDK app), 2) lib/tapstack.ts (main stack), 3) test/tapstack.test.ts (assertions), plus standard CDK project scaffolding.

Explicitly do NOT include:

AWS Config rules or recorders.

AWS CloudTrail (trails, org trails, event selectors, or related artifacts).

After generation: include brief inline comments with commands for: npm install, cdk bootstrap, cdk synth, and cdk deploy, and how to create required SSM parameters beforehand (names are props).