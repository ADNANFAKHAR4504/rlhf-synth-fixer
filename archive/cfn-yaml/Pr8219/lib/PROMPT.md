# Title

Refined Problem Statement - Secure eBook Storage System for LocalStack Deployment

## Summary

A publisher needs to securely store and manage approximately 3,000 daily e-books with a focus on local development and testing using LocalStack Pro. The system must provide secure storage, encrypted content, role-based access control, and automated monitoring. The architecture leverages AWS services that are fully supported by LocalStack: S3 (storage), KMS (encryption), IAM (access management), Lambda (monitoring), SNS (notifications), and EventBridge (scheduling). The system will be deployed via AWS CloudFormation for reproducibility and tested in LocalStack before production deployment.

## Goals

- Securely store e-books with encryption at rest
- Implement role-based access control with IAM
- Provide automated storage monitoring and alerting
- Enable local development and testing with LocalStack Pro
- Deploy via CloudFormation for consistency and maintainability
- Minimize infrastructure complexity by using core AWS services

---

## Functional Requirements

1. Store e-book files (PDF, ePub, MOBI) securely in an S3 bucket with KMS server-side encryption
2. Implement IAM roles with least-privilege access for S3 operations
3. Configure S3 bucket policies to restrict access to authorized roles only
4. Enable S3 versioning for data protection and recovery
5. Implement automated storage monitoring via Lambda function
6. Send monitoring reports and alerts via SNS
7. Schedule daily monitoring checks using EventBridge
8. Support conditional logging with separate S3 logging bucket
9. Allow optional external KMS key usage

## Non-Functional Requirements

- Handle 3,000 daily uploads with high availability
- Ensure data durability with S3 standard storage class
- Maintain security with encryption at rest and in transit
- Optimize for local development with LocalStack Pro compatibility
- Provide comprehensive monitoring and alerting capabilities
- Support multiple environments (dev, test, prod)

## Constraints & Assumptions

- Must be fully compatible with LocalStack Pro
- Reader authentication managed outside this system
- Focus on storage and monitoring, not content delivery
- No CloudFront, Route53, or WAF (LocalStack limitations)
- Use inline IAM policies instead of AWS-managed policies
- Simplified bucket naming for LocalStack compatibility

---

## High-level Flow

1. **Publisher Backend** uploads e-books to encrypted S3 bucket
2. **IAM Roles** control access to S3 resources
3. **S3 Bucket Policy** enforces security restrictions
4. **Lambda Function** monitors storage metrics daily
5. **EventBridge Rule** triggers automated monitoring
6. **SNS Topic** sends notifications and alerts
7. **Optional Logging** tracks S3 access for audit

## Components

- S3 bucket with KMS encryption and versioning
- Conditional S3 logging bucket
- KMS key for encryption (conditional)
- IAM roles for S3 access and Lambda execution
- Lambda function for storage monitoring (Python 3.11)
- SNS topic for alerts and notifications
- EventBridge rule for scheduled monitoring
- S3 bucket policies for access control

---

## LocalStack Pro Deployment

### Prerequisites

1. **LocalStack Pro**
   - LocalStack Pro with AWS services support
   - Docker Desktop or Docker Engine installed
   - LocalStack CLI installed (`pip install localstack`)
   - Valid LocalStack Pro API key

2. **AWS CLI**
   - AWS CLI v2 installed
   - Configured for LocalStack endpoint

3. **Development Tools**
   - Node.js 18+ (for testing)
   - Python 3.11+ (for Lambda functions)
   - Git for version control

### LocalStack Setup

#### 1. Start LocalStack Pro

```bash
# Set your LocalStack API key
export LOCALSTACK_API_KEY=your-api-key-here

# Start LocalStack with Docker
localstack start

# Or use docker-compose
docker-compose up -d
```

#### 2. Configure AWS CLI for LocalStack

