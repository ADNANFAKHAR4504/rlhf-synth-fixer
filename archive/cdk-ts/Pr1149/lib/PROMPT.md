## Prompt

You are an AWS Cloud Engineer specializing in secure, high-scale **serverless** architectures. Implement the following requirements using **AWS CDK (TypeScript)**, replacing the original CloudFormation YAML request while preserving all functionality and constraints.

## Instructions

- **Requirements Analysis:** 
Review all constraints and requirements for VPC networking, serverless components, scalability, security, tagging, and safe deployments with change sets.

- **AWS CDK Implementation (TypeScript):** 
- Project structure:
- `bin/tap.ts` CDK app entry point (sets region to `us-west-2`).
- `lib/tap-stack.ts` Main stack with all resources.
- `cdk.json` CDK configuration.
- Implement a **VPC** with at least two private subnets and appropriate routing for Lambda.
- Create one or more **AWS Lambda** functions:
- Deployed **inside the VPC** (private subnets).
- Granted **least-privilege IAM** to access S3 and DynamoDB.
- **Logging** enabled to CloudWatch.
- **S3 storage**:
- Primary application bucket.
- Enforce access from the **same VPC** via **Gateway VPC Endpoint for S3** and a **bucket policy** restricting access to the VPC endpoint.
- Tag all resources with `Environment: Production` (and propagate tags).
- **API Gateway** (HTTP API or REST) to trigger Lambda on specified endpoints:
- Configure routes/integrations.
- Enable access logging and metrics.
- **DynamoDB**:
- On-demand capacity (`PAY_PER_REQUEST`).
- VPC access control via **DynamoDB Gateway VPC Endpoint** (and IAM conditions where applicable).
- **Zero-downtime updates**:
- Ensure the stack supports **CloudFormation Change Sets** for safe, no-downtime updates (e.g., avoid breaking replacements of API domains or critical identifiers; leverage CDK deployment options that create change sets).
- **Security & Compliance**:
- No hard-coded secrets; use Parameters/Context/SSM where needed.
- Least-privilege IAM policies for Lambda S3 and DynamoDB.
- Encrypt data at rest (S3 managed encryption, DynamoDB default encryption).
- TLS enforced for in-transit where applicable (API Gateway).
- **Outputs** (recommended but optional): API invoke URL, S3 bucket name, DynamoDB table name, VPC endpoint IDs.

- **Region & Tagging:**
- Deploy all resources in **`us-west-2`**.
- Tag **all resources** with `Environment: Production`.

## Summary

Deliver an AWS CDK (TypeScript) project that:
- Runs in **us-west-2**, tags all resources with **Environment: Production**.
- Provides a **serverless stack**: API Gateway Lambda (in VPC) S3 & DynamoDB (on-demand).
- Restricts S3 access to the **same VPC** via **Gateway VPC Endpoint** and bucket policy.
- Uses **DynamoDB on-demand** capacity.
- Enables **CloudWatch logging** for Lambda and API Gateway.
- Supports **zero-downtime updates** via **CloudFormation Change Sets**.
- Applies **least-privilege IAM** throughout and avoids hard-coded secrets.

## Output Format

Output the **complete content** for the following three files only (no extra text or comments):

1. `bin/tap.ts` 
2. `lib/tap-stack.ts` 
3. `cdk.json`
