# Credit Scoring Application Infrastructure

Complete serverless infrastructure for a credit scoring web application using AWS CloudFormation.

## Quick Start

```bash
# Deploy the stack
aws cloudformation create-stack \
  --stack-name credit-scoring-prod \
  --template-body file://lib/credit-scoring-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=CertificateArn,ParameterValue=YOUR_ACM_CERTIFICATE_ARN \
    ParameterKey=DBMasterPassword,ParameterValue=YourSecurePassword123! \
  --capabilities CAPABILITY_IAM \
  --region us-east-1

# Wait for completion (15-20 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name credit-scoring-prod

# Get the application URL
aws cloudformation describe-stacks \
  --stack-name credit-scoring-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBUrl`].OutputValue' \
  --output text
```

## Architecture

```
Internet
   |
   v
Application Load Balancer (HTTPS)
   |
   v
Lambda Function (Node.js 18)
   |
   v
Aurora Serverless v2 PostgreSQL
```

## Infrastructure Components

### Networking
- VPC spanning 3 availability zones
- 3 public subnets for Application Load Balancer
- 3 private subnets for Lambda and Aurora
- 3 NAT Gateways for Lambda outbound connectivity
- Internet Gateway for public subnet access

### Compute
- Lambda function with Node.js 18 runtime
- Reserved concurrency (100) to prevent throttling
- VPC-enabled for Aurora database access
- Function URL with IAM authentication

### Database
- Aurora Serverless v2 PostgreSQL cluster (15.4)
- 2 database instances across AZs for high availability
- KMS encryption with automatic key rotation
- 30-day backup retention with daily backups
- Automated minor version patching

### Load Balancing
- Internet-facing Application Load Balancer
- HTTPS listener with TLS 1.2 minimum
- HTTP to HTTPS redirect (301)
- Lambda target group integration

### Security
- KMS customer-managed encryption key
- Least-privilege IAM roles
- Network isolation (private subnets)
- Security groups with minimal access

### Logging & Monitoring
- CloudWatch Logs for Lambda (365-day retention)
- CloudWatch Logs for ALB (365-day retention)
- CloudWatch Logs for Aurora (365-day retention)
- S3 bucket for ALB access logs

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **ACM Certificate** for HTTPS (must be in us-east-1)
3. **AWS CLI** configured with credentials

### Creating an ACM Certificate

```bash
# Request a certificate
aws acm request-certificate \
  --domain-name example.com \
  --subject-alternative-names "*.example.com" \
  --validation-method DNS \
  --region us-east-1

# Note the CertificateArn from the output
# Validate the certificate via DNS records
```

## Parameters

| Parameter | Required | Default | Description |
|-----------|----------|---------|-------------|
| **EnvironmentSuffix** | No | prod | Unique suffix for resource naming |
| **CertificateArn** | **Yes** | - | ACM certificate ARN for HTTPS |
| **DBMasterUsername** | No | dbadmin | Aurora database master username |
| **DBMasterPassword** | **Yes** | - | Aurora database password (min 8 characters) |
| **CostCenter** | No | fintech-ops | Cost center tag value |
| **Environment** | No | production | Environment tag value |
| **DataClassification** | No | sensitive | Data classification tag value |

## Deployment

### Option 1: AWS CLI (Recommended)

```bash
aws cloudformation create-stack \
  --stack-name credit-scoring-prod \
  --template-body file://lib/credit-scoring-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:123456789012:certificate/abc-123 \
    ParameterKey=DBMasterUsername,ParameterValue=dbadmin \
    ParameterKey=DBMasterPassword,ParameterValue=SecurePassword123! \
    ParameterKey=CostCenter,ParameterValue=fintech-ops \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=DataClassification,ParameterValue=sensitive \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### Option 2: AWS Console

1. Open AWS CloudFormation console
2. Click "Create Stack" → "With new resources"
3. Upload `lib/credit-scoring-stack.json`
4. Fill in parameters (EnvironmentSuffix, CertificateArn, DBMasterPassword)
5. Acknowledge IAM resource creation
6. Create stack

### Deployment Time

- **Total**: 15-20 minutes
- VPC and networking: 2-3 minutes
- NAT Gateways: 2-3 minutes
- Aurora cluster: 8-10 minutes
- Lambda and ALB: 2-3 minutes

## Outputs

After successful deployment, the stack provides:

```bash
# Get all outputs
aws cloudformation describe-stacks \
  --stack-name credit-scoring-prod \
  --query 'Stacks[0].Outputs'
```

