Hi! I need help creating secure AWS infrastructure using Terraform HCL (not CDKTF).

I'm working on a production system that needs to be HIPAA compliant and follow security best practices. Here's what I need:

The Setup:

Deploy everything in us-west-2
Use HashiCorp Vault for all secrets (no hardcoded passwords!)
Everything should be named like "nova-prod-{resource}"
Tag all resources with Environment=prod and Owner=CloudEngineering
Infrastructure I need:

A VPC (10.0.0.0/16) with proper network segmentation (2 public, 2 private app, and 2 private DB subnets across 2 AZs)
An Application Load Balancer with HTTPS only (redirect HTTP to HTTPS) and WAF v2 protection
Auto-scaling EC2 instances (t3.micro, min=2, max=4) running nginx with self-signed TLS cert
A PostgreSQL 15 RDS database (db.t3.micro, Multi-AZ, encrypted, 7-day backups)
Proper security groups that only allow necessary traffic between tiers
S3 bucket for logs with KMS encryption, versioning, and block public access
CloudWatch log groups for application logs and VPC flow logs
Security Requirements:

Create and use a KMS CMK for encrypting everything (EBS, S3, RDS)
Implement least-privilege IAM policies
WAF v2 with AWS managed rules (CommonRuleSet, KnownBadInputsRuleSet, SQLiRuleSet)
All traffic must be encrypted in transit (TLS/HTTPS)
ALB security group: Allow 80/443 only from Vault-stored allowlist CIDRs
App security group: Allow 443 only from ALB security group
RDS security group: Allow 5432 only from App security group
VPC Flow Logs to CloudWatch
Vault Integration:

Use Vault provider (>= 3.20) with data.vault_kv_secret_v2
Read allowed_ingress_cidrs from kv/app/ingress
Read acm_certificate_arn from kv/app/acm
Read db_master_password from kv/db/primary
Assume AWS credentials are injected via environment
Outputs I need (all values):

VPC: ID, CIDR, ARN
Subnets: All IDs, CIDRs, AZs for public/private-app/private-db
Networking: Internet Gateway ID, NAT Gateway IDs and IPs, Route Table IDs
Security Groups: IDs and names for ALB, App, RDS
ALB: DNS name, ARN, Zone ID, Target Group ARN, Listener ARNs
Auto Scaling: ASG name, Launch Template ID and version
RDS: Instance ID, endpoint, address, port, database name, username, engine version, instance class, storage, AZ, multi-AZ status, backup window, subnet group
KMS: CMK ID and ARN
S3: Logs bucket name and ARN
CloudWatch: Log group names and ARNs for app and VPC flow logs
WAF: WebACL ID and ARN
IAM: All role and policy ARNs
Connection strings: Database connection string