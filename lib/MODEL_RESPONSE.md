### Reasoning Trace
---

This is a complex request for a highly available, multi-region AWS infrastructure for a financial application with strict compliance requirements. I need to create a comprehensive Terraform setup that includes:

1. Multi-region architecture (primary and secondary)
2. Multi-AZ RDS clusters with cross-region replication
3. Auto-scaling application layer with load balancers
4. Full encryption (at rest and in transit)
5. Monitoring and alerting
6. Automated disaster recovery
7. RPO < 1 second and RTO < 5 minutes
8. Proper Terraform structure with workspaces, state management, and modules

Let me structure this properly:

- Root directory with main configuration
- Modules for reusable components
- Environment-specific configurations
- Proper state management with encryption and locking
- Security and compliance considerations for financial data

I'll create a comprehensive solution that addresses all these requirements.
### Answer 
---

I'll help you design a comprehensive multi-region AWS infrastructure for your critical financial application. This solution will meet your strict RPO/RTO requirements while ensuring PCI DSS compliance and high availability.

## Project Structure

```
terraform-financial-infrastructure/
├── main.tf
├── variables.tf
├── outputs.tf
├── providers.tf
├── backend.tf
├── versions.tf
├── modules/
│   ├── networking/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── database/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── compute/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── security/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   ├── monitoring/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── disaster-recovery/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
└── environments/
    ├── primary/
    │   └── terraform.tfvars
    └── secondary/
        └── terraform.tfvars
```

## Root Configuration Files

### backend.tf
```hcl
# Dynamic backend configuration for workspace-specific state files
terraform {
  backend "s3" {
    bucket         = "financial-app-terraform-state"
    key            = "infrastructure/${terraform.workspace}/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    kms_key_id     = "arn:aws:kms:us-east-1:123456789012:key/terraform-state-key"
    dynamodb_table = "terraform-state-locks"
    
    # Enable versioning and server-side encryption
    versioning = true
    
    # Prevent accidental state deletion
    lifecycle {
      prevent_destroy = true
    }
  }
}
```

### versions.tf
```hcl
terraform {
  required_version = ">= 1.5.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.5"
    }
  }
}
```

### providers.tf
```hcl
# Primary region provider
provider "aws" {
  region = var.primary_region
  alias  = "primary"
  
  default_tags {
    tags = {
      Environment     = terraform.workspace
      Project         = "financial-app"
      ManagedBy      = "terraform"
      ComplianceLevel = "PCI-DSS"
      DataClassification = "sensitive"
    }
  }
}

# Secondary region provider
provider "aws" {
  region = var.secondary_region
  alias  = "secondary"
  
  default_tags {
    tags = {
      Environment     = terraform.workspace
      Project         = "financial-app"
      ManagedBy      = "terraform"
      ComplianceLevel = "PCI-DSS"
      DataClassification = "sensitive"
    }
  }
}
```

