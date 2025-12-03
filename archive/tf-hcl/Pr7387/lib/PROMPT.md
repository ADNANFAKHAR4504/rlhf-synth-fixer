Problem Context

You must create a single-file Terraform configuration (main.tf) that fully implements a multi-region high-availability AWS infrastructure required entirely in Terraform.

The infrastructure must be consistently deployed in us-east-1 and eu-west-1 using Terraform resources, modules, and provider aliasing.
The environment requires high availability, disaster recovery, and replication across regions using AWS security and architectural best practices.

The system hosts a production-grade web application and requires network isolation, autoscaling compute, secure storage, and multi-AZ database redundancy. All storage and traffic paths must be encrypted and restricted.

The Terraform configuration must deploy identical infrastructure in both regions, parameterized for environment-specific variations (prod/dev), and must support repeatable deployments using techniques comparable to CloudFormation StackSets.


Core Implementation Requirements

Your Terraform code must include:

1. Multi-Region Setup

Implement providers for both us-east-1 and eu-west-1 using alias.

Deploy identical VPC, subnets, routing, security groups, ASGs, and RDS in both regions.

2. VPC & Networking

One dedicated VPC per region with proper CIDR blocks.

Public and private subnets.

Secure security groups and NACLs restricting ingress to ports 80 and 443 only.

NAT gateways and internet gateways as necessary.

3. EC2 Auto Scaling Group

ASG in each region with:

Min size: 2

Max size: 5

Latest Amazon Linux 2 AMI (use data source).

Launch template with IAM instance profile, encrypted EBS volumes, and secure SGs.

4. RDS Multi-AZ

Deploy multi-AZ RDS instance (PostgreSQL or MySQL).

Encrypted storage mandatory.

Place in private subnets.

No deletion protection (IMPORTANT).

5. S3 Configuration Storage

S3 bucket in each region with:

Versioning enabled

Public access blocked

KMS encryption enabled

Restricted IAM bucket policies.

6. Logging & Monitoring

CloudWatch log groups for application logs.

EC2 and RDS logging where supported.

7. Security Best Practices

Encrypted storage everywhere (EBS, RDS, S3).

Restricted access policies.

No public subnets except where absolutely required.

IAM least privilege for roles and instance profiles.

8. Deployment & Replication Requirements

Code must mimic “StackSets-like” behavior using:

Two AWS providers

Reusable modules (inside the same file)

Everything must be structured so re-deployments cause minimal downtime.

Must be safe for repeated applies (idempotent).

9. Naming Conventions

Use prefixes:

prod- for production

dev- for development

Apply naming patterns consistently across all resources.

10. Important Constraint

Do NOT enable deletion protection on any resource.

Constraint Items

Deploy identical infrastructure across multiple regions.
Ensure all resources comply with AWS security best practices, including encrypted storage and secure access policies.
Implement deployment using parameterized variables for region/environment.
Use S3 with versioning and restricted access.
Restrict SGs to ports 80/443 only for web servers.
ASG min=2/max=5.
Instances must use latest Amazon Linux 2 AMI.
Multi-AZ RDS required.
CloudWatch logging required.
Ensure zero data loss using Terraform best practices.
Deletion protection must be disabled everywhere.
Add a terraform block that sets required_version = ">= 1.5.0" and configure the AWS provider inside required_providers with version = "~> 5.0".

Expected Output

you must generate:

A single, complete, production-ready Terraform file (main.tf) that includes:

All providers

All resources

All modules (even if inline)

Variables and locals

Regional duplication logic

Networking

ASG

RDS multi-AZ

S3 with versioning

CloudWatch Logs

IAM roles and instance profiles

Comments explaining structure and parameter usage

No external files (everything must be self-contained)


Output Instructions
Generate a single-file Terraform configuration (main.tf) implementing all requirements above.
Ensure the output is formatted as valid Terraform HCL code 
Include comments throughout explaining key security best practices.
Do not summarize or break into sections — produce one full Terraform file as the output.