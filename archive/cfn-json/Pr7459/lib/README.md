# Serverless Trade Processing System

A production-ready serverless infrastructure for processing real-time stock market trade data using AWS CloudFormation, Step Functions, Lambda container functions, and DynamoDB global tables.

## Architecture Overview

This system processes trade events from three different source systems through a parallel validation and enrichment workflow:

1. **EventBridge** receives trade events from source systems
2. **Step Functions** orchestrates parallel processing:
   - Trade Validator validates incoming data
   - Metadata Enricher adds market context
3. **Compliance Recorder** stores processed trades in DynamoDB
4. **DynamoDB Global Table** replicates data across regions (us-east-1 and eu-west-1)
5. **Lambda Insights** monitors function performance
6. **CloudWatch Alarms** trigger on DLQ depth
7. **X-Ray** provides distributed tracing

## Key Features

- **Multi-region replication**: DynamoDB global tables and ECR cross-region replication
- **ARM64 architecture**: Cost-efficient Lambda container functions on Graviton2
- **Private connectivity**: VPC endpoints for AWS services
- **Comprehensive monitoring**: Lambda Insights, X-Ray tracing, CloudWatch alarms
- **Error handling**: Dead letter queues with 14-day retention, retry logic
- **Security**: Encryption at rest (KMS), least-privilege IAM policies
- **Configuration management**: SSM Parameter Store for all config values
- **Production-ready**: Fully destroyable resources, proper tagging, validation

## Prerequisites

- AWS CLI 2.x configured with appropriate permissions
- Docker with buildx support for ARM64 builds
- Node.js 18+ for running tests
- Access to create global tables and ECR repositories

## Project Structure

```
lib/
├── TapStack.json               # Main CloudFormation template
├── PROMPT.md                   # Human-readable requirements
├── MODEL_RESPONSE.md           # Initial implementation with training issues
├── IDEAL_RESPONSE.md           # Production-ready corrected implementation
├── MODEL_FAILURES.md           # Documentation of all fixes
├── README.md                   # This file
└── lambda/                     # Lambda function source code
    ├── validator/
    │   ├── Dockerfile
    │   ├── app.py
    │   └── requirements.txt
    ├── enricher/
    │   ├── Dockerfile
    │   ├── app.py
    │   └── requirements.txt
    └── recorder/
        ├── Dockerfile
        ├── app.py
        └── requirements.txt

test/
├── stack_validation.test.js    # CloudFormation template tests
├── integration.test.js         # Integration tests (post-deployment)
└── package.json                # Test dependencies
```

## Deployment

### Step 1: Set Environment Variables

```bash
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev
export VPC_ID=vpc-xxxxx
export PRIVATE_SUBNET_IDS="subnet-xxxxx,subnet-yyyyy"
```

### Step 2: Create ECR Repository (if not exists)

```bash
aws ecr create-repository \
  --repository-name trade-processing-${ENVIRONMENT_SUFFIX} \
  --region ${AWS_REGION} \
  --image-scanning-configuration scanOnPush=true
```

### Step 3: Build and Push Container Images

```bash
# Login to ECR
aws ecr get-login-password --region ${AWS_REGION} | \
  docker login --username AWS --password-stdin \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

# Build and push validator
cd lib/lambda/validator
docker buildx build --platform linux/arm64 -t trade-validator:latest .
docker tag trade-validator:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/trade-processing-${ENVIRONMENT_SUFFIX}:validator
docker push \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/trade-processing-${ENVIRONMENT_SUFFIX}:validator

# Build and push enricher
cd ../enricher
docker buildx build --platform linux/arm64 -t metadata-enricher:latest .
docker tag metadata-enricher:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/trade-processing-${ENVIRONMENT_SUFFIX}:enricher
docker push \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/trade-processing-${ENVIRONMENT_SUFFIX}:enricher

# Build and push recorder
cd ../recorder
docker buildx build --platform linux/arm64 -t compliance-recorder:latest .
docker tag compliance-recorder:latest \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/trade-processing-${ENVIRONMENT_SUFFIX}:recorder
docker push \
  ${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/trade-processing-${ENVIRONMENT_SUFFIX}:recorder
```

### Step 4: Deploy CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name trade-processing-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
    ParameterKey=ValidatorImageUri,ParameterValue=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/trade-processing-${ENVIRONMENT_SUFFIX}:validator \
    ParameterKey=EnricherImageUri,ParameterValue=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/trade-processing-${ENVIRONMENT_SUFFIX}:enricher \
    ParameterKey=RecorderImageUri,ParameterValue=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/trade-processing-${ENVIRONMENT_SUFFIX}:recorder \
    ParameterKey=ReplicaRegion,ParameterValue=eu-west-1 \
    ParameterKey=VpcId,ParameterValue=${VPC_ID} \
    ParameterKey=PrivateSubnetIds,ParameterValue=\"${PRIVATE_SUBNET_IDS}\" \
  --capabilities CAPABILITY_IAM \
  --tags Key=Environment,Value=${ENVIRONMENT_SUFFIX} Key=Project,Value=TradeProcessing

