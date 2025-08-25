Prompt: Secure Multi-Tier Cloud Infrastructure with AWS CloudFormation
Objective:
Design and implement a secure, auditable, and well-architected multi-tier cloud environment using AWS CloudFormation written in YAML. The goal is to enforce security best practices, apply least privilege access, and ensure resource compliance through AWS-native services.

Scope of Work:
You are required to build an AWS infrastructure stack that includes networking, compute, storage, IAM, monitoring, and auditing components. The architecture must span two Availability Zones and support a private application layer, with strong controls and visibility over resource activity.

Key Requirements:
CloudFormation Template:

Use YAML format.

The final output must be a single deployable template: secure-cloudformation-template.yaml.

Network Setup:

Define a VPC with a /16 CIDR block.

Create two public and two private subnets, distributed across two Availability Zones.

Ensure internet access is only available in public subnets via an Internet Gateway and proper route tables.

EC2 Instances:

Deploy one EC2 instance in each private subnet (total of two).

Use Security Groups to restrict SSH access to port 22 from a specific IP range only (e.g., 203.0.113.0/24).

Instances should not have public IPs.

IAM & Security:

Apply the principle of least privilege across all IAM roles and policies.

Create scoped IAM roles for EC2, AWS Config, and CloudTrail where required.

S3 Bucket Configuration:

Create a secure S3 bucket with:

Server-side encryption (SSE-S3 or SSE-KMS).

Block all public access settings.

Optional: Enable versioning and access logging for auditability.

Resource Monitoring & Compliance:

Set up AWS Config to track resource changes and enforce compliance rules (e.g., no public S3 access, IAM best practices).

Include Config Recorder and Delivery Channel setup in the template.

Audit Trail:

Enable AWS CloudTrail to record:

All management and data events.

Across all regions.

Store logs in a secure S3 bucket with encryption and access logging.