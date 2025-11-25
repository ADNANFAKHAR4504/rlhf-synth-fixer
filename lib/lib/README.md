# E-Commerce API Infrastructure

Production-ready infrastructure for an e-commerce product catalog API using Pulumi with TypeScript.

## Architecture

### Network Layer
- VPC with 3 public and 3 private subnets across 3 Availability Zones
- NAT Gateways for private subnet internet access
- Internet Gateway for public subnet connectivity

### Compute Layer
- ECS Fargate cluster for serverless container orchestration
- Auto-scaling: 2-10 tasks based on 70% CPU utilization
- Application Load Balancer with SSL termination

### Data Layer
- Aurora PostgreSQL Serverless v2 with multi-AZ deployment
- ElastiCache Redis cluster mode (2 shards, 1 replica per shard)
- AWS Secrets Manager for credentials with 30-day rotation

### Monitoring
- CloudWatch Logs with 14-day retention
- Custom metrics for API response times
- Alarms for CPU, database connections, and Redis memory

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Docker (for building container images)

## Configuration

Configure the stack with required parameters:

```bash
pulumi config set environmentSuffix <unique-suffix>
pulumi config set enableDeletionProtection false
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Deploy the infrastructure:
```bash
pulumi up
```

3. View outputs:
```bash
pulumi stack output albDnsName
pulumi stack output dbEndpoint
pulumi stack output redisEndpoint
```

## Resource Naming

All resources include the `environmentSuffix` parameter to support parallel deployments:
- Format: `resource-type-{environmentSuffix}`
- Example: `ecommerce-vpc-test123`

## Security

- All traffic between ALB and ECS uses private subnets
- Database and Redis are not publicly accessible
- Secrets stored in AWS Secrets Manager
- IAM roles follow least-privilege principle
- Encryption enabled for data at rest and in transit

## Cost Optimization

- Aurora Serverless v2 scales from 0.5 to 2 ACU
- ECS Fargate scales from 2 to 10 tasks
- CloudWatch logs retained for 14 days
- NAT Gateways deployed per AZ for high availability

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Note: Deletion protection must be disabled for complete cleanup.

## Outputs

- `vpcId`: VPC identifier
- `albDnsName`: Application Load Balancer DNS name
- `ecsClusterName`: ECS cluster name
- `dbEndpoint`: Aurora cluster endpoint
- `redisEndpoint`: Redis configuration endpoint
