Prompt:

You are a cloud infrastructure expert. Your task is to design and implement a resilient AWS environment using Terraform according to the following requirements and constraints:

Requirements:

Deploy infrastructure across two AWS regions - us-east-1 as primary and us-west-2 as secondary - with failover capabilities to ensure high availability.

Provision an Amazon RDS MySQL instance in each region, configured with Multi-AZ to support automatic failovers. RDS MySQL instances must be deployed in private subnets within each VPC, isolated from direct internet access. The RDS instances should use DB subnet groups that span multiple availability zones for high availability.

Create a VPC in each region with public and private subnets, using the CIDR block 10.0.0.0/16. Public subnets must have direct internet connectivity through an Internet Gateway, while private subnets should connect to the internet via NAT Gateways for outbound traffic like software updates and patches.

Implement security groups to control RDS access, allowing MySQL traffic on port 3306 only from within the VPC CIDR block. This ensures that database connections are restricted to resources within the same VPC.

Include necessary IAM roles and policies for the infrastructure to function securely. The IAM role for RDS Enhanced Monitoring should be attached to RDS instances to enable sending performance metrics to CloudWatch.

Store database credentials securely in AWS Secrets Manager with automatic cross-region replication from us-east-1 to us-west-2, ensuring credentials are available in both regions for failover scenarios.

Constraints:

All infrastructure must be defined and managed from a single Terraform HCL file.

Ensure configurations are valid, apply cleanly with Terraform, and follow best practices for high availability and fault tolerance.

Expected Output:
Provide a complete main.tf Terraform configuration that:

Creates the two-region setup with failover support.

Deploys Multi-AZ RDS MySQL instances.

Defines VPCs, public/private subnets, and necessary IAM roles/policies.

Is ready to apply with Terraform without errors.

Instructions for Claude:

Make the Terraform code production-ready and readable. I am using the structure is ├── IDEAL_RESPONSE.md
├── MODEL_FAILURES.md
├── MODEL_RESPONSE.md
├── PROMPT.md
├── provider.tf
└── tap_stack.tf

Use Terraform best practices - modular resources if needed, proper naming, outputs, and security considerations.

Explain briefly in comments what each section of the Terraform code does.