### main.tf
```hcl
# KMS keys for encryption
resource "aws_kms_key" "primary" {
  provider                = aws.primary
  description             = "KMS key for financial app encryption - primary region"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.app_name}-kms-primary"
  }
}

resource "aws_kms_key" "secondary" {
  provider                = aws.secondary
  description             = "KMS key for financial app encryption - secondary region"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = {
    Name = "${var.app_name}-kms-secondary"
  }
}

# Networking Module - Primary Region
module "networking_primary" {
  source = "./modules/networking"
  
  providers = {
    aws = aws.primary
  }
  
  region               = var.primary_region
  environment          = terraform.workspace
  vpc_cidr            = var.primary_vpc_cidr
  availability_zones   = var.primary_availability_zones
  public_subnet_cidrs  = var.primary_public_subnet_cidrs
  private_subnet_cidrs = var.primary_private_subnet_cidrs
  database_subnet_cidrs = var.primary_database_subnet_cidrs
  enable_nat_gateway   = true
  enable_vpn_gateway   = true
  enable_flow_logs     = true
  flow_logs_bucket     = aws_s3_bucket.flow_logs_primary.id
}

# Networking Module - Secondary Region
module "networking_secondary" {
  source = "./modules/networking"
  
  providers = {
    aws = aws.secondary
  }
  
  region               = var.secondary_region
  environment          = terraform.workspace
  vpc_cidr            = var.secondary_vpc_cidr
  availability_zones   = var.secondary_availability_zones
  public_subnet_cidrs  = var.secondary_public_subnet_cidrs
  private_subnet_cidrs = var.secondary_private_subnet_cidrs
  database_subnet_cidrs = var.secondary_database_subnet_cidrs
  enable_nat_gateway   = true
  enable_vpn_gateway   = true
  enable_flow_logs     = true
  flow_logs_bucket     = aws_s3_bucket.flow_logs_secondary.id
}

# VPC Peering between regions
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.primary
  vpc_id      = module.networking_primary.vpc_id
  peer_vpc_id = module.networking_secondary.vpc_id
  peer_region = var.secondary_region
  
  tags = {
    Name = "${var.app_name}-vpc-peering"
  }
}

# Security Module - Primary Region
module "security_primary" {
  source = "./modules/security"
  
  providers = {
    aws = aws.primary
  }
  
  vpc_id          = module.networking_primary.vpc_id
  environment     = terraform.workspace
  app_name        = var.app_name
  kms_key_id      = aws_kms_key.primary.id
  private_subnets = module.networking_primary.private_subnet_ids
}

# Security Module - Secondary Region
module "security_secondary" {
  source = "./modules/security"
  
  providers = {
    aws = aws.secondary
  }
  
  vpc_id          = module.networking_secondary.vpc_id
  environment     = terraform.workspace
  app_name        = var.app_name
  kms_key_id      = aws_kms_key.secondary.id
  private_subnets = module.networking_secondary.private_subnet_ids
}

# Database Module - Primary Region
module "database_primary" {
  source = "./modules/database"
  
  providers = {
    aws = aws.primary
  }
  
  environment              = terraform.workspace
  app_name                = var.app_name
  region                  = var.primary_region
  vpc_id                  = module.networking_primary.vpc_id
  database_subnets        = module.networking_primary.database_subnet_ids
  security_group_id       = module.security_primary.database_security_group_id
  kms_key_id             = aws_kms_key.primary.id
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  max_allocated_storage  = var.db_max_allocated_storage
  backup_retention_period = 35  # PCI DSS requires 30+ days
  preferred_backup_window = "03:00-04:00"
  enable_cross_region_backup = true
  backup_region          = var.secondary_region
  is_primary             = true
}

# Database Module - Secondary Region (Read Replica)
module "database_secondary" {
  source = "./modules/database"
  
  providers = {
    aws = aws.secondary
  }
  
  environment              = terraform.workspace
  app_name                = var.app_name
  region                  = var.secondary_region
  vpc_id                  = module.networking_secondary.vpc_id
  database_subnets        = module.networking_secondary.database_subnet_ids
  security_group_id       = module.security_secondary.database_security_group_id
  kms_key_id             = aws_kms_key.secondary.id
  instance_class         = var.db_instance_class
  allocated_storage      = var.db_allocated_storage
  max_allocated_storage  = var.db_max_allocated_storage
  backup_retention_period = 35
  preferred_backup_window = "03:00-04:00"
  is_primary             = false
  source_db_identifier   = module.database_primary.cluster_identifier
}

# Compute Module - Primary Region
module "compute_primary" {
  source = "./modules/compute"
  
  providers = {
    aws = aws.primary
  }
  
  environment           = terraform.workspace
  app_name             = var.app_name
  region               = var.primary_region
  vpc_id               = module.networking_primary.vpc_id
  private_subnet_ids   = module.networking_primary.private_subnet_ids
  public_subnet_ids    = module.networking_primary.public_subnet_ids
  security_group_ids   = [module.security_primary.app_security_group_id]
  kms_key_id          = aws_kms_key.primary.id
  instance_type       = var.app_instance_type
  min_size           = var.app_min_size
  max_size           = var.app_max_size
  desired_capacity   = var.app_desired_capacity
  health_check_type  = "ELB"
  health_check_grace_period = 300
  database_endpoint  = module.database_primary.cluster_endpoint
  database_secret_arn = module.database_primary.db_secret_arn
}

# Compute Module - Secondary Region
module "compute_secondary" {
  source = "./modules/compute"
  
  providers = {
    aws = aws.secondary
  }
  
  environment           = terraform.workspace
  app_name             = var.app_name
  region               = var.secondary_region
  vpc_id               = module.networking_secondary.vpc_id
  private_subnet_ids   = module.networking_secondary.private_subnet_ids
  public_subnet_ids    = module.networking_secondary.public_subnet_ids
  security_group_ids   = [module.security_secondary.app_security_group_id]
  kms_key_id          = aws_kms_key.secondary.id
  instance_type       = var.app_instance_type
  min_size           = var.app_min_size
  max_size           = var.app_max_size
  desired_capacity   = var.app_desired_capacity
  health_check_type  = "ELB"
  health_check_grace_period = 300
  database_endpoint  = module.database_secondary.cluster_endpoint
  database_secret_arn = module.database_secondary.db_secret_arn
}

# Route53 Health Checks and Failover
resource "aws_route53_health_check" "primary" {
  fqdn              = module.compute_primary.alb_dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = {
    Name = "${var.app_name}-primary-health-check"
  }
}

resource "aws_route53_health_check" "secondary" {
  fqdn              = module.compute_secondary.alb_dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"
  
  tags = {
    Name = "${var.app_name}-secondary-health-check"
  }
}

resource "aws_route53_zone" "main" {
  name = var.domain_name
  
  tags = {
    Name = "${var.app_name}-dns-zone"
  }
}

resource "aws_route53_record" "primary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = module.compute_primary.alb_dns_name
    zone_id                = module.compute_primary.alb_zone_id
    evaluate_target_health = true
  }
  
  set_identifier = "primary"
  failover_routing_policy {
    type = "PRIMARY"
  }
  
  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "secondary" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"
  
  alias {
    name                   = module.compute_secondary.alb_dns_name
    zone_id                = module.compute_secondary.alb_zone_id
    evaluate_target_health = true
  }
  
  set_identifier = "secondary"
  failover_routing_policy {
    type = "SECONDARY"
  }
  
  health_check_id = aws_route53_health_check.secondary.id
}

# Monitoring Module
module "monitoring" {
  source = "./modules/monitoring"
  
  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }
  
  environment              = terraform.workspace
  app_name                = var.app_name
  primary_region          = var.primary_region
  secondary_region        = var.secondary_region
  primary_alb_arn         = module.compute_primary.alb_arn
  secondary_alb_arn       = module.compute_secondary.alb_arn
  primary_asg_name        = module.compute_primary.asg_name
  secondary_asg_name      = module.compute_secondary.asg_name
  primary_db_cluster_id   = module.database_primary.cluster_identifier
  secondary_db_cluster_id = module.database_secondary.cluster_identifier
  alert_email             = var.alert_email
}

# Disaster Recovery Module
module "disaster_recovery" {
  source = "./modules/disaster-recovery"
  
  providers = {
    aws.primary   = aws.primary
    aws.secondary = aws.secondary
  }
  
  environment             = terraform.workspace
  app_name               = var.app_name
  primary_region         = var.primary_region
  secondary_region       = var.secondary_region
  primary_db_cluster_arn = module.database_primary.cluster_arn
  secondary_db_cluster_arn = module.database_secondary.cluster_arn
  route53_zone_id        = aws_route53_zone.main.zone_id
  domain_name           = var.domain_name
}

# S3 Buckets for Flow Logs
resource "aws_s3_bucket" "flow_logs_primary" {
  provider = aws.primary
  bucket   = "${var.app_name}-flow-logs-${var.primary_region}-${terraform.workspace}"
  
  tags = {
    Name = "${var.app_name}-flow-logs-primary"
  }
}

resource "aws_s3_bucket" "flow_logs_secondary" {
  provider = aws.secondary
  bucket   = "${var.app_name}-flow-logs-${var.secondary_region}-${terraform.workspace}"
  
  tags = {
    Name = "${var.app_name}-flow-logs-secondary"
  }
}
```

