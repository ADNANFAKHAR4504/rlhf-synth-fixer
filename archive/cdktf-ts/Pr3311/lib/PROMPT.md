Create a production-ready CDKTF TypeScript project in us-east-1 (single AWS account) that provisions a secure, highly-available multi-AZ environment.

File:

lib/tap-stack.ts: Main stack
lib/modules.ts: Modular components

Networking:

VPC: 10.0.0.0/16
Subnets: 2 Public + 2 Private (across multiple AZs)
Internet Gateway (IGW)
NAT Gateway
Route Tables

RDS MySQL:

Multi-AZ deployment in private subnets
Secrets stored in AWS Secrets Manager
Automated backups enabled
Deletion protection enabled

Security Groups:

Public SG: Allow ports 80/443 from anywhere
SSH (22): Allow only from configurable CIDR (via env/context)
DB SG: Allow only from App SG / private subnets (no public DB access)

Tagging:

Apply consistent tags to all resources:
Project
Env
Owner
Name (e.g., tap-prod-vpc)

Best Practices:

No hardcoded secrets → use Secrets Manager
Enforce least-privilege IAM roles

Outputs:

VPC ID
Subnet IDs
DB Endpoint
Secrets ARN

Validation:

Code must compile successfully,
cdktf synth runs without error,
terraform validate passes