# Serverless CMS Infrastructure using Terraform CDK and TypeScript

## Role

You are a senior cloud engineer with expertise in AWS, serverless architecture, and Terraform CDK (CDKTF) using TypeScript.

## Task

Design and implement a scalable, secure, multi-region serverless infrastructure to support a Content Management System (CMS) using Terraform CDK in TypeScript.

## Problem Statement

Provision an AWS serverless architecture using Terraform CDK with the following components:

1. **API Gateway** to expose HTTP endpoints for accessing CMS content.
2. **AWS Lambda functions** written in Python for dynamic content processing and management.
3. **Amazon DynamoDB** tables for storing content metadata, with auto-scaling enabled.
4. **Amazon S3 buckets** for storing content files, with versioning enabled for object-level history.
5. **Amazon CloudFront** distribution for low-latency content delivery, caching, and global edge coverage.
6. **IAM Roles and Policies** granting least privilege access to each service component (e.g., Lambda, S3, DynamoDB).
7. Infrastructure must support **multi-region deployment** using Terraform CDK without requiring manual region-specific code changes.

## Environment

- AWS cloud environment with serverless architecture
- Target regions: `us-east-1`, `us-west-2`, and `eu-central-1`
- Each region-specific resource should follow a standardized naming convention such as:  
  `cms-<env>-<region>` (e.g., `cms-prod-us-east-1`)
- Use Terraform CDK (CDKTF) and TypeScript as the infrastructure-as-code language and toolchain
- All Lambda functions must be written in Python and deployed as part of the infrastructure setup

## Constraints and Best Practices

- The solution must support **automated multi-region deployments** from the same codebase (e.g., region passed via CLI or context)
- Use **Terraform CDK and TypeScript idioms** (e.g., `constructs`, `TerraformStack`, modular reusable code)
- **Security-first approach**:
  - IAM policies must follow the **least privilege principle**
  - Minimize public access and restrict permissions at the resource level
- Optimize for scalability and low latency across regions
- Avoid hardcoding values; prefer props

## Expected Output

- A complete and self-contained **CDKTF Construct written in TypeScript** which creates all the required resources
- Includes all necessary constructs and dependencies to deploy the serverless CMS including any required lambda functions
- The props must include a parameter called "provider", which should be used to set the provider parameter for every resource being created in the Construct.
- The Construct itself should initialize an AWS Provider or Backend. It should only focus on the creation of the resources
- Should be deployable using `cdktf deploy` 
- Provide inline comments explaining the logic and choices
- Output only the code (avoid additional commentary or markdown unless part of code comments)