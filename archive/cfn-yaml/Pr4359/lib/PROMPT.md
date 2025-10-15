You are tasked with generating a complete AWS CloudFormation YAML template that provisions a secure, highly available web application infrastructure.
Follow the technical and security requirements below precisely. The template must be valid YAML and pass CloudFormation validation.
create a single YAML file with all the resource in that

Infrastructure Requirements


-IAM & Access Control:

Implement least privilege IAM policies for all users, roles, and permissions.
Avoid wildcard permissions. Use specific actions and resources

-Encryption:

Encrypt all data at rest with AWS KMS,
Encrypt all data in transit using SSL/TLS.

-Logging & Monitoring:

Enable AWS CloudTrail for auditing API calls.

Enable VPC Flow Logs for network traffic monitoring,

Enable S3 access logging for storage activity.

Send logs to a central, encyrpted S3 bucket.

-Networking (VPC):

Create a VPC with at least two public and two private subnets across different Availability Zones for high availability.
Attach an Internet Gateway for the public subnets.

-NAT Gateway:

deploy a NAT Gateway in the public subnet to allow private subnets secure outbound internet access.

-Application Security:

Deploy AWS WAF and integrate it with the application’s load balancer or CloudFront distribution.

Enable AWS Shield for DDoS protection.

-Storage (S3):

Create all S3 buckets with versioning enabled.

Enable encryption at rest (KMS) and access logging.

-Network Security:

Create Security Groups that allow inbound traffic only on:

Port 80 (HTTP

Port 443 (HTTPS)

Port 22 (SSH)

Outbound traffic should be restricted to necessary destinations only.

-Database Layer:

Use Amazon RDS for database management (engine of your choice).

Place RDS instances in private subnets.

Enable automatic backups and encryption.

General Best Practices:

Use parameters, mappings, and outputs logically.

Ensere all resource dependencies are correctly defined.

Include descriptive logical names.

Follow AWS security and reliability best practices.

The template should deploy successfully without manual edits.

Expected Output

A production-ready CloudFormation YAML template implementing all the requirements above;

it must be syntactically valid, logically consistent, and deployable in AWS as-is.

do not include explanations or commentary just only the yaml CloudFormation code.