### variables.tf
```hcl
variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "financial-app"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DR"
  type        = string
  default     = "us-west-2"
}

variable "primary_vpc_cidr" {
  description = "CIDR block for primary VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "secondary_vpc_cidr" {
  description = "CIDR block for secondary VPC"
  type        = string
  default     = "10.1.0.0/16"
}

variable "primary_availability_zones" {
  description = "Availability zones for primary region"
  type        = list(string)
  default     = ["us-east-1a", "us-east-1b", "us-east-1c"]
}

variable "secondary_availability_zones" {
  description = "Availability zones for secondary region"
  type        = list(string)
  default     = ["us-west-2a", "us-west-2b", "us-west-2c"]
}

variable "primary_public_subnet_cidrs" {
  description = "CIDR blocks for public subnets in primary region"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "primary_private_subnet_cidrs" {
  description = "CIDR blocks for private subnets in primary region"
  type        = list(string)
  default     = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]
}

variable "primary_database_subnet_cidrs" {
  description = "CIDR blocks for database subnets in primary region"
  type        = list(string)
  default     = ["10.0.21.0/24", "10.0.22.0/24", "10.0.23.0/24"]
}

variable "secondary_public_subnet_cidrs" {
  description = "CIDR blocks for public subnets in secondary region"
  type        = list(string)
  default     = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
}

variable "secondary_private_subnet_cidrs" {
  description = "CIDR blocks for private subnets in secondary region"
  type        = list(string)
  default     = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]
}

variable "secondary_database_subnet_cidrs" {
  description = "CIDR blocks for database subnets in secondary region"
  type        = list(string)
  default     = ["10.1.21.0/24", "10.1.22.0/24", "10.1.23.0/24"]
}

variable "db_instance_class" {
  description = "Instance class for RDS instances"
  type        = string
  default     = "db.r6g.2xlarge"
}

variable "db_allocated_storage" {
  description = "Allocated storage for RDS in GiB"
  type        = number
  default     = 100
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for RDS autoscaling"
  type        = number
  default     = 1000
}

variable "app_instance_type" {
  description = "EC2 instance type for application servers"
  type        = string
  default     = "t3.large"
}

variable "app_min_size" {
  description = "Minimum number of instances in ASG"
  type        = number
  default     = 3
}

variable "app_max_size" {
  description = "Maximum number of instances in ASG"
  type        = number
  default     = 10
}

variable "app_desired_capacity" {
  description = "Desired number of instances in ASG"
  type        = number
  default     = 6
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
}
```

