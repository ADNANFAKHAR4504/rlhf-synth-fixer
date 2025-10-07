You are a Senior Cloud Engineer with expertise in AWS.

Restated requirements:
- Build a secure AWS environment for a web application. All deployable resources must be created in **us-west-2**. Configure the Terraform S3 backend for remote state (no hardcoded account IDs/ARNs/regions—use variables, environment variables, or configuration files).
- **S3**: Create a bucket that is globally unique with the naming pattern `secure-app-bucket-<unique_id>`, with public access fully disabled. Use server-side encryption (SSE) and block all public ACLs/policies.
- **EC2 & Auto Scaling**: Launch EC2 instances (type **t3.micro**) in Auto Scaling Groups behind an ALB. Attach IAM roles limited to the minimal permissions required to access the S3 bucket(s), preferring AWS Managed Policies where suitable and applying the least-privilege principle elsewhere.
- **VPC**: Provision a VPC with public and private subnets. Public subnets must auto-assign public IPs and route to the internet securely via an Internet Gateway and route tables. Private subnets must not be directly accessible from the internet (use NAT Gateways for egress if needed).
- **Security Groups**: Allow only **HTTPS (443)** and **SSH (22)**. Restrict SSH ingress strictly to **203.0.113.0/24**. Deny everything else by default.
- **RDS (PostgreSQL)**: Create a PostgreSQL instance using the **latest available engine version**, enable **automatic minor version upgrades**, and enforce **encryption at rest with AWS KMS-managed keys**. Place RDS in private subnets with appropriate SG rules.
- **CloudTrail**: Enable organization/account activity auditing with CloudTrail and deliver logs to a secure, encrypted S3 bucket with least-privilege access.
- **Lambda**: Deploy a Lambda function using the **latest runtime** and trigger it via **S3 event notifications** (e.g., object create). Ensure the Lambda role/policy is least-privilege, and logs are shipped to CloudWatch.
- **Additional services to include**: ALB, Auto Scaling, CloudWatch (metrics/logs/alarms as appropriate), API Gateway.
- **Tagging**: Apply tags to **all** resources—`Environment`, `Department`, and `Project`.
- **Parameterization**: Do **not** hardcode values like account IDs, ARNs, or regions. Use Terraform variables, `.tfvars`, environment variables, or external configuration.
- **Best practices**: Follow AWS security, compliance, and scalability best practices throughout (principle of least privilege, encryption at rest/in transit, minimal SG ingress, proper IAM role separation).

### File Structure
- `provider.tf` (already present)
  - Configure the Terraform **S3 backend** for remote state (all identifiers/paths parameterized).
- `lib/main.tf`
  - Declare **all variables** (including `aws_region`, unique suffix/ID for S3 names, CIDRs, SSH allowed CIDR, tagging map, toggle flags).
  - Define **locals** for resource naming conventions, tags, CIDR blocks, toggles, and IP ranges.
  - **Implement resources**: VPC, public/private subnets, route tables, IGW/NAT, security groups, IAM roles/policies, ALB, Auto Scaling (Launch Template, ASG), EC2 instances (t3.micro), RDS (PostgreSQL) with KMS and auto minor upgrades, CloudWatch (logs/alarms), S3 (application bucket + CloudTrail logs bucket), API Gateway, CloudTrail (trail + delivery to secure S3), and Lambda (latest runtime) triggered by S3 events.
  - **Outputs**: Expose IDs/ARNs/hosts/endpoints for all key resources (VPC ID, subnet IDs, SG IDs, ALB DNS, ASG name, EC2 IAM role, RDS endpoint/ARN, S3 bucket names, CloudTrail trail name/ARN, Lambda function name/ARN, API Gateway endpoint).

Instructions:
- Use Terraform HCL and ensure every configurable value is driven by variables (with sane defaults where appropriate).
- Enforce least-privilege IAM policies and prefer AWS Managed Policies for standard access patterns.
- Ensure private subnets have no direct internet ingress, and public subnets auto-assign public IPs.
- Ensure S3 event notifications are correctly wired to Lambda with IAM and permissions resources.
- Choose the latest supported Lambda runtime and PostgreSQL engine version dynamically via data sources or variables.
- Tag all resources with iac-rlhf-amazon