# Infrastructure as Code - Current State Documentation

This document describes the current state of all Terraform files in the infrastructure codebase.

## Overview

The infrastructure implements a complete payment processing platform on AWS using:
- **VPC** with public, private, and database subnets across multiple availability zones
- **Application Load Balancer (ALB)** for traffic distribution
- **ECS Fargate** for containerized application hosting
- **RDS Aurora PostgreSQL** for database with high availability
- **ECR** for container image storage
- **S3** buckets for logging and flow logs
- **VPC Endpoints** for private connectivity to AWS services
- **CloudWatch** for monitoring and logging
- **Auto Scaling** for ECS services

---

## File Structure

### 1. `provider.tf`
**Purpose**: Terraform provider configuration and version constraints

**Contents**:
- Terraform version requirement: `>= 1.5.0`
- AWS provider: `~> 5.0`
- Random provider: `~> 3.5`
- AWS provider configuration with:
  - Region from `var.aws_region`
  - Default tags (Environment, Project, ManagedBy)

---

### 2. `variables.tf`
**Purpose**: Input variable definitions

**Variables Defined**:
- `aws_region` (default: "us-east-1") - AWS region for deployment
- `environment_suffix` (default: "default") - Environment identifier with validation
- `vpc_cidr` (default: "10.0.0.0/16") - VPC CIDR block
- `availability_zones_count` (default: 3) - Number of AZs
- `container_image` (default: "nginx:latest") - Container image
- `container_port` (default: 80) - Container port
- `ecs_task_cpu` (default: "512") - ECS task CPU units
- `ecs_task_memory` (default: "1024") - ECS task memory in MB
- `ecs_desired_count` (default: 2) - Desired ECS task count
- `ecs_min_capacity` (default: 2) - Minimum ECS capacity
- `ecs_max_capacity` (default: 10) - Maximum ECS capacity
- `db_name` (default: "paymentdb") - Database name
- `db_username` (default: "dbadmin") - Database master username
- `db_instance_class` (default: "db.r6g.large") - RDS instance class
- `db_backup_retention_period` (default: 3) - Backup retention in days
- `enable_container_insights` (default: true) - Enable Container Insights
- `enable_vpc_flow_logs` (default: true) - Enable VPC Flow Logs

---

### 3. `data.tf`
**Purpose**: Data source queries

**Data Sources**:
- `aws_availability_zones.available` - Queries available AZs with opt-in-status filter
- `aws_caller_identity.current` - Gets current AWS account ID
- `aws_region.current` - Gets current AWS region

---

### 4. `locals.tf`
**Purpose**: Local values and computed variables

**Locals Defined**:
- `azs` - Sliced availability zones based on count
- `public_subnet_cidrs` - Calculated public subnet CIDRs
- `private_subnet_cidrs` - Calculated private subnet CIDRs
- `database_subnet_cidrs` - Calculated database subnet CIDRs
- `name_prefix` - Common naming prefix: `payment-app-${var.environment_suffix}`
- `common_tags` - Standard tags (Environment, Project, ManagedBy)

---

### 5. `vpc.tf`
**Purpose**: VPC and networking resources

**Resources Created**:
- `aws_vpc.main` - Main VPC with DNS support enabled
- `aws_internet_gateway.main` - Internet Gateway
- `aws_subnet.public` (count-based) - Public subnets with auto-assign public IP
- `aws_subnet.private` (count-based) - Private subnets for ECS tasks
- `aws_subnet.database` (count-based) - Database subnets
- `aws_eip.nat` (count-based) - Elastic IPs for NAT Gateways
- `aws_nat_gateway.main` (count-based) - NAT Gateways (one per AZ)
- `aws_route_table.public` - Public route table
- `aws_route.public_internet` - Route to Internet Gateway (0.0.0.0/0)
- `aws_route_table_association.public` (count-based) - Public subnet associations
- `aws_route_table.private` (count-based) - Private route tables (one per AZ)
- `aws_route.private_nat` (count-based) - Routes to NAT Gateways
- `aws_route_table_association.private` (count-based) - Private subnet associations
- `aws_route_table.database` - Database route table
- `aws_route_table_association.database` (count-based) - Database subnet associations

**Key Features**:
- Multi-AZ deployment
- Separate route tables for public, private, and database subnets
- NAT Gateways for private subnet internet access

---

### 6. `security-groups.tf`
**Purpose**: Security group definitions

**Security Groups**:
- `aws_security_group.alb`:
  - Allows HTTP (80) and HTTPS (443) from internet
  - Allows all outbound traffic
  
- `aws_security_group.ecs_tasks`:
  - Allows traffic from ALB security group on container port
  - Allows all outbound traffic
  
