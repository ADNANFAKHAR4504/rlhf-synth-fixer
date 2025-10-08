# Portfolio Tracking Platform - Infrastructure as Code

## Overview
This implementation provides a comprehensive portfolio tracking platform using CDKTF (Cloud Development Kit for Terraform) with TypeScript. The infrastructure is deployed to AWS and includes networking, compute, database, caching, API, and monitoring components.

## Architecture

### Network Layer (network-stack.ts)
- **VPC**: Custom VPC with CIDR 172.32.0.0/16
- **Subnets**:
  - 2 Public subnets across 2 availability zones (172.32.1.0/24, 172.32.2.0/24)
  - 2 Private subnets across 2 availability zones (172.32.11.0/24, 172.32.12.0/24)
- **Internet Gateway**: Attached to VPC for public internet access
- **NAT Gateways**: One per public subnet for private subnet internet access
- **Route Tables**: Separate routing for public and private subnets

### Compute Layer (compute-stack.ts)
- **Application Load Balancer (ALB)**:
  - Internet-facing in public subnets
  - HTTP/HTTPS listeners
  - Health checks on `/health` endpoint
- **Auto Scaling Group**:
  - Min: 2, Max: 6, Desired: 2 instances
  - t3.medium instances running Amazon Linux 2
  - Deployed in private subnets
  - ELB health checks with 300s grace period
  - Session stickiness enabled
- **Launch Template**:
  - CloudWatch agent for monitoring
  - IAM instance profile with SSM access
  - User data for initialization
- **Security Groups**:
  - ALB: Allows HTTP (80) and HTTPS (443) from internet
  - EC2: Allows HTTP (80) from ALB only

### Database Layer (database-stack.ts)
- **RDS PostgreSQL**:
  - Engine: PostgreSQL 15.14
  - Instance: db.t3.medium
  - Storage: 100GB GP3, encrypted
  - Multi-AZ: Enabled for high availability
  - Automated backups: 7-day retention
  - Backup window: 03:00-04:00
  - Maintenance window: Sunday 04:00-05:00
  - Located in private subnets
- **ElastiCache Serverless**:
  - Engine: Valkey 8.1
  - Data storage: 10GB maximum
  - ECPU: 5000 maximum per second
  - Daily snapshots at 03:00
  - TTL: 1 minute for market data
  - Located in private subnets
- **S3 Bucket**:
  - Historical data storage
  - Versioning enabled
  - Public access blocked
  - Encryption at rest
- **Security Groups**:
  - RDS: Port 5432, accessible from VPC CIDR
  - ElastiCache: Port 6379, accessible from VPC CIDR

### API Layer (api-stack.ts)
- **API Gateway WebSocket API**:
  - Real-time portfolio updates
  - Routes: $connect, $disconnect, $default
  - Stage: prod with auto-deploy
- **Lambda Function**:
  - Runtime: Node.js 18.x
  - Handler: WebSocket connection management
  - Environment: ALB DNS for backend communication
  - Timeout: 30 seconds
  - Memory: 256MB
- **IAM Roles**:
  - Lambda execution role with CloudWatch Logs access
  - API Gateway management permissions

### Monitoring Layer (monitoring-stack.ts)
- **CloudWatch Dashboard**: `portfolio-tracking-metrics`
- **Metrics Tracked**:
  - EC2 CPU utilization (average and max)
  - ALB response time and request count
  - RDS database connections and CPU
  - Auto Scaling group capacity and instances
- **Refresh**: 5-minute intervals

## Key Features

### High Availability
- Multi-AZ RDS for database failover
- Auto Scaling Group across multiple availability zones
- NAT Gateways in each availability zone
- Application Load Balancer distributing traffic

### Security
- Private subnets for application and database layers
- Security groups with least-privilege access
- Encrypted storage (RDS, S3)
- IAM roles with minimal permissions
- Public access blocked on S3 buckets

### Scalability
- Auto Scaling (2-6 instances) based on demand
- ElastiCache Serverless with automatic scaling
- Application Load Balancer for traffic distribution
- WebSocket API for real-time updates

### Monitoring
- Centralized CloudWatch dashboard
- CloudWatch agent on EC2 instances
- RDS performance insights enabled
- ALB access logs capability

## Deployment Configuration

### Region
- Default: us-east-1
- Configurable via `awsRegion` prop or `lib/AWS_REGION` file

### State Management
- S3 backend: `iac-rlhf-tf-states`
- Key format: `{environmentSuffix}/{stackId}.tfstate`
- Encryption enabled

### Environment Suffix
- Enables multiple environments (dev, staging, prod)
- Applied to all resource names for isolation

## Resource Naming Convention
All resources follow the pattern: `portfolio-{resource-type}-{environmentSuffix}`

Examples:
- VPC: `portfolio-vpc`
- ALB: `portfolio-alb-pr3522`
- Database: `portfolio-holdings-db-pr3522`
- Cache: `portfolio-market-cache-pr3522`

## Important Notes

1. **Database Password**: Currently hardcoded as temporary value. In production, use AWS Secrets Manager or parameterize.

2. **Read Replica**: Commented out due to incompatibility with Secrets Manager in existing database. Enable after recreating database with standard password.

3. **Blue/Green Deployment**: Disabled for RDS due to Secrets Manager incompatibility. Use standard RDS updates.

4. **Lambda Code**: Packaged using `DataArchiveFile` from `lib/lambda/websocket-handler/`

5. **Multi-Region**: Infrastructure can be deployed to different regions by setting `awsRegion` or creating `lib/AWS_REGION` file.

## Cost Optimization Considerations
- t3.medium instances (burstable)
- ElastiCache Serverless (pay per use)
- RDS Multi-AZ (balanced HA vs cost)
- Auto Scaling based on actual load
- S3 lifecycle policies (can be added)

## Dependencies
```json
{
  "cdktf": "^0.20.10",
  "@cdktf/provider-aws": "^19.40.0",
  "@cdktf/provider-archive": "^11.0.0",
  "constructs": "^10.4.2"
}
```

## Deployment Commands
```bash
# Install dependencies
npm install

# Synthesize Terraform
npm run cdktf:synth

# Deploy
npm run cdktf:deploy

# Destroy
npm run cdktf:destroy
```