# Zero-Trust Security Infrastructure for Payment Processing

This CloudFormation template deploys a comprehensive zero-trust security architecture for payment processing workloads that meet PCI-DSS compliance requirements.

## Architecture Overview

The infrastructure implements multiple layers of security controls:

1. **Network Security**: Private VPC with no internet access, AWS Network Firewall for traffic inspection
2. **Encryption**: Separate KMS keys for EBS, S3, and RDS with automatic 90-day rotation
3. **Access Control**: IAM roles with least-privilege policies, Systems Manager Session Manager for secure access
4. **Monitoring**: VPC Flow Logs, AWS Config rules, GuardDuty threat detection
5. **Compliance**: Continuous compliance monitoring with AWS Config rules

## Components

### Network Infrastructure
- VPC with private subnets across 3 availability zones
- Transit Gateway attachment for secure connectivity
- AWS Network Firewall with stateful rules
- VPC Flow Logs encrypted with KMS

### Encryption Keys
- **EBS KMS Key**: For EC2 volume encryption
- **S3 KMS Key**: For S3 bucket encryption (Flow Logs, Config)
- **RDS KMS Key**: For RDS database encryption
- All keys have automatic rotation enabled (every 90 days)

### Identity and Access
- EC2 instance role with least-privilege policies
- Instance profile for EC2 instances
- No wildcard permissions
- Systems Manager Session Manager access only

### Compliance and Monitoring
- AWS Config with rules:
  - encrypted-volumes: Ensures EBS volumes are encrypted
  - iam-password-policy: Validates IAM password policy
- GuardDuty for threat detection
- VPC Flow Logs for network traffic analysis

### Systems Manager Access
- VPC endpoints for SSM (ssm, ssmmessages, ec2messages)
- Session Manager for secure shell access
- No SSH keys or bastion hosts required

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. IAM permissions to create all resources
3. Optional: Existing Transit Gateway ID (for Transit Gateway attachment)

### Parameters

- **EnvironmentSuffix** (Required): Unique suffix for resource naming (e.g., "prod-001")
- **TransitGatewayId** (Optional): Transit Gateway ID for VPC attachment
- **VpcCidr** (Optional): VPC CIDR block (default: 10.0.0.0/16)

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name zero-trust-security \
  --template-body file://lib/zero-trust-security.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=TransitGatewayId,ParameterValue=tgw-xxxxx \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Stack Creation

```bash
aws cloudformation describe-stack-events \
  --stack-name zero-trust-security \
  --region us-east-1
```

### Validate Deployment

```bash
# Check stack status
aws cloudformation describe-stacks \
  --stack-name zero-trust-security \
  --region us-east-1

# Verify Config rules are active
aws configservice describe-config-rules \
  --region us-east-1

# Verify GuardDuty is enabled
aws guardduty list-detectors \
  --region us-east-1

# Check VPC Flow Logs
aws ec2 describe-flow-logs \
  --region us-east-1
```

## Security Features

### Zero-Trust Principles
- No public subnets or internet gateways
- All traffic inspected by Network Firewall
- Least-privilege IAM policies
- Encrypted data at rest and in transit

### PCI-DSS Compliance
- Network segmentation with private subnets
- Encryption with customer-managed KMS keys
- Continuous compliance monitoring with AWS Config
- Comprehensive audit logging (Flow Logs, CloudTrail integration)
- Threat detection with GuardDuty

### Key Rotation
All KMS keys are configured with automatic rotation:
- Rotation period: 90 days
- AWS manages the rotation process
- Old key versions retained for decryption

## Important Notes

### GuardDuty Limitation
**WARNING**: GuardDuty allows only ONE detector per AWS account per region. If a detector already exists in your account, the stack creation will fail. Options:

1. Remove GuardDuty resource from template if detector exists
2. Use custom resource to check existence before creation
3. Manually delete existing detector (if safe to do so)

### Resource Cleanup
All resources are configured with `DeletionPolicy: Delete` for testing environments. This ensures complete stack deletion without manual intervention.

**For production**: Consider changing deletion policies for:
- KMS keys (to `Retain` for key recovery)
- S3 buckets (to `Retain` for audit log preservation)

### AWS Config
The template uses the correct IAM managed policy:
```
arn:aws:iam::aws:policy/service-role/AWS_ConfigRole
```

Note the `service-role/` prefix which is required for AWS Config.

## Outputs

The template exports the following outputs:

