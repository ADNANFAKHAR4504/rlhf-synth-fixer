Claude Sonnet–style Prompt

Problem:
You are tasked with creating a CloudFormation template in JSON format that defines a secure, production-ready AWS infrastructure.

Background:
Security Configuration as Code is critical in modern cloud environments, ensuring consistent and replicable security measures across all infrastructure components. The generated template will be deployed in a production environment and must follow AWS security and compliance best practices, including encryption, restricted network access, logging, monitoring, and least-privilege IAM policies.

Environment:

AWS region: us-west-2

Target environment: Production

All resources must follow strict access control and tagging standards

Infrastructure must include compute, storage, networking, database, and monitoring services

Constraint Items:

Resources must be deployed in the us-west-2 region.

All S3 buckets must have server-side encryption enabled.

IAM roles must have MFA enforced for access.

Security groups must restrict SSH access to a specific IP range.

EC2 instances must be launched in a VPC with defined subnets.

All resources must have tags including "Environment": "Production".

CloudWatch must have alarms set for all instance metrics.

RDS instances must be placed in a private subnet.

Load Balancers must have access logs enabled.

The template must include an S3 bucket for application logs.

AWS Lambda functions must have encrypted environment variables.

KMS keys must have automatic rotation enabled.

IAM policies must follow the principle of least privilege.

Expected Output:

A valid JSON CloudFormation template

Must meet all constraints listed above

Must be deployable in AWS without errors

Must include inline comments (using Metadata fields) where necessary to explain security configurations