```bash
# Configure AWS CLI to use LocalStack endpoint
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test
export AWS_DEFAULT_REGION=us-east-1

# Test connection
aws --endpoint-url=http://localhost:4566 s3 ls
```

### Deployment Steps

#### 1. Validate CloudFormation Template

```bash
# Validate template syntax
aws --endpoint-url=http://localhost:4566 cloudformation validate-template \
  --template-body file://lib/TapStack.yml
```

#### 2. Deploy Stack to LocalStack

```bash
# Deploy with default parameters
aws --endpoint-url=http://localhost:4566 cloudformation create-stack \
  --stack-name ebooks-storage-dev \
  --template-body file://lib/TapStack.yml \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnableLogging,ParameterValue=true \
  --capabilities CAPABILITY_NAMED_IAM

# Wait for stack creation
aws --endpoint-url=http://localhost:4566 cloudformation wait stack-create-complete \
  --stack-name ebooks-storage-dev
```

#### 3. Verify Stack Outputs

```bash
# Get stack outputs
aws --endpoint-url=http://localhost:4566 cloudformation describe-stacks \
  --stack-name ebooks-storage-dev \
  --query 'Stacks[0].Outputs'

# Save outputs to file
mkdir -p cfn-outputs
aws --endpoint-url=http://localhost:4566 cloudformation describe-stacks \
  --stack-name ebooks-storage-dev \
  --query 'Stacks[0].Outputs' > cfn-outputs/stack-outputs.json
```

### Testing the Deployment

#### 1. Upload Test eBook

```bash
# Upload a test file to S3
echo "Test eBook content" > test-ebook.txt

aws --endpoint-url=http://localhost:4566 s3 cp test-ebook.txt \
  s3://ebooks-storage-dev/test-ebook.txt

# Verify upload
aws --endpoint-url=http://localhost:4566 s3 ls s3://ebooks-storage-dev/
```

#### 2. Test Lambda Monitoring Function

```bash
# Invoke Lambda function manually
aws --endpoint-url=http://localhost:4566 lambda invoke \
  --function-name eBook-StorageMonitoring-dev \
  --payload '{}' \
  response.json

# View response
cat response.json
```

#### 3. Check SNS Notifications

```bash
# List SNS topics
aws --endpoint-url=http://localhost:4566 sns list-topics

# Get topic attributes
aws --endpoint-url=http://localhost:4566 sns get-topic-attributes \
  --topic-arn arn:aws:sns:us-east-1:000000000000:eBook-Alerts-dev
```

#### 4. Verify EventBridge Rule

```bash
# List EventBridge rules
aws --endpoint-url=http://localhost:4566 events list-rules

# Describe specific rule
aws --endpoint-url=http://localhost:4566 events describe-rule \
  --name eBook-StorageMonitoring-Schedule-dev
```

### Running Unit and Integration Tests

#### 1. Install Dependencies

```bash
npm install
```

#### 2. Run Unit Tests

```bash
npm run test:unit
```

#### 3. Run Integration Tests

```bash
# Ensure LocalStack is running
npm run test:integration
```

#### 4. Run All Tests

```bash
npm test
```

### Cleanup

```bash
# Delete the stack
aws --endpoint-url=http://localhost:4566 cloudformation delete-stack \
  --stack-name ebooks-storage-dev

# Wait for deletion
aws --endpoint-url=http://localhost:4566 cloudformation wait stack-delete-complete \
  --stack-name ebooks-storage-dev

# Stop LocalStack
localstack stop
```

---

## Template Structure

### Parameters

- `Environment` (dev/test/prod) - Environment name
- `KmsKeyAlias` - Optional external KMS key alias
- `EnableLogging` - Enable/disable S3 access logging

### Conditions

- `CreateKmsKey` - Create new KMS key if alias not provided
- `EnableLoggingCondition` - Create logging bucket if enabled

### Resources

1. **S3 Buckets**
   - `EbooksS3Bucket` - Main storage with KMS encryption
   - `LoggingBucket` - Conditional logging bucket

