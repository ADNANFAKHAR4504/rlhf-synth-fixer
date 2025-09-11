Prompt (Claude Sonnet–aligned)

Role: You are an expert AWS Cloud Architect specializing in CloudFormation.
Task: Generate a production-ready CloudFormation template in JSON format that sets up a highly available and secure AWS infrastructure for a migration scenario. The output must be a complete, valid JSON template named prod-environment-setup.json, deployable without errors in us-east-1.

Problem Statement

You are tasked with migrating an existing infrastructure to AWS using CloudFormation. The environment must be highly available, fault-tolerant, and secure, spread across at least two Availability Zones.

Requirements

VPC & Networking

Create a new VPC named prod-vpc with CIDR block 10.0.0.0/16.

Provision at least two public and two private subnets across two AZs.

Attach an Internet Gateway and configure public route tables.

Deploy a NAT Gateway in one public subnet for private subnet outbound internet access.

Load Balancer & Traffic

Deploy an Elastic Load Balancer (Application Load Balancer preferred).

Accept only HTTPS traffic on port 443 from the internet.

Route traffic to instances in private subnets.

Compute (EC2 + Auto Scaling)

Launch EC2 instances of type t3.micro.

Configure an Auto Scaling Group across at least two AZs.

Scale based on workload fluctuations (min 2, max 4).

Database (RDS)

Deploy a Multi-AZ RDS instance (MySQL or PostgreSQL).

Ensure not publicly accessible.

Subnet group must place DB in private subnets.

Storage (S3)

Create an S3 bucket for backups.

Enable server-side encryption (SSE-S3 or SSE-KMS).

Turn on versioning.

Logging & Monitoring

Configure EC2 instances to send logs to CloudWatch Logs.

Security & IAM

Security groups must allow only HTTPS (443) inbound from internet.

Apply least privilege IAM roles for EC2 and RDS.

No root credentials or hardcoded secrets.

All resources must include the tag: "Environment": "Production".

Constraints

Must be CloudFormation JSON format only.

All resources must follow AWS best practices for security, HA, and scalability.

No YAML, only JSON output.

Ensure logical resource names include the prefix prod-.

Expected Output

A single CloudFormation JSON template named prod-environment-setup.json that:

Deploys without errors in us-east-1.

Fully satisfies the above requirements.

Contains descriptive logical resource names and outputs.