Key outputs:
- **ALBUrl**: HTTPS URL to access the application
- **LambdaFunctionArn**: Lambda function ARN
- **AuroraClusterEndpoint**: Database writer endpoint
- **VPCId**: VPC identifier

## Testing

### Test the Application

```bash
# Get the ALB URL
ALB_URL=$(aws cloudformation describe-stacks \
  --stack-name credit-scoring-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`ALBUrl`].OutputValue' \
  --output text)

# Send a test request
curl -X POST $ALB_URL \
  -H "Content-Type: application/json" \
  -d '{"customer_id": "12345", "request_type": "score"}'
```

Expected response:
```json
{
  "creditScore": 745,
  "timestamp": "2025-11-27T12:34:56.789Z",
  "status": "success"
}
```

### Test Lambda Function Directly

```bash
# Get function name
FUNCTION_NAME=$(aws cloudformation describe-stacks \
  --stack-name credit-scoring-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionArn`].OutputValue' \
  --output text | awk -F: '{print $NF}')

# Invoke function
aws lambda invoke \
  --function-name $FUNCTION_NAME \
  --payload '{"customer_id": "12345"}' \
  response.json

# View response
cat response.json
```

### Verify Database Connection

```bash
# Get database endpoint
DB_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name credit-scoring-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`AuroraClusterEndpoint`].OutputValue' \
  --output text)

echo "Database endpoint: $DB_ENDPOINT"

# Connect via psql (requires bastion host or VPN)
psql -h $DB_ENDPOINT -U dbadmin -d creditscoring
```

## Monitoring

### CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/credit-scoring-prod --follow

# View ALB logs
aws logs tail /aws/alb/credit-scoring-prod --follow

# View Aurora logs
aws logs tail /aws/rds/cluster/credit-scoring-aurora-cluster-prod/postgresql --follow
```

### CloudWatch Metrics

Monitor key metrics:
- **Lambda**: Invocations, Duration, Errors, Throttles
- **ALB**: RequestCount, TargetResponseTime, HTTPCode_Target_5XX_Count
- **Aurora**: DatabaseConnections, CPUUtilization, ServerlessDatabaseCapacity

### Create Dashboard

```bash
# Create CloudWatch dashboard
aws cloudwatch put-dashboard \
  --dashboard-name credit-scoring-prod \
  --dashboard-body file://dashboard.json
```

## Updating the Stack

### Update Lambda Code

```bash
# Update function code
aws lambda update-function-code \
  --function-name credit-scoring-prod \
  --zip-file fileb://function.zip

# Update environment variables
aws lambda update-function-configuration \
  --function-name credit-scoring-prod \
  --environment Variables={KEY=VALUE}
```

### Update Stack

```bash
aws cloudformation update-stack \
  --stack-name credit-scoring-prod \
  --template-body file://lib/credit-scoring-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,UsePreviousValue=true \
    ParameterKey=CertificateArn,UsePreviousValue=true \
    ParameterKey=DBMasterPassword,UsePreviousValue=true \
  --capabilities CAPABILITY_IAM
```

## Security Best Practices

### 1. Rotate Database Credentials

```bash
# Store in Secrets Manager
aws secretsmanager create-secret \
  --name credit-scoring/db/password \
  --secret-string '{"username":"dbadmin","password":"NewPassword123!"}'

# Enable automatic rotation
aws secretsmanager rotate-secret \
  --secret-id credit-scoring/db/password \
  --rotation-lambda-arn arn:aws:lambda:...
```

### 2. Enable WAF

```bash
# Create WAF WebACL
aws wafv2 create-web-acl \
  --name credit-scoring-waf \
  --scope REGIONAL \
  --default-action Allow={} \
  --rules file://waf-rules.json

# Associate with ALB
aws wafv2 associate-web-acl \
  --web-acl-arn arn:aws:wafv2:... \
  --resource-arn arn:aws:elasticloadbalancing:...
```

### 3. Enable CloudTrail

```bash
# Ensure CloudTrail is logging all API calls
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=ResourceName,AttributeValue=credit-scoring-prod
```

## Cost Optimization

### Estimated Monthly Costs (us-east-1)

| Service | Configuration | Estimated Cost |
|---------|--------------|----------------|
| Aurora Serverless v2 | 0.5-2 ACUs, 24/7 | $43-$173/month |
| Lambda | 1M requests, 512MB, 1s avg | $20/month |
| ALB | 1M requests | $22/month |
| NAT Gateway | 3 gateways, 100GB | $97/month |
| CloudWatch Logs | 10GB ingestion, 365d retention | $5/month |
| **Total** | | **$187-$317/month** |

