# Security-Hardened Payment Processing Infrastructure

CloudFormation template for deploying PCI-DSS compliant infrastructure for payment card data processing.

## Architecture

This template deploys:

- **VPC**: 3 availability zones with public and private subnets
- **RDS PostgreSQL**: Multi-AZ deployment with KMS encryption in private subnets
- **S3**: Encrypted bucket for audit logs with versioning and public access blocking
- **KMS**: Encryption key with automatic rotation for RDS
- **IAM**: EC2 instance role with least-privilege permissions
- **CloudWatch Logs**: Application log group with 90-day retention
- **VPC Flow Logs**: Network traffic logging to S3
- **CloudTrail**: Audit trail with log file validation

## Security Features

### Network Isolation
- Private subnets for database tier (no internet access)
- Security groups with least-privilege rules
- No 0.0.0.0/0 ingress rules
- HTTPS-only communication between tiers

### Encryption
- RDS encryption at rest using KMS
- KMS automatic key rotation enabled
- S3 server-side encryption (AES-256)
- TLS 1.2+ for data in transit

### Audit and Compliance
- VPC Flow Logs for all network interfaces
- CloudTrail logging with validation
- CloudWatch Logs with 90-day retention
- All resources tagged for compliance tracking

### Access Control
- IAM roles with specific permissions (no wildcards)
- Least-privilege principle enforced
- Multi-AZ RDS for high availability

## Prerequisites

- AWS CLI configured with appropriate IAM permissions
- CloudFormation permissions to create all resources
- KMS permissions for key creation and management

## Deployment

### Using AWS CLI

```bash
aws cloudformation create-stack \
  --stack-name payment-security-infrastructure \
  --template-body file://lib/security-infrastructure.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=DBMasterUsername,ParameterValue=dbadmin \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Using AWS Console

1. Open CloudFormation console in us-east-1 region
2. Click "Create stack" → "With new resources"
3. Upload `lib/security-infrastructure.yaml`
4. Provide stack name and parameters:
   - EnvironmentSuffix: unique identifier (e.g., "prod", "dev")
   - DBMasterUsername: database admin username
   - DBMasterPassword: strong password (min 8 chars)
5. Acknowledge IAM resource creation
6. Review and create stack

## Parameters

- **EnvironmentSuffix**: Unique suffix for resource naming (default: "dev")
- **DBMasterUsername**: Master username for PostgreSQL (default: "dbadmin")
- **DBMasterPassword**: Master password for PostgreSQL (required, min 8 chars)

## Outputs

The template exports the following values:

- VPCId: VPC identifier
- PrivateSubnet1/2/3Id: Private subnet identifiers
- DBEndpoint: RDS PostgreSQL endpoint address
- DBPort: RDS PostgreSQL port
- AuditLogBucketName: S3 bucket for audit logs
- ApplicationLogGroupName: CloudWatch log group
- EC2InstanceProfileArn: IAM instance profile ARN
- RDSKMSKeyId: KMS key for encryption
- ApplicationSecurityGroupId: Application tier security group
- DBSecurityGroupId: Database tier security group

## Stack Deletion

To delete the stack:

```bash
aws cloudformation delete-stack \
  --stack-name payment-security-infrastructure \
  --region us-east-1
```

**Note**: All resources are configured for deletion (no retention policies).

## Compliance

This infrastructure meets PCI-DSS requirements:

- **Requirement 1**: Network segmentation with firewalls (Security Groups)
- **Requirement 2**: No default credentials, strong passwords required
- **Requirement 3**: Data encryption at rest (KMS) and in transit (TLS)
- **Requirement 4**: Encrypted transmission of cardholder data (HTTPS only)
- **Requirement 6**: Secure development (IaC best practices)
- **Requirement 7**: Least-privilege access (IAM roles)
- **Requirement 8**: Strong authentication (database credentials)
- **Requirement 9**: Physical access controls (AWS data centers)
- **Requirement 10**: Audit logging (CloudTrail, VPC Flow Logs)
- **Requirement 11**: Security monitoring (CloudWatch)
- **Requirement 12**: Security policies (enforced via templates)

## Cost Optimization

This template uses:
- db.t3.medium RDS instance (adjustable)
- gp3 storage for cost efficiency
- S3 lifecycle policy for log archival
- Multi-AZ for high availability (required for production)

## Monitoring

Monitor your infrastructure:

```bash
# Check RDS status
aws rds describe-db-instances \
  --db-instance-identifier payment-db-<suffix>

# View CloudWatch logs
aws logs tail /aws/application/payment-processing-<suffix> --follow

# Check VPC Flow Logs
aws s3 ls s3://payment-audit-logs-<account-id>-<suffix>/
```

## Troubleshooting

### Stack Creation Fails

- Check IAM permissions for CloudFormation
- Verify parameter values (password strength, etc.)
- Check CloudFormation events for specific errors

### Cannot Connect to Database

- Verify security group rules
- Ensure application is in correct VPC/subnet
- Check RDS instance status

### Missing Logs

- Verify CloudWatch Logs permissions
- Check VPC Flow Logs configuration
- Ensure CloudTrail is logging

## Support

For issues or questions:
- Review CloudFormation events in AWS Console
- Check AWS service health dashboard
- Review CloudWatch Logs for application errors
