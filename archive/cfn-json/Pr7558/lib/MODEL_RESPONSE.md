# CloudFormation Payment Processing Infrastructure

This implementation provides a complete CloudFormation solution for deploying payment processing infrastructure consistently across multiple environments.

## File: lib/TapStack.json

The main CloudFormation template containing all resources in a single flattened file.

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| EnvironmentName | String | Environment name (dev, staging, prod) |
| SnsEmail | String | Email for SNS alarm notifications |
| VpcCidr | String | CIDR block for VPC (default: 10.0.0.0/16) |
| AvailabilityZone1 | AWS::EC2::AvailabilityZone::Name | First AZ |
| AvailabilityZone2 | AWS::EC2::AvailabilityZone::Name | Second AZ |
| AvailabilityZone3 | AWS::EC2::AvailabilityZone::Name | Third AZ |

### Resources Included

**Network Resources:**
- VPC with DNS support
- Internet Gateway
- 3 Public Subnets (one per AZ)
- 3 Private Subnets (one per AZ)
- Public and Private Route Tables
- Lambda Security Group
- ALB Security Group
- DynamoDB VPC Endpoint

**Storage Resources:**
- DynamoDB Table (payment-transactions) with:
  - Partition Key: transactionId (String)
  - Sort Key: timestamp (Number)
  - GSI: customer-index (customerId + timestamp)
  - GSI: status-index (paymentStatus + timestamp)
  - Point-in-time recovery enabled

**Compute Resources:**
- Lambda Execution Role with DynamoDB and CloudWatch permissions
- Validation Lambda Function (Node.js 22.x, 512 MB, 30s timeout)
- Processing Lambda Function (Node.js 22.x, 512 MB, 60s timeout)
- Application Load Balancer (internet-facing)
- Target Groups for Lambda functions
- ALB Listener and Rules
- Step Functions Role
- Payment State Machine (Validate -> Process -> Succeed/Fail)

**Monitoring Resources:**
- SNS Alarm Topic with email subscription
- Validation Function Error Alarm
- Processing Function Error Alarm
- DynamoDB Throttle Alarm
- State Machine Failure Alarm
- Validation Function Duration Alarm

### Conditions

- **IsProduction**: Enables reserved concurrency (100) for Lambda functions when EnvironmentName = "prod"

### Outputs

- StackName
- EnvironmentName
- VpcId
- AlbDnsName
- StateMachineArn
- PaymentTableName
- ValidationFunctionArn
- ProcessingFunctionArn
- AlarmTopicArn

## File: lib/parameters/dev-params.json

```json
[
  { "ParameterKey": "EnvironmentName", "ParameterValue": "dev" },
  { "ParameterKey": "SnsEmail", "ParameterValue": "dev-team@example.com" },
  { "ParameterKey": "VpcCidr", "ParameterValue": "10.0.0.0/16" },
  { "ParameterKey": "AvailabilityZone1", "ParameterValue": "us-east-1a" },
  { "ParameterKey": "AvailabilityZone2", "ParameterValue": "us-east-1b" },
  { "ParameterKey": "AvailabilityZone3", "ParameterValue": "us-east-1c" }
]
```

## File: lib/parameters/staging-params.json

```json
[
  { "ParameterKey": "EnvironmentName", "ParameterValue": "staging" },
  { "ParameterKey": "SnsEmail", "ParameterValue": "staging-team@example.com" },
  { "ParameterKey": "VpcCidr", "ParameterValue": "10.1.0.0/16" },
  { "ParameterKey": "AvailabilityZone1", "ParameterValue": "us-east-1a" },
  { "ParameterKey": "AvailabilityZone2", "ParameterValue": "us-east-1b" },
  { "ParameterKey": "AvailabilityZone3", "ParameterValue": "us-east-1c" }
]
```

## File: lib/parameters/prod-params.json

```json
[
  { "ParameterKey": "EnvironmentName", "ParameterValue": "prod" },
  { "ParameterKey": "SnsEmail", "ParameterValue": "ops-team@example.com" },
  { "ParameterKey": "VpcCidr", "ParameterValue": "10.2.0.0/16" },
  { "ParameterKey": "AvailabilityZone1", "ParameterValue": "us-east-1a" },
  { "ParameterKey": "AvailabilityZone2", "ParameterValue": "us-east-1b" },
  { "ParameterKey": "AvailabilityZone3", "ParameterValue": "us-east-1c" }
]
```

## Deployment

### Deploy to Dev

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-dev \
  --template-body file://lib/TapStack.json \
  --parameters file://lib/parameters/dev-params.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy to Staging

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-staging \
  --template-body file://lib/TapStack.json \
  --parameters file://lib/parameters/staging-params.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy to Production

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-prod \
  --template-body file://lib/TapStack.json \
  --parameters file://lib/parameters/prod-params.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

## Testing the Payment Workflow

```bash
# Start a Step Functions execution
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:ACCOUNT_ID:stateMachine:payment-workflow-dev \
  --input '{"transactionId":"txn-001","customerId":"cust-123","amount":100.50}'
```

## Cleanup

```bash
aws cloudformation delete-stack --stack-name payment-processing-dev
aws cloudformation delete-stack --stack-name payment-processing-staging
aws cloudformation delete-stack --stack-name payment-processing-prod
```

## Architecture

```
                    ┌─────────────────────────────────────┐
                    │           Internet                   │
                    └─────────────────┬───────────────────┘
                                      │
                    ┌─────────────────▼───────────────────┐
                    │    Application Load Balancer         │
                    │         (Public Subnets)             │
                    └─────────────────┬───────────────────┘
                                      │
              ┌───────────────────────┼───────────────────────┐
              │                       │                       │
    ┌─────────▼─────────┐   ┌────────▼────────┐   ┌─────────▼─────────┐
    │  Validation Lambda │   │ Processing Lambda│   │  Step Functions   │
    │  (Private Subnet)  │   │ (Private Subnet) │   │  State Machine    │
    └─────────┬─────────┘   └────────┬────────┘   └───────────────────┘
              │                       │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │    DynamoDB Table      │
              │  (VPC Endpoint)        │
              └───────────────────────┘
```
