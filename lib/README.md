# Payment Processing API Infrastructure

This CDK Python application deploys a secure, highly available payment processing API with enterprise-grade security and monitoring.

## Architecture

- **VPC**: 3 availability zones with public and private subnets
- **ECS Fargate**: Serverless container orchestration with auto-scaling (2-10 tasks)
- **Application Load Balancer**: HTTPS traffic distribution with ACM certificates
- **AWS WAF**: Rate limiting and SQL injection protection
- **Aurora PostgreSQL**: Multi-AZ database cluster with encryption at rest
- **Secrets Manager**: Secure credential storage and injection
- **CloudWatch**: Dashboards and alarms for monitoring

## Prerequisites

- Python 3.9 or higher
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS credentials configured
- Docker installed for local testing

## Installation

```bash
# Install dependencies
pip install -r requirements.txt

# Install dev dependencies
pip install -r requirements-dev.txt
```

## Deployment

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Synthesize CloudFormation template
cdk synth

# Deploy infrastructure
cdk deploy --context environmentSuffix=dev

# Deploy to production
cdk deploy --context environmentSuffix=prod
```

## Environment Variables

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource naming (default: dev)
- `CDK_DEFAULT_ACCOUNT`: AWS account ID
- `CDK_DEFAULT_REGION`: AWS region (default: us-east-1)

## Testing

```bash
# Run unit tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=lib --cov-report=term-missing
```

## Monitoring

The stack creates:
- CloudWatch dashboard with API latency, error rates, and database connections
- Alarm for error rates exceeding 5%
- Alarm for database CPU exceeding 80%

## Security Features

- End-to-end encryption with TLS certificates
- AWS WAF protection against common exploits
- Least-privilege IAM roles
- Database credentials in Secrets Manager
- Private subnets for application and database

## Clean Up

```bash
# Destroy infrastructure
cdk destroy --context environmentSuffix=dev
```
