## Prompt

You are an AWS Cloud Infrastructure Engineer specializing in multi-region, redundant, and disaster recoveryfocused architectures. Your task is to implement the following requirements using AWS CDK with TypeScript, replacing the original CloudFormation YAML requirement while keeping all features and constraints intact.

## Instructions

- **Requirements Analysis:** 
Review all requirements for redundancy, encryption, replication, monitoring, and IAM compliance. Ensure multi-region deployment is handled correctly.

- **AWS CDK Implementation:** 
- Use AWS CDK (TypeScript) to define all infrastructure.
- Organize the project into:
- `bin/tap.ts`: CDK app entry point.
- `lib/tap-stack.ts`: CDK stack definition with AWS resources.
- `cdk.json`: CDK project configuration.
- The stack must:
1. Deploy resources in **primary region** (`us-east-1`) and **backup region** (`us-west-2`) for high availability and disaster recovery.
2. Provision **S3 buckets** in both regions with **versioning** and **server-side encryption** enabled.
3. Implement **AWS Lambda functions** to automate **cross-region S3 data synchronization**.
4. Create **IAM roles** that adhere strictly to the **principle of least privilege**.
5. Deploy **CloudWatch dashboards** for real-time monitoring of replication status and related metrics across both regions.
6. Apply the naming convention **`Corp-<resource>`** to all resources.
7. Ensure the deployment architecture is reusable, parameterized, and can be extended for additional regions if required.

- **Security and Compliance:** 
- Enforce encryption for all S3 data at rest.
- Ensure IAM policies grant only the permissions required.
- Avoid hard-coded credentials or sensitive data in code.

- **Output:** 
- Code must be modular, production-ready, and deployable with `cdk deploy` for both regions.

## Summary

Deliver an AWS CDK (TypeScript) project that:

- Deploys multi-region infrastructure in `us-east-1` and `us-west-2` using CDK stacks.
- Provisions encrypted, versioned S3 buckets in both regions.
- Implements cross-region replication automation via Lambda.
- Configures least-privilege IAM roles.
- Provides CloudWatch dashboards for replication monitoring.
- Applies `Corp-<resource>` naming convention.

## Output Format

- Output the **complete content** for the following three files:
1. `bin/tap.ts`
2. `lib/tap-stack.ts`
3. `cdk.json`
- **Do not** include explanations, comments, or extra text**only the code** for each file.