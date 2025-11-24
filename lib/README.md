# Secure Secrets Vault with Automated Rotation

This Pulumi TypeScript project implements a secure secrets management infrastructure with automated credential rotation for AWS Aurora MySQL databases.

## Architecture

- **Aurora MySQL 8.0**: Encrypted database cluster in private subnets (Multi-AZ)
- **AWS Secrets Manager**: Secure storage for database credentials with automatic rotation
- **Lambda Function**: Node.js 18.x rotation handler invoked every 30 days
- **Customer-Managed KMS Keys**: Separate keys for database, secrets, and logs
- **VPC Endpoints**: Private connectivity to Secrets Manager and KMS (no internet required)
- **CloudWatch Logs**: Encrypted audit trail for all rotation operations

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create VPC, RDS, Lambda, KMS, Secrets Manager resources

## Deployment

### 1. Install Dependencies

```bash
cd lib
npm install
```

### 2. Configure Pulumi Stack

```bash
pulumi stack init dev
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix dev-001
```

### 3. Deploy Infrastructure

```bash
pulumi up
```

Review the preview and confirm deployment. The process takes approximately 10-15 minutes due to RDS cluster provisioning.

### 4. Retrieve Outputs

```bash
pulumi stack output secretArn
pulumi stack output vpcId
pulumi stack output clusterEndpoint
```

## Architecture Details

### Network Isolation

- VPC with private subnets across 2 availability zones
- No public subnets or NAT gateways
- VPC endpoints for AWS services (Secrets Manager, KMS)
- Security groups controlling Lambda-to-Aurora communication

### Encryption

- **Database**: Encrypted at rest using customer-managed KMS key
- **Secrets**: Encrypted using dedicated KMS key with automatic rotation
- **Logs**: CloudWatch Logs encrypted with KMS key
- All KMS keys have automatic key rotation enabled

### IAM Permissions

All IAM policies follow least-privilege principle:
- Lambda function has specific resource ARNs (no wildcards except GetRandomPassword)
- KMS key policies include comprehensive service principal permissions
- CloudWatch Logs has explicit encryption context conditions

### Rotation Process

The Lambda function handles 4-step rotation:

1. **createSecret**: Generate new random password
2. **setSecret**: Update password in Aurora using current credentials
3. **testSecret**: Verify new password works
4. **finishSecret**: Mark new version as AWSCURRENT

Rotation occurs automatically every 30 days.

## Critical Configuration Notes

### Aurora Instance Class

Uses `db.t3.medium` instance class. This is required because:
- Aurora MySQL 8.0.mysql_aurora.3.04.0 is not compatible with db.t3.small
- db.t3.medium provides sufficient resources for rotation operations

### KMS Key Policies

The CloudWatch Logs KMS key includes:
- Service principal: `logs.{region}.amazonaws.com`
- Encryption context condition for specific log group ARN
- Permissions: Encrypt, Decrypt, ReEncrypt, GenerateDataKey, CreateGrant, DescribeKey

This comprehensive policy prevents deployment errors related to log group encryption.

## Outputs

- `secretArn`: ARN of the Secrets Manager secret containing database credentials
- `vpcId`: ID of the VPC containing all resources
- `clusterEndpoint`: Endpoint address of the Aurora cluster

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured as destroyable:
- Aurora cluster: `skipFinalSnapshot: true`, `deletionProtection: false`
- No RETAIN removal policies on any resources

## Testing

After deployment, verify rotation works:

```bash
# Trigger manual rotation
aws secretsmanager rotate-secret \
  --secret-id $(pulumi stack output secretArn) \
  --rotation-lambda-arn <lambda-arn>

# Check CloudWatch Logs
aws logs tail /aws/lambda/rotation-function-{environmentSuffix} --follow
```

## Compliance and Tagging

All resources include tags:
- `Environment`: Environment identifier (from environmentSuffix)
- `CostCenter`: "security-operations"
- `Compliance`: "required"

## Security Considerations

- Database is not publicly accessible
- All network traffic stays within AWS private network via VPC endpoints
- Lambda function runs in VPC with no internet gateway access
- Credentials never logged or exposed in plaintext
- Rotation happens transparently without application downtime

## Troubleshooting

### Rotation Failures

Check Lambda logs:
```bash
aws logs tail /aws/lambda/rotation-function-{environmentSuffix}
```

Common issues:
- Network connectivity: Verify security groups allow Lambda → Aurora on port 3306
- KMS permissions: Ensure Lambda role can decrypt secrets
- Database permissions: Verify master user can ALTER USER

### KMS Key Policy Errors

If CloudWatch Logs fail to create:
- Verify KMS key policy includes logs service principal
- Check encryption context condition matches log group ARN exactly
- Ensure region placeholder is correctly interpolated

## Cost Optimization

- Aurora Serverless not used due to cold start concerns with rotation
- db.t3.medium balances cost with performance requirements
- CloudWatch Logs retention: 30 days (adjust if needed)
- No NAT gateway costs (VPC endpoints used instead)

## Maintenance

- KMS keys rotate automatically (yearly)
- Secrets rotate automatically (30 days)
- Monitor CloudWatch Logs for rotation failures
- Review IAM policies quarterly for least-privilege compliance
