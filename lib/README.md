# IoT Sensor Data Processing Platform

A complete AWS infrastructure for processing IoT sensor data with CI/CD pipeline integration.

## Architecture

This solution implements a complete IoT data processing platform with:

1. **Kinesis Data Streams** - Ingests 10,000+ sensor events per second
2. **ECS Fargate** - Containerized data processing with auto-scaling
3. **RDS PostgreSQL** - Multi-AZ operational database
4. **ElastiCache Redis** - Distributed caching layer
5. **EFS** - Shared storage for containers
6. **API Gateway** - External integration endpoint
7. **Secrets Manager** - Automated credential rotation (30 days)
8. **VPC** - Network isolation and security

## Deployment

### Prerequisites

- AWS CLI configured
- AWS CDK installed (`npm install -g aws-cdk`)
- Python 3.9+

### Install Dependencies

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Deploy to Different Environments

```bash
# Deploy to dev
cdk deploy --context environmentSuffix=dev --context environment=dev

# Deploy to staging
cdk deploy --context environmentSuffix=staging --context environment=staging

# Deploy to production
cdk deploy --context environmentSuffix=prod --context environment=prod
```

### CI/CD Integration

This infrastructure is designed to work with the GitHub Actions workflow defined in `lib/ci-cd.yml`. The workflow includes:

- Automated deployment to dev on commits
- Manual approval gates for staging and prod
- Security scanning with cdk-nag
- Cross-account role assumptions
- OIDC authentication

### Environment Variables

The stack accepts these context parameters:

- `environmentSuffix` - Unique identifier for environment (default: "dev")
- `environment` - Environment name for configuration (default: "dev")

## Resource Naming

All resources follow the pattern: `{resource-name}-{environmentSuffix}`

This ensures multiple environments can coexist without conflicts.

## Security Features

- All data encrypted at rest and in transit
- Secrets rotation every 30 days
- VPC isolation with private subnets
- Security groups with least-privilege access
- IAM roles with minimal permissions
- CloudWatch logging enabled

## Destroying the Stack

```bash
cdk destroy --context environmentSuffix=dev
```

All resources are configured with RemovalPolicy.DESTROY for easy cleanup.

## Monitoring

- CloudWatch Logs for all components
- ECS Container Insights enabled
- RDS Enhanced Monitoring
- API Gateway access logs
- Custom metrics for Kinesis processing

## Testing

After deployment, test the API endpoint:

```bash
# Get API endpoint from stack outputs
aws cloudformation describe-stacks --stack-name TapStack-dev \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text

# Send test data
aws apigatewayv2 post /sensors \
  --body '{"sensorId": "sensor-001", "temperature": 72.5, "timestamp": "2025-12-04T12:00:00Z"}' \
  --region us-east-1
```

## Cost Optimization

- Kinesis provisioned mode (can switch to on-demand for variable workloads)
- Burstable RDS instances (upgrade for production)
- Single NAT gateway (add more for production HA)
- EFS bursting mode (switch to provisioned if needed)

## Compliance

This infrastructure is designed with ISO 27001 considerations:

- Data encryption
- Access controls
- Audit logging
- Secrets management
- Network isolation