# Wait for stack creation to complete
aws cloudformation wait stack-create-complete \
  --stack-name trade-processing-${ENVIRONMENT_SUFFIX}
```

### Step 5: Verify Deployment

```bash
# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name trade-processing-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs'

# Check state machine
STATE_MACHINE_ARN=$(aws cloudformation describe-stacks \
  --stack-name trade-processing-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`StateMachineArn`].OutputValue' \
  --output text)

aws stepfunctions describe-state-machine --state-machine-arn ${STATE_MACHINE_ARN}
```

## Testing

### Run Unit Tests

```bash
cd test
npm install
npm test
```

### Test Trade Processing

```bash
# Send test event via EventBridge
aws events put-events --entries '[
  {
    "Source": "trading.system1",
    "DetailType": "Trade Event",
    "Detail": "{\"tradeId\": \"T12345\", \"amount\": 1000.50, \"currency\": \"USD\", \"sourceSystem\": \"system1\"}"
  }
]'

# Check state machine execution
aws stepfunctions list-executions \
  --state-machine-arn ${STATE_MACHINE_ARN} \
  --max-items 5

# Query DynamoDB for recorded trade
TABLE_NAME=$(aws cloudformation describe-stacks \
  --stack-name trade-processing-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`TradeTableName`].OutputValue' \
  --output text)

aws dynamodb get-item \
  --table-name ${TABLE_NAME} \
  --key '{"tradeId": {"S": "T12345"}, "timestamp": {"N": "1234567890"}}'
```

## Monitoring

### CloudWatch Dashboards

Access CloudWatch console to view:
- Lambda Insights metrics (duration, memory, cold starts)
- Step Functions execution metrics
- DLQ depth alarms
- X-Ray service map

### View Logs

```bash
# Validator logs
aws logs tail /aws/lambda/trade-validator-${ENVIRONMENT_SUFFIX} --follow

# Enricher logs
aws logs tail /aws/lambda/metadata-enricher-${ENVIRONMENT_SUFFIX} --follow

# Recorder logs
aws logs tail /aws/lambda/compliance-recorder-${ENVIRONMENT_SUFFIX} --follow
```

### Check Alarms

```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix validator-dlq-alarm-${ENVIRONMENT_SUFFIX}
```

## Cleanup

```bash
# Delete CloudFormation stack (all resources will be destroyed)
aws cloudformation delete-stack \
  --stack-name trade-processing-${ENVIRONMENT_SUFFIX}

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name trade-processing-${ENVIRONMENT_SUFFIX}

# Delete ECR images (optional)
aws ecr batch-delete-image \
  --repository-name trade-processing-${ENVIRONMENT_SUFFIX} \
  --image-ids imageTag=validator imageTag=enricher imageTag=recorder
```

## Configuration

All configuration is managed via SSM Parameter Store:

- `/trade-processing/${ENVIRONMENT_SUFFIX}/api-endpoint` - API endpoint URL
- `/trade-processing/${ENVIRONMENT_SUFFIX}/processing-threshold` - Processing threshold value
- `/trade-processing/${ENVIRONMENT_SUFFIX}/max-retries` - Maximum retry attempts

Update parameters:

```bash
aws ssm put-parameter \
  --name /trade-processing/${ENVIRONMENT_SUFFIX}/api-endpoint \
  --value https://api.production.com/v1 \
  --type String \
  --overwrite
```

## Security Considerations

- All SQS queues encrypted with AWS KMS
- DynamoDB table encrypted at rest with KMS
- Lambda functions run in private subnets with VPC endpoints
- IAM policies follow least-privilege principle
- All resources properly tagged for cost allocation
- X-Ray tracing enabled for security auditing

## Cost Optimization

- Lambda functions use ARM64 (Graviton2) for ~20% cost savings
- DynamoDB uses on-demand billing (no idle capacity costs)
- Reserved concurrent executions prevent runaway costs
- ECR lifecycle policy limits image storage costs
- VPC endpoints eliminate NAT Gateway costs for AWS service calls

## Troubleshooting

### Lambda Function Failures

Check dead letter queues:
```bash
aws sqs receive-message --queue-url <dlq-url>
```

### State Machine Failures

View execution history:
```bash
aws stepfunctions describe-execution --execution-arn <execution-arn>
```

### DynamoDB Replication Issues

Check global table status:
```bash
aws dynamodb describe-global-table --global-table-name trades-${ENVIRONMENT_SUFFIX}
```

## Documentation

- [PROMPT.md](./PROMPT.md) - Human-readable requirements
- [MODEL_RESPONSE.md](./MODEL_RESPONSE.md) - Initial implementation
- [IDEAL_RESPONSE.md](./IDEAL_RESPONSE.md) - Production-ready implementation
- [MODEL_FAILURES.md](./MODEL_FAILURES.md) - Complete list of fixes and improvements

## License

This infrastructure code is provided as-is for educational and training purposes.
