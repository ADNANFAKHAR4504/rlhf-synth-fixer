# AWS Infrastructure Requirements

We need to set up secure AWS infrastructure using Terraform CDK with TypeScript for hosting our web application. The setup should follow AWS security best practices and be ready for production use.

## Infrastructure Components

### Network Setup
- VPC called "secure-network" in us-west-2 region
- Public subnets for web tier
- Internet gateway for public access
- Proper route tables

### Security Configuration
Security groups should:
- Allow HTTP (port 80) and HTTPS (port 443) inbound
- Allow outbound traffic for web server responses and external API calls

Network ACLs need to:
- Follow AWS best practices for public subnet traffic restrictions

### Server Configuration
- EC2 instance in the public subnet
- Attach the security group we create
- Instance needs internet access through the IGW
- Keep IAM permissions minimal - only what's needed

### Storage Requirements
- S3 bucket for application logs
- Server-side encryption enabled (AES-256 or KMS)
- EC2 instance should have write-only access to this bucket

### Access Management
- IAM role for the EC2 instance
- Policy should only grant s3:PutObject permission to the log bucket
- Follow least privilege principle

### Resource Tagging
Tag all resources with:
Environment = "Production"

## Implementation Notes
The code should be modular and easy to understand. Make sure everything follows TypeScript best practices for CDK development.

Let me know if you need clarification on any of these requirements.