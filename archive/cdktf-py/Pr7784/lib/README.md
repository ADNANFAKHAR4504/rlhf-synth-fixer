# Fraud Detection API Infrastructure

Production-ready infrastructure for a fraud detection API using CDKTF with Python.

## Architecture Overview

This infrastructure deploys a complete fraud detection API system with:

- **VPC**: 3 availability zones with public and private subnets
- **ECS Fargate**: Containerized API service with auto-scaling
- **Application Load Balancer**: SSL/TLS termination and traffic distribution
- **API Gateway**: Request throttling and API key authentication
- **Aurora Serverless v2**: PostgreSQL database with auto-scaling
- **Secrets Manager**: Secure credential storage with rotation
- **CloudWatch**: Comprehensive monitoring, dashboards, and alarms
- **X-Ray**: Distributed tracing for performance analysis
- **WAF**: Web application firewall with rate limiting and geo-blocking
- **S3**: VPC flow logs with lifecycle policies

## Prerequisites

- Python 3.9+
- Pipenv
- Node.js 16+ (for CDKTF)
- AWS CLI configured with appropriate credentials
- Terraform CLI

## Installation

1. Install dependencies:
```bash
pipenv install
```

2. Install CDKTF CLI:
```bash
npm install -g cdktf-cli
```

## Deployment

1. Synthesize Terraform configuration:
```bash
cdktf synth
```

2. Deploy infrastructure:
```bash
cdktf deploy
```

3. Approve the deployment when prompted.

## Configuration

### Environment Suffix

The infrastructure uses an `environment_suffix` parameter for multi-environment deployment:

```python
FraudDetectionStack(app, "fraud-detection", environment_suffix="dev")
```

Change "dev" to "staging" or "prod" for different environments.

### Region

Default region is `us-east-1`. Modify in the AwsProvider configuration if needed.

## Outputs

After deployment, the following outputs are available:

- `alb_dns_name`: ALB DNS name for direct access
- `api_endpoint`: API Gateway endpoint URL
- `dashboard_url`: CloudWatch dashboard URL
- `vpc_id`: VPC identifier
- `ecs_cluster_name`: ECS cluster name
- `aurora_endpoint`: Aurora database endpoint

## Security Features

### PCI DSS Compliance

- Encryption at rest for Aurora database
- SSL/TLS encryption in transit
- WAF protection against common attacks
- Secure credential management with Secrets Manager
- VPC flow logs for security auditing
- CloudWatch monitoring and alerting

### IAM Least Privilege

ECS tasks have minimal required permissions:
- Secrets Manager read access
- CloudWatch Logs write access
- X-Ray daemon write access

### Network Security

- Database in private subnets only
- ECS tasks in private subnets
- ALB in public subnets
- Security groups with minimal ingress rules
- NAT Gateway for controlled outbound access

## Monitoring

### CloudWatch Dashboard

View real-time metrics:
- API response times
- Error rates (4xx, 5xx)
- Database connections
- ECS resource utilization

### CloudWatch Alarms

Configured alarms:
- API latency > 200ms
- ECS service health < 1 healthy task
- Aurora connections > 80

## Auto-Scaling

### ECS Service

- Min: 2 tasks
- Max: 10 tasks
- Scale up when CPU > 70%
- Scale down when CPU < 70%

### Aurora Serverless v2

- Min: 0.5 ACUs
- Max: 4.0 ACUs
- Auto-scales based on workload

## API Usage

### Authentication

API requests require an API key in the `x-api-key` header:

```bash
curl -H "x-api-key: YOUR_API_KEY" https://API_ENDPOINT/api/detect
```

### Rate Limiting

- 1000 requests/second per API key
- 2000 burst limit
- 100,000 requests per day quota

## Blue-Green Deployment

Two target groups configured for zero-downtime deployments:
- `fraud-tg-blue`: Active target group
- `fraud-tg-green`: Standby target group

## Cleanup

To destroy all infrastructure:

```bash
cdktf destroy
```

## Cost Optimization

- Aurora Serverless v2: Scales down to 0.5 ACUs during low traffic
- ECS Fargate: Auto-scales based on demand (min 2 tasks)
- S3 lifecycle policies: Flow logs deleted after 90 days
- CloudWatch log retention: 30 days

## Troubleshooting

### ECS Task Failures

Check CloudWatch Logs:
```bash
aws logs tail /ecs/fraud-api-dev --follow
```

### Database Connection Issues

Verify security group rules allow ECS tasks to reach Aurora on port 5432.

### High Latency

Review CloudWatch dashboard and X-Ray traces for bottlenecks.
