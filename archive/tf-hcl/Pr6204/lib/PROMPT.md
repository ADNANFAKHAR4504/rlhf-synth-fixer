IAC-101911931

Design a production-ready Terraform configuration written entirely in HCL that deploys a scalable web application environment on AWS.All code must be contained in a single file named main.tf.Do not create or modify any provider blocks — a provider.tf file is already supplied and handles provider configuration.

Infrastructure Requirements
VPC & Networking
VPC CIDR: 10.0.0.0/16

Deploy across 3 Availability Zones
Public subnets:
10.0.1.0/24
10.0.2.0/24
10.0.3.0/24

Private subnets:
10.0.11.0/24
10.0.12.0/24
10.0.13.0/24

Create an Internet Gateway
Create 1 NAT Gateway per AZ
Route tables that correctly route public → IGW and private → NAT GW

Listener: HTTP on port 80 .
Target Group:
Port 3000.
Protocol HTTP.
Health check on path /health, expecting matcher code 200.
Compute Layer — Auto Scaling Group

Amazon Linux 2023 AMI
Instance type: t3.medium
Enforce IMDSv2
User data installs Node.js and deploys the app


Auto Scaling Group:
Runs in private subnets
Min size: 2
Max size: 10
CPU >70% scale-out policy
300-second cooldown

RDS PostgreSQL
PostgreSQL 
Instance class: db.t3.micro
Multi-AZ enabled
7-day automatic backup retention
Stored in private subnets
Master password must be retrieved from AWS Secrets Manager

Security Groups
ALB SG :
Inbound: Allow TCP 80.
EC2 SG :
Inbound: Allow TCP 3000 only from the ALB SG.
RDS SG :
Inbound: Allow TCP 5432 (PostgreSQL) only from the EC2 SG.
Secrets Manager
Store DB master password in Secrets Manager

Outputs
ALB DNS name
RDS endpoint
Secrets Manager secret ARN
Additional Outputs for networking and security group IDs.


Tagging
All resources must include:
Environment
Project
ManagedBy = "Terraform"

Additional Rules
Must be fully functional Terraform code
Must respect dependencies (use depends_on where appropriate)
Must not rely on external modules
Must not include provider blocks (already provided)
The entire implementation must reside in main.tf only