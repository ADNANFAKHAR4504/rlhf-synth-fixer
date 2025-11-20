# Payment Processing Infrastructure - Blue-Green Deployment

Complete Terraform (HCL) infrastructure for migrating a payment processing application from on-premises to AWS with zero downtime using a blue-green deployment strategy and continuous database replication.

## Architecture Overview

### Network Architecture
- VPC: 10.0.0.0/16 spanning 3 availability zones in us-east-1
- Public Subnets: 10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24 (for ALB and NAT Gateways)
- Private Subnets: 10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24 (for ECS and RDS)
- 3 NAT Gateways (one per AZ) for private subnet outbound traffic
- Internet Gateway for public subnet internet access

### Application Architecture
- ECS Fargate: Containerized payment processing application in private subnets
- Blue Environment: Active production traffic (2 tasks running)
- Green Environment: Standby for zero-downtime deployment (0 tasks initially)
- Application Load Balancer: SSL/TLS termination and traffic distribution across public subnets
- Separate target groups for blue and green environments

### Database Architecture
- Aurora PostgreSQL: Multi-AZ cluster with 3 instances (one per AZ)
- Engine Version: 15.4
- Backup Retention: 7 days with automated backups
- Encryption: KMS customer-managed key for data at rest
- AWS DMS: Continuous replication from on-premises Oracle to Aurora PostgreSQL

### Security Features
- All data encrypted at rest using KMS customer-managed keys
- All application traffic confined to private subnets
- Security groups follow least privilege principle
- No 0.0.0.0/0 ingress rules on ECS and RDS security groups (only ALB for public access)
- SSL/TLS on ALB using AWS Certificate Manager
- IAM roles with least privilege policies

### Compliance Features (PCI-DSS)
- CloudWatch log retention: 90 days for compliance
- Automated database backups: 7 days retention
- Resource tagging: Environment, CostCenter, MigrationPhase
- Comprehensive audit logging for all services
- Network isolation with no direct internet access from application tier

## AWS Services Implemented

**Core Services**:
- VPC (with 3 AZs, public and private subnets)
- ECS Fargate (blue-green deployment)
- RDS Aurora PostgreSQL (Multi-AZ cluster)
- Application Load Balancer (target groups for blue/green)
- AWS DMS (database migration from Oracle)

**Supporting Services**:
- IAM (roles and policies)
- CloudWatch (log groups with 90-day retention)
- KMS (customer-managed encryption keys)
- ACM (SSL/TLS certificates)
- NAT Gateway (3 instances, one per AZ)
- Internet Gateway

## Prerequisites

1. Terraform: Version 1.5 or later
2. AWS CLI: Configured with appropriate credentials
3. AWS Account: With permissions to create VPC, ECS, RDS, DMS, ALB, IAM resources
4. Container Image: Payment processing application image in Amazon ECR
5. Source Database: On-premises Oracle database accessible from AWS (for DMS)

## Deployment Instructions

### Step 1: Clone and Configure

```bash
# Navigate to the lib directory
cd lib

# Copy example tfvars
cp terraform.tfvars.example terraform.tfvars

# Edit terraform.tfvars with your actual values
vim terraform.tfvars
```

### Step 2: Set Required Variables

Edit `terraform.tfvars` and provide these critical values:

```hcl
environment_suffix     = "prod"  # Or dev, staging, etc.
db_master_password     = "SECURE_PASSWORD_HERE"
source_db_server       = "oracle.yourcompany.com"
source_db_username     = "oracle_user"
source_db_password     = "ORACLE_PASSWORD_HERE"
container_image        = "123456789.dkr.ecr.us-east-1.amazonaws.com/payment-app:v1.0"
```

### Step 3: Initialize Terraform

```bash
terraform init
```

### Step 4: Review Execution Plan

```bash
terraform plan -out=tfplan
```

Review the plan carefully to ensure all resources match expectations.

### Step 5: Apply Configuration

```bash
terraform apply tfplan
```

This will create:
- 1 VPC with 6 subnets (3 public, 3 private)
- 3 NAT Gateways
- 1 Application Load Balancer with 2 target groups
- 1 ECS Fargate cluster with 2 services (blue/green)
- 1 Aurora PostgreSQL cluster with 3 instances
- 1 DMS replication instance with endpoints and task
- IAM roles, security groups, KMS keys, CloudWatch log groups

