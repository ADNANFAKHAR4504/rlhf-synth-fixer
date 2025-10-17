# University Learning Management System Infrastructure

Complete CloudFormation YAML template for a GDPR-compliant learning management system infrastructure deployed in eu-central-1 (Frankfurt).

## Infrastructure Components

### Network Layer
- VPC (10.0.0.0/16) with DNS support
- 2 Public subnets across different AZs for NAT Gateway
- 2 Private subnets across different AZs for application resources
- Internet Gateway for public subnet connectivity
- NAT Gateway for controlled outbound internet access from private subnets
- Route tables configured for public and private subnet traffic

### Security & Encryption
- KMS customer-managed keys for database and EFS encryption
- AWS Secrets Manager for secure database credential storage
- Security groups with least privilege access rules
- All resources deployed in private subnets (no public exposure)

### Database Layer
- Aurora PostgreSQL 15.4 cluster with 2 instances (Multi-AZ)
- 35-day automated backup retention (Aurora maximum)
- AWS Backup service with 90-day retention for GDPR compliance
- Point-in-time recovery enabled via Aurora continuous backups
- Encryption at rest using KMS
- CloudWatch Logs export for PostgreSQL logs

### Backup Configuration (GDPR Compliance)
- AWS Backup Vault encrypted with database KMS key
- AWS Backup Plan with daily backups at 3 AM UTC
- 90-day backup retention meeting GDPR requirements
- Backup selection targeting Aurora cluster
- IAM role for backup service with proper permissions

### Application Platform
- ECS Fargate cluster for serverless container orchestration
- Container Insights enabled for monitoring
- Task definitions with configurable CPU and memory
- ECS Service with 2 tasks for high availability
- Deployment circuit breaker for safe deployments
- IAM roles for task execution and EFS/Secrets access

### Caching & Storage
- ElastiCache Redis 7.1 replication group
- Multi-AZ deployment with automatic failover
- Transit encryption enabled (TLS required)
- 7-day snapshot retention
- EFS file system with KMS encryption
- EFS mount targets in both private subnets
- EFS lifecycle policies (transition to IA after 30 days)

### Monitoring & Logging
- CloudWatch Log Group for ECS container logs
- 30-day log retention
- Container Insights enabled on ECS cluster

## GDPR Compliance

- Data residency in eu-central-1 (Frankfurt, Germany)
- All data encrypted at rest using KMS customer-managed keys
- All data encrypted in transit using TLS/SSL
- 90-day backup retention with point-in-time recovery
- Private network architecture with no public exposure
- IAM roles and security groups enforce least privilege
- Comprehensive audit logging via CloudWatch

## Deployment

Deploy using AWS CLI:

```bash
aws cloudformation create-stack \
  --stack-name university-lms-infrastructure \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=lms-prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-central-1
```

## AWS Services Used

- VPC
- EC2 (Subnets, Security Groups, NAT Gateway, Internet Gateway, EIP)
- ECS Fargate
- RDS Aurora PostgreSQL
- ElastiCache Redis
- AWS Backup (Vault, Plan, Selection)
- KMS
- Secrets Manager
- EFS
- IAM
- CloudWatch Logs