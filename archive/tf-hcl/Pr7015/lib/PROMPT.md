Create an complete Terraform configuration that deploys the same infrastructure across three environments: development, staging, and production. The setup must use a reusable module structure and Terraform workspaces to keep each environment isolated with its own state file. Use non-overlapping VPC CIDR blocks for each environment (dev: 10.1.0.0/16, staging: 10.2.0.0/16, prod: 10.3.0.0/16). Each environment should include a VPC with public and private subnets across two availability zones, an Application Load Balancer, Auto Scaling Groups with EC2 instances, an RDS PostgreSQL Multi-AZ instance, and an S3 bucket with versioning enabled and environment-specific bucket names.

Use conditional logic so non-prod uses smaller instance sizes (t3.micro for app servers and db.t3.micro for RDS), while production uses larger sizes (m5.large for EC2 and db.m5.large for RDS). Production EC2 must use dedicated tenancy while non-prod uses default tenancy. Security groups must restrict database access so only application instances can reach the DB.

All every resources must follow consistent tagging (Environment and CostCenter). Each environment must will have its own backend configuration using S3 and DynamoDB for state locking. Environment-specific settings must come from separate tfvars files. The module structure should be clean and reusable across all three environments.

Focus mainly on the VPC, ALB + ASG, and RDS components (core requirements). You may include one optional enhancement if it fits naturally.

The final output should be a modular Terraform layout with:

a main module for shared logic,

per-environment tfvars files,

backend configs for each environment,

and workspace-based separation ensuring isolation and consistent provisioning.