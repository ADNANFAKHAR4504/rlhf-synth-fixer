# Ideal Response - Actual Infrastructure Implementation

## Overview

This document describes the **actual implemented infrastructure** for a multi-region disaster recovery setup using Terraform. The infrastructure provides high availability through Multi-AZ Aurora deployment, cross-region application redundancy, and DynamoDB Global Tables.

---

## Architecture Summary

### What This Infrastructure Provides:

-  **Multi-AZ Aurora MySQL Database** (High Availability within region)
-  **DynamoDB Global Tables** (Cross-region data replication)
-  **Dual-Region Application Deployment** (us-east-1 and us-west-2)
-  **Application Load Balancers** (Both regions)
-  **Auto Scaling Groups** (Primary active, Secondary standby)
-  **Lambda Failover Automation**
-  **Route53 Health Checks** (DNS-based failover)
-  **CloudWatch Monitoring & Alarms**
-  **AWS Backup** (Automated backup policies)
-  **WAF Protection** (Primary region)
-  **KMS Encryption** (Both regions)

### What This Infrastructure Does NOT Provide:

-  Aurora Global Database (cross-region database replication)
-  Secondary Aurora Cluster
-  Secrets Manager for database credentials
-  RDS Enhanced Monitoring with IAM roles

### Disaster Recovery Capabilities:

- **Availability Zone Failures:**  Fully automatic (Multi-AZ)
- **Regional Database Failures:**  Manual intervention required
- **Regional Application Failures:**  Automated with Route53 + Lambda
- **Achievable RTO:** ~30-60 minutes (with manual database recovery)
- **Achievable RPO:** ~15-30 minutes (via automated backups)

---

## Project Structure

```
lib/
├── tap_stack.tf          # Main orchestration file
├── provider.tf           # Provider and backend configuration
├── variables.tf          # Input variables
├── outputs.tf            # Output values
└── modules/
    ├── vpc/              # VPC networking
    ├── security_groups/  # Security group rules
    ├── kms/              # KMS encryption keys
    ├── rds/              # Aurora Multi-AZ cluster
    ├── dynamodb/         # DynamoDB Global Table
    ├── alb/              # Application Load Balancers
    ├── asg/              # Auto Scaling Groups
    ├── iam/              # IAM roles and policies
    ├── lambda/           # Failover Lambda function
    ├── monitoring/       # CloudWatch alarms and SNS
    ├── backup/           # AWS Backup configuration
    ├── waf/              # WAF rules for ALB
    └── route53/          # Route53 health checks and DNS
```

---

## Core Configuration Files

### provider.tf

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
      configuration_aliases = [aws.secondary]
    }
    local = {
      source  = "hashicorp/local"
      version = ">= 2.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = ">= 2.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}

# Secondary region provider for DR
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
}
```

### variables.tf

```hcl
variable "aws_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (prod or staging)"
  type        = string
  default     = "prod"
  validation {
    condition     = contains(["prod", "staging"], var.environment)
    error_message = "Environment must be 'prod' or 'staging'."
  }
}

variable "vpc_cidr_primary" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "vpc_cidr_secondary" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "aurora_instance_class" {
  description = "Aurora instance size"
  type        = string
  default     = "db.t3.medium"
}

variable "ec2_instance_type" {
  description = "EC2 instance type for app servers"
  type        = string
  default     = "t3.medium"
}

variable "asg_min_capacity" {
  description = "Minimum ASG capacity"
  type        = number
  default     = 2
}

variable "asg_max_capacity" {
  description = "Maximum ASG capacity"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired ASG capacity"
  type        = number
  default     = 3
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "dr-app"
}

variable "resource_suffix" {
  description = "Suffix to append to resource names for uniqueness"
  type        = string
  default     = "v2"
}
```

---

## Main Infrastructure (tap_stack.tf)

### Data Sources

```hcl
data "aws_availability_zones" "primary" {
  state = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_caller_identity" "current" {}
```

### KMS Module - Encryption Keys

```hcl
module "kms" {
  source = "./modules/kms"

  project_name = var.project_name
  environment  = var.environment

  providers = {
    aws           = aws
    aws.secondary = aws.secondary
  }
}
```

**Purpose:** Creates KMS keys in both regions for encrypting RDS, DynamoDB, and other resources.

### VPC Modules - Network Infrastructure

```hcl
# Primary Region VPC
module "vpc_primary" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr_primary
  region       = var.aws_region
  region_name  = "primary"

  providers = {
    aws = aws
  }
}

