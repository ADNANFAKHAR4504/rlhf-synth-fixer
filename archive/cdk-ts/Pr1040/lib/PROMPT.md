## Prompt

You are an AWS Cloud Infrastructure Engineer specializing in highly available, disaster-resilient, and compliant architectures. Your task is to implement the following requirements using AWS CDK with TypeScript, ensuring all critical best practices for security, region failover, and compliance.

## Instructions

- **Requirements Analysis:** 
Carefully review all requirements regarding multi-region deployment, disaster recovery, secure data management, alerting, logging, DNS, and compliance monitoring.
- **AWS CDK Implementation:**
- Use AWS CDK (TypeScript) for all infrastructure code.
- Organize the solution using these files:
- `bin/tap.ts`: CDK app entry point.
- `lib/tap-stack.ts`: Stack definition and all AWS resources.
- `cdk.json`: CDK project configuration.
- The solution must:
1. Deploy infrastructure spanning both `ap-south-1` and `us-east-2` regions to guarantee availability.
2. Provision S3 buckets for backup storage, encrypted with AWS KMS.
3. Create independent Amazon RDS instances in each region (with automated backups). Cross‑region replication is not required.
4. Define AWS Lambda functions for data processing tasks.
5. Create an Amazon SNS topic encrypted with KMS and wire CloudWatch alarms to publish to it. Subscriptions are not managed in this stack and must be created/confirmed externally.
6. Use a VPC with public and private subnets (CIDR block: `10.0.0.0/16`).
7. Enable CloudWatch logging for all critical operations.
8. Define IAM roles with least privilege, granting only the necessary permissions to services.
9. Utilize Route 53 for DNS management and failover routing policy.
- **Security and Best Practices:**
- Adhere to AWS security, compliance, and least-privilege principles.
- Do not hard-code any sensitive information or credentials.
- Ensure high availability and disaster recovery across both regions.
- Use clean, modular code, ready for `cdk deploy`.
- **Output:**
- All files must be functional and deployable.

## Summary

Deliver an AWS CDK (TypeScript) project that:

- Provisions VPC, public/private subnets, independent RDS instances in each region (no cross‑region replication), S3 buckets (KMS encrypted), Lambda, an SNS topic with CloudWatch alarms (no in‑stack subscription), Route 53 DNS with failover, and CloudWatch Logs. AWS Config is excluded.
- Spans both `ap-south-1` and `us-east-2` regions for true multi-region HA and DR.
- Follows tagging, resource naming, and IAM best practices.
- Uses the following structure: `bin/tap.ts`, `lib/tap-stack.ts`, `cdk.json`.

## Output Format

- Output the **complete content** for the following three files:
1. `bin/tap.ts`
2. `lib/tap-stack.ts`
3. `cdk.json`
- **Do not** include explanations, comments, or extra text**only the code** for each file.
