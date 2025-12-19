# Video Processing Pipeline Infrastructure

This CDKTF Python implementation provides a complete video processing pipeline infrastructure for StreamFlix's media streaming platform.

## Architecture Overview

The infrastructure includes:

- **Kinesis Stream**: Ingests raw video content with 2 shards for scalability
- **ECS Fargate**: Processes videos using containerized workloads
- **RDS Aurora Serverless v2**: Stores video metadata and processing state
- **Secrets Manager**: Manages database credentials and API keys securely
- **VPC**: Isolated network with public subnets for ECS and private subnets for RDS
- **SQS Dead Letter Queue**: Captures failed processing jobs for retry
- **CloudWatch**: Monitoring and alerting for the pipeline

## Prerequisites

- Python >= 3.7
- CDKTF CLI >= 0.15.0
- Node.js >= 14.0
- AWS CLI configured with appropriate credentials

## Environment Variables

Set these environment variables before deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="iac-rlhf-tf-states"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"
```

## Deployment Instructions

1. Install dependencies:
```bash
pipenv install
```

2. Synthesize the Terraform configuration:
```bash
cdktf synth
```

3. Deploy the infrastructure:
```bash
cdktf deploy
```

4. Destroy the infrastructure (when needed):
```bash
cdktf destroy
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- `video-processing-vpc-dev`
- `video-ingestion-stream-dev`
- `video-metadata-cluster-dev`

## Security Features

1. **Secrets Management**: Database credentials stored in Secrets Manager
2. **Network Isolation**: RDS in private subnets, ECS in public subnets with security groups
3. **Encryption**: RDS encryption at rest, Terraform state encryption in S3
4. **IAM Roles**: Least privilege access for ECS tasks

## Monitoring

CloudWatch alarms monitor:
- Kinesis stream throttling
- Dead letter queue message count
- ECS task failures (via Container Insights)

## Error Handling

- Failed processing jobs are sent to the DLQ
- CloudWatch alarms alert on failures
- Processing state tracked in RDS database

## Compliance

The infrastructure supports EU media regulations through:
- Complete audit trail in CloudWatch logs
- Metadata storage in RDS for content tracking
- Retention policies configurable per requirement

## Cost Optimization

- Aurora Serverless v2 scales down to 0.5 ACU when idle
- ECS Fargate eliminates server management overhead
- Kinesis retention set to 24 hours (minimal cost)
- CloudWatch logs retention set to 7 days

## Testing

Run unit tests:
```bash
pytest tests/
```

## Troubleshooting

1. **Deployment fails**: Check AWS credentials and permissions
2. **ECS tasks failing**: Check CloudWatch logs at `/ecs/video-processing-{suffix}`
3. **Database connection issues**: Verify security group rules and secret values