- **VPCId**: VPC identifier
- **PrivateSubnetAZ1Id, PrivateSubnetAZ2Id, PrivateSubnetAZ3Id**: Private subnet identifiers
- **NetworkFirewallArn**: Network Firewall ARN
- **EBSKMSKeyArn, S3KMSKeyArn, RDSKMSKeyArn**: KMS key ARNs
- **EC2InstanceRoleArn**: IAM role ARN for EC2 instances
- **EC2InstanceProfileArn**: Instance profile ARN
- **VPCFlowLogsBucketName**: S3 bucket for VPC Flow Logs
- **ConfigBucketName**: S3 bucket for AWS Config
- **GuardDutyDetectorId**: GuardDuty detector ID
- **SSMEndpointDNS**: Systems Manager endpoint DNS

## Testing

### Test Systems Manager Access

1. Launch an EC2 instance in one of the private subnets
2. Attach the EC2 instance profile
3. Connect via Session Manager:

```bash
aws ssm start-session \
  --target i-xxxxxxxxx \
  --region us-east-1
```

### Test Network Firewall

1. Check firewall endpoints:

```bash
aws network-firewall describe-firewall \
  --firewall-name network-firewall-[suffix] \
  --region us-east-1
```

2. Review firewall logs in CloudWatch:

```bash
aws logs tail /aws/networkfirewall/[suffix] \
  --follow \
  --region us-east-1
```

### Test AWS Config Rules

```bash
# Check compliance status
aws configservice describe-compliance-by-config-rule \
  --config-rule-names encrypted-volumes-[suffix] iam-password-policy-[suffix] \
  --region us-east-1
```

### Test KMS Key Rotation

```bash
# Verify key rotation is enabled
aws kms get-key-rotation-status \
  --key-id [key-id] \
  --region us-east-1
```

## Troubleshooting

### Stack Creation Failures

1. **GuardDuty detector already exists**:
   - Check existing detectors: `aws guardduty list-detectors`
   - Remove GuardDuty resource from template or delete existing detector

2. **IAM permission errors**:
   - Ensure you have `CAPABILITY_NAMED_IAM` in create-stack command
   - Verify IAM permissions for all services

3. **S3 bucket name conflicts**:
   - S3 bucket names must be globally unique
   - Template uses account ID in bucket names to avoid conflicts

### Config Rules Not Evaluating

1. Ensure ConfigRecorder is running:

```bash
aws configservice describe-configuration-recorder-status \
  --region us-east-1
```

2. Start the recorder if needed:

```bash
aws configservice start-configuration-recorder \
  --configuration-recorder-name config-recorder-[suffix] \
  --region us-east-1
```

### VPC Flow Logs Not Appearing

1. Verify Flow Log is active:

```bash
aws ec2 describe-flow-logs \
  --filter "Name=resource-id,Values=[vpc-id]" \
  --region us-east-1
```

2. Check S3 bucket permissions (bucket policy allows VPC Flow Logs service)

3. Wait 10-15 minutes for initial logs to appear

## Cost Optimization

### Estimated Monthly Costs (us-east-1)

- **Network Firewall**: ~$400 (firewall endpoints + processing)
- **VPC Endpoints**: ~$22 (3 endpoints across 3 AZs)
- **GuardDuty**: ~$5-50 (usage-based)
- **AWS Config**: ~$10-20 (rules + recorder)
- **KMS Keys**: $3 (3 keys)
- **S3 Storage**: Variable (depends on log volume)
- **VPC Flow Logs**: Variable (depends on traffic volume)

**Total**: ~$450-500/month (excluding compute resources)

### Cost Reduction Options

1. Reduce Network Firewall endpoints to 2 AZs (not recommended for production)
2. Adjust VPC Flow Log retention period
3. Use S3 lifecycle policies for older Config data
4. Consider centralizing GuardDuty to a security account

## Maintenance

### Regular Tasks

1. **Review GuardDuty findings** (weekly):
   - Check for security threats
   - Investigate medium/high severity findings

2. **Monitor AWS Config compliance** (daily):
   - Review non-compliant resources
   - Remediate configuration drift

3. **Analyze VPC Flow Logs** (as needed):
   - Investigate unusual traffic patterns
   - Verify zero-trust policy enforcement

4. **Verify KMS key rotation** (quarterly):
   - Confirm automatic rotation is working
   - Update key policies if needed

### Updates

To update the stack:

```bash
aws cloudformation update-stack \
  --stack-name zero-trust-security \
  --template-body file://lib/zero-trust-security.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name zero-trust-security \
  --region us-east-1
```

**Note**: All resources will be deleted due to `DeletionPolicy: Delete`. For production, consider retaining:
- KMS keys (for key recovery period)
- S3 buckets (for audit log retention)

## References

- [AWS Network Firewall Documentation](https://docs.aws.amazon.com/network-firewall/)
- [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- [AWS Config Rules](https://docs.aws.amazon.com/config/latest/developerguide/managed-rules-by-aws-config.html)
- [AWS GuardDuty](https://docs.aws.amazon.com/guardduty/latest/ug/what-is-guardduty.html)
