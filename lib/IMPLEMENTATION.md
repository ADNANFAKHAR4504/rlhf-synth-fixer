# Zero Trust Security Framework - Implementation Guide

## Overview

This CDKTF Python implementation provides a comprehensive Zero Trust security framework for AWS infrastructure. The solution implements all 10 Zero Trust requirements with a modular architecture that can be deployed across multiple AWS accounts.

## Architecture

### Components

1. **VPC and Networking** (`lib/vpc.py`)
   - Private subnets across 3 availability zones
   - 22+ VPC endpoints for AWS services (eliminates internet-bound traffic)
   - Security groups with least-privilege access
   - No internet gateways (Zero Trust principle)

2. **IAM Roles** (`lib/iam.py`)
   - Cross-account access with MFA and external ID enforcement
   - Security audit role for compliance services
   - Session Manager role for bastion-less EC2 access
   - 1-hour session limits for temporary credentials

3. **Encryption** (`lib/encryption.py`)
   - KMS keys with automatic rotation enabled
   - Granular key policies per service (CloudTrail, S3, RDS, General)
   - Separate keys for different data classification levels
   - Explicit deny for unencrypted operations

4. **Monitoring** (`lib/monitoring.py`)
   - CloudTrail with log file validation and S3 object lock
   - VPC Flow Logs with CloudWatch Logs integration
   - Athena database for flow logs security analysis
   - CloudWatch alarms for suspicious activities

5. **Security and Compliance** (`lib/security.py`)
   - Security Hub with CIS and AWS Foundational standards
   - Custom Security Hub insights for critical findings
   - AWS Config with 7 compliance rules
   - Monitoring for unencrypted EBS volumes and public RDS instances

6. **WAF** (`lib/waf.py`)
   - Rate-based rules (2000 requests/5 minutes)
   - AWS managed rule sets (Core, Known Bad Inputs, IP Reputation)
   - Custom IP blocklist support
   - CloudWatch metrics for all rules

7. **Compliance** (`lib/compliance.py`)
   - Service Control Policy (SCP) templates
   - Policies to prevent disabling security services
   - Encryption enforcement policies
   - Public access prevention policies

8. **Main Stack** (`lib/tap_stack.py`)
   - Orchestrates all security components
   - S3 backend for state management
   - AWS provider configuration with default tags

## Prerequisites

### Software Requirements

- Python 3.8+
- pipenv
- Node.js 16+ (for CDKTF)
- AWS CLI configured
- CDKTF CLI installed (`npm install -g cdktf-cli`)

### AWS Requirements

- AWS account with administrative access
- S3 bucket for Terraform state
- Appropriate IAM permissions for all services
- GuardDuty already enabled (account-level resource)

## Installation

### 1. Install Dependencies

```bash
# Install Python dependencies
pipenv install

# Install CDKTF providers
cdktf get
```

### 2. Configure Environment Variables

```bash
export ENVIRONMENT_SUFFIX="dev"                    # Required: Unique suffix for resources
export TERRAFORM_STATE_BUCKET="your-state-bucket"  # Required: S3 bucket for state
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"  # Optional: Defaults to us-east-1
export AWS_REGION="us-east-1"                      # Optional: Defaults to us-east-1
export REPOSITORY="iac-test-automations"           # Optional: For tagging
export COMMIT_AUTHOR="your-name"                   # Optional: For tagging
export PR_NUMBER="123"                             # Optional: For tagging
export TEAM="synth"                                # Optional: For tagging
```

### 3. Review Configuration

Edit `cdktf.json` if needed:
- AWS provider version: `aws@~> 6.0`
- Python app command: `pipenv run python tap.py`

## Deployment

### Initial Deployment

```bash
# Synthesize Terraform configuration
cdktf synth

# Plan changes (review before applying)
cdktf plan

# Deploy infrastructure
cdktf deploy
```

### Verify Deployment

```bash
# Check CloudTrail
aws cloudtrail describe-trails --region us-east-1

# Check Security Hub
aws securityhub describe-hub --region us-east-1

# Check AWS Config
aws configservice describe-configuration-recorders --region us-east-1

# Check VPC endpoints
aws ec2 describe-vpc-endpoints --region us-east-1
```

## Configuration

### Resource Naming