- `aws_security_group.rds`:
  - Allows PostgreSQL (5432) from ECS tasks security group
  - Allows all outbound traffic

**All security groups**:
- Use `name_prefix` for naming
- Include common tags
- Have `create_before_destroy` lifecycle rule

---

### 7. `alb.tf`
**Purpose**: Application Load Balancer configuration

**Resources Created**:
- `aws_lb.main`:
  - Application Load Balancer (internet-facing)
  - HTTP/2 enabled
  - Access logs to S3 bucket
  - Deployed in public subnets
  
- `aws_lb_target_group.app`:
  - Target type: IP (for Fargate)
  - Health check configured (HTTP, path: /, matcher: 200)
  - Deregistration delay: 30 seconds
  
- `aws_lb_listener.http`:
  - Port 80
  - Redirects to HTTPS (port 443)
  
- `aws_lb_listener.https`:
  - Port 443
  - Currently HTTP protocol (placeholder for SSL certificate)
  - Forwards to target group
  
- `aws_lb_listener_rule.app`:
  - Path-based routing for `/api/*` and `/`

---

### 8. `ecs.tf`
**Purpose**: ECS cluster, task definitions, and service

**Resources Created**:
- `aws_ecs_cluster.main`:
  - Container Insights conditionally enabled
  
- `aws_cloudwatch_log_group.ecs`:
  - Log group for ECS tasks
  - Retention: 7 days
  
- `aws_iam_role.ecs_task_execution`:
  - Execution role for ECS tasks
  - Assumes `ecs-tasks.amazonaws.com`
  
- `aws_iam_role_policy_attachment.ecs_task_execution`:
  - Attaches `AmazonECSTaskExecutionRolePolicy`
  
- `aws_iam_role_policy.ecs_task_execution_ssm`:
  - Allows SSM Parameter Store access
  - Allows KMS decrypt
  
- `aws_iam_role.ecs_task`:
  - Task role for application
  - Assumes `ecs-tasks.amazonaws.com`
  
- `aws_iam_role_policy.ecs_task`:
  - Allows SSM Parameter Store access
  - Allows CloudWatch Logs write access
  
- `aws_ecs_task_definition.app`:
  - Fargate launch type
  - Network mode: awsvpc
  - CPU and memory from variables
  - Container definition includes:
    - Port mappings
    - Environment variables (ENVIRONMENT, AWS_REGION)
    - Secrets from SSM Parameter Store (DB_PASSWORD, DB_CONNECTION)
    - CloudWatch Logs configuration
    - Health check configuration
  
- `aws_ecs_service.app`:
  - Fargate launch type
  - Deployed in private subnets
  - Connected to ALB target group
  - Deployment circuit breaker enabled
  - Health check grace period: 60 seconds

---

### 9. `ecs-autoscaling.tf`
**Purpose**: ECS auto scaling configuration

**Resources Created**:
- `aws_appautoscaling_target.ecs`:
  - Min/max capacity from variables
  - Targets ECS service
  
- `aws_appautoscaling_policy.ecs_cpu`:
  - Target tracking scaling
  - Metric: ECS Service Average CPU Utilization
  - Target: 70%
  - Scale-in cooldown: 300s
  - Scale-out cooldown: 60s
  
- `aws_appautoscaling_policy.ecs_memory`:
  - Target tracking scaling
  - Metric: ECS Service Average Memory Utilization
  - Target: 80%
  - Scale-in cooldown: 300s
  - Scale-out cooldown: 60s
  
- `aws_cloudwatch_metric_alarm.ecs_cpu_high`:
  - Monitors CPU utilization > 80%
  - Evaluation periods: 2
  
- `aws_cloudwatch_metric_alarm.ecs_memory_high`:
  - Monitors memory utilization > 85%
  - Evaluation periods: 2

---

### 10. `rds.tf`
**Purpose**: RDS Aurora PostgreSQL cluster

**Resources Created**:
- `random_password.db_password`:
  - 32 character password
  - Special characters included
  
- `aws_ssm_parameter.db_password`:
  - SecureString parameter
  - Stores database password
  
- `aws_ssm_parameter.db_connection_string`:
  - SecureString parameter
  - JSON-encoded connection string (host, port, database, username)
  
- `aws_db_subnet_group.main`:
  - Uses database subnets
  
- `aws_rds_cluster.main`:
  - Engine: `aurora-postgresql`
  - Engine version: `14.6`
  - Engine mode: `provisioned`
  - Serverless v2 scaling (min: 0.5, max: 2.0 ACU)
  - Storage encrypted with KMS
  - CloudWatch logs export: postgresql
  - Backup retention from variable
  - Preferred backup window: 03:00-04:00
  - Preferred maintenance window: mon:04:00-mon:05:00
  - Skip final snapshot
  
