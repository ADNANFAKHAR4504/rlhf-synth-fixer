# Secure Multi-Tier Cloud Infrastructure Solution

This CloudFormation template implements a comprehensive secure multi-tier cloud infrastructure that meets all the requirements specified in the prompt. The solution provides a robust, auditable, and well-architected environment using AWS-native services with strong security controls and visibility.

## Architecture Overview

The infrastructure implements a secure multi-tier architecture spanning two Availability Zones with the following components:

### Network Layer
- **VPC**: 10.0.0.0/16 CIDR block with DNS support
- **Public Subnets**: Two subnets (10.0.1.0/24, 10.0.2.0/24) in different AZs for NAT Gateways
- **Private Subnets**: Two subnets (10.0.10.0/24, 10.0.11.0/24) in different AZs for EC2 instances
- **Internet Gateway**: Provides internet access to public subnets
- **NAT Gateways**: Two NAT Gateways (one per AZ) for outbound internet access from private subnets
- **Route Tables**: Properly configured routing for public and private subnets

### Compute Layer
- **EC2 Instances**: Two instances deployed in private subnets across different AZs
- **Security Groups**: Restrictive security group allowing SSH access only from specified CIDR (203.0.113.0/24)
- **IAM Instance Profile**: Least privilege IAM role with SSM access and CloudWatch logging permissions
- **CloudWatch Agent**: Pre-configured for comprehensive monitoring and logging

### Storage Layer
- **Application S3 Bucket**: Encrypted with SSE-S3, versioning enabled, public access blocked
- **Config S3 Bucket**: Dedicated bucket for AWS Config history and snapshots
- **CloudTrail S3 Bucket**: Dedicated bucket for audit trail logs
- **Access Logs Bucket**: Centralized bucket for S3 access logging

### Security and Compliance
- **AWS Config**: Complete resource tracking with compliance rules
- **CloudTrail**: Multi-region audit trail with log file validation
- **IAM Roles**: Least privilege access policies for all services
- **Encryption**: All storage encrypted at rest
- **Network Security**: Private instances with no public IP addresses

### Monitoring and Logging
- **CloudWatch Log Groups**: Separate log groups for instances, S3 access, and CloudTrail
- **Retention Policies**: Tiered retention (30 days for instances, 90 days for S3, 365 days for CloudTrail)
- **CloudWatch Agent**: Automated metric and log collection from EC2 instances

## Implementation Files

### CloudFormation Template: `lib/TapStack.yml`

The complete CloudFormation template implements all required infrastructure components following AWS best practices for security, monitoring, and compliance.

## Deployment Instructions

### Prerequisites
1. AWS CLI configured with appropriate permissions
2. CloudFormation permissions for IAM, EC2, S3, Config, and CloudTrail
3. Python and pipenv for linting (optional)

### Deployment Commands

1. **Validate the template:**
```bash
# Lint the CloudFormation template
pipenv run cfn-lint lib/TapStack.yml --regions us-east-1

# Convert to JSON for unit tests
pipenv run cfn-flip lib/TapStack.yml > lib/TapStack.json
```

2. **Deploy the stack:**
```bash
# Set environment variables
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1

# Deploy using AWS CLI
aws cloudformation deploy \
  --template-file lib/TapStack.yml \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
  --tags Repository=iac-test-automations CommitAuthor=claude
```

3. **Collect deployment outputs:**
```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs' \
  --output json > cfn-outputs/stack-outputs.json

# Convert to flat format for testing
node -e "
const outputs = require('./cfn-outputs/stack-outputs.json');
const flat = {};
outputs.forEach(o => flat[o.OutputKey] = o.OutputValue);
require('fs').writeFileSync('cfn-outputs/flat-outputs.json', JSON.stringify(flat, null, 2));
"
```

4. **Run tests:**
```bash
# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration
```

5. **Clean up resources:**
```bash
# Empty S3 buckets first (if they contain objects)
aws s3 rm s3://secure-app-bucket-{ACCOUNT-ID}-{REGION}-${ENVIRONMENT_SUFFIX} --recursive
aws s3 rm s3://config-bucket-{ACCOUNT-ID}-{REGION}-${ENVIRONMENT_SUFFIX} --recursive
aws s3 rm s3://cloudtrail-bucket-{ACCOUNT-ID}-{REGION}-${ENVIRONMENT_SUFFIX} --recursive
aws s3 rm s3://access-logs-bucket-{ACCOUNT-ID}-{REGION}-${ENVIRONMENT_SUFFIX} --recursive

# Delete the stack
aws cloudformation delete-stack --stack-name TapStack${ENVIRONMENT_SUFFIX}
```