All resources include the `environmentSuffix` parameter:
- Pattern: `{resource-type}-{environment-suffix}`
- Example: `zero-trust-vpc-dev`, `zero-trust-cloudtrail-prod`
- This enables parallel deployments without conflicts

### KMS Keys

Four KMS keys are created:
1. **CloudTrail Key**: For CloudTrail logs encryption
2. **S3 Key**: For S3 bucket encryption with deny on unencrypted uploads
3. **RDS Key**: For RDS database encryption
4. **General Key**: For other services requiring encryption

### VPC Endpoints

22 VPC endpoints are created to eliminate internet-bound traffic:
- **Interface endpoints**: EC2, SSM, KMS, Secrets Manager, RDS, Lambda, etc.
- **Gateway endpoints**: S3, DynamoDB

### AWS Config Rules

7 Config rules monitor compliance:
1. Encrypted EBS volumes
2. RDS public access check
3. S3 bucket public read prohibited
4. S3 bucket public write prohibited
5. S3 bucket encryption enabled
6. RDS storage encrypted
7. Root account MFA enabled

### Security Hub Insights

3 custom insights track security findings:
1. **Critical Findings**: NEW findings with CRITICAL severity
2. **Unencrypted Resources**: FAILED compliance for encryption
3. **Publicly Accessible Resources**: HIGH/CRITICAL public access findings

## Outputs

The stack provides outputs for SIEM integration (to be implemented):

- VPC ID
- Private subnet IDs
- Security group IDs
- KMS key ARNs
- CloudTrail trail ARN
- S3 bucket names
- Config recorder name
- Security Hub account ID
- WAF Web ACL ARN

## Monitoring and Alerts

### CloudWatch Alarms

Three security alarms are configured:
1. **Unauthorized API Calls**: Threshold > 5 calls in 5 minutes
2. **IAM Policy Changes**: Threshold > 1 change in 5 minutes
3. **Root Account Usage**: Threshold > 0 in 1 minute

### VPC Flow Logs Analysis

Athena queries for security analysis:
- **Rejected Connections**: Top 100 rejected connection attempts
- Query database: `zero_trust_flow_logs_{environment_suffix}`

### CloudTrail

- Log file validation enabled
- S3 object lock configured (30-day retention in GOVERNANCE mode)
- Multi-region trail enabled
- KMS encryption enabled

## Security Considerations

### GuardDuty

**IMPORTANT**: GuardDuty detector is NOT created by this stack. GuardDuty is an account-level resource (one detector per account/region). Ensure GuardDuty is already enabled in your AWS account before deployment.

### IAM Roles

- **Cross-Account Role**: Requires MFA and external ID `zero-trust-external-id`
- **Session Duration**: Limited to 1 hour
- **Permissions**: Least-privilege read-only access

### S3 Buckets

All S3 buckets have:
- Public access blocked
- Versioning enabled
- Encryption at rest (KMS or AES256)
- Bucket policies denying unencrypted uploads
- Bucket policies denying public access

### Service Control Policies

SCP templates are provided in `lib/compliance.py` but must be applied manually at the AWS Organizations level:
1. **Prevent Security Service Disable**: Deny stopping CloudTrail, Config, GuardDuty, Security Hub
2. **Require Encryption**: Deny unencrypted S3, EBS, RDS operations
3. **Prevent Public Access**: Deny public S3 buckets and RDS instances

## Cost Optimization

Estimated monthly costs (us-east-1, assuming moderate usage):

- **VPC Endpoints**: ~$7-10/endpoint × 22 = $154-220/month
- **CloudTrail**: $2/100k events + S3 storage
- **VPC Flow Logs**: $0.50/GB ingested
- **AWS Config**: $0.003/config item recorded
- **Security Hub**: $0.0010/finding
- **KMS**: $1/key/month × 4 = $4/month
- **S3 Storage**: Variable based on log volume

**Total estimated**: ~$200-300/month for comprehensive Zero Trust monitoring

### Cost Reduction Strategies

1. **VPC Endpoints**: Create only for services you actively use
2. **VPC Flow Logs**: Use S3 instead of CloudWatch Logs (cheaper storage)
3. **CloudWatch Log Retention**: Set to 7 days (configured)
4. **AWS Config**: Focus on critical compliance rules only

