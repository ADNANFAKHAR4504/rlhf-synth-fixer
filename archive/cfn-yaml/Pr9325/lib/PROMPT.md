# AWS CloudFormation Template Requirements
Design a secure and highly available AWS CloudFormation YAML template to implement a production-grade infrastructure with robust security controls. The template should create a fully managed, compliant environment that follows security best practices and ensures comprehensive monitoring and threat detection capabilities.

# Environment Setup
- Create a VPC with two public and two private subnets across different availability zones that isolates application workloads
- Configure Security Groups that control inbound and outbound traffic to EC2 instances
- Deploy an Application Load Balancer that distributes traffic across EC2 instances in multiple availability zones
- Set up Auto Scaling Group that launches EC2 instances with IAM roles attached for S3 and CloudWatch access
- Implement IAM roles that are attached to EC2 instances providing minimum required permissions
- Configure S3 buckets with KMS encryption keys for secure data storage
- Set up KMS keys that encrypt S3 buckets and other sensitive resources
- Deploy NAT Gateway in public subnet that provides internet access for instances in private subnets
- Configure CloudWatch Logs that collect application logs from EC2 instances
- Create Launch Template that defines EC2 instance configuration with security groups attached
- Prepend all resource names with SecureApp prefix for consistent identification

# Architecture Connectivity
- IAM Instance Profile attaches to EC2 instances launched by Auto Scaling Group
- Security Groups control access between Load Balancer and EC2 instances
- KMS Key encrypts S3 buckets and application data at rest
- Auto Scaling Group places instances across multiple private subnets for high availability
- Load Balancer receives traffic from internet and forwards to healthy EC2 instances
- EC2 instances write logs to CloudWatch for monitoring and troubleshooting

# Constraints
- Deploy resources using region from environment variable without hardcoded values
- All S3 buckets must have encryption enabled using KMS keys
- IAM roles must implement least privilege access principles
- VPC must have minimum two public and two private subnets for availability
- Security Groups must restrict access to necessary ports only
- AWS KMS must be used for encryption key management across all resources
- Template must pass AWS CloudFormation validation and linting requirements
- Follow company naming convention with SecureApp prefix on all resources

# Output Expectations
- A single, production-ready CloudFormation YAML template that:
  - Implements all security and compliance requirements with KMS encryption
  - Creates a highly available infrastructure with Load Balancer and Auto Scaling across multiple AZs
  - Deploys EC2 instances with IAM roles attached for secure access to AWS services
  - Configures VPC networking with public and private subnets connected through NAT Gateway
  - Uses descriptive logical resource names with SecureApp prefix
  - Follows AWS security best practices and guidelines
  - Enables monitoring through CloudWatch Logs integration
  - Passes AWS CloudFormation validation and cfn-lint checks
