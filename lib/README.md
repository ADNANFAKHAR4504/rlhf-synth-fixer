
# Blue-Green Payment Processing Migration

This Pulumi TypeScript infrastructure implements a complete blue-green deployment strategy for migrating a payment processing system from on-premises to AWS.

## Architecture Overview

The solution creates two isolated environments (blue and green) connected via Transit Gateway, enabling:
- Zero-downtime migration from on-premises to AWS
- Gradual traffic shifting using Route 53 weighted routing
- Instant rollback capability
- Incremental data synchronization

## Infrastructure Components

### Network Layer
- **Blue VPC**: 10.0.0.0/16 (on-premises mirror)
- **Green VPC**: 10.1.0.0/16 (new AWS-native)
- **Transit Gateway**: Secure inter-environment communication
- **VPC Endpoints**: S3 and DynamoDB (no internet routing)
- **Multi-AZ**: 3 availability zones for high availability

### Database Layer
- **Aurora PostgreSQL 14.6** clusters in both environments
- Customer-managed KMS encryption at rest
- Automated Multi-AZ failover
- Read replicas for scaling
- 7-day backup retention

### Application Services
- **ECS Fargate** services:
  - Payment API (2 tasks per environment)
  - Transaction Processor (2 tasks per environment)
  - Reporting Service (2 tasks per environment)
- Auto-scaling based on CPU/memory
- Secrets Manager integration for credentials

### Load Balancing & Security
- **Application Load Balancers** with path-based routing
- **AWS WAF** rules: SQL injection, XSS, rate limiting (10K req/sec)
- Security groups with least-privilege access
- Health checks with automatic failover

### Data Storage
- **S3 Buckets**:
  - Transaction logs with Glacier lifecycle (90 days)
  - Compliance documents with tiered storage
  - SSL/TLS enforcement
  - Versioning enabled
- **DynamoDB Tables**:
  - Session management with GSIs
  - API rate limiting with TTL

### Migration & Monitoring
- **Lambda Function**: Incremental data sync (Node.js 18.x)
- **CloudWatch Dashboard**: Real-time metrics
- **SNS Alerts**: High error rates, service health
- **CloudWatch Logs**: 90-day retention for audit

## Deployment Instructions

### Prerequisites
- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed

### Configuration

Create a Pulumi stack configuration:

```bash
pulumi config set environmentSuffix <unique-suffix>

### Deploy

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

### Migration Process

1. **Initial Deployment**: Deploy both blue and green environments
2. **Data Sync**: Run migration Lambda to sync data from blue to green
3. **Testing**: Validate green environment functionality
4. **Traffic Shift**: Adjust Route 53 weights (90/10, 70/30, 50/50, etc.)
5. **Monitoring**: Watch CloudWatch dashboard for metrics
6. **Rollback**: If issues arise, shift traffic back to blue

### Outputs

After deployment, you'll receive:
- `blueAlbEndpoint`: Blue environment ALB URL
- `greenAlbEndpoint`: Green environment ALB URL
- `blueDatabaseEndpoint`: Blue Aurora cluster endpoint
- `greenDatabaseEndpoint`: Green Aurora cluster endpoint
- `dashboardUrl`: CloudWatch dashboard URL

## Security & Compliance

### PCI-DSS Compliance
- Encryption at rest (KMS) and in transit (TLS)
- Network isolation via VPCs and security groups
- Audit logging (90-day CloudWatch retention)
- AWS Config rules monitoring

### IAM Roles
- ECS Task Role: Least-privilege access to S3, DynamoDB, Secrets Manager
- Lambda Role: Database access and VPC execution
- All roles follow principle of least privilege

## Cost Optimization

- **Serverless Components**: Lambda, Fargate (pay per use)
- **Aurora Serverless v2**: Recommended for auto-scaling
- **DynamoDB On-Demand**: Automatic scaling
- **S3 Lifecycle**: Automatic transition to Glacier

## Monitoring & Alerting

### CloudWatch Alarms
- High error rate (>1% over 5 minutes)
- Database connection issues
- ECS service health
- Migration job failures

### Dashboard Widgets
- Transaction throughput
- Response time latency
- Error rates per environment
- Database performance metrics

## Cleanup

To destroy all resources:

```bash
pulumi destroy

Note: Ensure all S3 buckets are empty before destruction.

## Support

For issues or questions, refer to:
- AWS Well-Architected Framework
- Pulumi TypeScript documentation
- PCI-DSS compliance guidelines

