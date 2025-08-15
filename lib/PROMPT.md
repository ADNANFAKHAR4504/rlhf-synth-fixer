Prompt:

Design and implement  multi-region AWS infrastructure using CDK for Terraform (CDKTF) with TypeScript. Your solution should follow this folder structure:

main.ts (in the project root) – Entry point that synthesizes the app and defines stacks.

lib/tapstack.ts – Contains the primary CDKTF stack (TapStack) that encapsulates all AWS resource logic.

test/ – Contains unit/integration tests validating the infrastructure.

Infrastructure Requirements:

Use CDKTF in TypeScript to provisionn AWS infrastructure across three regions: us-east-1, eu-west-1, and ap-southeast-2.

In each region, set up consistent networking components, including :

VPCs

Public and private subnets

Internet gateways

Create one S3 bucket per region with the identical lifecycle policies for storage management.

Configure IAM roles with cross-account access between two distinct AWS accounts.

Apply a consistent tagging strategy across all resources for cost tracking and organizational compliance.

Optimize for cost-efficiency, leveraging regional pricing advantages and avoiding over-provisioning.

Implement security is best practices using proper security groups and NACLs.

Ensure high availability and fault tolerance for critical infrastructure components.

Automate deployment using CDKTF CLI and scripts to manage environments via environment-specific config.

Use Terraform state management to track and protect infrastructure state.

Validate all infrastructure changes against company compliance and security standards.

Write and organize all the test cases under the test directory to verify correct infrastructure deployment.