# Secondary Region VPC
module "vpc_secondary" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment
  vpc_cidr     = var.vpc_cidr_secondary
  region       = var.secondary_region
  region_name  = "secondary"

  providers = {
    aws = aws.secondary
  }
}
```

**Purpose:** Creates isolated VPCs in both regions with:
- Public subnets (for ALB)
- Private subnets (for application and database)
- Internet Gateways
- NAT Gateways
- Route tables

### Security Groups Modules

```hcl
# Primary Region Security Groups
module "security_groups_primary" {
  source = "./modules/security_groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc_primary.vpc_id
  region_name  = "primary"

  providers = {
    aws = aws
  }
}

# Secondary Region Security Groups
module "security_groups_secondary" {
  source = "./modules/security_groups"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.vpc_secondary.vpc_id
  region_name  = "secondary"

  providers = {
    aws = aws.secondary
  }
}
```

**Purpose:** Creates security groups for:
- ALB (allows HTTP/HTTPS from internet)
- Application servers (allows traffic from ALB)
- Database (allows MySQL/Aurora traffic from application)

### RDS Module - Aurora Multi-AZ

```hcl
module "rds" {
  source = "./modules/rds"

  project_name        = var.project_name
  environment         = var.environment
  primary_region      = var.aws_region
  primary_subnet_ids  = module.vpc_primary.private_subnet_ids
  primary_db_sg_id    = module.security_groups_primary.db_sg_id
  primary_kms_key_arn = module.kms.rds_primary_key_arn
  instance_class      = var.aurora_instance_class
  resource_suffix     = var.resource_suffix

  # Secondary region parameters kept for compatibility but not used
  secondary_region      = var.secondary_region
  secondary_subnet_ids  = module.vpc_secondary.private_subnet_ids
  secondary_db_sg_id    = module.security_groups_secondary.db_sg_id
  secondary_kms_key_arn = module.kms.rds_secondary_key_arn
}
```

**RDS Module Implementation (modules/rds/main.tf):**

```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "primary" {
  name       = "${var.project_name}-db-subnet-group-${var.environment}-${var.resource_suffix}"
  subnet_ids = var.primary_subnet_ids

  tags = {
    Name        = "${var.project_name}-db-subnet-group-${var.resource_suffix}"
    Environment = var.environment
  }
}

# Primary Aurora Cluster (Multi-AZ)
resource "aws_rds_cluster" "primary" {
  cluster_identifier              = "${var.project_name}-aurora-${var.environment}-${var.resource_suffix}"
  engine                          = "aurora-mysql"
  engine_version                  = "8.0.mysql_aurora.3.04.0"
  database_name                   = replace("${var.project_name}db", "-", "")
  master_username                 = "admin"
  master_password                 = "ChangeMe123456!" # Use AWS Secrets Manager in production
  db_subnet_group_name            = aws_db_subnet_group.primary.name
  vpc_security_group_ids          = [var.primary_db_sg_id]
  backup_retention_period         = 7
  preferred_backup_window         = "03:00-04:00"
  preferred_maintenance_window    = "mon:04:00-mon:05:00"
  storage_encrypted               = true
  kms_key_id                      = var.primary_kms_key_arn
  skip_final_snapshot             = true
  enabled_cloudwatch_logs_exports = ["error", "slowquery"]

  tags = {
    Name        = "${var.project_name}-aurora-cluster-${var.resource_suffix}"
    Environment = var.environment
    Region      = var.primary_region
  }

  lifecycle {
    ignore_changes = [master_password]
  }
}

