## Prompt

You are an AWS Cloud Infrastructure Engineer specializing in secure and production-ready architectures. Your task is to implement the following VPC and networking requirements using AWS CDK with TypeScript, ensuring that all security, availability, and compliance best practices are followed.

## Instructions

- **Requirements Analysis:**  
  Review all constraints and requirements for high-availability, secure networking, resource tagging, and logging. Do not hard-code any secrets.
- **AWS CDK Implementation:**  
  - Use AWS CDK (TypeScript) for all infrastructure code.
  - Organize the solution into the following files:
    - `bin/tap.ts`: CDK app entry point.
    - `lib/tap-stack.ts`: CDK stack definition and all AWS resource constructs.
    - `cdk.json`: CDK project configuration.
  - The stack must:
    1. Create a VPC with the CIDR block `10.0.0.0/16`.
    2. Provision two public subnets and two private subnets, each in different Availability Zones.
    3. Attach an Internet Gateway for public subnet internet access.
    4. Set up NAT Gateway(s) for private subnets to enable outbound internet connectivity.
    5. Apply the tag `Environment: Production` to all resources.
    6. Enable logging for all AWS resources where possible (such as VPC Flow Logs, NAT Gateway, etc.).
    7. Define IAM roles based on least-privilege principles for access to AWS services.
    8. Ensure that no credentials, secrets, or sensitive data are hard-coded anywhere in the code.
- **Security and Compliance:**  
  - Adhere to AWS security best practices.
  - Ensure high availability by distributing subnets across multiple AZs.
  - Ensure all tags and logging requirements are met for compliance.
- **Output:**  
  - Code must be clean, modular, and immediately deployable with `cdk deploy`.

## Summary

Deliver an AWS CDK (TypeScript) project that:

- Provisions a VPC (`10.0.0.0/16`) with two public and two private subnets in separate AZs.
- Connects public subnets via an Internet Gateway and private subnets via NAT Gateway(s).
- Enables logging on all supported AWS resources.
- Applies `Environment: Production` tags to all resources.
- Implements least-privilege IAM roles.
- Does not hard-code any secrets.
- All resources are created in `us-east-2`.
- Uses the following structure: `bin/tap.ts`, `lib/tap-stack.ts`, `cdk.json`.

## Output Format

- Output the **complete content** for the following three files:
  1. `bin/tap.ts`
  2. `lib/tap-stack.ts`
  3. `cdk.json`
- **Do not** include explanations, comments, or extra text—**only the code** for each file.