2. **Security**
   - `EbooksKmsKey` - KMS encryption key (conditional)
   - `EbooksKmsKeyAlias` - KMS key alias (conditional)
   - `EbooksS3BucketPolicy` - S3 access restrictions
   - `S3AccessRole` - IAM role for S3 operations
   - `StorageMonitoringRole` - IAM role for Lambda

3. **Monitoring**
   - `StorageMonitoringFunction` - Lambda for monitoring
   - `SNSAlertTopic` - Alert notifications
   - `StorageMonitoringSchedule` - EventBridge daily trigger
   - `StorageMonitoringPermission` - Lambda invoke permission

### Outputs

- S3 bucket name, ARN, and domain
- IAM role ARNs
- KMS key ID and ARN (conditional)
- SNS topic ARN
- Lambda function ARN and name
- Environment name

---

## Security Best Practices

1. **Encryption**
   - KMS encryption for S3 at rest
   - TLS 1.2+ for data in transit
   - Separate encryption keys per environment

2. **Access Control**
   - Least-privilege IAM roles
   - S3 bucket policies restricting access
   - Block all public S3 access
   - Role-based access patterns

3. **Monitoring & Audit**
   - Optional S3 access logging
   - Lambda-based storage monitoring
   - SNS alerting for anomalies
   - CloudWatch Logs integration

4. **Data Protection**
   - S3 versioning enabled
   - Encryption key rotation support
   - Conditional logging for compliance

---

## LocalStack Limitations & Workarounds

### Not Supported in LocalStack

- CloudFront distributions
- Route53 DNS management
- AWS Certificate Manager (ACM)
- WAF/WAFv2 web application firewall
- CloudWatch Dashboards (limited)
- CloudWatch Alarms (limited)
- AWS-managed IAM policies

### Workarounds Implemented

1. **No CloudFront**: Use S3 direct access with signed URLs
2. **No Route53**: Use LocalStack S3 endpoints directly
3. **No ACM**: LocalStack doesn't require SSL certificates
4. **Inline IAM Policies**: Replace managed policies with inline
5. **Simplified Naming**: Avoid AWS::AccountId in resource names
6. **Lambda Monitoring**: Replace CloudWatch Dashboard with Lambda

---

## Cost Optimization (Production)

- S3 Standard for active content
- S3 versioning for data protection
- Lifecycle policies for old versions
- Lambda monitoring to track usage
- SNS for cost-effective notifications
- EventBridge for scheduled tasks

---

## Prompt: Generate CloudFormation Template

```
You are an AWS cloud architect tasked with creating a LocalStack-compatible CloudFormation template for a secure eBook storage system.

Requirements:
- S3 bucket with KMS encryption for eBook storage
- IAM roles with least-privilege access
- Lambda function for automated storage monitoring
- SNS topic for alerts and notifications
- EventBridge rule for daily monitoring schedule
- S3 bucket policies restricting access
- Optional S3 logging bucket
- Optional external KMS key support

LocalStack Constraints:
- No CloudFront, Route53, ACM, or WAF
- Use inline IAM policies (no AWS-managed policies)
- Simplified bucket naming (no AWS::AccountId)
- Python 3.11 Lambda runtime
- Core AWS services only (S3, KMS, IAM, Lambda, SNS, EventBridge)

Parameters:
- Environment (dev/test/prod)
- KmsKeyAlias (optional)
- EnableLogging (true/false)

Outputs:
- S3 bucket details (name, ARN, domain)
- IAM role ARNs
- KMS key information
- SNS topic ARN
- Lambda function details
- Environment name

Security:
- Encryption at rest with KMS
- Block all public S3 access
- Least-privilege IAM policies
- S3 versioning enabled
- Comprehensive tagging with iac-rlhf-amazon

Return: CloudFormation YAML template optimized for LocalStack Pro deployment with inline documentation.
```
