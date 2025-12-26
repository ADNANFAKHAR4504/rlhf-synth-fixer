## CloudFormation Template - Secure AWS Infrastructure

The initial CloudFormation template creates a secure AWS infrastructure for production environments with the following components:

### Infrastructure Components

1. **VPC and Networking**
   - VPC with CIDR 10.0.0.0/16
   - Public and Private subnets
   - Internet Gateway and routing configuration

2. **Compute Resources**
   - EC2 instance deployed in public subnet
   - Security group restricting SSH access to specified CIDR
   - IAM role with least privilege access
   - Encrypted EBS volume

3. **Storage**
   - Primary S3 bucket with KMS encryption and versioning
   - Access logs S3 bucket
   - CloudTrail S3 bucket for audit logs

4. **Security and Auditing**
   - CloudTrail for API monitoring
   - IAM roles following least privilege principle
   - Security groups with restricted access
   - All resources tagged with Environment: Production

### Template Structure

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS Infrastructure for Production Environment'

Parameters:
  - AllowedSSHCIDR (SSH access CIDR block)
  - InstanceType (EC2 instance type)
  - KeyPairName (SSH key pair)

Resources:
  - VPC with public/private subnets
  - EC2 instance with security group
  - IAM roles and instance profile
  - KMS key for S3 encryption
  - Three S3 buckets (secure, logs, cloudtrail)
  - CloudTrail configuration

Outputs:
  - VPCId
  - EC2InstanceId
  - EC2PublicIP
  - S3BucketName
  - CloudTrailArn
  - SecurityGroupId
```