- `aws_rds_cluster_instance.main` (count: 2):
  - 2 instances for high availability
  - Performance Insights enabled
  - Enhanced monitoring enabled (60s interval)
  
- `aws_kms_key.rds`:
  - KMS key for RDS encryption
  - Key rotation enabled
  - Deletion window: 7 days
  
- `aws_kms_alias.rds`:
  - KMS key alias
  
- `aws_iam_role.rds_monitoring`:
  - IAM role for RDS Enhanced Monitoring
  
- `aws_iam_role_policy_attachment.rds_monitoring`:
  - Attaches `AmazonRDSEnhancedMonitoringRole` policy

---

### 11. `ecr.tf`
**Purpose**: ECR repository for container images

**Resources Created**:
- `aws_ecr_repository.app`:
  - Image tag mutability: `MUTABLE`
  - Image scanning on push enabled
  - Encryption: AES256
  - Force delete enabled
  
- `aws_ecr_lifecycle_policy.app`:
  - Rule 1: Keep last 10 tagged images (prefix: "v")
  - Rule 2: Remove untagged images after 7 days

---

### 12. `s3.tf`
**Purpose**: S3 bucket for ALB access logs

**Resources Created**:
- `aws_s3_bucket.alb_logs`:
  - Bucket for ALB access logs
  - Force destroy enabled
  
- `aws_s3_bucket_versioning.alb_logs`:
  - Versioning enabled
  
- `aws_s3_bucket_server_side_encryption_configuration.alb_logs`:
  - AES256 encryption
  
- `aws_s3_bucket_public_access_block.alb_logs`:
  - All public access blocked
  
- `aws_s3_bucket_policy.alb_logs`:
  - Allows ELB service account to write logs
  - Allows delivery.logs.amazonaws.com to write logs
  
- `aws_s3_bucket_lifecycle_configuration.alb_logs`:
  - Expires objects after 90 days
  - Non-current version expiration: 30 days

---

### 13. `vpc-flow-logs.tf`
**Purpose**: VPC Flow Logs to S3

**Resources Created**:
- `aws_s3_bucket.vpc_flow_logs`:
  - Bucket for VPC Flow Logs
  - Force destroy enabled
  
- `aws_s3_bucket_versioning.vpc_flow_logs`:
  - Versioning enabled
  
- `aws_s3_bucket_server_side_encryption_configuration.vpc_flow_logs`:
  - AES256 encryption
  
- `aws_s3_bucket_public_access_block.vpc_flow_logs`:
  - All public access blocked
  
- `aws_flow_log.main` (conditional):
  - Created only if `var.enable_vpc_flow_logs` is true
  - Destination: S3 bucket
  - Traffic type: ALL
  - Attached to main VPC

---

### 14. `vpc-endpoints.tf`
**Purpose**: VPC endpoints for private connectivity

**Resources Created**:
- `aws_security_group.vpc_endpoints`:
  - Allows HTTPS (443) from VPC CIDR
  - Allows all outbound traffic
  
- **Interface Endpoints** (in private subnets):
  - `aws_vpc_endpoint.ecr_api` - ECR API
  - `aws_vpc_endpoint.ecr_dkr` - ECR Docker
  - `aws_vpc_endpoint.logs` - CloudWatch Logs
  - `aws_vpc_endpoint.ssm` - Systems Manager
  - `aws_vpc_endpoint.secretsmanager` - Secrets Manager
  - `aws_vpc_endpoint.ecs` - ECS
  - `aws_vpc_endpoint.ecs_agent` - ECS Agent
  - `aws_vpc_endpoint.ecs_telemetry` - ECS Telemetry
  
- **Gateway Endpoint**:
  - `aws_vpc_endpoint.s3` - S3 Gateway endpoint
  - Attached to private and database route tables

**All endpoints**:
- Private DNS enabled (for Interface endpoints)
- Use VPC endpoints security group
- Tagged with common tags

---

### 15. `cloudwatch.tf`
**Purpose**: CloudWatch dashboard and log groups

**Resources Created**:
- `aws_cloudwatch_dashboard.main`:
  - Dashboard with 3 widgets:
    1. ECS Service Metrics (CPU, Memory)
    2. ALB Metrics (Response Time, Request Count)
    3. RDS Metrics (CPU, Database Connections)
  
- `aws_cloudwatch_log_group.vpc_flow_logs`:
  - Log group for VPC Flow Logs (if using CloudWatch)
  - Retention: 7 days

---

### 16. `outputs.tf`
**Purpose**: Output values for infrastructure

