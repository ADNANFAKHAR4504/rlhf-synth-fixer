Prompt: Generate a Cross-Account, Parameterized AWS CloudFormation Template

Task:

You are tasked with generating a fully deployable, production-grade AWS CloudFormation YAML template that sets up a highly available and secure AWS environment in the us-east-1 region.

The environment must include networking, security, compute access, storage, and database components — all defined in a single CloudFormation template.

Requirements

The CloudFormation stack must create and configure the following resources:

VPC

CIDR: 10.0.0.0/16

Public Subnets

Two public subnets, each in different Availability Zones

CIDRs: 10.0.1.0/24 and 10.0.2.0/24

Private Subnets

Two private subnets, each in different Availability Zones

CIDRs: 10.0.3.0/24 and 10.0.4.0/24

Internet Gateway

Create and attach it to the VPC

Elastic IP + NAT Gateway

Allocate an Elastic IP

Deploy NAT Gateway in one of the public subnets

Route Tables

Public route table → route 0.0.0.0/0 → Internet Gateway

Private route table → route 0.0.0.0/0 → NAT Gateway

Associate route tables with their respective subnets

Security Group

Allow inbound HTTP (80) and HTTPS (443) from anywhere

Allow all outbound traffic

IAM Role and Instance Profile

IAM role for EC2 or other instances to access S3

Attach inline policy for S3 list/get/put/delete on the created bucket

S3 Bucket

Enable versioning

Must block all public access

RDS (MySQL)

Deploy in private subnets

Multi-AZ and automated backups enabled

Specify instance class, engine version, backup retention, and credentials as parameters

Public access disabled

DynamoDB Table

Table name parameterized

ReadCapacityUnits = 5

WriteCapacityUnits = 5

Primary key: id (String)

Constraints

Cross-Account Executability:
The template must deploy successfully in any AWS account or region without modification.

No Hardcoding:
Absolutely no hardcoded ARNs, Account IDs, Region names, or specific resource names.
All configurable or unique identifiers (like S3 bucket names) must use parameters or pseudo parameters (e.g., ${AWS::AccountId}, ${AWS::Region}).

Parameterization:
Any user-supplied values (CIDRs, DB credentials, bucket name, etc.) must be defined as CloudFormation Parameters.

Security and Availability:
All subnets must span multiple AZs.
No public exposure of private components (RDS, DynamoDB).
S3 bucket must have versioning and public access blocked.
RDS must be Multi-AZ and have automated backups.