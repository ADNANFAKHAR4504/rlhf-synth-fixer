# Model Failures
## 1. RDS Instance Lacks Multi-AZ Deployment

**Statement**: The RDS instance is configured with `MultiAZ: false`, which is not recommended for production-grade secure deployments. Multi-AZ increases availability and durability.
```yaml
MultiAZ: false
```
## 2. EC2 UserData Scripts Hardcoded

**Statement**: The CloudWatch agent configuration and UserData scripts are partially hardcoded. In a secure enterprise environment, this should be parameterized or pulled from S3/SSM to reduce maintenance risk.
```yaml
UserData:
  Fn::Base64: !Sub |
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    # Configuration hardcoded in UserData
```
## 3. CloudTrail Only Logs Single S3 Bucket

**Statement**: The `EventSelectors` in CloudTrail only include `SecureEnvS3Bucket`, not all S3 buckets. This limits audit coverage and does not fully capture object-level S3 events across the environment.
```yaml
EventSelectors:
  - DataResources:
      - Type: AWS::S3::Object
        Values:
          - !Sub '${SecureEnvS3Bucket}/*'
```
## 4. AWS Config Delivery Channel Not Enforced with Encryption

**Statement**: The Config Delivery Channel is created but does not explicitly enforce KMS encryption or validation for the S3 bucket it writes to.
```yaml
SecureEnvDeliveryChannel:
  Type: AWS::Config::DeliveryChannel
  Properties:
    Name: SecureEnv-Config-DeliveryChannel
    S3BucketName: !Ref SecureEnvConfigBucket
```
## 5. Incomplete GuardDuty Configuration

**Statement**: GuardDuty is enabled but does not include explicit SNS notifications or integrations for alerting. A production-ready security deployment should capture findings automatically.
```yaml
SecureEnvGuardDutyDetector:
  Type: AWS::GuardDuty::Detector
  Properties:
    Enable: true
```
## 6. EBS Volume Encryption Key Hardcoding

**Statement**: The EC2 launch template references a single KMS key directly. For multi-environment deployments, the KMS key ARN should be parameterized to support per-environment encryption.
```yaml
KmsKeyId: !Ref SecureEnvKMSKey
```
## 7. WAF Rules Missing Managed Rule Group Coverage

**Statement**: Only SQLi and XSS custom rules are included. A production WAF deployment should also include AWS Managed Rule Sets (e.g., AWSManagedRulesCommonRuleSet) to cover additional threats.
```yaml
Rules:
  - Name: SQLInjectionRule
    ...
  - Name: XSSRule
    ...
```
## 8. VPC Flow Logs Missing

**Statement**: No VPC Flow Logs are defined. Flow Logs are required for auditing traffic and meeting compliance requirements.

## 9. Static AMI Reference

**Statement**: The template uses a static AMI ID, which is region-specific and can become outdated. Dynamic mapping or SSM Parameter store lookup is preferred.
```yaml
ImageId: ami-0c55b159cbfafe1d0
```
## 10. CloudWatch Log Group Retention Not Configurable

**Statement**: The CloudWatch Log Group for EC2 logs has a fixed retention of 90 days. For enterprise compliance, this should be parameterized.
```yaml
RetentionInDays: 90
```
## 11. IAM Role Policies May Be Too Broad

**Statement**: Certain IAM roles (like KMS key policies) grant wide permissions (`kms:*`) which may violate least privilege requirements in some environments.
```yaml
Action: 'kms:*'
Resource: '*'
```
