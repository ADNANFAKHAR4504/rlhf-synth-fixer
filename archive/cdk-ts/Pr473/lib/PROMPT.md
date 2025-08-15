## Prompt

You are an AWS Cloud Infrastructure Engineer specializing in highly available, secure, and recoverable web application architectures. Your task is to implement the following requirements using AWS CDK with TypeScript, ensuring the solution follows AWS and enterprise best practices.

## Instructions

- **Requirements Analysis:**  
  Review all requirements for high availability, automated recovery, encryption, monitoring, and naming conventions. Ensure compliance with all constraints and best practices.
- **AWS CDK Implementation:**  
  - Use AWS CDK (TypeScript) for all infrastructure code.
  - Organize the solution into the following files:
    - `bin/tap.ts`: CDK app entry point.
    - `lib/tap-stack.ts`: CDK stack definition and AWS resource configuration.
    - `cdk.json`: CDK project configuration.
  - The stack must:
    1. Deploy Elastic Load Balancer (ELB) to distribute incoming traffic across multiple Availability Zones.
    2. Launch EC2 instances in public subnets, with automatic recovery enabled (using EC2 auto recovery).
    3. Deploy an RDS database instance with:
        - Multi-AZ deployment.
        - Automated backups via DB snapshots.
        - Data at rest encrypted using AWS KMS.
    4. Use KMS for all encryption needs, including EBS and RDS.
    5. Configure CloudWatch alarms to monitor critical metrics (e.g., CPU utilization) and initiate recovery actions as needed.
    6. Follow the 'project-stage-resource' naming convention for all resources.
    7. Use existing VPCs and subnets in the `us-east-1` region.
- **Security and Best Practices:**  
  - Ensure high availability by distributing resources across multiple AZs.
  - Enable encryption at rest using AWS KMS for all data stores.
  - Ensure clean, modular, and immediately deployable code.
- **Output:**  
  - All files should be ready for deployment via `cdk deploy`.

## Summary

Deliver an AWS CDK (TypeScript) project that:

- Distributes application traffic via an Elastic Load Balancer across multiple AZs.
- Deploys EC2 instances with auto recovery in public subnets.
- Provisions RDS with multi-AZ, automated DB snapshots, and KMS encryption.
- Sets up CloudWatch alarms for monitoring and automated recovery.
- Names all resources using the 'project-stage-resource' format.
- Operates in the `us-east-1` region, using existing VPCs and subnets.
- Uses the following structure: `bin/tap.ts`, `lib/tap-stack.ts`, `cdk.json`.

## Output Format

- Output the **complete content** for the following three files:
  1. `bin/tap.ts`
  2. `lib/tap-stack.ts`
  3. `cdk.json`
- **Do not** include explanations, comments, or extra text—**only the code** for each file.