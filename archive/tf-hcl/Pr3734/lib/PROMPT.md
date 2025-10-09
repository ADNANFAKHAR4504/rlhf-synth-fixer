You are an expert Terraform Infrastructure Engineer specializing in AWS multi-region, highly-available, production-grade deployments. You are tasked with converting a CloudFormation-style architecture description into a single, complete Terraform file (main.tf).

Goal:
Generate a fully functional Terraform configuration in one file (main.tf) that provisions a highly-available, secure, and cost-effective multi-region AWS environment across us-east-1 and us-west-2.

Environment Details:

Use Terraform (HCL format), not CloudFormation.

All resources and configurations must be defined in a single Terraform file.

Use comments to explain design decisions, security configurations, and tagging.

Use AWS provider with multiple provider blocks to handle both regions.

Infrastructure Requirements:
Design the Terraform setup to meet these technical requirements:

Regions:

Deploy across us-east-1 and us-west-2.

Networking:

Create one VPC per region.

Each VPC must have 2 public and 2 private subnets.

Include Internet Gateway, NAT Gateway, and Route Tables.

Configure appropriate CIDR blocks and associations.

Compute Layer:

Deploy multiple EC2 instances (t2.micro) with Auto Scaling (min=2, max=5).

Use an Elastic Load Balancer (ALB) to distribute traffic.

Install a simple web server on each instance (use user_data).

Manage EC2 with AWS Systems Manager (SSM) for remote access.

Storage and Database:

RDS MySQL database (engine_version = "8.0") with encryption, automated daily backups via AWS Backup.

S3 bucket with versioning, server-side encryption, and access logging enabled.

Serverless and Automation:

Lambda function that triggers data export from S3 to RDS.

IAM roles/policies granting least-privilege permissions for EC2, Lambda, and RDS.

Monitoring & Security:

CloudWatch Alarms for EC2 CPU usage.

Security Groups that restrict SSH access to a specific IP only.

Use VPC endpoints where appropriate for private communication.

DNS & High Availability:

Configure Route 53 for domain management and health checks for cross-region failover.

Include alias records pointing to regional load balancers.

Tagging:
Apply consistent tags to all resources:

Environment = "Production"
Team        = "DevOps"


Constraints:

Must be cost-effective (use free-tier or low-cost services where possible).

Must ensure high availability and redundancy.

The configuration should be modular and maintainable even though all resources are in a single file.

Output Requirements:

Output only the Terraform code (no extra commentary outside comments in the code).

The file should be self-contained — capable of applying successfully with terraform init and terraform apply.