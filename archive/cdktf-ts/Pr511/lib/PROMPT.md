### Role
You are a senior cloud infrastructure engineer with deep expertise in AWS, Terraform CDK, and TypeScript.

### Task
Generate a Terraform CDK (TypeScript) code snippet that fully provisions and manages a specified AWS environment as described below.

### Context
The goal is to migrate an existing AWS infrastructure to be managed entirely via Terraform, focusing on network setup and backup strategies, while following best practices for state management and resource tagging.

### Problem Statement
Create a CDKTF TypeScript project that:
1. Creates a VPC in the `us-west-2` region with CIDR block ``10.0.0.0/16``.
2. Configures at least two public subnets, each in a different availability zone within the region.
3. Attaches an Internet Gateway to the VPC.
4. Defines route tables and associates them with the public subnets to enable internet access.
5. Creates an S3 bucket named ``migration-backup-`` for backups, ensuring the bucket name is unique by using generated random values or similar methods.
6. Sets up a security group allowing inbound SSH (TCP port 22) from ``0.0.0.0/0`` as a temporary exception.
7. Tags all resources with ``Project: Migration`` and ``Environment: Production``.
8. Configures Terraform remote state storage to securely store all state files in an S3 backend.
9. Prohibits the use of hard-coded values; instead, use variables and AWS data sources wherever applicable.

### Environment
- AWS region: ``us-west-2``
- Terraform language version: 0.14 or later
- Programming language: TypeScript using Terraform CDK (CDKTF)

### Constraints and Best Practices
- Use variables and data sources instead of hard-coded literals.
- Follow a clear and consistent naming convention for all Terraform and AWS resources.
- Ensure all resources have required tags for project tracking.
- Implement remote state backend configuration using an S3 bucket.
- Include the necessary CDKTF commands to initialize, synthesize, and deploy the stack.
- Avoid generic or placeholder names; use meaningful, environment-specific identifiers formatted with backticks.

### Expected Output
Provide complete, idiomatic Terraform CDK TypeScript code that meets the above specifications, including:
- Module imports and constructs.
- Definitions of variables and data sources.
- Resource declarations with proper configuration and tagging.
- Backend configuration snippet for remote state storage.
- Any required initialization or deployment commands formatted as shell commands.