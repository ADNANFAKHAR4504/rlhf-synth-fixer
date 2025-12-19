This CloudFormation template provisions a secure, compliant, and highly available production environment in us-east-1. It follows AWS best practices for security, networking, scalability, monitoring, and compliance.

The template has been validated against cfn-lint and aws cloudformation validate-template and is designed for enterprise-grade production workloads.

Key Features
1. Security & IAM

Implements least privilege IAM roles for EC2 and RDS access.

Restricts SSH access via Security Groups to a configurable CIDR.

Uses KMS CMKs with key rotation enabled for encrypting S3, RDS, EBS, and CloudTrail logs.

Enforces TLS (in-transit encryption) for ALB and CloudFront distributions.

2. Networking

VPC (10.0.0.0/16) with public and private subnets across two Availability Zones.

Internet Gateway attached for public subnets.

NAT Gateways configured for outbound internet access from private subnets.

EC2 instances deployed only inside private subnets.

3. Compute & Scaling

EC2 instances launched in an Auto Scaling Group (ASG) with minimum size of 3 instances.

Integrated with CloudWatch alarms to trigger scaling based on CPU utilization.

Bastion host provisioned in public subnet with controlled SSH access.

4. Load Balancing & Traffic Distribution

Application Load Balancer (ALB) distributes inbound HTTP/HTTPS traffic to EC2 instances.

CloudFront distribution configured for caching static content from S3.

5. Storage & Database

S3 buckets with encryption, versioning, and access logging enabled.

Multi-AZ RDS instance (PostgreSQL) with encryption at rest and automated backups.

6. Logging, Auditing & Compliance

CloudTrail enabled with logs delivered to encrypted S3 bucket.

AWS Config rules deployed to monitor compliance with encryption, MFA, IAM, and resource tagging.

CloudWatch Alarms for monitoring EC2 health and scaling events.

SSM Patch Manager configured for automated EC2 patch compliance.

7. Secrets & Configuration Management

AWS SSM Parameter Store (SecureString) used for managing sensitive parameters (DB credentials, API keys).

Lambda functions (if added later) configured with encrypted environment variables.

8. Tagging & Governance

All resources are tagged with:

Environment

Owner

Project

This enforces governance and cost-tracking across the stack.

9. Resilience & Backup

Daily automated RDS backups enabled with retention policy.

EBS snapshots created automatically via Data Lifecycle Manager (DLM).