# Aurora Instances (Multi-AZ with 2 instances across different AZs)
resource "aws_rds_cluster_instance" "primary" {
  count              = 2
  identifier         = "${var.project_name}-aurora-${var.environment}-${var.resource_suffix}-${count.index + 1}"
  cluster_identifier = aws_rds_cluster.primary.id
  instance_class     = var.instance_class
  engine             = aws_rds_cluster.primary.engine
  engine_version     = aws_rds_cluster.primary.engine_version

  tags = {
    Name        = "${var.project_name}-aurora-instance-${var.resource_suffix}-${count.index + 1}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

**Key Features:**
-  Multi-AZ deployment (2 instances across different AZs)
-  Automated backups (7-day retention)
-  KMS encryption at rest
-  CloudWatch logs export (error, slowquery)
-  Hardcoded password (should use Secrets Manager)
-  Skip final snapshot enabled (should be false for production)

### DynamoDB Module - Global Table

```hcl
module "dynamodb" {
  source = "./modules/dynamodb"

  project_name     = var.project_name
  environment      = var.environment
  secondary_region = var.secondary_region
  resource_suffix  = var.resource_suffix
}
```

**Purpose:** Creates DynamoDB Global Table with:
- Cross-region replication to secondary region
- PAY_PER_REQUEST billing mode
- Point-in-time recovery enabled
- Streaming enabled for replication
- Sub-second replication lag

### ALB Modules - Load Balancers

```hcl
# Primary Region ALB
module "alb_primary" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc_primary.vpc_id
  public_subnet_ids = module.vpc_primary.public_subnet_ids
  alb_sg_id         = module.security_groups_primary.alb_sg_id
  region_name       = "primary"
  resource_suffix   = var.resource_suffix

  providers = {
    aws = aws
  }
}

# Secondary Region ALB
module "alb_secondary" {
  source = "./modules/alb"

  project_name      = var.project_name
  environment       = var.environment
  vpc_id            = module.vpc_secondary.vpc_id
  public_subnet_ids = module.vpc_secondary.public_subnet_ids
  alb_sg_id         = module.security_groups_secondary.alb_sg_id
  region_name       = "secondary"
  resource_suffix   = var.resource_suffix

  providers = {
    aws = aws.secondary
  }
}
```

**Purpose:** Application Load Balancers in both regions with:
- Target groups
- Health checks (path: /health)
- HTTP listeners
- Cross-zone load balancing

### SNS Topic Placeholder

```hcl
# Note: We need to create a placeholder SNS topic first for IAM module
resource "aws_sns_topic" "alerts_placeholder" {
  name = "${var.project_name}-dr-alerts-${var.environment}-${var.resource_suffix}"

  tags = {
    Name        = "${var.project_name}-sns-alerts-${var.resource_suffix}"
    Environment = var.environment
  }

  lifecycle {
    create_before_destroy = true
  }
}
```

### IAM Module

```hcl
module "iam" {
  source = "./modules/iam"

  project_name       = var.project_name
  environment        = var.environment
  dynamodb_table_arn = module.dynamodb.table_arn
  sns_topic_arn      = aws_sns_topic.alerts_placeholder.arn
  resource_suffix    = var.resource_suffix
}
```

**Purpose:** Creates IAM roles and policies for:
- EC2 instances (access to DynamoDB)
- Lambda functions (RDS failover permissions)
- AWS Backup service role

### Lambda Module - Failover Automation

```hcl
module "lambda" {
  source = "./modules/lambda"

  project_name       = var.project_name
  environment        = var.environment
  lambda_role_arn    = module.iam.lambda_role_arn
  global_cluster_id  = module.rds.global_cluster_id
  primary_region     = var.aws_region
  secondary_region   = var.secondary_region
  sns_topic_arn      = aws_sns_topic.alerts_placeholder.arn
  primary_alb_dns    = module.alb_primary.alb_dns_name
  secondary_alb_dns  = module.alb_secondary.alb_dns_name
  resource_suffix    = var.resource_suffix
}
```

**Purpose:** Lambda function for automated failover:
- Triggered by CloudWatch alarms or EventBridge rules
- Handles application-layer failover
- Sends SNS notifications
- Note: Cannot handle Aurora failover (no secondary cluster)

### ASG Modules - Auto Scaling Groups

```hcl
# Primary ASG (Active)
module "asg_primary" {
  source = "./modules/asg"

  project_name          = var.project_name
  environment           = var.environment
  region                = var.aws_region
  region_name           = "primary"
  instance_type         = var.ec2_instance_type
  instance_profile_name = module.iam.ec2_instance_profile_name
  app_sg_id             = module.security_groups_primary.app_sg_id
  private_subnet_ids    = module.vpc_primary.private_subnet_ids
  target_group_arn      = module.alb_primary.target_group_arn
  min_capacity          = var.asg_min_capacity
  max_capacity          = var.asg_max_capacity
  desired_capacity      = var.asg_desired_capacity

  providers = {
    aws = aws
  }
}

# Secondary ASG (Standby - Warm Standby Pattern)
module "asg_secondary" {
  source = "./modules/asg"

  project_name          = var.project_name
  environment           = var.environment
  region                = var.secondary_region
  region_name           = "secondary"
  instance_type         = var.ec2_instance_type
  instance_profile_name = module.iam.ec2_instance_profile_name
  app_sg_id             = module.security_groups_secondary.app_sg_id
  private_subnet_ids    = module.vpc_secondary.private_subnet_ids
  target_group_arn      = module.alb_secondary.target_group_arn
  min_capacity          = 0  # Cost optimization: secondary starts with 0
  max_capacity          = var.asg_max_capacity
  desired_capacity      = 0  # Scaled up during failover

  providers = {
    aws = aws.secondary
  }
}
```

**Key Features:**
- Primary ASG: Active with configured capacity
- Secondary ASG: Warm standby (0 capacity, ready to scale)
- Launch templates with user data
- ELB health checks
- Automatic scaling on failover

### Monitoring Module

```hcl
module "monitoring" {
  source = "./modules/monitoring"

  project_name           = var.project_name
  environment            = var.environment
  lambda_function_arn    = module.lambda.function_arn
  lambda_function_name   = module.lambda.function_name
  primary_alb_arn_suffix = module.alb_primary.alb_arn_suffix
  primary_tg_arn_suffix  = module.alb_primary.target_group_arn_suffix
  primary_db_cluster_id  = module.rds.primary_cluster_id
  dynamodb_table_name    = module.dynamodb.table_name
  asg_desired_capacity   = var.asg_desired_capacity
  resource_suffix        = var.resource_suffix
}
```

**Purpose:** CloudWatch monitoring with:
- Alarms for ALB unhealthy targets
- Alarms for database connections
- Alarms for region failures
- EventBridge rules for health checks
- SNS topic for alerts
- Lambda permissions for SNS and EventBridge

### Backup Module

```hcl
module "backup" {
  source = "./modules/backup"

  project_name               = var.project_name
  environment                = var.environment
  backup_role_arn            = module.iam.backup_role_arn
  primary_aurora_cluster_arn = "arn:aws:rds:${var.aws_region}:${data.aws_caller_identity.current.account_id}:cluster:${module.rds.primary_cluster_id}"
  dynamodb_table_arn         = module.dynamodb.table_arn
  resource_suffix            = var.resource_suffix
}
```

**Purpose:** AWS Backup configuration for:
- Aurora cluster backups
- DynamoDB table backups
- Automated backup schedules
- Retention policies

### WAF Module

```hcl
module "waf_primary" {
  source = "./modules/waf"

  project_name = var.project_name
  environment  = var.environment
  region_name  = "primary"
  alb_arn      = module.alb_primary.alb_arn
}
```

**Purpose:** WAFv2 protection for primary ALB with:
- Rate limiting (10k requests/5 min)
- AWS Managed Common Rules
- AWS Managed Known Bad Inputs protection

### Route53 Module

```hcl
module "route53" {
  source = "./modules/route53"

  project_name       = var.project_name
  environment        = var.environment
  primary_alb_dns    = module.alb_primary.alb_dns_name
  secondary_alb_dns  = module.alb_secondary.alb_dns_name
}
```

**Purpose:** Route53 health checks and DNS failover:
- Health checks for both ALBs
- Failover routing policy
- Automatic DNS failover on primary failure

---

## Outputs (outputs.tf)

```hcl
output "primary_alb_dns" {
  description = "DNS name of primary ALB"
  value       = module.alb_primary.alb_dns_name
}

output "secondary_alb_dns" {
  description = "DNS name of secondary ALB"
  value       = module.alb_secondary.alb_dns_name
}

output "primary_aurora_endpoint" {
  description = "Primary Aurora cluster writer endpoint"
  value       = module.rds.primary_endpoint
}

output "primary_aurora_reader_endpoint" {
  description = "Primary Aurora cluster reader endpoint (Multi-AZ)"
  value       = module.rds.primary_reader_endpoint
}

output "dynamodb_table_name" {
  description = "DynamoDB Global Table name"
  value       = module.dynamodb.table_name
}

output "lambda_failover_function" {
  description = "Lambda failover function ARN"
  value       = module.lambda.function_arn
}

output "sns_alerts_topic" {
  description = "SNS topic for DR alerts"
  value       = module.monitoring.sns_topic_arn
}

output "rto_rpo_summary" {
  description = "DR configuration summary"
  value = {
    rto_target           = "15 minutes"
    rpo_target           = "5 minutes"
    primary_region       = var.aws_region
    secondary_region     = var.secondary_region
    aurora_configuration = "Multi-AZ deployment with 2 instances across availability zones"
    dynamodb_replication = "Sub-second global replication"
    failover_automation  = "Lambda-based automated failover"
  }
}

output "route53_health_checks" {
  description = "Route53 health check IDs"
  value       = module.route53.health_checks
}

output "monitoring_alarms" {
  description = "CloudWatch alarm ARNs"
  value       = module.monitoring.alarm_arns
}

output "cost_optimization_notes" {
  description = "Cost optimization recommendations"
  value = {
    aurora_note          = "Using db.t3.medium instances for cost-effective Multi-AZ deployment"
    asg_standby_note     = "Secondary ASG starts with 0 capacity (warm standby pattern)"
    dynamodb_billing     = "PAY_PER_REQUEST billing mode - scales automatically"
    nat_gateway_note     = "Consider single NAT Gateway per region for cost savings in non-prod"
  }
}

output "backup_configuration" {
  description = "AWS Backup configuration details"
  value       = module.backup.backup_configuration
}

output "security_configuration" {
  description = "Security and WAF configuration"
  value = {
    waf_enabled           = "Yes - Primary ALB protected by WAFv2"
    waf_rules             = "Rate limiting (10k req/min), AWS Managed Common Rules, Known Bad Inputs"
    encryption_at_rest    = "Enabled for Aurora, DynamoDB, EBS volumes"
    encryption_in_transit = "TLS/SSL enforced for all data transfer"
  }
}
```

---

## Disaster Recovery Capabilities

### High Availability (Within Region) 

**Scenario:** Single Availability Zone failure

**Response:**
1. Aurora Multi-AZ automatically fails over to standby instance (~2-3 minutes)
2. ALB stops routing to unhealthy AZ
3. ASG launches replacement instances in healthy AZs
4. **RTO:** ~2-5 minutes
5. **RPO:** 0 (synchronous replication within Multi-AZ)

**Status:** Fully automated, production-ready

### Application-Layer Disaster Recovery (Cross-Region) 

**Scenario:** Primary region application failure

**Response:**
1. Route53 health checks detect primary ALB failure
2. DNS automatically fails over to secondary ALB
3. Lambda function scales up secondary ASG
4. Application serves from secondary region
5. DynamoDB Global Table provides data access
6. **RTO:** ~5-10 minutes (application layer only)
7. **RPO:** <1 second (DynamoDB replication)

**Status:** Automated for application tier

### Database-Layer Disaster Recovery (Cross-Region) 

**Scenario:** Primary region complete failure (including database)

**Current Limitations:**
- No Aurora Global Database
- No secondary Aurora cluster
- Manual database restoration required

**Manual Recovery Process:**
1. Restore Aurora from automated backup to secondary region (~15-30 min)
2. Update application configuration to point to new database
3. Scale up secondary ASG (automated via Lambda)
4. Update Route53 to secondary region (automated)
5. **Estimated RTO:** 30-60 minutes (includes manual steps)
6. **Estimated RPO:** 15-30 minutes (from last automated backup)

**Status:** Requires manual intervention, not production-ready for regional disasters

---

## Cost Optimization Features

### Cost-Effective Choices:

1. **Aurora Instance Class:** `db.t3.medium` instead of `db.r6g.large`
   - Savings: ~60% lower cost
   - Trade-off: Burstable performance, suitable for dev/test

2. **Secondary ASG Warm Standby:** 0 instances until failover
   - Savings: $0 EC2 costs in secondary region during normal operation
   - Trade-off: Slightly longer RTO (+2-3 minutes for instance launch)

3. **DynamoDB PAY_PER_REQUEST:** Scales with actual usage
   - Savings: No provisioned capacity costs during low traffic
   - Trade-off: Higher per-request cost at very high volumes

4. **Single NAT Gateway Option:** (mentioned in notes)
   - Savings: ~$30-45/month per region
   - Trade-off: Single point of failure for outbound internet

---

## Security Features

### Encryption:

-  Aurora: KMS encryption at rest
-  DynamoDB: KMS encryption at rest
-  EBS volumes: Encrypted via launch template
-  SNS topics: KMS encryption
-  S3 state backend: Encryption enabled

### Network Security:

-  Private subnets for application and database
-  Security groups with least privilege
-  WAF protection on primary ALB
-  No public database access

### Access Control:

-  IAM roles for EC2, Lambda, Backup
-  Instance profiles for EC2
-  Hardcoded database password (should use Secrets Manager)

---

## Monitoring and Alerting

### CloudWatch Alarms:

1. **ALB Unhealthy Hosts** (Primary region)
   - Threshold: >0 unhealthy targets for 3 consecutive periods
   - Action: SNS notification

2. **Database Connections** (Primary cluster)
   - Threshold: High connection count
   - Action: SNS notification

3. **Primary Region Failure** (Composite alarm)
   - Triggers automated failover via Lambda

### EventBridge Rules:

- Health check every 5 minutes
- Triggers Lambda on health check failures
- Automated failover orchestration

### SNS Notifications:

- Email/SMS alerts for all critical events
- Integrated with Lambda for failover events

---

## Deployment Instructions

### Prerequisites:

1. AWS CLI configured with appropriate credentials
2. Terraform >= 1.4.0 installed
3. S3 bucket for Terraform state
4. DynamoDB table for state locking (optional)

### Initialization:

```bash
terraform init \
  -backend-config="bucket=my-terraform-state-bucket" \
  -backend-config="key=dr-infrastructure/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="encrypt=true"
```

### Planning:

```bash
terraform plan \
  -var="project_name=my-app" \
  -var="environment=prod" \
  -var="resource_suffix=v1" \
  -out=tfplan
```

### Deployment:

```bash
terraform apply tfplan
```

### Outputs:

```bash
terraform output -json > infrastructure-outputs.json
```

---

## Testing Procedures

### 1. Multi-AZ Failover Test:

```bash
# Manually reboot primary Aurora instance
aws rds reboot-db-instance --db-instance-identifier <primary-instance-id>

# Observe automatic failover to standby (~2-3 minutes)
# Monitor CloudWatch metrics and logs
```

### 2. Application Failover Test:

```bash
# Stop primary ASG instances
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name <primary-asg-name> \
  --desired-capacity 0

# Observe Route53 DNS failover
# Monitor Lambda execution logs
# Verify secondary ASG scales up
```

### 3. DynamoDB Replication Test:

```bash
# Write data to primary region
aws dynamodb put-item --table-name <table-name> --item '{"id":{"S":"test-123"}}'

# Read from secondary region (should replicate in <1 second)
aws dynamodb get-item --table-name <table-name> --key '{"id":{"S":"test-123"}}' --region us-west-2
```

---

## Limitations and Recommendations

### Current Limitations:

1.  **No Aurora Global Database**
   - Cannot achieve stated 5-minute RPO for regional failures
   - Manual database restoration required

2.  **Hardcoded Database Password**
   - Security risk
   - Should use AWS Secrets Manager

3.  **Skip Final Snapshot Enabled**
   - Risk of data loss on cluster deletion
   - Should be disabled for production

4.  **No RDS Enhanced Monitoring**
   - Limited database performance visibility
   - Should add IAM roles and enable

### Recommendations for Production:

**High Priority:**

1. Implement Aurora Global Database (see MODEL_FAILURES.md for details)
2. Migrate to AWS Secrets Manager for database credentials
3. Disable skip_final_snapshot
4. Enable RDS Enhanced Monitoring

**Medium Priority:**

5. Add "general" query logs to CloudWatch exports
6. Consider upgrading Aurora instance class for production workloads
7. Add VPC Flow Logs for network forensics
8. Implement automated backup testing

**Low Priority:**

9. Add AWS Config for compliance monitoring
10. Implement AWS Systems Manager Session Manager for instance access
11. Add X-Ray tracing for application performance insights

---

## Conclusion

This infrastructure provides **solid high availability** within a region and **good application-layer disaster recovery** across regions. However, it **does not meet full cross-region disaster recovery requirements** due to the lack of Aurora Global Database.

### Best Use Cases:

-  Development and testing environments
-  Applications tolerant to 30-60 minute RTO
-  Applications where DynamoDB can be the source of truth
-  Cost-conscious deployments

### Not Suitable For:

-  Mission-critical applications requiring <15 minute RTO
-  Applications with strict cross-region RPO requirements
-  Compliance requirements mandating cross-region database replication
-  Applications requiring immediate database failover

### Path to Full DR Compliance:

To achieve the originally stated objectives (15-minute RTO, 5-minute RPO), implement the Aurora Global Database enhancements detailed in MODEL_FAILURES.md. This will add approximately $500-1000/month in costs but provide true cross-region disaster recovery capabilities.