**Outputs Defined**:
- `vpc_id` - VPC ID
- `public_subnet_ids` - Public subnet IDs
- `private_subnet_ids` - Private subnet IDs
- `database_subnet_ids` - Database subnet IDs
- `alb_dns_name` - ALB DNS name
- `alb_zone_id` - ALB zone ID
- `alb_arn` - ALB ARN
- `ecs_cluster_name` - ECS cluster name
- `ecs_cluster_arn` - ECS cluster ARN
- `ecs_service_name` - ECS service name
- `rds_cluster_endpoint` - RDS writer endpoint
- `rds_cluster_reader_endpoint` - RDS reader endpoint
- `rds_cluster_port` - RDS port
- `rds_cluster_database_name` - Database name
- `ecr_repository_url` - ECR repository URL
- `ecr_repository_arn` - ECR repository ARN
- `db_password_parameter_name` - SSM parameter name for password (sensitive)
- `db_connection_parameter_name` - SSM parameter name for connection string
- `alb_logs_bucket` - S3 bucket for ALB logs
- `vpc_flow_logs_bucket` - S3 bucket for VPC flow logs
- `cloudwatch_dashboard_name` - CloudWatch dashboard name
- `nat_gateway_ips` - NAT Gateway Elastic IPs

---

## Architecture Summary

### Network Architecture
- **VPC**: Single VPC with CIDR 10.0.0.0/16 (configurable)
- **Subnets**: 
  - Public subnets (one per AZ) - for ALB and NAT Gateways
  - Private subnets (one per AZ) - for ECS tasks
  - Database subnets (one per AZ) - for RDS
- **Internet Access**:
  - Public subnets: Direct via Internet Gateway
  - Private subnets: Via NAT Gateways
  - Database subnets: No internet access
- **VPC Endpoints**: Private connectivity to AWS services without internet

### Application Architecture
- **Load Balancer**: Application Load Balancer in public subnets
- **Compute**: ECS Fargate tasks in private subnets
- **Database**: RDS Aurora PostgreSQL (2 instances) in database subnets
- **Container Registry**: ECR for container images
- **Auto Scaling**: CPU and memory-based auto scaling for ECS

### Security Architecture
- **Security Groups**: Least privilege access
  - ALB: HTTP/HTTPS from internet
  - ECS: Traffic from ALB only
  - RDS: PostgreSQL from ECS only
- **Encryption**:
  - RDS: Encrypted at rest with KMS
  - ECR: AES256 encryption
  - S3: AES256 encryption
- **Secrets Management**: SSM Parameter Store (SecureString)
- **Network Isolation**: Private subnets, VPC endpoints

### Monitoring & Logging
- **CloudWatch**:
  - Container Insights (optional)
  - Log groups for ECS
  - Dashboard for metrics
  - Alarms for ECS CPU/Memory
- **S3 Logging**:
  - ALB access logs
  - VPC Flow Logs (optional)

### High Availability
- **Multi-AZ**: All resources deployed across multiple availability zones
- **RDS**: 2 Aurora instances for high availability
- **ECS**: Desired count with auto scaling
- **NAT Gateways**: One per AZ for redundancy

---

## Key Design Decisions

1. **Fargate over EC2**: Serverless container hosting, no EC2 management
2. **Aurora PostgreSQL**: Managed database with automatic backups and high availability
3. **Serverless v2 Scaling**: Aurora Serverless v2 for cost optimization
4. **VPC Endpoints**: Private connectivity to avoid internet egress costs
5. **Separate Subnets**: Network isolation between tiers (public, private, database)
6. **SSM Parameter Store**: Secure storage for database credentials
7. **Auto Scaling**: CPU and memory-based scaling for cost optimization
8. **CloudWatch Integration**: Comprehensive monitoring and logging
9. **S3 for Logs**: Centralized logging with lifecycle policies
10. **Tagging Strategy**: Consistent tagging for resource management

---

## Dependencies

### Resource Dependencies
- VPC must be created before subnets
- Internet Gateway must exist before NAT Gateways
- NAT Gateways must exist before private routes
- Security groups must exist before resources that use them
- RDS cluster must exist before connection string parameter
- ALB listener must exist before ECS service

### Provider Dependencies
- AWS Provider ~> 5.0
- Random Provider ~> 3.5
- Terraform >= 1.5.0

---

## Notes

- **SSL Certificate**: HTTPS listener currently uses HTTP protocol. SSL certificate (ACM) should be configured for production.
- **Backend**: Currently uses local backend. For production, configure S3 backend with DynamoDB locking.
- **ELB Service Account**: S3 bucket policy uses hardcoded ELB service account for us-east-1. Should be made region-aware for multi-region deployments.
- **Container Image**: Default is nginx:latest. Should be replaced with actual application image.
- **Database Password**: Generated randomly and stored in SSM Parameter Store.
- **VPC Flow Logs**: Conditionally created based on `enable_vpc_flow_logs` variable.

---

*Last Updated: Current state as of infrastructure deployment*