## Module: Networking

### modules/networking/main.tf
```hcl
# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "${var.environment}-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  
  tags = {
    Name = "${var.environment}-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)
  
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true
  
  tags = {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "private"
  }
}

# Database Subnets
resource "aws_subnet" "database" {
  count = length(var.database_subnet_cidrs)
  
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = var.availability_zones[count.index]
  
  tags = {
    Name = "${var.environment}-database-subnet-${count.index + 1}"
    Type = "database"
  }
}

# Elastic IPs for NAT Gateways
resource "aws_eip" "nat" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0
  
  domain = "vpc"
  
  tags = {
    Name = "${var.environment}-nat-eip-${count.index + 1}"
  }
}

# NAT Gateways
resource "aws_nat_gateway" "main" {
  count = var.enable_nat_gateway ? length(var.availability_zones) : 0
  
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  
  tags = {
    Name = "${var.environment}-nat-${count.index + 1}"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  
  tags = {
    Name = "${var.environment}-public-rt"
  }
}

resource "aws_route_table" "private" {
  count = length(var.availability_zones)
  
  vpc_id = aws_vpc.main.id
  
  dynamic "route" {
    for_each = var.enable_nat_gateway ? [1] : []
    content {
      cidr_block     = "0.0.0.0/0"
      nat_gateway_id = aws_nat_gateway.main[count.index].id
    }
  }
  
  tags = {
    Name = "${var.environment}-private-rt-${count.index + 1}"
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count = length(var.public_subnet_cidrs)
  
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(var.private_subnet_cidrs)
  
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = length(var.database_subnet_cidrs)
  
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "main" {
  count = var.enable_flow_logs ? 1 : 0
  
  iam_role_arn    = aws_iam_role.flow_logs[0].arn
  log_destination_arn = "arn:aws:s3:::${var.flow_logs_bucket}"
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
  
  tags = {
    Name = "${var.environment}-vpc-flow-logs"
  }
}

resource "aws_iam_role" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  
  name = "${var.environment}-vpc-flow-logs-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "vpc-flow-logs.amazonaws.com"
      }
    }]
  })
}

# Network ACLs for additional security
resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id
  
  # Allow inbound database traffic from private subnets only
  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 3306
    to_port    = 3306
  }
  
  # Allow all outbound traffic
  egress {
    protocol   = -1
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }
  
  tags = {
    Name = "${var.environment}-database-nacl"
  }
}
```

