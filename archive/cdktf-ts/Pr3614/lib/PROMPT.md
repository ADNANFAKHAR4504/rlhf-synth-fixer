
Create a production-ready AWS CDKTF project in TypeScript for multi-tier AWS environment in the us-west-2 region.

FILE STRUCTURE:
lib/tap-stack.ts — Main stack that composes and instantiates all modules
lib/modules.ts — Contains all reusable modular constructs (VPC, ASG, ALB, RDS, S3, IAM, CloudWatch)

FUNCTIONAL REQUIREMENTS:

Networking
- VPC: CIDR 10.0.0.0/16; 2 public and 2 private subnets across 2 Availability Zones; Internet Gateway; NAT Gateway; Route tables (public & private)

Auto Scaling Group (ASG):
- Deploy EC2 instances in private subnets
- Use latest Amazon Linux 2 AMI (fetched via SSM parameter)
- Integrate with ALB for load balancing
- Attach IAM role with least privilege: read DB credentials from Secrets Manager; send logs to CloudWatch

Application Load Balancer (ALB):
- Deployed in public subnets
- Accept HTTPS traffic only
- Uses ACM certificate for SSL termination (allow ARN input variable or domain-based creation)
- Access logs stored in S3 (encrypted bucket)

RDS MySQL Database:
- Deployed in private subnets
- Multi-AZ enabled for high availability
- Automatic minor version upgrades ON
- Encrypted at rest
- Access restricted only to EC2 instances via Security Group
- No public access

Security:
- Implement Security Groups and IAM Roles/Policies following least privilege:
  - EC2: read DB secrets and send logs
  - ALB: allows HTTPS from 0.0.0.0/0
  - RDS: inbound only from EC2 security group
- Enforce encryption and block public access where applicable

S3 Bucket (for ALB logs):
- Encryption enabled
- Public access blocked
- Lifecycle policies: transition to infrequent access; expire after defined period
- Configured as ALB access log destination

Secrets Management:
- Use AWS Secrets Manager to securely store RDS credentials
- No hardcoded passwords
- Secrets retrieved dynamically in EC2 UserData

CloudWatch Dashboard:
- Create a centralized CloudWatch Dashboard showing EC2, RDS, and ALB metrics

Tagging
- Apply consistent tag: Environment = Production