### Step 6: Verify Deployment

```bash
# Get ALB DNS name for accessing the application
terraform output alb_dns_name

# Get Aurora database endpoint
terraform output aurora_cluster_endpoint

# Get ECS cluster details
terraform output ecs_cluster_name
```

## Blue-Green Deployment Process

### Initial State (Blue Active)
- Blue ECS service: 2 tasks running in private subnets
- Green ECS service: 0 tasks (standby)
- ALB routing 100% traffic to blue target group

### Phase 1: Deploy New Version to Green

```bash
# Update container image in terraform.tfvars or via variable
container_image = "123456789.dkr.ecr.us-east-1.amazonaws.com/payment-app:v2.0"

# Scale up green service to match blue
aws ecs update-service \
  --cluster ecs-cluster-prod \
  --service payment-service-green-prod \
  --desired-count 2 \
  --region us-east-1

# Wait for green tasks to become healthy
aws ecs wait services-stable \
  --cluster ecs-cluster-prod \
  --services payment-service-green-prod \
  --region us-east-1
```

### Phase 2: Switch Traffic to Green

```bash
# Update active_environment variable
# In terraform.tfvars:
active_environment = "green"

# Apply the change (updates ALB listener rule)
terraform apply -var="active_environment=green"
```

Traffic now flows: ALB → Green Target Group → Green ECS Tasks

### Phase 3: Verify and Scale Down Blue

```bash
# Monitor application for issues
# Check CloudWatch logs, metrics, ALB target health

# If everything looks good, scale down blue
aws ecs update-service \
  --cluster ecs-cluster-prod \
  --service payment-service-blue-prod \
  --desired-count 0 \
  --region us-east-1
```

### Rollback Procedure (If Needed)

If issues detected with green environment:

```bash
# Immediately switch traffic back to blue
terraform apply -var="active_environment=blue"

# Scale down green
aws ecs update-service \
  --cluster ecs-cluster-prod \
  --service payment-service-green-prod \
  --desired-count 0 \
  --region us-east-1
```

## Database Migration with AWS DMS

### Step 1: Verify DMS Endpoints

```bash
# Test source Oracle endpoint connection
aws dms test-connection \
  --replication-instance-arn $(terraform output -raw dms_replication_instance_arn) \
  --endpoint-arn <source-endpoint-arn> \
  --region us-east-1

# Test target Aurora PostgreSQL endpoint connection
aws dms test-connection \
  --replication-instance-arn $(terraform output -raw dms_replication_instance_arn) \
  --endpoint-arn <target-endpoint-arn> \
  --region us-east-1
```

### Step 2: Start Replication Task

```bash
# Start DMS replication task (full load + CDC)
aws dms start-replication-task \
  --replication-task-arn <replication-task-arn> \
  --start-replication-task-type start-replication \
  --region us-east-1
```

### Step 3: Monitor Replication

```bash
# Check replication task status
aws dms describe-replication-tasks \
  --filters "Name=replication-task-arn,Values=<task-arn>" \
  --region us-east-1

# View DMS CloudWatch logs
aws logs tail /dms/replication-dev --follow --region us-east-1
```

### Step 4: Verify Data Consistency

```bash
# Connect to source Oracle database
sqlplus user/pass@oracle.onprem.example.com

# Connect to target Aurora PostgreSQL
psql -h $(terraform output -raw aurora_cluster_endpoint) -U postgres -d paymentdb

# Compare row counts, run validation queries
```

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Examples:
- VPC: `vpc-dev`
- ALB: `alb-dev`
- ECS Cluster: `ecs-cluster-dev`
- Aurora Cluster: `aurora-cluster-dev`
- KMS Key Alias: `alias/payment-processing-dev`
- IAM Roles: `ecs-task-execution-role-dev`, `dms-vpc-role-dev`
- Security Groups: `alb-sg-dev`, `ecs-sg-dev`, `rds-sg-dev`, `dms-sg-dev`

## Tags Applied to All Resources