### Reduce Costs

1. **Use VPC Endpoints** instead of NAT Gateways for AWS services
2. **Reduce NAT Gateways** from 3 to 1 (less HA)
3. **Lower Aurora capacity** to 0.5-1 ACUs if not heavily used
4. **Reduce log retention** from 365 to 90 days (if compliance allows)
5. **Use Lambda provisioned concurrency** only during peak hours

## Troubleshooting

### Stack Creation Fails

**Issue**: Stack creation fails at Aurora cluster

**Solution**: Check:
- VPC has DNS support enabled
- Subnets in at least 2 AZs
- Security group rules allow port 5432
- KMS key policy allows RDS service

```bash
# Check stack events
aws cloudformation describe-stack-events \
  --stack-name credit-scoring-prod \
  --max-items 20
```

### Lambda Cannot Connect to Aurora

**Issue**: Lambda function times out when accessing database

**Solution**: Verify:
1. Lambda is in private subnets
2. Security groups allow Lambda → Aurora on port 5432
3. NAT Gateway is functioning for AWS API calls
4. Database cluster is available

```bash
# Check Lambda VPC configuration
aws lambda get-function-configuration \
  --function-name credit-scoring-prod \
  --query 'VpcConfig'

# Check security group rules
aws ec2 describe-security-groups \
  --group-ids sg-xxxxx
```

### ALB Returns 502 Bad Gateway

**Issue**: ALB returns 502 errors

**Solution**: Check:
1. Lambda function is running without errors
2. Lambda has permission to be invoked by ALB
3. Target group health status
4. Lambda concurrency limits

```bash
# Check target health
aws elbv2 describe-target-health \
  --target-group-arn arn:aws:elasticloadbalancing:...

# Check Lambda errors
aws logs filter-log-events \
  --log-group-name /aws/lambda/credit-scoring-prod \
  --filter-pattern "ERROR"
```

### High Costs

**Issue**: Unexpected AWS costs

**Solution**: Check:
1. NAT Gateway data transfer charges
2. Aurora ACU usage (check CloudWatch ServerlessDatabaseCapacity)
3. Lambda invocations and duration
4. CloudWatch Logs ingestion

```bash
# Check cost and usage
aws ce get-cost-and-usage \
  --time-period Start=2025-11-01,End=2025-11-30 \
  --granularity DAILY \
  --metrics UnblendedCost \
  --group-by Type=SERVICE
```

## Cleanup

### Delete the Stack

**Important**: Empty S3 bucket first

```bash
# Get bucket name
BUCKET_NAME=$(aws cloudformation describe-stacks \
  --stack-name credit-scoring-prod \
  --query 'Stacks[0].Parameters[?ParameterKey==`EnvironmentSuffix`].ParameterValue' \
  --output text)

# Empty S3 bucket
aws s3 rm s3://credit-scoring-alb-logs-${BUCKET_NAME}-$(aws sts get-caller-identity --query Account --output text) --recursive

# Delete stack
aws cloudformation delete-stack \
  --stack-name credit-scoring-prod

# Wait for deletion (10-15 minutes)
aws cloudformation wait stack-delete-complete \
  --stack-name credit-scoring-prod

echo "Stack deleted successfully"
```

All resources will be permanently deleted (DeletionPolicy: Delete).

## Compliance & Security

### Encryption
- ✅ KMS encryption at rest for Aurora
- ✅ TLS 1.2+ for data in transit
- ✅ Automatic key rotation enabled

### Logging
- ✅ 365-day log retention (Lambda, ALB, Aurora)
- ✅ CloudWatch Logs for all components
- ✅ S3 access logs for ALB

### Network Security
- ✅ Private subnets for Lambda and Aurora
- ✅ Security groups with least-privilege rules
- ✅ No public database access

### Backup & Recovery
- ✅ 30-day backup retention for Aurora
- ✅ Daily automated backups
- ✅ Multi-AZ deployment for high availability

### Tagging
- ✅ All resources tagged with:
  - CostCenter
  - Environment
  - DataClassification

## Support

For issues or questions:
- Check CloudFormation events: `aws cloudformation describe-stack-events`
- Review CloudWatch Logs: `aws logs tail`
- AWS Support: https://console.aws.amazon.com/support/

## License

This infrastructure template is provided as-is for demonstration purposes.
