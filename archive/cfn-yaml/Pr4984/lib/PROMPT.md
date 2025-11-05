You have been tasked with migrating an existing infrastructure to a new, highly available, and secure environment on AWS. The stack can be in any region.

Core Requirements & Strict Constraints:
You must generate a CloudFormation YAML template that provisions resources adhering to every one of the following constraints. Do not deviate from these specifications.

Region & Tagging:
All provisioned resources must be tagged with Environment: Production.

VPC and Networking:

Establish a scalable and secure AWS VPC with at least two public and two private subnets across different Availability Zones.

Configure Security Groups to strictly allow only HTTP (port 80) and HTTPS (port 443) inbound traffic to the compute layer.

Compute Layer (EC2):

Deploy an Amazon EC2 Auto Scaling group.

The group must be configured to maintain a minimum of two running instances at all times.

Database Layer (RDS):

Use Amazon RDS for the database.

Automatic backups must be enabled.

An RDS Read Replica must be established in a separate Availability Zone to ensure high availability.

Static Content (S3 & CloudFront):

Store static assets in an Amazon S3 bucket.

Versioning must be enabled for the S3 bucket.

Deliver these assets using an Amazon CloudFront distribution with HTTPS enabled and enforced.

Caching (ElastiCache):

Integrate AWS ElastiCache using the Redis engine for caching purposes.

Serverless & Scheduling (Lambda):

Implement an AWS Lambda function designed to execute periodic tasks.

This Lambda must be triggered on a schedule using CloudWatch Events.

Security & Identity:

IAM: Implement all necessary IAM roles and policies to ensure least-privilege access across all services (EC2, Lambda, RDS, etc.).

WAF: Deploy AWS WAF to protect the CloudFront distribution against common web exploits.

Secrets Manager: Use AWS Secrets Manager for all sensitive configuration data (e.g., database credentials). The template must reference these secrets securely, not contain them directly.

KMS: Apply AWS KMS for data encryption at rest for all services that support it, including RDS, S3, and EC2 volumes.

DNS & Routing (Route 53):

Utilize Route 53 for DNS management, implementing a failover routing policy for high availability.

Monitoring & Compliance:

CloudTrail: Set up AWS CloudTrail to log all API activity within the account.

AWS Config: Implement AWS Config rules to validate that the deployed infrastructure remains compliant with your requirements.

SNS: Create an AWS SNS topic for sending notifications regarding critical resource changes or alarms.

Expected Output:

CloudFormation YAML Template: A single, complete, and well-commented CloudFormation template in YAML format. The template should use parameters for configurable values (like VPC CIDR, instance types) and intrinsic functions (Ref, Fn::GetAtt) to connect resources.

Validation and Testing Plan: After the YAML code block, provide a brief, clear guide on how to validate and test the template. Include the specific AWS CLI commands to check for syntax correctness (aws cloudformation validate-template) and to deploy the stack (aws cloudformation create-stack).