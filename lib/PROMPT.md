Prompt:

You are a cloud infrastructure expert. Your task is to design and implement a resilient AWS environment using Terraform according to the following requirements and constraints:

Requirements:

Deploy infrastructure across two AWS regions (us-east-1 as primary, us-west-2 as secondary) with failover capabilities to ensure high availability.

Provision an Amazon RDS MySQL instance in each region, configured with Multi-AZ to support automatic failovers.

Create a VPC in each region with public and private subnets, using the CIDR block 10.0.0.0/16.

Include necessary IAM roles and policies for the infrastructure to function securely.

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

Use Terraform best practices (modular resources if needed, proper naming, outputs, and security considerations).

Explain briefly in comments what each section of the Terraform code does.
