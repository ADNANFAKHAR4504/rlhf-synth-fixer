Absolutely! Heres your original expert-level AWS CDK task rewritten in your requested format, tailored for an AWS Lambda + API Gateway + S3 stack, using CDK (TypeScript), and following the same structure:

---

# AWS Serverless Stack Provisioning with AWS CDK and TypeScript

## Role

You are a senior cloud infrastructure engineer with deep expertise in AWS, AWS CDK (Cloud Development Kit), and TypeScript.

## Task

Write a complete AWS CDK program in TypeScript that provisions the following AWS serverless infrastructure.

## Problem Statement

Provision a highly secure, production-ready, and operationally excellent AWS serverless environment with the following requirements:

1. The stack must deploy in the `us-east-1` region and all resource names must be prefixed with `prod-`, following parameterized naming conventions suitable for multi-environment deployments.
2. Provision at least:
    - One AWS Lambda function
    - An API Gateway (REST or HTTP)
    - An S3 bucket
3. Secure the environment by:
    - Applying least-privilege IAM policies to Lambda and API Gateway, defined in code.
    - Enforcing S3 encryption at rest (SSE-S3 or SSE-KMS) and HTTPS-only access.
    - Restricting Lambda invocation to API Gateway only.
    - Enabling WAF integration for API Gateway.
    - Enabling logging for all core resources (API Gateway access logs, Lambda execution logs, S3 access logs).
    - Enabling API Gateway authentication (API Key or Cognito).
    - Tagging all resources with environment, owner, cost, and compliance metadata.
4. Operational excellence:
    - Enable CloudWatch metrics, alarms, and tracing (AWS X-Ray) for Lambda.
    - Set up API Gateway usage plans and throttling.
    - Enable versioning and lifecycle policies for S3.
    - Provide unit and integration test scaffolding for the stack constructs.
5. Deployment must support multiple environments (dev, staging, prod) via context variables or stack parameters, and be safe for updates and deletion.

## Environment

- AWS Region: `us-east-1`
- Infrastructure as Code Tool: **AWS CDK** using **TypeScript**
- Resource Prefix: `prod-` (parameterized for multi-environment support)

## Constraints and Best Practices

- Follow AWS Well-Architected Framework best practices for security, reliability, and cost.
- All IAM permissions must implement the principle of least privilege.
- Use idiomatic AWS CDK and TypeScript.
- All resources must be tagged for cost, environment, and compliance.
- Avoid deprecated AWS services or CDK constructs.
- Code must be modular, maintainable, and production-ready.

## Expected Output

- Complete **AWS CDK code in TypeScript** for the stack, including all necessary imports and constructs.
    - Create the entire solution as a single stack.
    - The stack must extend the `Construct` class rather than `Stack` or `Stage`.
    - Omit code to initialize AWS Providers, App, or environment context.
    - Output only the code for this stack, do not include main entrypoint code or bootstrap code.
- Code should be self-contained and runnable via `cdk deploy`.
- Include **inline comments** explaining key sections.
- Output only the code (no extra commentary).
