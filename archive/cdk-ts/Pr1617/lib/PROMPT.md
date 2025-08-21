You are generating an AWS CDK v2 (TypeScript) project for the repository structure:

bin/tap.ts – CDK app entrypoint

lib/tapstack.ts – main stack (export class TapStack)

test/ – snapshot/unit tests using aws-cdk-lib/assertions

Important constraints

Do NOT include AWS Config rules or CloudTrail anywhere in the solution. Exclude them entirely.

Use AWS CDK v2 (aws-cdk-lib and constructs) and TypeScript.

Target region us-east-1. Name the app and stack from projectName: “IaC - AWS Nova Model Breaking”; stack id: TapStack.

Enforce least privilege across all IAM roles/policies.

All security groups must be highly restrictive: default no egress, and only add the minimum required ingress/egress rules.

Multi-AZ VPC spanning three AZs, with isolated and private subnets, plus VPC endpoints for common services to keep traffic private.

GuardDuty must be enabled in all AWS regions used by the account (implement via a CDK pattern that creates regional stacks or a custom resource pattern—choose a production-safe approach that does not rely on Organization admin). Make the home region us-east-1.

Use AWS Systems Manager Parameter Store (SecureString) for sensitive values; create a KMS CMK for encryption; do not hardcode secrets.

All S3 buckets created by this stack must have:

Block Public Access = Block All (true)

Default encryption (SSE-KMS with the CMK above)

Bucket policies to deny unencrypted uploads and non-TLS access

Versioning enabled and a basic lifecycle rule for noncurrent versions

Implement MFA enforcement for all IAM users via:

An account password policy (strong complexity, rotation)

An IAM policy attached to an IAM group (e.g., MfaRequiredGroup) that denies all actions unless aws:MultiFactorAuthPresent is true, with safe exceptions to allow users to enroll/activate virtual MFA and change password.

Provide guidance comments on attaching users to this group (do not create real users).

Provide a sample Amazon API Gateway (REST) integrated with a minimal Lambda to demonstrate access logging and execution logging in CloudWatch Logs:

Create and configure a Log Group with a retention period.

Enable access logging with a structured JSON format and detailed metrics on all stages.

Ensure Lambda has the minimum IAM permissions (logging, VPC if needed).

Add VPC endpoints (Interface and/or Gateway) for: SSM, SSM Messages, EC2 Messages, CloudWatch Logs, CloudWatch, KMS (interface), S3 (gateway), DynamoDB (gateway). Ensure security groups for interface endpoints only allow required traffic from private subnets.

Tag all resources with:

Project = IaC - AWS Nova Model Breaking

Owner = Platform

Environment = SecurityBaseline

Deliverables (match this repo layout and naming):

bin/tap.ts

Standard CDK app bootstrap that instantiates TapStack in us-east-1.

Accept projectName as context (default to “IaC - AWS Nova Model Breaking”).

lib/tapstack.ts (the majority of the implementation) including:

VPC across 3 AZs, with isolated/private subnets, no public subnets, NAT usage minimized (explain choice in comments).

Strict security groups:

Default deny all egress; explicitly allow only what’s necessary (e.g., to VPC endpoints).

No wide-open ingress.

KMS CMK for Parameter Store and S3 encryption (key policy least-privilege; allow necessary service principals).

SSM Parameter Store SecureString parameters for placeholders like /nova/api/secrets/dbPassword (do not hardcode values).

S3: at least one bucket for centralized logs/artifacts with blockPublicAccess=BLOCK_ALL, SSE-KMS, versioning, lifecycle, and deny policies for aws:SecureTransport and server-side encryption conditions.

IAM:

Account password policy.

IAM group MfaRequiredGroup with a deny-all-unless-MFA policy (include exceptions for iam:*MFADevice*, iam:CreateVirtualMFADevice, iam:EnableMFADevice, iam:ListMFADevices, iam:ChangePassword, and sts:GetSessionToken).

Permission boundaries/example inline policies kept minimal; roles for Lambda/API only with strictly required actions.

API Gateway + Lambda:

REST API with a /health resource integrated to the Lambda.

Stage logging: access logging enabled (JSON format), execution logging on, metrics enabled.

CloudWatch Log Group for access logs with set retention.

IAM role/policy for API Gateway to publish logs (least privilege).

VPC Endpoints for SSM, SSM Messages, EC2 Messages, CloudWatch, CloudWatch Logs, KMS, plus S3 and DynamoDB gateways; attach endpoint SGs to allow only VPC traffic from private subnets.

GuardDuty (multi-region):

Enable a Detector in us-east-1.

Also enable Detectors in a list of major commercial regions using a safe CDK pattern (e.g., Stack.of(this).regionalResources pattern or a CustomResource backed by a Lambda that iterates active regions).

Do not rely on AWS Organizations admin delegation—assume a single-account setup.

Outputs for VPC ID, private subnet IDs, API endpoint URL, S3 bucket name, and KMS key ARN.

Apply global tags listed above.

test/tapstack.test.ts

Assertions that:

S3 buckets have BlockPublicAccess, SSE-KMS, versioning, and deny policies for non-TLS and unencrypted puts.

API Gateway stage has access logging and metrics enabled; there is a dedicated Log Group.

Security groups default no egress.

GuardDuty Detector resource exists (at least in us-east-1).

IAM account password policy exists.

IAM group with MFA enforcement deny policy exists.

Quality, security, and style requirements

No wildcard (“*”) permissions unless absolutely unavoidable; justify in comments if used.

Use constructs and helper functions to keep tapstack.ts clear and maintainable.

Add explanatory comments for every security-critical choice.

Ensure synthesized template passes basic cdk-nag style concerns (add suppressions only with justification comments).

Prefer private subnets + endpoints over internet egress.

Ensure API execution role, Lambda role, and endpoint SGs are least privilege.

Do not include any AWS Config resources or CloudTrail resources.

What to output

Provide the complete TypeScript source files for bin/tap.ts, lib/tapstack.ts, and test/tapstack.test.ts, plus any minimal package.json, tsconfig.json, and cdk.json required to run.

Include build/run notes: npm install, npx cdk bootstrap, npx cdk synth, npx cdk deploy.

Do not include any placeholder secrets; rely on the Parameter Store.

Keep all code compatible with Node.js 18+.

Ensure the stack deploys cleanly in us-east-1.

Reminder: Exclude AWS Config and CloudTrail entirely.