You are an expert AWS CloudFormation engineer.
Your task is to write a single, production-ready CloudFormation template in YAML that configures a secure and compliant application infrastructure environment.

Language & Platform

Language: YAML

Platform: AWS CloudFormation - no SAM, no CDK

Reference: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/Welcome.html

Service Architecture & Data Flow

The application infrastructure connects services in this pattern:

Lambda functions deployed in private VPC subnets query the RDS database for application data and store processing results in S3 buckets. All data is encrypted at rest using KMS keys. CloudWatch Logs capture Lambda execution logs for monitoring and debugging. EC2 instances deployed in the VPC provide additional compute capacity with security groups restricting access to specific IP ranges. SSM Parameter Store securely stores database credentials and other sensitive configuration values that Lambda functions retrieve at runtime.

Environment & Constraints

All resources must deploy to us-east-1.

IAM Roles must follow the principle of least privilege.

All resources must be tagged with Environment, CostCenter, Owner, and Project for governance.

All S3 buckets must enable server-side encryption with KMS managed keys and versioning.

Lambda functions must run inside a VPC and use environment variables for configuration.

RDS instances must not be publicly accessible and must enable encryption at rest.

Security groups must allow inbound access only from specific IP ranges.

Sensitive values must be stored in SSM Parameter Store.

CloudWatch Logs must be enabled for Lambda function monitoring.

Resources to Include

VPC with public and private subnets across multiple availability zones

Internet Gateway and route tables for network connectivity

Multiple Lambda functions deployed in VPC with environment variables and least-privilege IAM roles

RDS MySQL instance in private subnet with encryption and backup retention

Multiple S3 buckets with KMS encryption, versioning, and lifecycle policies

SSM Parameter Store parameters for sensitive values (database credentials)

KMS encryption keys with proper key policies

Security groups with restricted CIDR ranges

CloudWatch Log Groups for Lambda function logging

IAM roles for Lambda and EC2 with explicit permissions

Additional Implementation Notes

Use Parameters for Environment configuration.

Apply comprehensive tagging (Environment, CostCenter, Owner, Project, ManagedBy) to all resources.

Ensure least-privilege IAM policies for Lambda roles with explicit KMS and S3 actions.

Follow AWS Well-Architected Framework security best practices.

Configure RDS with 7-day backup retention and automated backups.

Enable S3 lifecycle policies for cost optimization.

Expected Output
Produce only a valid .yaml CloudFormation template inside a fenced code block
