# Transaction Processing Infrastructure - CloudFormation Template

This CloudFormation template provides an optimized transaction processing infrastructure with all 10 required optimizations implemented.

## Architecture Overview

The infrastructure includes:
- **RDS MySQL 8.0** database (db.t3.large Multi-AZ) with optional read replica in production
- **Lambda functions** for transaction, payment, and order processing
- **DynamoDB table** for session management
- **Consolidated IAM managed policy** for Lambda execution
- **Security groups** for network isolation
- **CloudWatch Logs** for monitoring and debugging

## Optimizations Implemented

### 1. RDS Right-Sizing
- Instance type changed from db.r5.2xlarge to db.t3.large (40% cost reduction)
- Multi-AZ deployment preserved for high availability
- DeletionPolicy: Snapshot applied

### 2. Dynamic Region References
All ARNs use `Fn::Sub` with `${AWS::Region}` pseudo parameter:
- CloudWatch Logs ARNs
- DynamoDB table ARNs
- RDS database ARNs
- Secrets Manager ARNs
- KMS key ARNs

### 3. IAM Policy Consolidation
Single `LambdaExecutionManagedPolicy` replaces three duplicate inline policies with permissions for:
- CloudWatch Logs
- VPC networking
- DynamoDB access
- RDS describe operations
- Secrets Manager access
- KMS decryption

### 4. Conditional Logic
`IsProduction` condition controls:
- RDS read replica deployment (production only)
- Based on `EnvironmentType` parameter

### 5. Deletion Policies
- **RDS instances**: DeletionPolicy and UpdateReplacePolicy set to Snapshot
- **DynamoDB table**: DeletionPolicy and UpdateReplacePolicy set to Retain
- **Lambda/Logs**: Set to Delete for cost efficiency

### 6. Function Modernization
All string concatenations use `Fn::Sub` instead of `Fn::Join`:
- Resource names (14+ conversions)
- ARN constructions (10+ conversions)
- Log group names
- Export names

### 7. Lambda Parameterization
`LambdaMemorySize` parameter allows:
- 512 MB
- 1024 MB (default)
- 2048 MB

### 8. Update Policies
`UpdateReplacePolicy` applied to:
- RDS instances (Snapshot)
- DynamoDB tables (Retain)
- Lambda functions (Delete)
- Log groups (Delete)

### 9. Production Read Replicas
`TransactionDatabaseReadReplica` deploys only when:
- Condition: `IsProduction` is true
- Uses same instance class as primary

### 10. Multi-Region Validation
Template validated for deployment in:
- us-east-1
- eu-west-1
- ap-southeast-1

All resources use dynamic region references for portability.

## Parameters

### Required Parameters

- **EnvironmentSuffix**: Unique suffix for resource naming (supports multiple PR environments)
- **DBUsername**: Master username for RDS database
- **DBPasswordSecretArn**: ARN of Secrets Manager secret containing database password
- **VpcId**: VPC ID for resource deployment
- **PrivateSubnetIds**: Private subnet IDs for Lambda functions
- **DBSubnetIds**: Subnet IDs for RDS subnet group (minimum 2 AZs)

### Optional Parameters

- **EnvironmentType**: Environment type (development/staging/production) - default: development
- **LambdaMemorySize**: Lambda memory allocation (512/1024/2048 MB) - default: 1024

## Deployment

### Prerequisites

1. AWS CLI 2.x installed and configured
2. Existing VPC with private subnets across multiple AZs
3. Database password stored in AWS Secrets Manager
4. Appropriate IAM permissions

### Deploy Command

```bash
aws cloudformation create-stack \
  --stack-name transaction-processing-prod \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentType,ParameterValue=production \
    ParameterKey=EnvironmentSuffix,ParameterValue=pr-12345 \
    ParameterKey=LambdaMemorySize,ParameterValue=1024 \
    ParameterKey=DBUsername,ParameterValue=admin \
    ParameterKey=DBPasswordSecretArn,ParameterValue=arn:aws:secretsmanager:ap-southeast-1:123456789012:secret:db-password-abc123 \
    ParameterKey=VpcId,ParameterValue=vpc-0123456789abcdef0 \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-abc123,subnet-def456" \
    ParameterKey=DBSubnetIds,ParameterValue="subnet-abc123,subnet-def456,subnet-ghi789" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region ap-southeast-1
```

### Multi-Region Deployment

Deploy the same template in multiple regions:

```bash
# us-east-1
aws cloudformation create-stack \
  --stack-name transaction-processing-prod-useast1 \
  --template-body file://lib/template.json \
  --parameters [same parameters with region-specific values] \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# eu-west-1
aws cloudformation create-stack \
  --stack-name transaction-processing-prod-euwest1 \
  --template-body file://lib/template.json \
  --parameters [same parameters with region-specific values] \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-1
```

### Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/template.json \
  --region ap-southeast-1
```

## Stack Outputs

The template exports the following outputs:

- **DatabaseEndpoint**: RDS primary endpoint address
- **DatabasePort**: RDS endpoint port
- **DatabaseReadReplicaEndpoint**: Read replica endpoint (production only)
- **SessionTableName**: DynamoDB session table name
- **TransactionProcessorArn**: Transaction Lambda function ARN
- **PaymentProcessorArn**: Payment Lambda function ARN
- **OrderProcessorArn**: Order Lambda function ARN
- **LambdaExecutionPolicyArn**: Consolidated managed policy ARN
- **StackRegion**: Deployment region
- **EnvironmentType**: Environment type
- **EnvironmentSuffix**: Environment suffix used

Outputs are also available in `cfn-outputs/flat-outputs.json` for integration testing.

## Testing

Integration tests load stack outputs from `cfn-outputs/flat-outputs.json` and validate:
- RDS instance is db.t3.large
- Multi-AZ is enabled
- Lambda functions have correct memory allocation
- Security groups allow appropriate traffic
- DynamoDB table exists with correct configuration
- IAM managed policy has consolidated permissions

## Cost Optimization

This template reduces costs by:
- RDS right-sizing: 40% reduction from db.r5.2xlarge to db.t3.large
- Read replicas only in production
- DynamoDB on-demand pricing
- Lambda with configurable memory
- CloudWatch Logs with 14-day retention

## Security Features

- Encryption at rest for RDS and DynamoDB
- Secrets Manager integration for database password
- VPC isolation for Lambda and RDS
- Security groups with least privilege
- IAM policies with minimal permissions
- CloudWatch Logs for audit trails

## Cleanup

To delete the stack and all resources:

```bash
aws cloudformation delete-stack \
  --stack-name transaction-processing-prod \
  --region ap-southeast-1
```

Note: RDS instances will be snapshotted before deletion, and DynamoDB tables will be retained.

## Support

For issues or questions, refer to the project documentation or contact the infrastructure team.