Every resource is tagged with:
- **Name**: Resource-specific name with environment suffix
- **Environment**: Value from `environment_suffix` variable
- **CostCenter**: "FinOps" (for cost allocation)
- **MigrationPhase**: "blue", "green", or "initial"
- **Repository**: From variable (default: "unknown")
- **Team**: From variable (default: "unknown")
- **Author**: From variable (default: "unknown")
- **PRNumber**: From variable (default: "unknown")

## Security Considerations

### Network Security
- All ECS tasks run in private subnets with no public IP addresses
- RDS Aurora cluster in private subnets, not publicly accessible
- DMS replication instance in private subnet
- Only ALB has public access (ports 80, 443)
- NAT Gateways provide controlled outbound internet access
- Security groups restrict traffic to specific ports and sources

### Encryption
- KMS customer-managed keys for all encryption at rest
- Automatic key rotation enabled
- 7-day deletion window for accidental deletion protection
- RDS storage encrypted with KMS
- DMS replication instance storage encrypted with KMS
- EBS volumes for ECS tasks encrypted

### IAM Security
- Separate IAM roles for:
  - ECS task execution (pull images, write logs)
  - ECS task runtime (application permissions)
  - DMS VPC management
  - DMS CloudWatch logging
- Least privilege policies
- No wildcard permissions
- Service-specific trust relationships

### Database Security
- Aurora PostgreSQL in private subnets only
- KMS encryption at rest
- SSL/TLS required for connections (DMS endpoints use ssl_mode=require)
- Automated encrypted backups with 7-day retention
- Security group allows access only from ECS and DMS

### Certificate Management
- ACM certificate for HTTPS on ALB
- Automatic certificate renewal
- TLS 1.3 policy enforced (ELBSecurityPolicy-TLS13-1-2-2021-06)
- HTTP traffic redirected to HTTPS

## Monitoring and Logging

### CloudWatch Log Groups (90-day retention for PCI-DSS compliance)
- `/ecs/payment-processing-blue-{env}`: Blue environment container logs
- `/ecs/payment-processing-green-{env}`: Green environment container logs
- `/dms/replication-{env}`: DMS replication task logs
- `/alb/access-logs-{env}`: ALB access logs

### CloudWatch Metrics
- **ECS**: Container Insights enabled for detailed metrics
- **ALB**: Request count, latency, target health, 4xx/5xx errors
- **RDS**: CPU utilization, connections, IOPS, replication lag
- **DMS**: Replication lag, CDC latency, task errors

### Monitoring Commands

```bash
# View ECS task logs
aws logs tail /ecs/payment-processing-blue-dev --follow --region us-east-1

# Check ALB target health
aws elbv2 describe-target-health \
  --target-group-arn $(terraform output -raw blue_target_group_arn) \
  --region us-east-1

# Monitor DMS replication
aws dms describe-replication-tasks \
  --region us-east-1 | jq '.ReplicationTasks[] | {TaskId: .ReplicationTaskIdentifier, Status: .Status}'
```

## Troubleshooting

### ECS Tasks Not Starting

```bash
# Describe tasks to see errors
aws ecs describe-tasks \
  --cluster ecs-cluster-dev \
  --tasks <task-id> \
  --region us-east-1

# Check CloudWatch logs
aws logs tail /ecs/payment-processing-blue-dev --follow

# Common issues:
# - Container image not found in ECR
# - IAM role permissions insufficient
# - Environment variables missing or incorrect
# - Database endpoint unreachable
```

### ALB Health Check Failures

```bash
# Check target health status
aws elbv2 describe-target-health \
  --target-group-arn <tg-arn> \
  --region us-east-1

# Verify security group rules
aws ec2 describe-security-groups \
  --group-ids <sg-id> \
  --region us-east-1

# Common issues:
# - Health check path /health not responding
# - Security group blocking port 8080 from ALB
# - ECS tasks not registering with target group
```

### DMS Replication Issues

```bash
# Check replication task status
aws dms describe-replication-tasks --region us-east-1

# View detailed DMS logs
aws logs tail /dms/replication-dev --follow

# Test endpoint connections
aws dms test-connection \
  --replication-instance-arn <instance-arn> \
  --endpoint-arn <endpoint-arn>

# Common issues:
# - Source database not reachable (firewall, VPN)
# - Incorrect database credentials
# - Insufficient permissions on source database
# - Table schema incompatibilities
```

