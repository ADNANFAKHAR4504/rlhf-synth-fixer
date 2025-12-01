# Video Processing Pipeline Infrastructure

## Architecture Overview

This CDK stack deploys a complete video processing pipeline infrastructure for StreamTech Japan, designed to handle thousands of video files daily with high availability and low latency.

### Components

1. **VPC**: Multi-AZ VPC with public, private, and isolated subnets
2. **ECS Cluster**: Fargate-based container orchestration for video processing tasks
3. **RDS PostgreSQL**: Multi-AZ database for storing video metadata
4. **ElastiCache Redis**: Multi-node Redis cluster for caching popular content
5. **EFS**: Shared file system for temporary video processing storage
6. **API Gateway**: RESTful API for accessing video metadata
7. **Secrets Manager**: Secure storage for database credentials and API keys

### Security Features

- VPC isolation with proper subnet segmentation
- Security groups with least privilege access
- Encrypted EFS file system
- Encrypted ElastiCache with transit encryption
- Secrets Manager for credential management
- IAM roles with minimal required permissions

### High Availability

- Multi-AZ VPC with 2 availability zones
- Multi-AZ RDS with automated failover
- ElastiCache Redis with 2 nodes and automatic failover
- ECS Fargate for managed container orchestration

## Prerequisites

- AWS CLI configured with appropriate credentials
- Python 3.8 or higher
- Node.js 14.x or higher (for CDK CLI)
- AWS CDK CLI installed (`npm install -g aws-cdk`)

## Installation

1. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Deployment

1. Set environment variables:
```bash
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev  # or prod, staging, etc.
```

2. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

3. Synthesize the stack:
```bash
cdk synth
```

4. Deploy the stack:
```bash
cdk deploy --parameters environmentSuffix=$ENVIRONMENT_SUFFIX
```

## Configuration

The stack accepts the following parameters:

- `environment_suffix`: String suffix for resource naming (e.g., 'dev', 'prod')

## Outputs

After deployment, the stack provides the following outputs:

- `VpcId`: VPC identifier
- `EcsClusterName`: ECS cluster name
- `RdsEndpoint`: PostgreSQL database endpoint
- `RedisEndpoint`: Redis cache endpoint
- `EfsFileSystemId`: EFS file system ID
- `ApiEndpoint`: API Gateway URL
- `DbSecretArn`: Database credentials secret ARN

## Resource Naming Convention

All resources follow the naming pattern: `{resource-type}-{environmentSuffix}`

Examples:
- VPC: `vpc-dev`
- ECS Cluster: `video-processing-dev`
- RDS Instance: `rds-postgresql-dev`

## Cost Optimization

- RDS uses db.t3.medium instances (adjustable based on workload)
- ECS Fargate with appropriate CPU/memory allocation
- ElastiCache uses cache.t3.micro nodes
- EFS uses bursting throughput mode with lifecycle policies

## Monitoring

- ECS Container Insights enabled for cluster monitoring
- CloudWatch Logs for ECS task logs
- RDS Enhanced Monitoring available
- API Gateway CloudWatch metrics

## Cleanup

To destroy all resources:

```bash
cdk destroy
```

Note: All resources are configured with `RemovalPolicy.DESTROY` for clean teardown.

## Testing

Run unit tests:
```bash
pytest tests/unit/
```

Run integration tests:
```bash
pytest tests/integration/
```

## Troubleshooting

### RDS Connection Issues
- Verify security group allows traffic from ECS tasks
- Check that ECS tasks are in the correct subnets
- Verify credentials from Secrets Manager

### ElastiCache Connection Issues
- Ensure transit encryption is properly configured
- Verify security group rules
- Check that Redis endpoint is accessible from ECS tasks

### EFS Mount Issues
- Verify EFS security group allows NFS traffic (port 2049)
- Check that ECS task definition includes proper volume configuration
- Ensure IAM permissions for EFS access

## Support

For issues or questions, please refer to the AWS CDK documentation or contact the infrastructure team.
