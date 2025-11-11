# Environment Migration Infrastructure

Complete Pulumi TypeScript infrastructure for environment migration with database replication, containerized applications, blue-green deployment, and weighted routing.

## Architecture

### Network Layer
- VPC across 3 Availability Zones
- Public and private subnets
- VPN Gateway for on-premises connectivity
- Single NAT Gateway for cost optimization
- Internet Gateway for public access

### Database Layer
- RDS Aurora PostgreSQL Serverless v2
- AWS DMS for on-premises to Aurora migration
- DMS replication instance, endpoints, and tasks
- CloudWatch logging for DMS operations

### Container Layer
- Amazon ECR with vulnerability scanning enabled
- ECS Fargate cluster for serverless containers
- Application Load Balancer with 2 listeners (production and test)
- Two target groups for blue-green deployment
- CodeDeploy for automated blue-green deployments

### Traffic Management
- Route53 hosted zone
- Weighted routing policies: 0%, 25%, 50%, 75%, 100%
- Gradual traffic shifting capability

### Storage & State
- DynamoDB table for application state
- S3 bucket for application data

### Serverless Functions
- Lambda for database migration validation
- Lambda for health check monitoring
- Enhanced IAM permissions for AWS service access

### Monitoring & Observability
- CloudWatch Log Groups for ECS, Lambda, and DMS
- CloudWatch Alarms for CPU, memory, and health
- CloudWatch Dashboard for unified monitoring

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured
- Node.js 18+ and npm
- Docker (for building container images)

## Configuration

Set required configuration values:
