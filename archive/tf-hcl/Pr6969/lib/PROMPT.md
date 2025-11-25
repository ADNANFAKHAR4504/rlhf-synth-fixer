Create an Terraform configuration for an payment processing application that must stay consistent across dev, staging, and prod.. Use Terraform 1.5+ and AWS provider 5.x. The setup must use Terraform workspaces and an S3 backend so each environment has its own state file.

Define an reusable module structure that all three environments will use. The environments are dev, staging, and prod, and each already has its own VPC with CIDR blocks: dev (10.0.0.0/16), staging (10.1.0.0/16), prod (10.2.0.0/16). Each VPC also already has 3 AZs with public and private subnets. Do not create new VPCs; use data sources to reference the existing VPCs and their subnets.

Inside the reusable module, include:

An RDS PostgreSQL instance with instance sizes based on environment:

dev - db.t3.micro

staging - db.t3.small

prod - db.t3.medium
Automated backups should be: none for dev, 7 days for staging, 30 days for prod.

Security groups that allow HTTPS (443) inbound from the internet and PostgreSQL (5432) from the EC2 application servers. Security group rules should be defined once inside the module and reused across all environments.

An Application Load Balancer with listeners and target groups pointing to EC2 instances living in private subnets.

EC2 instances with instance types based on environment:

dev - t3.micro

staging - t3.small

prod -> t3.small

CloudWatch alarms for RDS CPU utilization with thresholds:

dev -> 80%

staging -> 70%

prod -> 60%

Consistent naming conventions so all resources are prefixed with the environment name.

Tags for all resources: Environment, Project, and ManagedBy.

Provide three separate .tfvars files: dev.tfvars, staging.tfvars, and prod.tfvars, containing only the environment-specific values. The main/root module should load variables from the module and ensure changes to the module automatically propagate to all environments.

Finally, output the ALB DNS name, RDS endpoint, and security group IDs and other apropriate outputs.

Make sure nothing is missing from this list and ensure the prompt produces a full modular Terraform configuration.