# Financial Transaction Processing Infrastructure

This CloudFormation template deploys an optimized infrastructure stack for financial transaction processing using RDS Aurora MySQL ServerlessV2 and AWS Lambda.

## Architecture Overview

The template creates:

- **RDS Aurora MySQL ServerlessV2 Cluster**: Scalable database cluster with 0.5-1.0 ACU range
- **Lambda Function**: Transaction processor with 3GB memory and reserved concurrency of 100
- **DynamoDB Table**: Session management with PAY_PER_REQUEST billing and TTL
- **VPC Integration**: Security groups for Lambda and RDS with proper ingress/egress rules
- **Secrets Manager**: Secure storage for database credentials
- **CloudWatch Dashboard**: Production monitoring (enabled for prod environment only)
- **SNS Topic**: Deployment notifications

## Key Features

### Deployment Optimization

- **Zero Circular Dependencies**: All resources use explicit DependsOn or Ref/GetAtt patterns
- **Fast Deployment**: Optimized for under 15-minute deployment time
- **Update Safety**: UpdateReplacePolicy set to Retain for stateful resources
- **Resource Control**: ReservedConcurrentExecutions prevents Lambda scaling issues

### Environment-Specific Behavior

- **Production**: Enhanced monitoring, Performance Insights, 30-day log retention, CloudWatch dashboard
- **Dev/Staging**: Basic monitoring, 7-day log retention, no dashboard

### Security

- VPC-isolated Lambda and RDS deployment
- Security groups with minimal required access
- Secrets Manager integration for credential management
- No public accessibility for database

## Prerequisites

- Existing VPC in us-east-1 region
- At least 2 private subnets in different availability zones
- VPC ID and subnet IDs available for parameters

## Parameters

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| EnvironmentName | String | Environment (dev/staging/prod) | dev |
| EnvironmentSuffix | String | Unique suffix for resource naming | Required |
| DBUsername | String | Database master username | admin |
| DBPassword | String | Database master password | Required |
| VPCId | VPC ID | Existing VPC for deployment | Required |
| PrivateSubnetIds | Subnet IDs | Private subnets for RDS and Lambda | Required |

## Deployment

### Using AWS CLI

```bash
aws cloudformation deploy \
  --stack-name TapStack-prod \
  --template-file lib/TapStack.json \
  --parameter-overrides \
    EnvironmentName=prod \
    EnvironmentSuffix=prod \
    DBUsername=admin \
    DBPassword=YourSecurePassword123! \
    VPCId=vpc-xxxxxxxxx \
    PrivateSubnetIds=subnet-xxxxxxxx,subnet-yyyyyyyy,subnet-zzzzzzzz \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Using AWS Console

1. Navigate to CloudFormation console in us-east-1 region
2. Click "Create stack" > "With new resources"
3. Upload `lib/TapStack.json`
4. Fill in required parameters
5. Acknowledge IAM resource creation
6. Click "Create stack"

### Validation

Before deploying, validate the template:

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json \
  --region us-east-1
```

## Stack Outputs

| Output | Description | Exported As |
|--------|-------------|-------------|
| RDSClusterEndpoint | Aurora cluster write endpoint | ${StackName}-RDSClusterEndpoint |
| RDSClusterReadEndpoint | Aurora cluster read endpoint | ${StackName}-RDSClusterReadEndpoint |
| LambdaFunctionArn | Lambda function ARN | ${StackName}-LambdaFunctionArn |
| LambdaSecurityGroupId | Lambda security group ID | ${StackName}-LambdaSecurityGroupId |
| DBSecurityGroupId | RDS security group ID | ${StackName}-DBSecurityGroupId |
| DBSecretArn | Database credentials secret ARN | ${StackName}-DBSecretArn |
| NotificationTopicArn | SNS topic ARN | ${StackName}-NotificationTopicArn |
| SessionTableName | DynamoDB session table name | ${StackName}-SessionTableName |
| SessionTableArn | DynamoDB session table ARN | ${StackName}-SessionTableArn |
| DBSecretArn | Secrets Manager secret ARN | ${StackName}-DBSecretArn |
| NotificationTopicArn | SNS topic ARN | ${StackName}-NotificationTopicArn |

## Resource Dependencies

```
DBSubnetGroup
  ↓
AuroraDBCluster (DeletionPolicy: Retain, UpdateReplacePolicy: Retain)
  ↓
AuroraDBInstance
  ↓
TransactionProcessorFunction (DependsOn: AuroraDBCluster, AuroraDBInstance)
```

Security groups are created independently to avoid circular dependencies.

## Update Strategy

### Safe Updates

- RDS cluster uses DeletionPolicy: Retain and UpdateReplacePolicy: Retain
- Lambda uses DeletionPolicy: Delete for clean removal
- No circular dependencies allow stack updates without deletion

### Update Procedure

1. Test changes in dev environment first
2. Validate template before updating: `aws cloudformation validate-template`
3. Create change set: `aws cloudformation create-change-set`
4. Review changes in change set
5. Execute change set if changes are acceptable

## Monitoring

### CloudWatch Logs

- Lambda logs: `/aws/lambda/transaction-processor-{EnvironmentSuffix}`
- RDS logs: Error logs and slow query logs exported to CloudWatch

### CloudWatch Dashboard (Production Only)

Access at: CloudWatch > Dashboards > `transaction-processing-{EnvironmentSuffix}`

Metrics included:
- Lambda invocations, errors, duration, concurrent executions
- RDS capacity (ACU), database connections

### Performance Insights (Production Only)

- Enabled for RDS instance in production
- 7-day retention period
- Access via RDS console > Performance Insights

## Cost Optimization

- ServerlessV2 scaling: 0.5-1.0 ACU range minimizes idle costs
- Enhanced monitoring: Production only
- Log retention: 7 days (dev/staging), 30 days (prod)
- Reserved concurrency: Prevents runaway Lambda costs

## Troubleshooting

### Stack Creation Fails

1. Verify VPC and subnet IDs exist and are in us-east-1
2. Ensure subnets are in different availability zones
3. Check IAM permissions for CloudFormation
4. Validate password meets complexity requirements (8-41 characters)

### Lambda Cannot Connect to RDS

1. Verify security group rules allow traffic on port 3306
2. Check Lambda is deployed in same VPC as RDS
3. Verify RDS cluster is in available state
4. Check RDS endpoint in Lambda environment variables

### Deployment Takes Too Long

1. Verify using ServerlessV2 (not provisioned instances)
2. Check no unnecessary dependencies in template
3. Ensure VPC subnets have proper routing
4. Monitor stack events in CloudFormation console

## Cleanup

To delete the stack:

```bash
aws cloudformation delete-stack \
  --stack-name transaction-processing-stack \
  --region us-east-1
```

**Note**: RDS cluster will be retained due to DeletionPolicy: Retain. To delete it:

```bash
aws rds delete-db-cluster \
  --db-cluster-identifier aurora-cluster-{EnvironmentSuffix} \
  --skip-final-snapshot \
  --region us-east-1
```

## Security Considerations

- Change default database password immediately after deployment
- Restrict SNS topic subscriptions to authorized personnel
- Review and tighten security group rules based on actual traffic patterns
- Enable VPC Flow Logs for network traffic analysis
- Consider using AWS WAF if Lambda is exposed via API Gateway
- Rotate database credentials regularly using Secrets Manager rotation

## Support

For issues or questions:
1. Check CloudFormation stack events for error messages
2. Review Lambda CloudWatch logs
3. Check RDS cluster status and events
4. Validate all parameters are correct
5. Ensure IAM permissions are sufficient