### Database Connection Issues

```bash
# Test connection from ECS task
aws ecs execute-command \
  --cluster ecs-cluster-dev \
  --task <task-id> \
  --container payment-app-blue \
  --interactive \
  --command "/bin/sh"

# Inside container:
psql -h $DB_HOST -U postgres -d paymentdb

# Common issues:
# - Security group not allowing port 5432 from ECS
# - Aurora cluster not fully started
# - Incorrect database credentials
# - DNS resolution issues
```

## Cost Optimization

### Current Architecture Costs (Estimated Monthly in us-east-1)

- **NAT Gateways**: 3 × $32 = $96 (plus data transfer)
- **Application Load Balancer**: ~$23 (plus data transfer)
- **ECS Fargate**: 2 tasks × 0.5 vCPU × 1GB = ~$30
- **Aurora PostgreSQL**: 3 × db.r6g.large = ~$400
- **DMS Replication Instance**: dms.t3.medium = ~$60
- **Estimated Total**: ~$600-700/month

### Cost Optimization Options

1. **Aurora Serverless v2**: Replace provisioned Aurora with serverless for variable workloads
   - Scales automatically based on load
   - Can reduce costs by 50-90% for non-constant workloads

2. **Fargate Spot**: Use Fargate Spot for non-critical environments
   - Up to 70% cost savings
   - Suitable for dev/staging environments

3. **NAT Gateway Alternatives**:
   - Use VPC Endpoints for AWS services (S3, ECR, CloudWatch)
   - Replace NAT Gateways with NAT instances for dev/staging
   - Can save ~$100/month per environment

4. **Stop DMS After Migration**:
   - Stop or delete DMS replication instance once migration is complete
   - Save ~$60/month

5. **Right-Size RDS Instances**:
   - Start with smaller instance types (db.t4g.medium)
   - Scale up based on actual usage patterns
   - Can save 50-70% during initial phases

## Cleanup

To destroy all resources:

```bash
# Important: Scale down ECS services first
aws ecs update-service \
  --cluster ecs-cluster-dev \
  --service payment-service-blue-dev \
  --desired-count 0 \
  --region us-east-1

aws ecs update-service \
  --cluster ecs-cluster-dev \
  --service payment-service-green-dev \
  --desired-count 0 \
  --region us-east-1

# Wait for tasks to stop
aws ecs wait services-inactive \
  --cluster ecs-cluster-dev \
  --services payment-service-blue-dev payment-service-green-dev \
  --region us-east-1

# Destroy all infrastructure
terraform destroy
```

**Warning**: This will permanently delete all resources including databases. Ensure you have backups before destroying.

## Files in This Directory

- `main.tf`: VPC, subnets, NAT gateways, route tables, KMS keys, CloudWatch log groups
- `security_groups.tf`: Security groups for ALB, ECS, RDS, and DMS
- `iam.tf`: IAM roles and policies for ECS and DMS
- `rds.tf`: Aurora PostgreSQL cluster and instances
- `alb.tf`: Application Load Balancer, target groups, listeners, ACM certificate
- `ecs.tf`: ECS cluster, task definitions, and services for blue/green deployments
- `dms.tf`: DMS replication instance, endpoints, and migration task
- `outputs.tf`: Output values for important resource identifiers
- `variables.tf`: Input variable declarations
- `provider.tf`: Terraform and AWS provider configuration
- `terraform.tfvars.example`: Example variable values
- `.terraform.lock.hcl`: Terraform dependency lock file
- `README.md`: This file

## Support and Troubleshooting

For issues or questions:

1. Check CloudWatch logs for error messages
2. Review AWS service quotas (ensure limits not exceeded)
3. Verify IAM permissions for Terraform execution role
4. Check security group rules and network connectivity
5. Review Terraform state for resource drift
6. Consult AWS documentation for specific service issues

## References

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [AWS RDS Aurora PostgreSQL User Guide](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/)
- [AWS DMS User Guide](https://docs.aws.amazon.com/dms/latest/userguide/)
- [Blue-Green Deployments on AWS](https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/)
- [PCI-DSS on AWS Compliance](https://aws.amazon.com/compliance/pci-dss-level-1-faqs/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