## Troubleshooting

### Issue: GuardDuty Detector Already Exists

**Error**: `The request is rejected because a detector already exists`

**Solution**: Remove GuardDuty detector creation from code. GuardDuty is account-level and should already be enabled.

### Issue: IAM Policy Not Found

**Error**: `Policy arn:aws:iam::aws:policy/service-role/ConfigRole does not exist`

**Solution**: Use correct policy ARN: `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole` (note the `AWS_` prefix)

### Issue: VPC Endpoint Conflicts

**Error**: `A VPC endpoint with the specified configuration already exists`

**Solution**: Ensure `environmentSuffix` is unique for each deployment. Check existing VPC endpoints with:
```bash
aws ec2 describe-vpc-endpoints --region us-east-1
```

### Issue: S3 Bucket Name Conflict

**Error**: `BucketAlreadyExists`

**Solution**: S3 bucket names are globally unique. Ensure your `environmentSuffix` creates unique bucket names.

## Maintenance

### Updating the Stack

```bash
# Update code
git pull

# Plan changes
cdktf plan

# Apply changes
cdktf deploy
```

### Rotating KMS Keys

KMS keys have automatic rotation enabled (annually). No manual action required.

### Updating Config Rules

Add new Config rules to `lib/security.py`:
```python
ConfigConfigRule(
    self,
    "new_rule_id",
    name=f"zero-trust-new-rule-{self.environment_suffix}",
    source=ConfigConfigRuleSource(
        owner="AWS",
        source_identifier="RULE_IDENTIFIER",
    ),
    depends_on=[self.config_recorder],
)
```

### Updating Security Hub Insights

Add new insights to `lib/security.py`:
```python
SecurityhubInsight(
    self,
    "new_insight_id",
    filters={
        "severity_label": [{"comparison": "EQUALS", "value": "HIGH"}]
    },
    group_by_attribute="ResourceType",
    name=f"New Insight - {self.environment_suffix}",
)
```

## Cleanup

### Destroy Infrastructure

```bash
# Plan destruction
cdktf plan --destroy

# Destroy infrastructure
cdktf destroy
```

**Note**: All resources are configured to be destroyable (no retention policies). S3 buckets will be deleted with their contents.

## Testing

### Unit Tests

Tests should be created in `tests/unit/` directory:
- `test_vpc.py`: VPC and endpoint configuration
- `test_iam.py`: IAM role policies
- `test_encryption.py`: KMS key policies
- `test_monitoring.py`: CloudTrail and Flow Logs
- `test_security.py`: Security Hub and Config rules
- `test_waf.py`: WAF rules
- `test_compliance.py`: SCP policy documents

### Integration Tests

Tests should be created in `tests/integration/` directory:
- Verify VPC endpoints are functional
- Test IAM role assumption with MFA
- Validate CloudTrail logging
- Check Config rule compliance
- Verify Security Hub findings
- Test WAF rule blocking

### Running Tests

```bash
# Unit tests
pipenv run pytest tests/unit/ -v --cov=lib

# Integration tests (requires deployed infrastructure)
pipenv run pytest tests/integration/ -v
```

## Multi-Account Deployment

### Deployment Strategy

1. **Security Account**: Deploy full stack including Security Hub delegated admin
2. **Member Accounts**: Deploy subset (VPC endpoints, Config, CloudTrail to central bucket)
3. **Central Logging**: All accounts send logs to Security Account S3 buckets

### Configuration Per Account

Adjust `tap_stack.py` for member accounts:
- Skip Security Hub account enablement
- Use cross-account S3 buckets for CloudTrail
- Configure Config aggregator to Security Account

## Support

For issues or questions:
1. Check AWS service status
2. Review CloudWatch Logs for error messages
3. Verify IAM permissions
4. Check Security Hub findings for misconfigurations
5. Review AWS Config compliance dashboard

## References

- [AWS Zero Trust Architecture](https://aws.amazon.com/security/zero-trust/)
- [AWS Well-Architected Framework - Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/)
- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [AWS VPC Endpoints](https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints.html)
- [AWS Security Hub](https://docs.aws.amazon.com/securityhub/)
- [AWS Config](https://docs.aws.amazon.com/config/)
