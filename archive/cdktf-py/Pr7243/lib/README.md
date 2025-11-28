# Financial Data Processing Pipeline - Optimized CDKTF Infrastructure

This repository contains an optimized CDKTF Python implementation for a financial data processing pipeline. The infrastructure has been refactored to reduce costs by 30%, decrease deployment time by 50%, and improve maintainability through reusable constructs.

## Architecture

The infrastructure implements a serverless data processing pipeline with the following components:

- **S3 Bucket**: Raw data storage with lifecycle policies for automatic Glacier transition after 90 days
- **Lambda Functions**: Four ETL functions (ingest, validate, transform, load) using ARM-based Graviton2 processors
- **Lambda Layers**: Shared dependencies to reduce deployment package sizes
- **DynamoDB Table**: Metadata tracking with on-demand billing and point-in-time recovery
- **Step Functions**: Orchestration workflow with error handling and exponential backoff retry
- **CloudWatch**: Dashboards for pipeline health monitoring
- **SNS**: Topic for alerting on pipeline failures
- **VPC**: Private subnets across 3 availability zones for secure processing
- **Parameter Store**: Cross-stack reference exports

## Key Optimizations

### 1. Reusable Lambda Construct Pattern
The `ReusableLambdaConstruct` class eliminates code duplication by providing a standardized way to create Lambda functions with:
- Automatic IAM role creation with least-privilege policies
- CloudWatch log groups with retention policies
- ARM64 architecture for cost savings
- Environment variable management
- VPC configuration support

### 2. Lambda Layers for Shared Dependencies
Common dependencies are packaged into Lambda layers, reducing individual function package sizes and speeding up deployments.

### 3. On-Demand DynamoDB Billing
Converted from provisioned capacity to on-demand billing, eliminating over-provisioning costs for unpredictable workloads.

### 4. Step Functions Orchestration
Replaced multiple individual Lambda invocations with a Step Functions state machine that provides:
- Visual workflow representation
- Built-in error handling and retry logic
- Automatic exponential backoff for transient failures
- Centralized orchestration

### 5. S3 Lifecycle Policies
Automatic transition to Glacier storage after 90 days reduces storage costs for infrequently accessed data.

### 6. CDKTF Aspects for Tagging
Automatic application of FinOps cost allocation tags across all resources using CDKTF aspects.

### 7. ARM-Based Graviton2 Processors
All Lambda functions use ARM64 architecture for 20% better price-performance compared to x86.

## Prerequisites

- Python 3.9 or higher
- Node.js 16+ (for CDKTF)
- CDKTF CLI 0.19+
- Terraform 1.5+
- AWS CLI configured with appropriate credentials

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Install CDKTF CLI:
```bash
npm install -g cdktf-cli@latest
```

3. Prepare Lambda deployment packages:
```bash
# Create Lambda layer
cd lib/lambda/layers/shared_dependencies
zip -r ../shared_dependencies.zip python/
cd ../../../..

# Create Lambda function packages
cd lib/lambda/functions/ingest
zip ingest.zip index.py
cd ../../../../

cd lib/lambda/functions/transform
zip transform.zip index.py
cd ../../../../

cd lib/lambda/functions/load
zip load.zip index.py
cd ../../../../

cd lib/lambda/functions/validate
zip validate.zip index.py
cd ../../../../
```

## Deployment

1. Set the environment suffix:
```bash
export ENVIRONMENT_SUFFIX="dev"  # or "prod", "staging", etc.
```

2. Synthesize the Terraform configuration:
```bash
cdktf synth
```

3. Deploy the infrastructure:
```bash
cdktf deploy
```

The deployment will create all resources with the environment suffix appended for isolation.

## Configuration

The main stack is configured in `lib/tap_stack.py`. Key parameters:

- **Region**: us-east-2
- **Environment Suffix**: Passed during stack initialization for resource naming
- **Lambda Runtime**: Python 3.11 on ARM64 architecture
- **Lambda Timeout**: 300-600 seconds depending on function
- **Lambda Memory**: 512MB to 2GB depending on function
- **DynamoDB Billing**: On-demand (PAY_PER_REQUEST)
- **CloudWatch Log Retention**: 7 days
- **S3 Lifecycle**: 90 days to Glacier, 7 years retention

## Monitoring

The CloudWatch dashboard provides real-time visibility into:

- Lambda invocation counts and error rates
- Lambda execution duration
- Step Functions execution success/failure
- DynamoDB read/write capacity consumption
- S3 storage metrics

Access the dashboard at:
```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#dashboards:name=pipeline-health-{environment_suffix}
```

## Cost Optimization Features

1. **ARM64 Architecture**: 20% cost reduction on Lambda compute
2. **On-Demand DynamoDB**: Pay only for actual usage, no provisioned capacity waste
3. **Lambda Layers**: Reduced deployment sizes and faster cold starts
4. **S3 Lifecycle Policies**: Automatic Glacier transition for old data
5. **CloudWatch Log Retention**: 7-day retention prevents unbounded log storage costs
6. **No NAT Gateways**: VPC endpoints or private subnets without internet access
7. **Graviton2 Processors**: Better price-performance ratio

## Security

- All IAM policies follow least-privilege principles with no wildcard actions
- S3 bucket has public access blocked
- Lambda functions run in VPC private subnets
- DynamoDB has point-in-time recovery enabled
- All resources support encryption at rest
- CloudWatch logs for audit trails

## Parameter Store Exports

The following parameters are exported for cross-stack references:

- `/pipeline/{environment_suffix}/bucket-name`: S3 bucket name
- `/pipeline/{environment_suffix}/table-name`: DynamoDB table name
- `/pipeline/{environment_suffix}/state-machine-arn`: Step Functions ARN
- `/pipeline/{environment_suffix}/vpc-id`: VPC ID

## Testing the Pipeline

Execute the Step Functions state machine with a test payload:

```bash
aws stepfunctions start-execution \
  --state-machine-arn $(terraform output -raw state_machine_arn) \
  --input '{"jobId": "test-123", "data": {"sample": "data"}}'
```

Monitor execution:
```bash
aws stepfunctions describe-execution \
  --execution-arn <execution-arn-from-previous-command>
```

## Cleanup

To destroy all resources:

```bash
cdktf destroy
```

All resources are configured with proper deletion policies to ensure clean teardown.

## Cost Estimates

Based on 500GB daily processing with moderate complexity:

- Lambda (ARM64): ~$50/month (down from ~$65 with x86)
- DynamoDB (On-Demand): ~$30/month (down from ~$100 provisioned)
- S3 + Glacier: ~$15/month with lifecycle policies
- Step Functions: ~$10/month
- Data Transfer: ~$5/month
- CloudWatch: ~$5/month

**Total**: ~$115/month (down from ~$165/month - 30% reduction)

## Troubleshooting

### Lambda Timeout Errors
- Check CloudWatch logs: `/aws/lambda/{function-name}-{environment-suffix}`
- Increase timeout in `tap_stack.py` if needed
- Verify VPC configuration allows AWS service access

### Step Functions Failures
- View execution history in Step Functions console
- Check Lambda function logs for detailed error messages
- Verify IAM permissions for state machine role

### DynamoDB Throttling
- On-demand mode should auto-scale, but check for sustained high traffic
- Review CloudWatch metrics for capacity utilization
- Consider enabling DynamoDB auto-scaling if needed

## Contributing

When modifying the infrastructure:

1. Update the reusable constructs in `lib/constructs/`
2. Maintain environment suffix parameter in all resources
3. Follow least-privilege IAM policy guidelines
4. Add cost allocation tags for new resources
5. Update CloudWatch dashboard with new metrics
6. Test in a separate environment before production deployment

## License

[Your License Here]