## Module: Database

### modules/database/main.tf
```hcl
# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "${var.app_name}-${var.environment}-db-subnet-group"
  subnet_ids = var.database_subnets
  
  tags = {
    Name = "${var.app_name}-${var.environment}-db-subnet-group"
  }
}

# RDS Aurora Cluster (MySQL compatible for financial transactions)
resource "aws_rds_cluster" "main" {
  cluster_identifier              = "${var.app_name}-${var.environment}-cluster"
  engine                         = "aurora-mysql"
  engine_version                 = "8.0.mysql_aurora.3.04.0"
  engine_mode                    = "provisioned"
  database_name                  = "financial_db"
  master_username                = "admin"
  master_password                = random_password.db_password.result
  db_subnet_group_name           = aws_db_subnet_group.main.name
  vpc_security_group_ids         = [var.security_group_id]
  
  # High availability settings
  availability_zones             = data.aws_availability_zones.available.names
  preferred_backup_window        = var.preferred_backup_window
  preferred_maintenance_window   = "sun:04:00-sun:05:00"
  backup_retention_period        = var.backup_retention_period
  
  # Encryption
  storage_encrypted              = true
  kms_key_id                    = var.kms_key_id
  
  # Performance and scaling
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery", "audit"]
  
  # Enable backtrack for quick recovery (RPO improvement)
  backtrack_window              = 72
  
  # Cross-region backup
  dynamic "restore_to_point_in_time" {
    for_each = var.is_primary ? [] : [1]
    content {
      source_cluster_identifier = var.source_db_identifier
      restore_type             = "copy-on-write"
      use_latest_restorable_time = true
    }
  }
  
  # Enable deletion protection for production
  deletion_protection           = true
  
  # Enable Global Database for cross-region replication (sub-second RPO)
  global_cluster_identifier     = var.is_primary ? aws_rds_global_cluster.main[0].id : null
  
  # Serverless v2 scaling for automatic capacity management
  serverlessv2_scaling_configuration {
    max_capacity = 16
    min_capacity = 2
  }
  
  tags = {
    Name = "${var.app_name}-${var.environment}-cluster"
  }
}

# Global Database Cluster (only create in primary region)
resource "aws_rds_global_cluster" "main" {
  count = var.is_primary ? 1 : 0
  
  global_cluster_identifier = "${var.app_name}-global-cluster"
  engine                   = "aurora-mysql"
  engine_version          = "8.0.mysql_aurora.3.04.0"
  database_name           = "financial_db"
  storage_encrypted       = true
}

# RDS Cluster Instances
resource "aws_rds_cluster_instance" "main" {
  count = 3  # Three instances for high availability
  
  identifier                   = "${var.app_name}-${var.environment}-instance-${count.index + 1}"
  cluster_identifier          = aws_rds_cluster.main.id
  instance_class              = "db.serverless"
  engine                      = aws_rds_cluster.main.engine
  engine_version              = aws_rds_cluster.main.engine_version
  performance_insights_enabled = true
  performance_insights_kms_key_id = var.kms_key_id
  monitoring_interval         = 60
  monitoring_role_arn         = aws_iam_role.rds_enhanced_monitoring.arn
  
  preferred_maintenance_window = "sun:04:00-sun:05:00"
  auto_minor_version_upgrade  = false
  
  tags = {
    Name = "${var.app_name}-${var.environment}-instance-${count.index + 1}"
  }
}

# IAM role for RDS Enhanced Monitoring
resource "aws_iam_role" "rds_enhanced_monitoring" {
  name = "${var.app_name}-${var.environment}-rds-monitoring-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "monitoring.rds.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  role       = aws_iam_role.rds_enhanced_monitoring.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Secrets Manager for database credentials
resource "random_password" "db_password" {
  length  = 32
  special = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
}

resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.app_name}-${var.environment}-db-credentials"
  recovery_window_in_days = 30
  kms_key_id             = var.kms_key_id
}

resource "aws_secretsmanager_secret_version" "db_credentials" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = aws_rds_cluster.main.master_username
    password = random_password.db_password.result
    engine   = aws_rds_cluster.main.engine
    host     = aws_rds_cluster.main.endpoint
    port     = aws_rds_cluster.main.port
    dbname   = aws_rds_cluster.main.database_name
  })
}

# Parameter Store for non-sensitive configuration
resource "aws_ssm_parameter" "db_endpoint" {
  name  = "/${var.app_name}/${var.environment}/db/endpoint"
  type  = "String"
  value = aws_rds_cluster.main.endpoint
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}
```

