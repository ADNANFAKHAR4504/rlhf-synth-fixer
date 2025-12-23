# CloudFormation Template Implementation

I've created a comprehensive CloudFormation JSON template that implements the secure AWS infrastructure you requested. Here's what's included:

## Network Infrastructure

The template sets up a VPC (10.0.0.0/16) with proper network segmentation:

- Two public subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs for the ALB
- Two private subnets (10.0.10.0/24, 10.0.11.0/24) for EC2 instances
- Two database subnets (10.0.20.0/24, 10.0.21.0/24) for RDS
- Internet Gateway for public subnet internet access
- NAT Gateways in each AZ for private subnet outbound traffic
- VPC Flow Logs enabled for network monitoring

## Compute Resources

Auto Scaling Group configuration:
- Launch Template with latest Amazon Linux 2 AMI
- Instance type varies by environment (t3.small for Dev, t3.medium for Test, t3.large for Prod)
- Scaling based on environment (Dev: 1-2, Test: 1-3, Prod: 2-4)
- User data script installs and configures Apache httpd
- Health checks configured with 5-minute grace period

Application Load Balancer:
- Internet-facing ALB in public subnets
- HTTP listener on port 80
- Target group with health checks on /health endpoint
- Connection draining enabled

## Database

RDS MySQL instance:
- Multi-AZ deployment for high availability
- Storage encrypted with KMS
- Automated backups enabled (7-day retention)
- In private subnets with no public access
- Master credentials stored in Secrets Manager
- Enhanced monitoring enabled

## Security Implementation

Security Groups with least-privilege access:
- ALB: Allows HTTP (80) from internet
- EC2: Allows HTTP from ALB only
- RDS: Allows MySQL (3306) from EC2 instances only

KMS encryption:
- Custom KMS key for encrypting S3, RDS, and CloudTrail logs
- Key rotation enabled
- Proper key policy for service access

IAM Roles:
- EC2 instance role with SSM access for management
- CloudTrail role for logging to CloudWatch
- Config role for compliance monitoring
- All roles follow principle of least privilege

## Compliance and Auditing

CloudTrail:
- Multi-region trail enabled
- Logs stored in S3 with encryption
- CloudWatch Logs integration
- Bucket policy prevents log tampering

AWS Config:
- Configuration recorder for all resources
- Config rules for security checks:
  - RDS encryption required
  - S3 public read/write blocked
  - Unrestricted SSH access check
- Delivery channel to S3 bucket

CloudWatch Alarms:
- IAM policy changes monitoring
- Alarm actions configured for SNS notifications

## Storage

S3 Buckets:
- CloudTrail logs bucket with versioning and encryption
- Config logs bucket with lifecycle policies
- Public access blocked on all buckets
- Server-side encryption with KMS

## Parameters

The template uses CloudFormation parameters for flexibility:
- EnvironmentSuffix: Unique identifier for resources
- Environment: Development/Test/Production
- Owner, CostCenter: For resource tagging
- KeyPairName: For EC2 SSH access
- DBMasterUsername, DBMasterPassword: Database credentials

## Mappings

Region-specific AMI IDs mapped for us-east-1 and us-west-2.

Environment-specific configurations for instance types and scaling limits.

## Outputs

The template exports key resource information:
- VPC ID and CIDR
- Subnet IDs for all tiers
- ALB DNS name and ARN
- RDS endpoint and port
- KMS key ID and ARN
- Security group IDs
- S3 bucket names

All resources are tagged with Environment, Owner, CostCenter, and ManagedBy tags for proper organization and cost tracking.

The template is production-ready and can be deployed using CloudFormation without any manual configuration steps.
