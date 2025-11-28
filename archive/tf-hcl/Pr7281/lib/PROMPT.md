Problem Context

You must generate a single-file Terraform configuration (main.tf) that implements a production-grade, multi-region-ready AWS infrastructure.

we must implement everything ONLY in Terraform.

The stack must provide high availability, multi-AZ resilience, secure IAM roles, monitoring, replication support, and operational best practices suitable for an enterprise production system running in us-east-1.
All resources must follow corporate security/compliance rules and tagging conventions.

Core Implementation Requirements

You must write Terraform code that implements all of the following:

1. VPC + Subnets

Create a VPC in us-east-1

At least two subnets placed in different availability zones

Subnets must support multi-AZ high availability

Add routing, IGW, NAT (if required), and basic networking

2. EC2 High-Availability Setup

EC2 instances must be:

Amazon Linux 2

t3.micro

Spread across multiple AZs

Must be placed inside an Auto Scaling Group

Must include a Launch Template with encrypted root volume

Must include security groups with least privilege

CloudWatch alarms must monitor:

High CPU usage

CloudWatch alarms must publish notifications to SNS topic

3. RDS High-Availability Setup

Multi-AZ RDS instance, encrypted at rest

Automatic failover enabled

Backup retention = 7 days

No deletion protection

Must be deployed inside private subnets

Must use a parameter group & subnet group

4. IAM

IAM roles must follow:

Principle of least privilege

Restrictive minimal policies

Roles for EC2 & RDS access where required

5. S3

Create an S3 bucket with:

Server-side encryption (AWS-managed keys)

Versioning enabled (optional)

Block public access

No sensitive outputs

6. Monitoring & Alerting

CloudWatch CPU alarm for EC2

SNS Topic for alarm notifications

Subscription example (email) kept generic

7. Tagging Requirements

All resources must include:

Environment = "Production"
Project     = "CorpApp"

8. No Sensitive Outputs

Do NOT output instance IDs, IPs, hostnames, etc.

Only output non-sensitive metadata (if needed)

9. No Deletion Protection

NONE of the resources should have:

RDS deletion protection

S3 versioning lock

Autoscaling termination protection

Anything similar


Constraints

Your Terraform code MUST:

Be fully contained in a single file named main.tf

Be valid for AWS provider version ~> 5.x

Work in us-east-1

Pass terraform init, terraform validate, and terraform plan

Enable encryption-at-rest for:

EC2 EBS

RDS

S3

Implement multi-AZ availability

Implement IAM least-privilege

Include CloudWatch + SNS monitoring

Support Auto Scaling

Avoid ANY sensitive values in outputs

Include tagging for corporate standards

Expected Output

Produce a COMPLETE, production-ready single Terraform file implementing:

VPC + Subnets + Routing

EC2 Launch Template + ASG

IAM roles + restrictive policies

RDS multi-AZ encrypted instance

S3 bucket with SSE

CloudWatch Alarms

SNS Notifications

All required tags

All constraints above

No deletion protection

No sensitive outputs

Output Instructions
Generate a single-file Terraform configuration (main.tf) implementing all requirements above.
Ensure the output is formatted as valid Terraform HCL code 
Include comments throughout explaining key security best practices.
Do not summarize or break into sections — produce one full Terraform file as the output.