## Module: Compute

### modules/compute/main.tf
```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  name               = "${var.app_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_group_ids
  subnets           = var.public_subnet_ids
  
  # Enable deletion protection
  enable_deletion_protection = true
  
  # Enable access logs for compliance
  enable_http2 = true
  enable_cross_zone_load_balancing = true
  
  # Drop invalid headers for security
  drop_invalid_header_fields = true
  
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }
  
  tags = {
    Name = "${var.app_name}-${var.environment}-alb"
  }
}

# S3 bucket for ALB logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.app_name}-${var.environment}-alb-logs-${var.region}"
  
  tags = {
    Name = "${var.app_name}-${var.environment}-alb-logs"
  }
}

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

# Target Group
resource "aws_lb_target_group" "main" {
  name     = "${var.app_name}-${var.environment}-tg"
  port     = 443
  protocol = "HTTPS"
  vpc_id   = var.vpc_id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  
  # Stickiness for session management
  stickiness {
    type            = "app_cookie"
    cookie_duration = 86400
    cookie_name     = "AWSALBAPP"
  }
  
  # Deregistration delay for graceful shutdown
  deregistration_delay = 30
  
  tags = {
    Name = "${var.app_name}-${var.environment}-tg"
  }
}

# HTTPS Listener
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate_validation.main.certificate_arn
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# HTTP Listener (redirect to HTTPS)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# WAF for additional security
resource "aws_wafv2_web_acl" "main" {
  name  = "${var.app_name}-${var.environment}-waf"
  scope = "REGIONAL"
  
  default_action {
    allow {}
  }
  
  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1
    
    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }
    
    action {
      block {}
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "RateLimitRule"
      sampled_requests_enabled   = true
    }
  }
  
  # SQL injection protection
  rule {
    name     = "SQLiRule"
    priority = 2
    
    statement {
      sqli_match_statement {
        field_to_match {
          body {}
        }
        text_transformation {
          priority = 0
          type     = "URL_DECODE"
        }
        text_transformation {
          priority = 1
          type     = "HTML_ENTITY_DECODE"
        }
      }
    }
    
    action {
      block {}
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "SQLiRule"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name               = "${var.app_name}-waf"
    sampled_requests_enabled   = true
  }
}

resource "aws_wafv2_web_acl_association" "main" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.main.arn
}

# Launch Template for EC2 instances
resource "aws_launch_template" "main" {
  name_prefix   = "${var.app_name}-${var.environment}-"
  image_id      = data.aws_ami.app.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = var.security_group_ids
  
  # Instance profile for EC2 instances
  iam_instance_profile {
    name = aws_iam_instance_profile.app.name
  }
  
  # Enable detailed monitoring
  monitoring {
    enabled = true
  }
  
  # Encrypted root volume
  block_device_mappings {
    device_name = "/dev/xvda"
    
    ebs {
      volume_size           = 100
      volume_type          = "gp3"
      iops                 = 3000
      encrypted            = true
      kms_key_id          = var.kms_key_id
      delete_on_termination = true
    }
  }
  
  # Instance metadata options for security
  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }
  
  # User data for initial setup
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region           = var.region
    environment      = var.environment
    app_name        = var.app_name
    db_endpoint     = var.database_endpoint
    db_secret_arn   = var.database_secret_arn
  }))
  
  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.app_name}-${var.environment}-instance"
      Environment = var.environment
    }
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "main" {
  name               = "${var.app_name}-${var.environment}-asg"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = [aws_lb_target_group.main.arn]
  health_check_type   = var.health_check_type
  health_check_grace_period = var.health_check_grace_period
  min_size           = var.min_size
  max_size           = var.max_size
  desired_capacity   = var.desired_capacity
  
  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }
  
  # Enable instance refresh for deployments
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 90
      instance_warmup       = 300
    }
  }
  
  # Termination policies
  termination_policies = ["OldestInstance"]
  
  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]
  
  tag {
    key                 = "Name"
    value               = "${var.app_name}-${var.environment}-asg-instance"
    propagate_at_launch = true
  }
  
  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }
}

# Auto Scaling Policies
resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.app_name}-${var.environment}-scale-up"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.app_name}-${var.environment}-scale-down"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown              = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

# CloudWatch Alarms for scaling
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.app_name}-${var.environment}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "300"
  statistic          = "Average"
  threshold          = "70"
  alarm_description  = "This metric monitors EC2 cpu utilization"
  alarm_actions      = [aws_autoscaling_policy.scale_up.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.app_name}-${var.environment}-low-cpu"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/EC2"
  period             = "300"
  statistic          = "Average"
  threshold          = "30"
  alarm_description  = "This metric monitors EC2 cpu utilization"
  alarm_actions      = [aws_autoscaling_policy.scale_down.arn]
  
  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

# IAM Role for EC2 instances
resource "aws_iam_role" "app" {
  name = "${var.app_name}-${var.environment}-app-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "app" {
  name = "${var.app_name}-${var.environment}-app-policy"
  role = aws_iam_role.app.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = var.database_secret_arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = var.kms_key_id
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_instance_profile" "app" {
  name = "${var.app_name}-${var.environment}-app-profile"
  role = aws_iam_role.app.name
}

# ACM Certificate for HTTPS
resource "aws_acm_certificate" "main" {
  domain_name       = var.domain_name
  validation_method = "DNS"
  
  lifecycle {
    create_before_destroy = true
  }
  
  tags = {
    Name = "${var.app_name}-${var.environment}-cert"
  }
}

resource "aws_acm_certificate_validation" "main" {
  certificate_arn = aws_acm_certificate.main.arn
}

# Data source for AMI
data "aws_ami" "app" {
  most_recent = true
  owners      = ["self"]
  
  filter {
    name   = "name"
    values = ["${var.app_name}-app-*"]
  }
  
  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}
```