## Security Features Implemented

### 1. Network Security
- **Private Subnet Deployment**: EC2 instances have no public IP addresses
- **Restricted Security Groups**: SSH access limited to specific CIDR range (203.0.113.0/24)
- **NAT Gateway Architecture**: Outbound internet access through NAT Gateways in public subnets
- **Multi-AZ Design**: Resources distributed across two Availability Zones for resilience

### 2. Data Protection
- **S3 Encryption**: All buckets use server-side encryption with AES-256
- **Public Access Blocking**: All S3 buckets have public access completely blocked
- **Versioning**: Application bucket has versioning enabled for data protection
- **Access Logging**: Centralized S3 access logging for audit trails

### 3. Identity and Access Management
- **Least Privilege IAM**: All roles follow least privilege principles
- **Service-Specific Roles**: Separate roles for EC2, Config, and CloudTrail services
- **Instance Profile**: EC2 instances use IAM instance profiles instead of access keys
- **SSM Integration**: EC2 instances support AWS Systems Manager for secure access

### 4. Monitoring and Auditing
- **AWS Config**: Complete resource configuration tracking with compliance rules
- **CloudTrail**: Multi-region audit trail with log file validation
- **CloudWatch Logging**: Comprehensive logging with appropriate retention policies
- **Compliance Rules**: Automated checks for S3 public access, root keys, and security groups

### 5. Operational Security
- **CloudWatch Agent**: Automated metric and log collection from EC2 instances
- **Log Retention**: Tiered retention policies based on data sensitivity
- **Resource Tagging**: Consistent tagging for cost allocation and governance
- **Environment Isolation**: Resource naming includes environment suffix for separation

## Testing Strategy

### Unit Tests (`test/tap-stack.unit.test.ts`)
- **Template Structure**: Validates CloudFormation template syntax and structure
- **Resource Configuration**: Verifies all resources have correct properties
- **Security Configuration**: Confirms security groups, encryption, and access controls
- **Compliance Rules**: Validates AWS Config rules and CloudTrail configuration

### Integration Tests (`test/tap-stack.int.test.ts`)
- **Infrastructure Validation**: End-to-end validation of deployed resources
- **Security Verification**: Confirms security posture in live environment
- **Compliance Testing**: Validates Config rules and CloudTrail operation
- **Network Connectivity**: Verifies proper network configuration and isolation

## Compliance and Best Practices

This solution implements AWS Well-Architected Framework principles:

### Security Pillar
- ✅ Identity and access management with least privilege
- ✅ Detective controls with CloudTrail and Config
- ✅ Infrastructure protection with security groups and network ACLs
- ✅ Data protection in transit and at rest
- ✅ Incident response preparation with comprehensive logging

### Reliability Pillar
- ✅ Multi-AZ deployment for fault tolerance
- ✅ Backup and recovery with versioned S3 buckets
- ✅ Monitoring and alerting with CloudWatch

### Performance Efficiency Pillar
- ✅ Right-sizing with configurable instance types
- ✅ Monitoring with detailed CloudWatch metrics

### Cost Optimization Pillar
- ✅ Resource right-sizing with parameter-driven instance types
- ✅ Cost monitoring with resource tagging

### Operational Excellence Pillar
- ✅ Infrastructure as Code with CloudFormation
- ✅ Comprehensive testing with unit and integration tests
- ✅ Monitoring and alerting for operational health

## File Structure

```
lib/
├── TapStack.yml          # Main CloudFormation template
├── TapStack.json         # JSON version for unit tests
└── IDEAL_RESPONSE.md     # This documentation

test/
├── tap-stack.unit.test.ts    # Unit tests for template validation
└── tap-stack.int.test.ts     # Integration tests for deployed infrastructure

cfn-outputs/
└── flat-outputs.json        # Deployment outputs for integration tests
```

This solution provides a production-ready, secure, and well-documented infrastructure that meets all specified requirements while following AWS best practices and security standards.