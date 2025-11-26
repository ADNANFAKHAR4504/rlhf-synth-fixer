# PCI-DSS Compliant Payment Processing Infrastructure

## Overview

This CloudFormation template implements a comprehensive, PCI-DSS compliant payment processing infrastructure with enterprise-grade security controls, automated compliance monitoring, real-time alerting, and secure configuration management.

## Architecture

### Infrastructure Components

- **Network Isolation**: Isolated VPC with 3 private subnets across availability zones (us-east-1a/b/c)
- **Compute**: Lambda function for payment processing in private subnets with VPC configuration
- **Storage**: Encrypted S3 buckets for data and audit logs with versioning
- **Encryption**: Dual customer-managed KMS keys (data/SSM and SNS) with automatic rotation
- **Compliance**: AWS Config with continuous monitoring and automated rules
- **Alerting**: SNS topic with encrypted messaging and email notifications
- **Monitoring**: CloudWatch alarms with metric filters for proactive security monitoring
- **Configuration**: SSM Parameter Store with SecureString encryption for sensitive data
- **Connectivity**: VPC endpoints for S3, Lambda, and SSM (no internet access)

### Resource Count

**Total**: 47 resources

| Category | Count | Resources |
|----------|-------|-----------|
| Network Infrastructure | 13 | VPC, 3 Subnets, Route Table, 3 Associations, 3 VPC Endpoints, 2 Security Groups |
| Encryption | 4 | 2 KMS Keys, 2 Aliases |
| Storage | 4 | 2 S3 Buckets, 2 Bucket Policies |
| Compute | 5 | Lambda, Security Group, IAM Role, 2 Log Groups |
| Logging | 3 | Flow Log Group, Flow Log Role, VPC Flow Log |
| AWS Config | 6 | Config Role, Recorder, Delivery Channel, 3 Rules |
| SNS Alerting | 3 | Topic, Topic Policy, Email Subscription |
| CloudWatch Alarms | 8 | 4 Alarms, 4 Metric Filters |
| SSM Parameters | 3 | Config, Secret, API Key (all SecureString) |

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- CloudFormation permissions
- Email address for security alerts

### Deployment Command

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-prod \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=EmailAddress,ParameterValue=security@example.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --tags Key=Environment,Value=Production Key=Compliance,Value=PCI-DSS
```

### Post-Deployment Steps

1. **Start AWS Config Recorder**:
   ```bash
   aws configservice start-configuration-recorder \
     --configuration-recorder-name ConfigRecorder-prod-001 \
     --region us-east-1
   ```

2. **Confirm SNS Email Subscription**:
   - Check the email address provided during deployment
   - Click the confirmation link in the AWS SNS subscription email

3. **Verify Lambda Connectivity**:
   ```bash
   aws lambda invoke \
     --function-name PaymentProcessor-prod-001 \
     --region us-east-1 \
     response.json
   ```

4. **Enable CloudTrail (Optional but Recommended)**:
   - Required for S3 and KMS CloudWatch alarm metrics
   - Configure account-level CloudTrail for comprehensive auditing

## Security Features

### PCI-DSS Compliance

- **Data Encryption**: All data encrypted at rest (S3, SNS, SSM) and in transit (TLS)
- **Network Isolation**: No internet connectivity; all AWS service access via VPC endpoints
- **Access Control**: Least privilege IAM roles and security groups
- **Audit Logging**: VPC Flow Logs and AWS Config tracking all changes
- **Continuous Monitoring**: Automated compliance rules with Config
- **Incident Response**: Real-time alerts via SNS for security events

### Critical Protections

1. **Data Retention**: DataEncryptionKey and DataBucket have DeletionPolicy: Retain
2. **Parameter Encryption**: All SSM parameters encrypted with customer-managed KMS
3. **Network Security**: No Internet Gateway or NAT Gateway deployed
4. **Monitoring Coverage**: 4 CloudWatch alarms covering VPC, Lambda, S3, and KMS

## Testing

### Unit Tests

Run comprehensive unit tests covering all 47 resources:

```bash
npm test -- test/tap-stack.unit.test.ts
```

Tests verify:
- Template structure and format
- Resource properties and configuration
- Security controls (encryption, tagging, policies)
- Naming conventions with EnvironmentSuffix
- DeletionPolicy correctness
- PCI-DSS compliance tags

### Integration Tests

Run integration tests after deployment:

```bash
ENVIRONMENT_SUFFIX=prod-001 npm test -- test/tap-stack.int.test.ts
```

Tests verify:
- AWS Config compliance monitoring
- SNS alerting functionality
- CloudWatch alarm configuration
- VPC endpoint connectivity
- Lambda Parameter Store access
- S3 bucket security settings
- KMS key management

## Monitoring and Alerts

### CloudWatch Alarms

| Alarm | Metric | Threshold | Period | Action |
|-------|--------|-----------|--------|--------|
| VPC Rejected Connections | Custom | >100 | 5 min | SNS Alert |
| Lambda Errors | AWS/Lambda | >5 | 5 min | SNS Alert |
| S3 Unauthorized Access | Custom | ≥1 | 5 min | SNS Alert |
| KMS Key Usage Anomaly | Custom | >1000 | 5 min | SNS Alert |

### AWS Config Rules

1. **S3 Bucket Server-Side Encryption Enabled** - Ensures all S3 buckets use encryption
2. **VPC Flow Logs Enabled** - Validates VPC network monitoring
3. **Encrypted Volumes** - Checks EBS volumes are encrypted

## Operations

### Updating SSM Parameters

```bash
# Update configuration parameter
aws ssm put-parameter \
  --name /payment/prod-001/config \
  --value '{"processingMode":"production","timeout":60}' \
  --type SecureString \
  --key-id <DataEncryptionKeyId> \
  --overwrite \
  --region us-east-1
