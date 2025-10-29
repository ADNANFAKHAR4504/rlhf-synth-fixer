# Learning Management System Infrastructure - CloudFormation YAML

This document contains the complete infrastructure code for the Learning Management System (LMS) deployment using AWS CloudFormation in YAML format.

## Infrastructure Components

### Networking
- VPC with DNS support enabled
- 2 public subnets across 2 availability zones
- 2 private subnets for ECS tasks
- 2 database subnets for RDS instances
- NAT Gateway for private subnet internet access
- Internet Gateway for public subnet access
- Route tables configured for public and private traffic

### Security
- KMS encryption key for data encryption at rest
- Security groups with least privilege access
- Secrets Manager for credential management with automatic rotation
- Transit encryption enabled for Redis
- EFS encryption enabled

### Compute
- ECS Fargate cluster with Container Insights enabled
- Auto Scaling configured for CPU and memory metrics (2-20 instances)
- Task definition with 1 vCPU and 2GB memory
- Application Load Balancer for traffic distribution
- Target group health checks on root path

### Database
- Aurora MySQL cluster with 2 instances (db.r5.large)
- Storage encryption using KMS
- Automated backups with 7-day retention
- CloudWatch Logs export enabled
- Multi-AZ deployment for high availability

### Caching
- ElastiCache Redis cluster with 2 nodes (cache.r5.large)
- Automatic failover enabled
- Multi-AZ deployment
- At-rest and transit encryption enabled
- Snapshot retention for 5 days

### Storage
- EFS file system with encryption
- Lifecycle policy to transition to IA after 30 days
- Mount targets in private subnets
- Integrated with ECS task definition

### Streaming
- Kinesis Data Stream for analytics
- 2 shards with 24-hour retention
- KMS encryption enabled

### API Management
- API Gateway REST API
- Usage plan with throttling (1000 req/s, 2000 burst)
- HTTP proxy integration with ALB

### Monitoring
- CloudWatch alarms for ECS CPU utilization
- CloudWatch alarms for RDS connections
- Container Insights enabled
- CloudWatch Logs with 30-day retention

### IAM Roles
- ECS Task Execution Role for pulling images and secrets
- ECS Task Role for application permissions
- Lambda Role for secret rotation
- Least privilege policies applied

### Lambda Functions
- Secret rotation function for automated credential rotation
- Deployed in VPC for secure database access
- 30-day automatic rotation schedule

## Key Features

1. **High Availability**: Multi-AZ deployment across 2 availability zones
2. **Security**: Encryption at rest and in transit, secret rotation, KMS encryption
3. **Scalability**: Auto Scaling from 2 to 20 ECS tasks based on CPU/memory
4. **Monitoring**: CloudWatch alarms and Container Insights
5. **Compliance**: PDPA-compliant tags and security controls
6. **Disaster Recovery**: Automated backups and snapshots
