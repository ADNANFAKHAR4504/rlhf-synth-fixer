## Prompt

You are an AWS Cloud Infrastructure Engineer specializing in secure, compliant, and production-ready deployments. Your task is to implement the following advanced security and compliance requirements using AWS CDK with TypeScript, ensuring the design adheres to **CIS AWS Foundations Benchmarks** and organizational security policies.

## Instructions

- **Requirements Analysis:**  
  Review all constraints for security group rules, encryption, IAM, monitoring, and compliance. Ensure that the CDK implementation addresses every requirement while maintaining modular and reusable infrastructure code.

- **AWS CDK Implementation:**
  - Use AWS CDK (TypeScript) for all infrastructure definitions.
  - Organize the solution into:
    - `bin/tap.ts`: CDK app entry point.
    - `lib/tap-stack.ts`: Stack definition and AWS resource configurations.
    - `cdk.json`: CDK project configuration.
  - The stack must:
    1. Create **security groups** that allow **ingress traffic only on port 443** from specified IP ranges (parameterized).
    2. Enable **encryption at rest** for all S3 buckets using AWS-managed KMS keys.
    3. Create **IAM policies** and roles that follow the **principle of least privilege**.
    4. Enable **VPC Flow Logs** to log all network traffic.
    5. Ensure all **RDS instances** launch within a **specific VPC** and **subnet group**.
    6. Use **AWS KMS** for automatic encryption of EBS volumes.
    7. Enable **GuardDuty** for continuous security monitoring.
    8. Deploy **AWS WAF** to protect web applications from common vulnerabilities.
    9. Implement **Multi-Factor Authentication (MFA)** enforcement for all IAM users.
    10. Ensure compliance with **CIS AWS Foundations Benchmarks** for all applicable resources.
    11. Apply the naming convention: `companyname-env-component` for all resources.
    12. Deploy all resources in the **eu-central-1** region.
  - Ensure parameters and conditions are used where applicable for flexibility and reuse across environments.

- **Security and Compliance:**
  - Adhere to AWS and CIS AWS Foundations Benchmark best practices.
  - Enforce encryption for all data at rest and in transit.
  - Ensure least privilege access policies for IAM.
  - Avoid hard-coding secrets in the code.

- **Output:**
  - All code must be clean, modular, and deployable with `cdk deploy`.

## Summary

Deliver an AWS CDK (TypeScript) project that:

- Creates secure networking with port 443 restrictions.
- Encrypts S3, RDS, and EBS with KMS.
- Implements least-privilege IAM roles and MFA enforcement.
- Enables VPC Flow Logs, GuardDuty, and WAF for monitoring and protection.
- Deploys RDS in a dedicated VPC subnet group.
- Uses the naming convention `companyname-env-component`.
- Is fully compliant with **CIS AWS Foundations Benchmarks**.
- Deploys to `eu-central-1`.

## Output Format

- Output the **complete content** for the following three files:
  1. `bin/tap.ts`
  2. `lib/tap-stack.ts`
  3. `cdk.json`
- **Do not** include any explanations, comments, or extra text - **only the code** for each file.
