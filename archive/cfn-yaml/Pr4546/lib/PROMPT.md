Role: You are a Principal Cloud Security Architect with deep expertise in AWS and Infrastructure as Code (IaC). Your primary responsibility is to design and build secure, compliant, and resilient cloud environments using AWS CloudFormation.

Objective: Generate a single, comprehensive, and production-ready AWS CloudFormation template in YAML format. This template must provision a secure AWS environment that strictly adheres to the detailed list of security and operational requirements provided below. The final output must be a valid template named security_configuration.yaml.

Core Scenario & Requirements
Problem Statement: As a cloud engineer tasked with ensuring robust security configurations across your AWS environment, you must create a CloudFormation template that enforces a baseline of security best practices. The template must be self-contained and address networking, data protection, access control, monitoring, and high availability.

Strict Mandates:
You must implement every single one of the following constraints within the CloudFormation template. There are no exceptions.

Data Protection:

Utilize AWS Server-side Encryption (SSE), preferably with AWS KMS (SSE-KMS), to protect all data at rest for services like S3, EBS, and RDS.

All defined S3 buckets must have the 'Block all public access' setting enabled at the bucket level.

Enable AWS CloudTrail logging for the account, ensuring the trail's target S3 bucket is encrypted and configured with a lifecycle policy to archive logs.

Securely store and manage secrets (e.g., RDS master password) using AWS Secrets Manager. Do not hardcode secrets.

Networking & Access Control:

Establish a new VPC with both public and private subnets distributed across at least two Availability Zones.

The Security Group for EC2 instances must restrict SSH (port 22) access to a single, specified IP address/CIDR block, which will be a template parameter.

Implement an AWS WAF WebACL and associate it with an Application Load Balancer to protect web applications from common vulnerabilities (e.g., SQL injection, cross-site scripting).

Identity & Access Management (IAM):

Ensure that all newly created IAM roles are attached with IAM policies that grant, at most, read-only access (s3:GetObject, s3:ListBucket) to S3 buckets.

Compute & Database:

Implement an Auto Scaling group for EC2 instances, configured to launch instances across the multiple private subnets for high availability.

Ensure all EC2 instances are launched with detailed monitoring enabled.

Deploy an Amazon RDS database instance within a private subnet. The RDS instance must have automated backups enabled.

Monitoring & Compliance:

Implement at least two AWS Config rules to monitor compliance with security best practices (e.g., s3-bucket-public-read-prohibited, encrypted-volumes).

Configure CloudWatch alarms to trigger on specific unauthorized or unusual account activities (e.g., root account usage, IAM policy changes). Use a CloudWatch Metric Filter on the CloudTrail trail to detect these events.

Management & Operations:

Use AWS Certificate Manager (ACM) to provision an SSL/TLS certificate and associate it with the listener of an Application Load Balancer.

Ensure all created resources that support tagging have a consistent set of tags for cost tracking and ownership identification (e.g., Owner, Project, CostCenter).

Instructions for Template Generation
Format and Naming: The output must be a single, valid CloudFormation template in YAML format. The logical filename is security_configuration.yaml.

Parameters: Make the template reusable by defining parameters for key inputs, such as:

VpcCidrBlock (e.g., 10.0.0.0/16)

SshAllowedCidr (The specific IP address for SSH access)

DbInstanceClass (e.g., db.t3.micro)

DbMasterUsername

DomainName for the ACM certificate.

Tag values for Owner, Project, etc.

Secrets Handling: For the DbMasterPassword, use AWS Secrets Manager to generate a secret. The RDS resource should then retrieve the master password from this secret. Do not use a NoEcho parameter in CloudFormation for the password.

Structure and Readability: Logically group resources within the Resources section using comments (e.g., ### NETWORKING ###, ### SECURITY & COMPLIANCE ###, ### COMPUTE ###). Use clear, descriptive Logical IDs for all resources.

Outputs: Create an Outputs section to export critical resource information, such as the Application Load Balancer DNS name, the VPC ID, and the S3 bucket name for logs.

Your final response should be only the complete YAML code block for the CloudFormation template.