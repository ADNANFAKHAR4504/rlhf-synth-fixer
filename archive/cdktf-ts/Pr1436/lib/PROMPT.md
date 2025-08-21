Please build a secure AWS environment using CDK for Terraform with TypeScript. The infrastructure should follow enterprise security standards and be organized into reusable modules.

## File Structure
Split the implementation into two main files:

### 1. modules.ts
Create reusable infrastructure modules including:
- VPC with public/private subnets
- EC2 instances with proper security
- S3 buckets with encryption
- RDS database setup
- IAM roles and policies
- CloudTrail logging
- CloudWatch monitoring
- Security groups

### 2. tap-stack.ts  
Main stack file that:
- Uses the modules from modules.ts
- Sets configuration parameters
- Defines infrastructure outputs
- Applies naming and tagging standards

## Technical Requirements

### Naming & Tagging
- All resources must start with `corp-` prefix
- Every resource needs `Department: IT` tag
- Use variables instead of hardcoded values

### Network Setup
- Deploy everything in us-east-1 region
- VPC with minimum 2 public and 2 private subnets
- Spread subnets across different availability zones
- NAT gateway for private subnet internet access

### Compute Resources
- EC2 instances: m5.large minimum size
- SSH access only from 203.0.113.0/24 network
- EBS volumes encrypted at rest
- IAM role with S3 read-only permissions

### Storage & Database
- S3 buckets with versioning enabled
- Lifecycle policy: move to Glacier after 30 days
- AWS-managed KMS encryption
- RDS with Multi-AZ deployment and encryption

### Security & Monitoring
- CloudTrail enabled with dedicated S3 bucket
- CloudWatch alarms for 80%+ CPU usage
- Least privilege IAM policies
- No public access except where needed

### Code Quality
- Must pass terraform validate and plan
- Follow AWS best practices
- Modular and reusable code structure
- Proper commenting throughout

## Expected Deliverables
Two TypeScript files that create a complete, secure AWS infrastructure following all specified requirements and constraints.