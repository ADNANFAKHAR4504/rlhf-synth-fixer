# AWS Nova Model Breaking - Secure Infrastructure Solution

This solution provides a production-ready, secure AWS environment using CloudFormation YAML that meets all specified security requirements and follows industry best practices.

## Solution Overview

The CloudFormation template creates a secure AWS environment with:

- **Region Compliance**: All resources deployed in us-west-2 region
- **IAM Security**: Application-specific roles with least privilege access
- **Network Security**: Restricted SSH access from specific IP ranges only
- **S3 Security**: Encrypted buckets with access logging and no public access
- **KMS Encryption**: Customer-managed KMS keys for S3 encryption
- **Monitoring**: CloudWatch logs with appropriate retention policies

## Infrastructure Components

### Security & Encryption
- **KMS Key**: Customer-managed encryption key for S3 buckets
- **KMS Alias**: Named alias for easier key management

### Storage
- **Main S3 Bucket**: Primary storage with encryption, versioning, and access logging
- **Access Logs Bucket**: Dedicated bucket for S3 access logs

### Networking
- **VPC**: Private network (10.0.0.0/16) with DNS resolution enabled
- **Public Subnet**: Single subnet (10.0.1.0/24) in us-west-2a
- **Internet Gateway**: Provides internet access for the public subnet
- **Route Tables**: Proper routing configuration for internet access

### Security Groups
- **SSH Security Group**: Restricts SSH access to 203.0.113.0/24 CIDR only
- **Egress Rules**: Limited to HTTP (80) and HTTPS (443) outbound traffic

### IAM Roles & Policies
- **EC2 Instance Role**: Minimal permissions for S3 access and CloudWatch logging
- **Lambda Execution Role**: Basic Lambda execution with read-only S3 access
- **Instance Profile**: EC2 instance profile for role attachment

### Monitoring
- **CloudWatch Log Group**: Application logs with 30-day retention

## Security Features Implemented

### 1. Region Enforcement
- Explicit deployment in us-west-2 region
- Region validation condition in CloudFormation template
- Hardcoded availability zone (us-west-2a) for subnet placement

### 2. IAM Least Privilege
- **EC2 Role Permissions**:
  - S3 object operations (GetObject, PutObject, DeleteObject) on main bucket only
  - S3 ListBucket permission on main bucket only
  - KMS Decrypt and GenerateDataKey for S3 encryption key only
  - CloudWatch Logs permissions for application logging only

- **Lambda Role Permissions**:
  - AWS managed AWSLambdaBasicExecutionRole only
  - S3 GetObject and ListBucket permissions on main bucket only
  - KMS Decrypt permission for S3 encryption key only

- **No Wildcard Permissions**: All policies use specific resource ARNs

### 3. Network Security
- **SSH Access**: Only port 22 from 203.0.113.0/24 CIDR block
- **No Other Inbound**: No additional inbound rules configured
- **Limited Outbound**: Only HTTP/HTTPS for package updates and secure communications

### 4. S3 Security
- **Public Access Blocked**: All four public access block settings enabled
- **Encryption at Rest**: KMS encryption with customer-managed key
- **Access Logging**: All access logged to dedicated logging bucket
- **Versioning**: Object versioning enabled for data protection
- **Bucket Policy**: Secure logging configuration with account restrictions

### 5. Encryption
- **S3 Encryption**: SSE-KMS with customer-managed key
- **Key Rotation**: Configurable through KMS key policy
- **Service Access**: Specific KMS permissions for EC2 and Lambda roles

## File Structure

```
lib/
├── TapStack.yml          # Main CloudFormation template
├── TapStack.json         # JSON version of template (auto-generated)
└── AWS_REGION            # Target region file (us-west-2)

test/
├── tap-stack.unit.test.ts    # Unit tests for template validation
└── tap-stack.int.test.ts     # Integration tests for deployed resources
```

## Deployment Instructions

### Prerequisites
- AWS CLI configured with appropriate permissions
- Access to us-west-2 region
- CloudFormation deployment permissions

### Validation
```bash
# Validate template syntax
cfn-lint lib/TapStack.yml

# Validate template with AWS
aws cloudformation validate-template --template-body file://lib/TapStack.yml --region us-west-2
```

### Deployment
```bash
# Set environment variables
export AWS_REGION=us-west-2
export ENVIRONMENT_SUFFIX=dev

# Deploy stack
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStackdev \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides EnvironmentSuffix=dev \
  --region us-west-2
```

### Post-Deployment Validation
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

## Template Outputs

The template provides the following outputs for integration with other systems:

- **VPCId**: VPC identifier for network configurations
- **PublicSubnetId**: Subnet for EC2 instance placement
- **SSHSecurityGroupId**: Security group for SSH access
- **MainS3BucketName**: Primary bucket name for application use
- **MainS3BucketArn**: Bucket ARN for IAM policies
- **EC2InstanceRoleArn**: Role ARN for EC2 instance attachment
- **EC2InstanceProfileArn**: Instance profile for EC2 launch
- **LambdaExecutionRoleArn**: Role ARN for Lambda functions
- **KMSKeyId**: Encryption key ID for S3 operations
- **KMSKeyArn**: Encryption key ARN for cross-account access

## Customization Parameters

The template accepts the following parameters for customization:

- **ProjectName**: Default "nova-model-breaking" (used for resource naming)
- **Environment**: Default "prod" (dev/staging/prod options)
- **KMSKeyAlias**: Default "nova-s3-encryption" (KMS key alias)
- **SSHCidrIp**: Default "203.0.113.0/24" (SSH access CIDR block)

## Security Compliance

This solution meets all specified requirements:

✅ **Region**: All resources deployed in us-west-2
✅ **IAM Roles**: Application-specific with least privilege
✅ **No Wildcards**: All permissions use specific resource ARNs
✅ **Security Groups**: SSH only from 203.0.113.0/24
✅ **S3 Security**: Server access logging enabled
✅ **Public Access**: Blocked on all buckets
✅ **Encryption**: SSE-KMS enabled on all buckets

## Testing Strategy

### Unit Tests
- Template structure validation
- Resource property verification
- Security configuration validation
- IAM policy least privilege verification
- Tagging compliance checks

### Integration Tests
- Actual resource deployment verification
- Security group rule validation
- S3 bucket configuration testing
- IAM role functionality testing
- KMS key operation testing
- CloudWatch logs verification

## Best Practices Implemented

1. **Defense in Depth**: Multiple security layers (network, IAM, encryption)
2. **Principle of Least Privilege**: Minimal required permissions only
3. **Explicit Deny**: No implicit allow rules in security configurations
4. **Audit Trail**: Comprehensive logging for all S3 access
5. **Encryption Everywhere**: Data at rest and in transit protected
6. **Resource Tagging**: Consistent tagging for management and billing
7. **Parameterization**: Configurable template for different environments

This solution provides a secure, compliant, and production-ready AWS environment that can serve as a foundation for applications requiring strict security controls.