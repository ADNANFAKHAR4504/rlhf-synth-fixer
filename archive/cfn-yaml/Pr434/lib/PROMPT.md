Objective: Generate a comprehensive, secure, and production-ready AWS CloudFormation template in YAML format. The template must provision a multi-tier, highly available, and secure AWS environment in the us-east-1 region, strictly adhering to the principle of least privilege and incorporating robust security best practices.

Core Infrastructure Requirements:

VPC and Networking:

Create a new VPC.

The VPC must span two Availability Zones.

For each Availability Zone, create one public subnet and one private subnet.

Configure Internet Gateway, NAT Gateways (one per AZ for high availability), and appropriate route tables to ensure private subnets have outbound internet access while remaining inaccessible from the public internet.

Compute (EC2 Instances):

Provision a basic EC2 instance in each private subnet.

Security Group for EC2: Create a security group that allows only inbound HTTPS (port 443) traffic from any source (0.0.0.0/0).

SSH Access Control: Implement a separate security group rule that allows inbound SSH (port 22) traffic exclusively from a specified IP range. Use a placeholder for the IP range (e.g., 192.168.10.0/24).

Database (Amazon RDS):

Deploy an Amazon RDS for PostgreSQL database instance.

The RDS instance must be deployed in a Multi-AZ configuration to ensure high availability.

Ensure the database is placed within the private subnets.

Security and Compliance Requirements:

Encryption:

Create a customer-managed AWS KMS Key.

This KMS key must be used to enable encryption at rest for:

The root volumes of the EC2 instances.

The Amazon RDS database instance.

The S3 bucket for logs (as Server-Side Encryption with KMS).

Logging and Auditing:

Enable AWS CloudTrail for the entire region to log all API activity.

Create a centralized S3 bucket to store all logs (e.g., CloudTrail logs, VPC Flow Logs).

S3 Bucket Policy:

Enable Versioning on the bucket.

Enforce Server-Side Encryption using the created KMS key.

Implement a lifecycle policy to ensure logs are retained for a minimum of 365 days and then transitioned to a lower-cost storage class (e.g., Glacier).

Identity and Access Management (IAM):

Least Privilege: Create an IAM Role for the EC2 instances. This role should only have permissions necessary to interact with required services (e.g., write logs to the S3 bucket, access KMS). Do not grant administrative or overly broad permissions.

Access Key Rotation: Implement a mechanism using AWS Secrets Manager to automatically rotate IAM user access keys every 90 days. The template should set up the secret and the rotation schedule.

Tagging:

All resources created by the template (VPC, subnets, EC2, RDS, S3, KMS key, etc.) must be tagged with the key Project and the value SecureApp.

Expected Output:

A single, complete YAML file for the CloudFormation template.

The template must be well-commented, with explanations for each major section (e.g., VPC Configuration, IAM Roles, Security Services).

The final template must be valid and pass checks using cfn-lint.

Include a Parameters section for configurable values like the allowed SSH IP range.

Include an Outputs section to display important created resource IDs, such as the VPC ID, S3 Bucket Name, and EC2 Instance IDs.
