You are a Senior AWS Solutions Architect and Terraform Expert tasked with designing a production-ready AWS environment using Terraform v0.12 or later.

Environment:
Deploy AWS infrastructure resources including VPC, EC2 instances, Elastic Load Balancer (ELB), S3 buckets, and Security Groups. All resources must reside in the **us-east-1** AWS region, follow a strict naming convention with the prefix `prod-`, and adhere to high availability and security best practices.

Requirements:

1. Use Terraform v0.12 or later for all configurations.
2. Deploy all resources only in **us-east-1**.
3. All resource names must start with the prefix **prod-**.
4. Apply consistent tagging with `Environment = Production` to every resource.
5. Define all variables in a dedicated `variables.tf` file and reference them in `main.tf`.
6. Enable **S3 versioning** to prevent accidental data loss.
7. Configure ELB to allow access over both HTTP and HTTPS.
8. Achieve high availability by deploying resources across multiple Availability Zones in **us-east-1**.

Expected Output:
Provide a complete Terraform configuration with at least two files:

- `main.tf` for core infrastructure setup.
- `variables.tf` for managing input variables.

The configuration should successfully provision the environment, enforce the naming/tagging conventions, and meet all availability and security constraints.
