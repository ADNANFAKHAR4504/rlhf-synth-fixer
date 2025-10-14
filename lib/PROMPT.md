# Healthcare SaaS Cross-Region Disaster Recovery Implementation

You are an expert AWS Infrastructure Engineer. Create infrastructure using **AWS CDK with Python**.

## Task Overview

Implement a HIPAA-compliant disaster recovery solution for a healthcare data platform using an active-passive configuration across two AWS regions (primary: us-east-1, DR: us-west-2).

## Core Requirements

### 1. Multi-Region Architecture
- Primary region: us-east-1 (active)
- DR region: us-west-2 (passive)
- Active-passive failover configuration
- Both regions must have identical infrastructure deployed

### 2. Database Layer
- Use Aurora Serverless v2 for PostgreSQL (HIPAA-compliant, faster provisioning)
- Configure Aurora Global Database for cross-region replication
- Enable encryption at rest using AWS KMS
- Set backup retention to 7 days minimum
- Enable automated backups

### 3. Storage Layer
- S3 buckets for healthcare data storage
- Enable S3 Cross-Region Replication (CRR) from primary to DR region
- Enable versioning on all S3 buckets
- Configure S3 bucket encryption with SSE-S3
- Enable S3 bucket logging for audit trails

### 4. Compute Layer
- ECS Fargate service for application workloads
- Deploy in both regions with identical configuration
- Use Application Load Balancer (ALB) in each region
- Configure ALB with health checks
- Enable access logging for ALBs

### 5. DNS and Failover
- Route53 hosted zone for domain management
- Configure Route53 health checks for primary ALB
- Implement Route53 failover routing policy
- Primary record pointing to us-east-1 ALB
- Secondary record pointing to us-west-2 ALB

### 6. Security and Compliance
- All data encrypted at rest and in transit
- KMS keys for encryption in both regions
- VPC with private and public subnets across 2 availability zones
- Security groups with least-privilege access
- IAM roles following principle of least privilege
- Enable CloudTrail for audit logging in both regions
- VPC Flow Logs for network monitoring

### 7. Monitoring and Alerting
- CloudWatch alarms for critical metrics
- Monitor Aurora database health
- Monitor ALB health and target health
- Monitor ECS service health
- SNS topic for alarm notifications
- CloudWatch log groups for application and infrastructure logs

### 8. Backup and Recovery
- AWS Backup for centralized backup management
- Backup plan for Aurora database
- Point-in-time recovery capability
- Cross-region backup copies

### 9. Networking
- VPC in each region with consistent CIDR blocks
- Public subnets for ALB
- Private subnets for ECS and Aurora
- NAT Gateway for outbound internet access (1 per region for cost optimization)
- VPC endpoints for S3 and other AWS services where possible

## Technical Specifications

### Resource Naming
ALL resource names MUST include the environmentSuffix parameter using the pattern: `{resource-type}-${environment_suffix}`

Example:
```python
bucket_name=f"healthcare-data-{environment_suffix}"
```

### Region Configuration
The solution must support deployment to both regions. Use environment variables or context to determine which region to deploy to.

### Deployment Constraints
- Minimize resources that take long to deploy
- Use Aurora Serverless v2 (not provisioned RDS instances)
- Use 1 NAT Gateway per region (not per AZ) for cost optimization
- Set appropriate timeouts for CloudFormation resources

### Cost Optimization
- Use Aurora Serverless v2 with auto-scaling
- Use Fargate Spot when appropriate
- Configure S3 lifecycle policies for data transition
- Use VPC endpoints where possible to avoid NAT Gateway data transfer costs
- Set CloudWatch Logs retention to 14 days

### HIPAA Compliance Features
- Encryption at rest for all data stores (Aurora, S3)
- Encryption in transit (TLS/SSL)
- CloudTrail enabled for audit logging
- VPC Flow Logs for network activity monitoring
- Access logging for S3 buckets and ALBs
- IAM policies with least-privilege access
- KMS key management with rotation policies

## Code Structure

Create the following files with clean, well-commented code:

1. **lib/tap_stack.py** - Main stack orchestrator that instantiates nested constructs
2. **lib/networking_construct.py** - VPC, subnets, security groups, NAT gateway
3. **lib/database_construct.py** - Aurora Global Database, KMS encryption
4. **lib/storage_construct.py** - S3 buckets with CRR, versioning, encryption
5. **lib/compute_construct.py** - ECS Fargate, ALB, IAM roles
6. **lib/dns_construct.py** - Route53 hosted zone, health checks, failover records
7. **lib/monitoring_construct.py** - CloudWatch alarms, SNS topics, log groups
8. **lib/security_construct.py** - CloudTrail, VPC Flow Logs, KMS keys
9. **lib/backup_construct.py** - AWS Backup plans and vaults

Each construct should be a separate class extending `Construct` (not `Stack` or `NestedStack`) to maintain clean dependency management.

## Expected Output

Provide complete, production-ready CDK Python code in separate code blocks for each file. Each code block should be copy-pastable and ready to use. Include:

- Proper imports
- Type hints
- Comprehensive inline comments
- Error handling where appropriate
- All required properties for HIPAA compliance
- Environment suffix in all resource names

The infrastructure should demonstrate:
- Complete disaster recovery capability
- Automatic failover using Route53
- Cross-region data replication (Aurora Global Database + S3 CRR)
- HIPAA-compliant security controls
- Cost-optimized configurations
- Production-ready monitoring and alerting