## Module: Monitoring

### modules/monitoring/main.tf
```hcl
# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  provider = aws.primary
  
  dashboard_name = "${var.app_name}-${var.environment}-dashboard"
  
  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            [".", "RequestCount", { stat = "Sum" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum" }],
            [".", "HTTPCode_Target_4XX_Count", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "Application Load Balancer Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections", { stat = "Average" }],
            [".", "CPUUtilization", { stat = "Average" }],
            [".", "FreeableMemory", { stat = "Average" }],
            [".", "ReadLatency", { stat = "Average" }],
            [".", "WriteLatency", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "RDS Metrics"
        }
      }
    ]
  })
}

# SNS Topics for Alerts
resource "aws_sns_topic" "alerts" {
  provider = aws.primary
  name     = "${var.app_name}-${var.environment}-alerts"
  
  kms_master_key_id = "alias/aws/sns"
}

resource "aws_sns_topic_subscription" "email" {
  provider  = aws.primary
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alert_email
}

# CloudWatch Alarms for Critical Metrics
resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-${var.environment}-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "UnHealthyHostCount"
  namespace          = "AWS/ApplicationELB"
  period             = "60"
  statistic          = "Average"
  threshold          = "0"
  alarm_description  = "Alert when we have any unhealthy hosts"
  alarm_actions      = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = var.primary_alb_arn
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu_high" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-${var.environment}-rds-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "Alert when RDS CPU is too high"
  alarm_actions      = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBClusterIdentifier = var.primary_db_cluster_id
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage_low" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-${var.environment}-rds-storage-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "FreeStorageSpace"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "10737418240" # 10GB in bytes
  alarm_description  = "Alert when RDS free storage is low"
  alarm_actions      = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    DBClusterIdentifier = var.primary_db_cluster_id
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "app_logs" {
  provider = aws.primary
  
  name              = "/aws/application/${var.app_name}/${var.environment}"
  retention_in_days = 30
  kms_key_id       = var.kms_key_arn
}

# CloudWatch Insights queries for analysis
resource "aws_cloudwatch_query_definition" "error_analysis" {
  provider = aws.primary
  
  name = "${var.app_name}-error-analysis"
  
  log_group_names = [
    aws_cloudwatch_log_group.app_logs.name
  ]
  
  query_string = <<EOF
fields @timestamp, @message
| filter @message like /ERROR/
| stats count() by bin(5m)
EOF
}

# AWS Config for compliance monitoring
resource "aws_config_configuration_recorder" "main" {
  provider = aws.primary
  name     = "${var.app_name}-${var.environment}-recorder"
  role_arn = aws_iam_role.config.arn
  
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main" {
  provider       = aws.primary
  name           = "${var.app_name}-${var.environment}-delivery"
  s3_bucket_name = aws_s3_bucket.config.bucket
  
  snapshot_delivery_properties {
    delivery_frequency = "TwentyFour_Hours"
  }
}

resource "aws_config_configuration_recorder_status" "main" {
  provider   = aws.primary
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true
  
  depends_on = [aws_config_delivery_channel.main]
}

# S3 bucket for AWS Config
resource "aws_s3_bucket" "config" {
  provider = aws.primary
  bucket   = "${var.app_name}-${var.environment}-config-${var.primary_region}"
}

resource "aws_s3_bucket_public_access_block" "config" {
  provider = aws.primary
  bucket   = aws_s3_bucket.config.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role for Config
resource "aws_iam_role" "config" {
  provider = aws.primary
  name     = "${var.app_name}-${var.environment}-config-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "config.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "config" {
  provider   = aws.primary
  role       = aws_iam_role.config.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}
```

