We need to set up a secure multi-region AWS infrastructure using Terraform. The design should be minimal, with only two files: provider.tf for providers, and lib/tap_stack.tf for everything else. The infrastructure must run in three regions: us-east-1 and ap-southeast-2.

Each region requires a VPC with two public and two private subnets, Internet Gateway and NAT Gateways, restrictive NACLs, and VPC Flow Logs encrypted with KMS. Bastion hosts should run in public subnets using small Amazon Linux instances. They must allow SSH only from approved CIDRs, have encrypted EBS volumes, and use Systems Manager for secure access.

Private workloads include an RDS PostgreSQL database (encrypted, backups enabled, deletion protection in production only, private subnets only) and an ECS cluster using either Fargate or EC2. Each region also needs secure S3 buckets with encryption, versioning, access logging, and lifecycle rules.

All IAM roles must follow least privilege. We need roles for bastion hosts, ECS tasks, and RDS monitoring, with KMS customer-managed keys created in every region. Secrets are stored in AWS Secrets Manager and never exposed through outputs. For traffic handling, each region should have an Application Load Balancer with HTTPS, protected by AWS WAF v2 using managed rule sets.

Audit and compliance must be enforced using multi-region CloudTrail (with log validation and encryption), AWS Config with standard compliance rules, and KMS encryption for logs. Workspaces handle environments (development, staging, production), and tagging must be consistent across resources with environment, team, project, and ManagedBy=terraform.

Outputs should provide only non-sensitive values per region, including VPC ID, private subnet IDs, bastion DNS, ALB info, RDS endpoint, S3 logging bucket, CloudTrail ARN, Config status, and WAF ARN.