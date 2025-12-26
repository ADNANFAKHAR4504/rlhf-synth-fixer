# LocalStack Compatibility Analysis - Observability Stack (Pr7560)

## Overview

This is a **CloudFormation JSON** observability stack for payment processing with comprehensive monitoring using CloudWatch, X-Ray, and SNS.

## LocalStack Service Compatibility

### ✅ Community Tier Supported (Free)

| Service | Resource Type | Notes |
|---------|--------------|-------|
| CloudWatch Logs | AWS::Logs::LogGroup | Fully supported |
| CloudWatch Logs | AWS::Logs::ResourcePolicy | Supported |
| CloudWatch Logs | AWS::Logs::MetricFilter | Supported |
| CloudWatch | AWS::CloudWatch::Dashboard | Basic support |
| CloudWatch | AWS::CloudWatch::Alarm | Basic alarms supported |
| X-Ray | AWS::XRay::SamplingRule | Basic support |
| SNS | AWS::SNS::Topic | Supported |
| SNS | AWS::SNS::Subscription | Supported (no actual email delivery) |
| S3 | AWS::S3::Bucket | Fully supported |
| SSM | AWS::SSM::Parameter | Supported |
| IAM | AWS::IAM::Role | Supported |
| IAM | AWS::IAM::Policy | Supported |
| IAM | AWS::IAM::InstanceProfile | Supported |

### ⚠️ Pro Tier Required (Paid)

| Service | Resource Type | Status |
|---------|--------------|--------|
| Kinesis Firehose | AWS::KinesisFirehose::DeliveryStream | **Pro tier required** |
| CloudWatch | AWS::CloudWatch::MetricStream | **Pro tier required** |
| CloudWatch | AWS::CloudWatch::CompositeAlarm | **Pro tier or limited support** |

### 🔧 LocalStack Adaptations Made

1. **Conditional Metric Streaming**:
   - Added `IsLocalStack` condition to detect LocalStack environment
   - Made Metric Stream, Firehose, and related resources conditional
   - Stack deploys without these components in LocalStack Community
   - Fully functional on AWS with all features

2. **KMS Encryption Simplified**:
   - KMS encryption on Log Groups made optional via existing condition
   - LocalStack deployments can skip KMS by not providing `PrimaryKMSKeyArn` parameter
   - AWS deployments can still use KMS encryption

3. **Managed Policy Replacement**:
   - Replaced AWS managed policy `CloudWatchAgentServerPolicy` with inline equivalent
   - LocalStack may not have AWS managed policies available
   - Inline policy provides same permissions

4. **Email Subscription Note**:
   - SNS email subscriptions won't actually send emails in LocalStack
   - Subscription confirmation will be mocked
   - Use for testing infrastructure only

5. **Resource Naming**:
   - All resources already use parameterized naming with `EnvironmentSuffix`
   - Safe for parallel LocalStack testing

## Deployment Expectations

### LocalStack Community Deployment

**What Will Deploy**:
- ✅ CloudWatch Log Groups (3: Payment, API Gateway, Lambda)
- ✅ CloudWatch Dashboard with metrics widgets
- ✅ CloudWatch Alarms (API 5XX errors, Lambda timeouts)
- ✅ Composite Alarm (if supported, skipped if not)
- ✅ SNS Topic and email subscription (no actual emails)
- ✅ X-Ray Sampling Rule
- ✅ SSM Parameter for dashboard config
- ✅ Log Metric Filters (transaction volume, failures)
- ✅ IAM Roles and Policies
- ✅ S3 Bucket for metric storage

**What Will NOT Deploy** (Pro tier):
- ❌ CloudWatch Metric Stream
- ❌ Kinesis Firehose Delivery Stream
- ❌ Metric Stream IAM Role (conditional)

**Expected Behavior**:
- Stack creates successfully
- Basic observability infrastructure is functional
- Logs can be written to Log Groups
- Alarms can be created and evaluated
- Dashboard can be viewed (if LocalStack UI available)
- Metric streaming to S3 disabled (Pro feature)

### AWS Deployment

**What Will Deploy**:
- ✅ Everything - full observability stack
- ✅ Metric streaming to S3 via Firehose
- ✅ Real email notifications via SNS
- ✅ KMS encryption (if key ARN provided)

## Testing Strategy

### LocalStack Testing

```bash
# Set LocalStack endpoint
export AWS_ENDPOINT_URL=http://localhost:4566
export AWS_DEFAULT_REGION=us-east-1

# Deploy without Pro features
awslocal cloudformation create-stack \
  --stack-name tap-stack-Pr7560 \
  --template-body file://lib/TapStack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=localstack \
    ParameterKey=Environment,ParameterValue=development

# Check stack status
awslocal cloudformation describe-stacks \
  --stack-name tap-stack-Pr7560 \
  --query 'Stacks[0].StackStatus'

# List created resources
awslocal cloudformation list-stack-resources \
  --stack-name tap-stack-Pr7560

# Verify Log Groups
awslocal logs describe-log-groups \
  --log-group-name-prefix /aws/

# Verify SNS Topic
awslocal sns list-topics

# Verify Dashboard
awslocal cloudwatch list-dashboards

# Verify Alarms
awslocal cloudwatch describe-alarms

# Cleanup
awslocal cloudformation delete-stack \
  --stack-name tap-stack-Pr7560
```

### Integration Tests

Integration tests should verify:
1. Log Groups are created with correct retention
2. Dashboard exists and has valid JSON configuration
3. Alarms are created with correct thresholds
4. SNS topic is created
5. S3 bucket for metrics exists
6. X-Ray sampling rule is configured
7. IAM roles have correct permissions

## Known Limitations

1. **No Metric Streaming in Community**: Metric Stream and Firehose are Pro features
2. **No Email Delivery**: SNS email subscriptions won't send actual emails
3. **KMS Encryption**: May not work fully in LocalStack Community
4. **Cross-Region Features**: LocalStack runs single-region by default
5. **Managed Policies**: AWS managed policies may not exist in LocalStack

## Migration Notes

- **Original PR**: Pr7560 (archive/cfn-json/Pr7560)
- **Platform**: CloudFormation (JSON)
- **Language**: JSON
- **Complexity**: Expert
- **Primary Adaptation**: Added conditional logic to disable Pro-tier features in LocalStack
- **AWS Compatibility**: 100% - All features work on AWS, LocalStack conditionally excludes Pro features

## Recommendations

1. **For LocalStack Community Testing**: Deploy without KMS key parameter
2. **For Full Feature Testing**: Use LocalStack Pro or deploy to AWS
3. **For CI/CD**: This stack is suitable for LocalStack Community CI/CD as core observability features work
4. **For Production**: Deploy to AWS with KMS encryption and email alerts enabled
