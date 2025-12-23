Build a secure AWS infrastructure using CDK TypeScript that demonstrates security best practices with proper service integration. Deploy an EC2 instance in a VPC private subnet that uses KMS-encrypted EBS volumes and assumes an IAM role with SSM permissions for secure management. Create an S3 bucket encrypted with the same KMS key, accessible through an S3 Access Point that enforces ABAC policies based on principal tags. The security group on the EC2 instance allows SSH access only from a specific IP range (10.0.0.0/16).

Key service integrations:
- EC2 instance connects to Systems Manager (SSM) for secure instance management without SSH keys
- KMS encryption key is shared between EC2 EBS volumes and S3 bucket for centralized key management
- IAM role with least-privilege policies attached to EC2 instance for S3 and SSM access
- S3 Access Point enforces ABAC policies that validate principal tags (environment and department)
- VPC private subnet isolates EC2 instance from internet, with NAT gateway for outbound traffic
- Security group restricts inbound SSH to specific IP range while allowing SSM agent communication

Requirements:
- Deploy in us-west-2 region across multiple availability zones
- Use 'org-' prefix for all resource names
- Target AWS account 123456789012
- Enable KMS key rotation and encryption for all data at rest
- S3 bucket must have versioning enabled and enforce SSL for data in transit
- Tag all resources with environment and department for ABAC access control
- EC2 instance should be managed exclusively through SSM Session Manager

The infrastructure should pass CDK synth validation and deploy successfully with proper resource dependencies. All security configurations must align with AWS Well-Architected Framework security pillar.