## Module: Disaster Recovery

### modules/disaster-recovery/main.tf
```hcl
# Lambda function for automated failover
resource "aws_lambda_function" "failover" {
  provider         = aws.primary
  filename         = "${path.module}/failover.zip"
  function_name    = "${var.app_name}-${var.environment}-failover"
  role            = aws_iam_role.lambda_failover.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/failover.zip")
  runtime         = "python3.11"
  timeout         = 60
  
  environment {
    variables = {
      PRIMARY_REGION   = var.primary_region
      SECONDARY_REGION = var.secondary_region
      ROUTE53_ZONE_ID  = var.route53_zone_id
      DOMAIN_NAME      = var.domain_name
      PRIMARY_DB_CLUSTER = var.primary_db_cluster_arn
      SECONDARY_DB_CLUSTER = var.secondary_db_cluster_arn
    }
  }
  
  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [var.lambda_security_group_id]
  }
}

# EventBridge rule for automated failover trigger
resource "aws_cloudwatch_event_rule" "failover_trigger" {
  provider    = aws.primary
  name        = "${var.app_name}-${var.environment}-failover-trigger"
  description = "Trigger failover on primary region failure"
  
  event_pattern = jsonencode({
    source      = ["aws.health"]
    detail-type = ["AWS Health Event"]
    detail = {
      service = ["EC2", "RDS"]
      eventTypeCategory = ["issue"]
    }
  })
}

resource "aws_cloudwatch_event_target" "lambda" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.failover_trigger.name
  target_id = "FailoverLambdaTarget"
  arn       = aws_lambda_function.failover.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.failover.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.failover_trigger.arn
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_failover" {
  provider = aws.primary
  name     = "${var.app_name}-${var.environment}-lambda-failover-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_failover" {
  provider = aws.primary
  name     = "${var.app_name}-${var.environment}-lambda-failover-policy"
  role     = aws_iam_role.lambda_failover.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "route53:ChangeResourceRecordSets",
          "route53:GetChange",
          "route53:ListResourceRecordSets"
        ]
        Resource = [
          "arn:aws:route53:::hostedzone/${var.route53_zone_id}",
          "arn:aws:route53:::change/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "rds:FailoverDBCluster",
          "rds:PromoteReadReplicaDBCluster",
          "rds:DescribeDBClusters",
          "rds:DescribeGlobalClusters"
        ]
        Resource = [
          var.primary_db_cluster_arn,
          var.secondary_db_cluster_arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_vpc" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_failover.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# DynamoDB table for tracking failover state
resource "aws_dynamodb_table" "failover_state" {
  provider         = aws.primary
  name             = "${var.app_name}-${var.environment}-failover-state"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "id"
    type = "S"
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  server_side_encryption {
    enabled = true
  }
  
  replica {
    region_name = var.secondary_region
  }
  
  tags = {
    
