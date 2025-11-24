# Multi-Environment CloudFormation Infrastructure

Complete CloudFormation JSON solution for deploying consistent infrastructure across development, staging, and production environments.

## Quick Start

```bash
# 1. Upload nested templates to S3
aws s3 cp lib/vpc-nested-stack.json s3://your-bucket/
aws s3 cp lib/rds-nested-stack.json s3://your-bucket/
aws s3 cp lib/lambda-nested-stack.json s3://your-bucket/
aws s3 cp lib/s3-nested-stack.json s3://your-bucket/
aws s3 cp lib/monitoring-nested-stack.json s3://your-bucket/

# 2. Deploy master template
aws cloudformation create-stack \
  --stack-name infrastructure-dev \
  --template-body file://lib/master-template.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=EnvironmentSuffix,ParameterValue=xyz123 \
    ParameterKey=VPCTemplateURL,ParameterValue=https://your-bucket.s3.amazonaws.com/vpc-nested-stack.json \
    ParameterKey=RDSTemplateURL,ParameterValue=https://your-bucket.s3.amazonaws.com/rds-nested-stack.json \
    ParameterKey=LambdaTemplateURL,ParameterValue=https://your-bucket.s3.amazonaws.com/lambda-nested-stack.json \
    ParameterKey=S3TemplateURL,ParameterValue=https://your-bucket.s3.amazonaws.com/s3-nested-stack.json \
    ParameterKey=MonitoringTemplateURL,ParameterValue=https://your-bucket.s3.amazonaws.com/monitoring-nested-stack.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Architecture

The solution uses a master template with five nested stacks:

1. **VPC Stack** - Network infrastructure with conditional NAT Gateway
2. **RDS Stack** - Aurora PostgreSQL cluster with encryption and backups
3. **Lambda Stack** - Data processing functions with environment-specific memory
4. **S3 Stack** - Storage with cross-region replication to us-west-2
5. **Monitoring Stack** - CloudWatch alarms and SNS notifications

## Environment Configurations

| Configuration | Dev | Staging | Prod |
|--------------|-----|---------|------|
| VPC CIDR | 10.0.0.0/16 | 10.1.0.0/16 | 10.2.0.0/16 |
| Instance Type | t3.micro | t3.small | t3.medium |
| Lambda Memory | 256MB | 256MB | 512MB |
| RDS Instance | db.t3.medium | db.r5.large | db.r5.xlarge |
| NAT Gateway | No | Yes | Yes |

## Key Features

- **Nested Stacks** - Modular architecture for independent updates
- **Parameter Mappings** - Environment-specific configurations centralized
- **Conditional Resources** - NAT Gateway only in staging and prod
- **Encryption** - RDS and S3 encrypted at rest
- **High Availability** - Multi-AZ deployment with 2 RDS instances
- **Disaster Recovery** - S3 cross-region replication to us-west-2
- **Monitoring** - CloudWatch alarms for RDS and Lambda metrics
- **Clean Teardown** - DeletionPolicy: Delete for all resources

## Stack Outputs

All critical resource identifiers are exported:
- VPCId, PublicSubnet1/2, PrivateSubnet1/2
- DatabaseEndpoint, DatabaseReaderEndpoint
- DataProcessorFunctionArn, DataProcessorFunctionName
- ApplicationBucketName, ApplicationBucketArn
- AlarmTopicArn

## Security

- RDS and Lambda in private subnets with no public access
- Security groups follow least privilege principle
- Database credentials managed by AWS Secrets Manager
- S3 buckets block all public access
- IAM roles with scoped permissions

## Cost Optimization

- Conditional NAT Gateway (dev uses VPC endpoints)
- Right-sized instances per environment
- S3 Intelligent Tiering for automatic cost optimization
- 30-day lifecycle policy for Glacier transitions
- 7-day CloudWatch Logs retention

## Monitoring

CloudWatch alarms configured for:
- RDS CPU utilization > 80%
- RDS database connections > 80
- Lambda errors > 10 per minute
- Lambda throttles >= 1 event

All alarms publish to SNS topic for notifications.

## Validation

```bash
# Validate templates
aws cloudformation validate-template --template-body file://lib/master-template.json
aws cloudformation validate-template --template-body file://lib/vpc-nested-stack.json
aws cloudformation validate-template --template-body file://lib/rds-nested-stack.json
aws cloudformation validate-template --template-body file://lib/lambda-nested-stack.json
aws cloudformation validate-template --template-body file://lib/s3-nested-stack.json
aws cloudformation validate-template --template-body file://lib/monitoring-nested-stack.json
```

## Cleanup

```bash
# Delete stack and all resources
aws cloudformation delete-stack --stack-name infrastructure-dev --region us-east-1
```

All resources will be automatically deleted including S3 buckets with contents.

## Files

- `master-template.json` - Master orchestration template
- `vpc-nested-stack.json` - VPC, subnets, NAT, security groups
- `rds-nested-stack.json` - Aurora PostgreSQL cluster
- `lambda-nested-stack.json` - Lambda functions
- `s3-nested-stack.json` - S3 buckets with replication
- `monitoring-nested-stack.json` - CloudWatch and SNS

## Requirements Met

All 9 requirements from the specification implemented:
1. Master template with nested stacks
2. Parameter mappings for environment-specific values
3. RDS Aurora PostgreSQL with encryption and backups
4. Lambda functions with environment-specific memory
5. S3 with intelligent tiering and cross-region replication
6. VPC infrastructure with non-overlapping CIDRs
7. Conditional NAT Gateway creation
8. CloudWatch alarms with SNS topics
9. Comprehensive stack outputs

## Platform Details

- Platform: CloudFormation (cfn)
- Language: JSON
- Primary Region: us-east-1
- DR Region: us-west-2
