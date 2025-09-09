I have an AWS CDK project using TypeScript with the following structure:

bin/tap.ts → entry point of the CDK app

lib/tapstack.ts → contains the main stack definition

test/ → contains Jest unit tests and integration tests

I want you to generate a complete AWS CDK v2 TypeScript solution that implements the following requirements:

Core Requirements

The CDK stack must define a secure infrastructure setup that aligns with AWS best practices.

Include comprehensive logging using AWS CloudTrail and CloudWatch Logs for all security-related activities.

Implement IAM roles and policies with least privilege, scoped per resource.

Enable AWS Config with compliance rules for auditing resource configurations.

Encrypt all sensitive data at rest using AWS KMS integrated with all relevant services.

Deploy AWS WAF for web application protection.

Ensure S3 buckets are private by default, no public access allowed.

Enable Amazon GuardDuty for continuous threat detection, sending findings to CloudWatch Events.

Enforce multi-factor authentication (MFA) for all IAM users.

Configure AWS Systems Manager Patch Manager for automated patching of EC2 instances.

Add monitoring with AWS Lambda triggers to detect and automatically remediate unauthorized changes.

Apply a consistent naming convention: projectName-purpose-resourceType.

Operate in the us-east-1 region, inside the VPC ID: vpc-abc12345.

Tag all resources for visibility and cost tracking.

Template must be scalable and structured to support multiple stacks/environments.

Testing & Quality Requirements

Provide unit tests with Jest to achieve >90% coverage on the CDK constructs & resources defined in tapstack.ts.

Add live integration tests that validate successful stack deployment and critical security configurations.

Ensure tests cover:

IAM least privilege enforcement

CloudTrail and CloudWatch logging setup

S3 bucket access policies (no public access)

KMS encryption on resources

GuardDuty, WAF, and Config rules existence

Include testing utilities for mocking AWS services where needed.

Documentation

Generate a README.md explaining setup, deployment instructions, testing steps (unit + integration), and recovery procedures.

Document resource compliance, IAM restrictions, and how drift detection/remediation works.

Make sure the generated code and tests fit into this structure (bin/tap.ts, lib/tapstack.ts, test/) and follow production-grade AWS CDK + Jest best practices.