You are tasked with creating an AWS CDK application in JavaScript (ESM) with the following project structure:

bin/tap.mjs → entry point for the CDK app

lib/tap-stack.mjs → define all infrastructure here

test/ → include placeholder test files for integration/unit tests

The CDK stack must be defined in tap-stack.mjs and meet these requirements:

All IAM roles must enforce the principle of least privilege by attaching only the required AWS managed policies.

Ensure that all Amazon S3 buckets are encrypted at rest using AES-256 or AWS KMS. All bucket names should begin with prod-sec-.

Configure logging for all Amazon API Gateway endpoints to monitor access patterns.

Enable VPC Flow Logs for all VPCs to provide security insights and monitoring.

Protect all endpoints using AWS Shield Standard for DDoS protection.

Deploy all Amazon RDS instances with encryption enabled using AWS KMS. RDS instance identifiers must be prefixed with db-.

Enforce multi-factor authentication (MFA) on all IAM console users.

Define security group rules to restrict access and allow only necessary traffic (minimize open ports).

Use AWS Systems Manager Parameter Store to securely manage sensitive environment variables.

Ensure all AWS Lambda functions are configured within VPCs.

Constraints:

All resources must deploy in the us-east-1 region.

IAM roles must have names starting with role-.

Exclude AWS Config rules and CloudTrail configuration.

Follow AWS security best practices for all resources.

The output must generate deployable CDK code in JavaScript, compatible with the above folder structure.