```

### Viewing Config Compliance

```bash
# Get compliance summary
aws configservice describe-compliance-by-config-rule \
  --region us-east-1
```

### Checking CloudWatch Alarms

```bash
# List all alarms
aws cloudwatch describe-alarms \
  --alarm-name-prefix prod-001 \
  --region us-east-1
```

## Troubleshooting

### Lambda Cannot Access SSM Parameters

**Problem**: Lambda function fails to retrieve parameters from SSM
**Solution**: This was a critical issue fixed in the IDEAL_RESPONSE version
- Verify SSM VPC endpoint exists: `SsmInterfaceEndpoint`
- Verify security group allows port 443: `SsmEndpointSecurityGroup`
- Check Lambda IAM role has SSMParameterAccess policy

### Config Recorder Not Recording

**Problem**: Config dashboard shows no data
**Solution**: Config Recorder must be manually started after stack creation
```bash
aws configservice start-configuration-recorder \
  --configuration-recorder-name ConfigRecorder-<EnvironmentSuffix>
```

### SNS Alerts Not Received

**Problem**: No email notifications for alarms
**Solution**: Email subscription requires manual confirmation
- Check email for AWS SNS confirmation message
- Click "Confirm subscription" link

## Deletion

### Before Deleting Stack

1. **Retained Resources**: DataEncryptionKey and DataBucket will NOT be deleted
2. **Manual Cleanup Required**:
   ```bash
   # Delete S3 bucket objects first
   aws s3 rm s3://payment-data-<suffix>-<account-id> --recursive

   # Schedule KMS key deletion (7-30 days)
   aws kms schedule-key-deletion \
     --key-id <DataEncryptionKeyId> \
     --pending-window-in-days 30
   ```

3. **Delete Stack**:
   ```bash
   aws cloudformation delete-stack \
     --stack-name payment-processing-prod \
     --region us-east-1
   ```

## Compliance Validation

### PCI-DSS Requirements Mapping

| Requirement | Implementation | Validation |
|-------------|----------------|------------|
| 1.2 Network Security | VPC isolation, no IGW/NAT | Unit test verifies |
| 3.4 Data Encryption | KMS customer-managed keys | Config rule validates |
| 10.2 Audit Trails | VPC Flow Logs, Config | Integration test checks |
| 10.5 Log Protection | Encrypted CloudWatch Logs | Unit test validates |
| 11.4 Change Detection | AWS Config monitoring | Config rules active |

## Cost Optimization

Estimated monthly cost (us-east-1, moderate usage):

- VPC & Endpoints: $40
- Lambda (10M invocations): $2
- S3 Storage (100GB): $2
- KMS (2 keys): $2
- CloudWatch (logs/alarms): $10
- AWS Config: $6
- SNS: $0.50

**Total**: ~$63/month

## Support and Maintenance

### Regular Maintenance Tasks

1. **Weekly**: Review CloudWatch alarm states
2. **Weekly**: Check Config compliance dashboard
3. **Monthly**: Review VPC Flow Logs for anomalies
4. **Monthly**: Rotate SSM parameter values
5. **Quarterly**: Review and update Lambda function code
6. **Annually**: Audit KMS key policies

## References

- [AWS PCI-DSS Compliance Guide](https://docs.aws.amazon.com/compliance/pci-dss/)
- [AWS Config Rules](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html)
- [VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [Lambda in VPC](https://docs.aws.amazon.com/lambda/latest/dg/configuration-vpc.html)

## Version History

- **v1.0** (2025-11-25): Initial implementation with 47 resources
  - Added SSM VPC endpoint (critical fix)
  - Added DeletionPolicy: Retain for data protection
  - Comprehensive monitoring and compliance automation

---

**Project**: synth-g1l0y0k7
**Platform**: CloudFormation (JSON)
**Complexity**: Expert
**Compliance**: PCI-DSS Level 1
