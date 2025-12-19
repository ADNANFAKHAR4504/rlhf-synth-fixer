### `provider.tf`
```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  backend "local" {
    path = "terraform.tfstate"
  }
}

provider "aws" {
  region                     = var.aws_region
  skip_request_account_id = true
}

provider "aws" {
  alias                      = "r0"
  region                     = try(local.regions_padded[0], var.aws_region)
  skip_request_account_id = true
}

provider "aws" {
  alias                      = "r1"
  region                     = try(local.regions_padded[1], var.aws_region)
  skip_request_account_id = true
}

provider "aws" {
  alias                      = "r2"
  region                     = try(local.regions_padded[2], var.aws_region)
  skip_request_account_id = true
}
```

### `variables.tf`
```hcl
variable "aws_region" {
  description = "AWS region to deploy infrastructure"
  type        = string
}

variable "regions" {
  description = "List of AWS regions to deploy infrastructure"
  type        = list(string)
  validation {
    condition     = length(var.regions) > 0
    error_message = "At least one region must be specified"
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod"
  }
}

variable "vpc_cidrs" {
  description = "Map of VPC CIDR blocks per region"
  type        = map(string)
  validation {
    condition     = alltrue([for cidr in values(var.vpc_cidrs) : can(cidrhost(cidr, 0))])
    error_message = "All CIDR blocks must be valid"
  }
}

variable "availability_zones_per_region" {
  description = "Number of AZs to use per region"
  type        = number
  default     = 3
}

variable "instance_type" {
  description = "EC2 instance type for compute resources"
  type        = string
  default     = "t3.medium"
}

variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
  default     = 10
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
  default     = 4
}

variable "rds_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.medium"
}

variable "rds_engine" {
  description = "RDS database engine"
  type        = string
  default     = "mysql"
}

variable "rds_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0"
}

variable "rds_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 100
}

variable "rds_backup_retention_period" {
  description = "RDS backup retention period in days"
  type        = number
  default     = 30
}

variable "rds_maintenance_window" {
  description = "RDS maintenance window"
  type        = string
  default     = "sun:02:00-sun:04:00"
}

variable "rds_backup_window" {
  description = "RDS backup window"
  type        = string
  default     = "00:00-02:00"
}

variable "cloudtrail_retention_days" {
  description = "CloudTrail S3 retention in days"
  type        = number
  default     = 90
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
```

### `locals.tf`
```hcl
locals {
  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      ManagedBy   = "Terraform"
      Project     = "multi-region-infrastructure"
      Timestamp   = timestamp()
    }
  )

  name_prefix = "${var.environment}-${random_string.suffix.result}"

  # Pad regions list to ensure consistent indexing for aliased providers
  regions_padded = length(var.regions) > 0 ? var.regions : [var.aws_region]

  # Define region aliases for modules
  region0 = try(local.regions_padded[0], null)
  region1 = try(local.regions_padded[1], null)
  region2 = try(local.regions_padded[2], null)

  # Per-region computed subnet cidrs for multi-region deployments
  subnet_cidrs = {
    for region in var.regions : region => {
      public = [
        for i in range(var.availability_zones_per_region) :
        cidrsubnet(var.vpc_cidrs[region], 8, i)
      ]
      private = [
        for i in range(var.availability_zones_per_region) :
        cidrsubnet(var.vpc_cidrs[region], 8, i + var.availability_zones_per_region)
      ]
      database = [
        for i in range(var.availability_zones_per_region) :
        cidrsubnet(var.vpc_cidrs[region], 8, i + (2 * var.availability_zones_per_region))
      ]
    }
  }
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "random_password" "rds_master" {
  length  = 32
  special = true
}
```

### `main.tf`
```hcl
# Helper maps to drive per-index modules
locals {
  idx_map = {
    for idx, r in local.regions_padded : idx => r
  }
}

# Region 0 stack
module "kms_r0" {
  count       = local.region0 != null ? 1 : 0
  source      = "./modules/security"
  providers   = { aws = aws.r0 }
  environment = var.environment
  region      = local.region0
  name_prefix = local.name_prefix
}

module "networking_r0" {
  count              = local.region0 != null ? 1 : 0
  source             = "./modules/networking"
  providers          = { aws = aws.r0 }
  environment        = var.environment
  region             = local.region0
  vpc_cidr           = var.vpc_cidrs[local.region0]
  availability_zones = var.availability_zones_per_region
  public_subnets     = local.subnet_cidrs[local.region0].public
  private_subnets    = local.subnet_cidrs[local.region0].private
  database_subnets   = local.subnet_cidrs[local.region0].database
  name_prefix        = local.name_prefix
  kms_key_id         = module.kms_r0[0].kms_key_id
}

module "compute_r0" {
  count                = local.region0 != null ? 1 : 0
  source               = "./modules/compute"
  providers            = { aws = aws.r0 }
  depends_on           = [module.networking_r0]
  environment          = var.environment
  region               = local.region0
  vpc_id               = module.networking_r0[0].vpc_id
  private_subnet_ids   = module.networking_r0[0].private_subnet_ids
  public_subnet_ids    = module.networking_r0[0].public_subnet_ids
  instance_type        = var.instance_type
  min_size             = var.asg_min_size
  max_size             = var.asg_max_size
  desired_capacity     = var.asg_desired_capacity
  name_prefix          = local.name_prefix
  kms_key_id           = module.kms_r0[0].kms_key_id
  iam_instance_profile = module.kms_r0[0].instance_profile_name
}

module "database_r0" {
  count                   = local.region0 != null ? 1 : 0
  source                  = "./modules/database"
  providers               = { aws = aws.r0 }
  depends_on              = [module.networking_r0, module.kms_r0]
  environment             = var.environment
  region                  = local.region0
  vpc_id                  = module.networking_r0[0].vpc_id
  database_subnet_ids     = module.networking_r0[0].database_subnet_ids
  instance_class          = var.rds_instance_class
  engine                  = var.rds_engine
  engine_version          = var.rds_engine_version
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
  maintenance_window      = var.rds_maintenance_window
  backup_window           = var.rds_backup_window
  master_password         = random_password.rds_master.result
  name_prefix             = local.name_prefix
  kms_key_id              = module.kms_r0[0].kms_key_id
  security_group_id       = module.compute_r0[0].app_security_group_id
}

module "monitoring_r0" {
  count               = local.region0 != null ? 1 : 0
  source              = "./modules/monitoring"
  providers           = { aws = aws.r0 }
  depends_on          = [module.compute_r0, module.database_r0]
  environment         = var.environment
  region              = local.region0
  name_prefix         = local.name_prefix
  kms_key_id          = module.kms_r0[0].kms_key_id
  retention_days      = var.cloudtrail_retention_days
  alarm_email         = var.alarm_email
  vpc_id              = module.networking_r0[0].vpc_id
  alb_arn_suffix      = module.compute_r0[0].alb_arn_suffix
  asg_name            = module.compute_r0[0].asg_name
  rds_instance_id     = module.database_r0[0].rds_instance_id
  dynamodb_table_name = module.database_r0[0].dynamodb_table_name
}

# Region 1 stack
module "kms_r1" {
  count       = local.region1 != null ? 1 : 0
  source      = "./modules/security"
  providers   = { aws = aws.r1 }
  environment = var.environment
  region      = local.region1
  name_prefix = local.name_prefix
}

module "networking_r1" {
  count              = local.region1 != null ? 1 : 0
  source             = "./modules/networking"
  providers          = { aws = aws.r1 }
  environment        = var.environment
  region             = local.region1
  vpc_cidr           = var.vpc_cidrs[local.region1]
  availability_zones = var.availability_zones_per_region
  public_subnets     = local.subnet_cidrs[local.region1].public
  private_subnets    = local.subnet_cidrs[local.region1].private
  database_subnets   = local.subnet_cidrs[local.region1].database
  name_prefix        = local.name_prefix
  kms_key_id         = module.kms_r1[0].kms_key_id
}

module "compute_r1" {
  count                = local.region1 != null ? 1 : 0
  source               = "./modules/compute"
  providers            = { aws = aws.r1 }
  depends_on           = [module.networking_r1]
  environment          = var.environment
  region               = local.region1
  vpc_id               = module.networking_r1[0].vpc_id
  private_subnet_ids   = module.networking_r1[0].private_subnet_ids
  public_subnet_ids    = module.networking_r1[0].public_subnet_ids
  instance_type        = var.instance_type
  min_size             = var.asg_min_size
  max_size             = var.asg_max_size
  desired_capacity     = var.asg_desired_capacity
  name_prefix          = local.name_prefix
  kms_key_id           = module.kms_r1[0].kms_key_id
  iam_instance_profile = module.kms_r1[0].instance_profile_name
}

module "database_r1" {
  count                   = local.region1 != null ? 1 : 0
  source                  = "./modules/database"
  providers               = { aws = aws.r1 }
  depends_on              = [module.networking_r1, module.kms_r1]
  environment             = var.environment
  region                  = local.region1
  vpc_id                  = module.networking_r1[0].vpc_id
  database_subnet_ids     = module.networking_r1[0].database_subnet_ids
  instance_class          = var.rds_instance_class
  engine                  = var.rds_engine
  engine_version          = var.rds_engine_version
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
  maintenance_window      = var.rds_maintenance_window
  backup_window           = var.rds_backup_window
  master_password         = random_password.rds_master.result
  name_prefix             = local.name_prefix
  kms_key_id              = module.kms_r1[0].kms_key_id
  security_group_id       = module.compute_r1[0].app_security_group_id
}

module "monitoring_r1" {
  count               = local.region1 != null ? 1 : 0
  source              = "./modules/monitoring"
  providers           = { aws = aws.r1 }
  depends_on          = [module.compute_r1, module.database_r1]
  environment         = var.environment
  region              = local.region1
  name_prefix         = local.name_prefix
  kms_key_id          = module.kms_r1[0].kms_key_id
  retention_days      = var.cloudtrail_retention_days
  alarm_email         = var.alarm_email
  vpc_id              = module.networking_r1[0].vpc_id
  alb_arn_suffix      = module.compute_r1[0].alb_arn_suffix
  asg_name            = module.compute_r1[0].asg_name
  rds_instance_id     = module.database_r1[0].rds_instance_id
  dynamodb_table_name = module.database_r1[0].dynamodb_table_name
}

# Region 2 stack
module "kms_r2" {
  count       = local.region2 != null ? 1 : 0
  source      = "./modules/security"
  providers   = { aws = aws.r2 }
  environment = var.environment
  region      = local.region2
  name_prefix = local.name_prefix
}

module "networking_r2" {
  count              = local.region2 != null ? 1 : 0
  source             = "./modules/networking"
  providers          = { aws = aws.r2 }
  environment        = var.environment
  region             = local.region2
  vpc_cidr           = var.vpc_cidrs[local.region2]
  availability_zones = var.availability_zones_per_region
  public_subnets     = local.subnet_cidrs[local.region2].public
  private_subnets    = local.subnet_cidrs[local.region2].private
  database_subnets   = local.subnet_cidrs[local.region2].database
  name_prefix        = local.name_prefix
  kms_key_id         = module.kms_r2[0].kms_key_id
}

module "compute_r2" {
  count                = local.region2 != null ? 1 : 0
  source               = "./modules/compute"
  providers            = { aws = aws.r2 }
  depends_on           = [module.networking_r2]
  environment          = var.environment
  region               = local.region2
  vpc_id               = module.networking_r2[0].vpc_id
  private_subnet_ids   = module.networking_r2[0].private_subnet_ids
  public_subnet_ids    = module.networking_r2[0].public_subnet_ids
  instance_type        = var.instance_type
  min_size             = var.asg_min_size
  max_size             = var.asg_max_size
  desired_capacity     = var.asg_desired_capacity
  name_prefix          = local.name_prefix
  kms_key_id           = module.kms_r2[0].kms_key_id
  iam_instance_profile = module.kms_r2[0].instance_profile_name
}

module "database_r2" {
  count                   = local.region2 != null ? 1 : 0
  source                  = "./modules/database"
  providers               = { aws = aws.r2 }
  depends_on              = [module.networking_r2, module.kms_r2]
  environment             = var.environment
  region                  = local.region2
  vpc_id                  = module.networking_r2[0].vpc_id
  database_subnet_ids     = module.networking_r2[0].database_subnet_ids
  instance_class          = var.rds_instance_class
  engine                  = var.rds_engine
  engine_version          = var.rds_engine_version
  allocated_storage       = var.rds_allocated_storage
  backup_retention_period = var.rds_backup_retention_period
  maintenance_window      = var.rds_maintenance_window
  backup_window           = var.rds_backup_window
  master_password         = random_password.rds_master.result
  name_prefix             = local.name_prefix
  kms_key_id              = module.kms_r2[0].kms_key_id
  security_group_id       = module.compute_r2[0].app_security_group_id
}

module "monitoring_r2" {
  count               = local.region2 != null ? 1 : 0
  source              = "./modules/monitoring"
  providers           = { aws = aws.r2 }
  depends_on          = [module.compute_r2, module.database_r2]
  environment         = var.environment
  region              = local.region2
  name_prefix         = local.name_prefix
  kms_key_id          = module.kms_r2[0].kms_key_id
  retention_days      = var.cloudtrail_retention_days
  alarm_email         = var.alarm_email
  vpc_id              = module.networking_r2[0].vpc_id
  alb_arn_suffix      = module.compute_r2[0].alb_arn_suffix
  asg_name            = module.compute_r2[0].asg_name
  rds_instance_id     = module.database_r2[0].rds_instance_id
  dynamodb_table_name = module.database_r2[0].dynamodb_table_name
}
```

### `outputs.tf`
```hcl
output "region_infrastructure" {
  description = "Infrastructure details per region"
  value = merge(
    local.region0 != null ? {
      (local.region0) = {
        vpc_id              = module.networking_r0[0].vpc_id
        alb_dns             = module.compute_r0[0].alb_dns
        rds_endpoint        = module.database_r0[0].rds_endpoint
        dynamodb_table_name = module.database_r0[0].dynamodb_table_name
        cloudtrail_bucket   = module.monitoring_r0[0].cloudtrail_bucket
      }
    } : {},
    local.region1 != null ? {
      (local.region1) = {
        vpc_id              = module.networking_r1[0].vpc_id
        alb_dns             = module.compute_r1[0].alb_dns
        rds_endpoint        = module.database_r1[0].rds_endpoint
        dynamodb_table_name = module.database_r1[0].dynamodb_table_name
        cloudtrail_bucket   = module.monitoring_r1[0].cloudtrail_bucket
      }
    } : {},
    local.region2 != null ? {
      (local.region2) = {
        vpc_id              = module.networking_r2[0].vpc_id
        alb_dns             = module.compute_r2[0].alb_dns
        rds_endpoint        = module.database_r2[0].rds_endpoint
        dynamodb_table_name = module.database_r2[0].dynamodb_table_name
        cloudtrail_bucket   = module.monitoring_r2[0].cloudtrail_bucket
      }
    } : {}
  )
}

output "kms_keys" {
  description = "KMS key ARNs per region"
  value = merge(
    local.region0 != null ? { (local.region0) = module.kms_r0[0].kms_key_arn } : {},
    local.region1 != null ? { (local.region1) = module.kms_r1[0].kms_key_arn } : {},
    local.region2 != null ? { (local.region2) = module.kms_r2[0].kms_key_arn } : {}
  )
  sensitive = true
}
```

### `terraform.tfvars`
```hcl
aws_region = "us-east-1"

regions = [
  "eu-west-1",
  "ap-southeast-1"
]

environment = "prod"

vpc_cidrs = {
  "eu-west-1"      = "10.1.0.0/16"
  "ap-southeast-1" = "10.2.0.0/16"
}

availability_zones_per_region = 3

instance_type = "t3.medium"

asg_min_size         = 2
asg_max_size         = 10
asg_desired_capacity = 2

rds_instance_class    = "db.t3.medium"
rds_engine            = "mysql"
rds_engine_version    = "8.0.40"
rds_allocated_storage = 100

cloudtrail_retention_days = 90

alarm_email = "ops-team@example.com"

tags = {
  Owner      = "Platform Team"
  CostCenter = "Engineering"
  Compliance = "PCI-DSS"
}
```

## Module Configurations

### Module: Security (`modules/security/`)

#### `modules/security/versions.tf`
```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}
```

#### `modules/security/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}
```

#### `modules/security/main.tf`
```hcl
data "aws_caller_identity" "current" {}

resource "aws_kms_key" "main" {
  description             = "KMS key for ${var.environment} in ${var.region}"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow EC2 services to use the key"
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "autoscaling.amazonaws.com"
          ]
        }
        Action = [
          "kms:CreateGrant",
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:ReEncrypt*"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudTrail to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:GenerateDataKey*",
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GetKeyPolicy",
          "kms:ListAliases",
          "kms:ListKeys"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name = "${var.name_prefix}-kms-${var.region}"
  }
}

resource "aws_kms_alias" "main" {
  name          = "alias/${var.name_prefix}-${var.region}"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_iam_role" "instance" {
  name = "${var.name_prefix}-instance-role-${var.region}"

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

resource "aws_iam_role_policy" "instance" {
  name = "${var.name_prefix}-instance-policy-${var.region}"
  role = aws_iam_role.instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.name_prefix}-*/*",
          "arn:aws:s3:::${var.name_prefix}-*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:CreateGrant",
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyWithoutPlainText",
          "kms:ReEncrypt*"
        ]
        Resource = aws_kms_key.main.arn
      },
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters",
          "ssm:GetParametersByPath"
        ]
        Resource = "arn:aws:ssm:${var.region}:*:parameter/${var.environment}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_instance_profile" "instance" {
  name = "${var.name_prefix}-instance-profile-${var.region}"
  role = aws_iam_role.instance.name
}

resource "aws_s3_bucket" "app_data" {
  bucket = "${var.name_prefix}-app-data-${var.region}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id

  rule {
    id     = "transition-old-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 60
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}
```

#### `modules/security/outputs.tf`
```hcl
output "kms_key_id" {
  value = aws_kms_key.main.arn
}

output "kms_key_arn" {
  value = aws_kms_key.main.arn
}

output "instance_role_arn" {
  value = aws_iam_role.instance.arn
}

output "instance_profile_name" {
  value = aws_iam_instance_profile.instance.name
}

output "app_data_bucket" {
  value = aws_s3_bucket.app_data.id
}
```

### Module: Networking (`modules/networking/`)

#### `modules/networking/versions.tf`
```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}
```

#### `modules/networking/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
}

variable "availability_zones" {
  description = "Number of availability zones"
  type        = number
}

variable "public_subnets" {
  description = "List of public subnet CIDRs"
  type        = list(string)
}

variable "private_subnets" {
  description = "List of private subnet CIDRs"
  type        = list(string)
}

variable "database_subnets" {
  description = "List of database subnet CIDRs"
  type        = list(string)
}

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}
```

#### `modules/networking/main.tf`
```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.name_prefix}-vpc-${var.region}"
  }
}

resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_log.arn
  log_destination = aws_cloudwatch_log_group.flow_log.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id
}

resource "aws_cloudwatch_log_group" "flow_log" {
  name              = "/aws/vpc/${var.name_prefix}-${var.region}"
  retention_in_days = 30
}

resource "aws_iam_role" "flow_log" {
  name = "${var.name_prefix}-flow-log-role-${var.region}"

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

resource "aws_iam_role_policy" "flow_log" {
  name = "${var.name_prefix}-flow-log-policy-${var.region}"
  role = aws_iam_role.flow_log.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name_prefix}-igw-${var.region}"
  }
}

resource "aws_subnet" "public" {
  count = var.availability_zones

  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnets[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.name_prefix}-public-subnet-${count.index + 1}-${var.region}"
    Type = "public"
  }
}

resource "aws_subnet" "private" {
  count = var.availability_zones

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnets[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.name_prefix}-private-subnet-${count.index + 1}-${var.region}"
    Type = "private"
  }
}

resource "aws_subnet" "database" {
  count = var.availability_zones

  vpc_id            = aws_vpc.main.id
  cidr_block        = var.database_subnets[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.name_prefix}-database-subnet-${count.index + 1}-${var.region}"
    Type = "database"
  }
}

resource "aws_eip" "nat" {
  count  = var.availability_zones
  domain = "vpc"

  tags = {
    Name = "${var.name_prefix}-eip-nat-${count.index + 1}-${var.region}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count = var.availability_zones

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.name_prefix}-nat-${count.index + 1}-${var.region}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name_prefix}-public-rt-${var.region}"
  }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.main.id
}

resource "aws_route_table_association" "public" {
  count = var.availability_zones

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  count  = var.availability_zones
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "${var.name_prefix}-private-rt-${count.index + 1}-${var.region}"
  }
}

resource "aws_route" "private_nat" {
  count = var.availability_zones

  route_table_id         = aws_route_table.private[count.index].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.main[count.index].id
}

resource "aws_route_table_association" "private" {
  count = var.availability_zones

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_route_table_association" "database" {
  count = var.availability_zones

  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 80
    to_port    = 80
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 443
    to_port    = 443
  }

  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 1024
    to_port    = 65535
  }

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "${var.name_prefix}-public-nacl-${var.region}"
  }
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = concat(aws_subnet.private[*].id, aws_subnet.database[*].id)

  ingress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = var.vpc_cidr
    from_port  = 0
    to_port    = 0
  }

  egress {
    protocol   = "-1"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = 0
    to_port    = 0
  }

  tags = {
    Name = "${var.name_prefix}-private-nacl-${var.region}"
  }
}
```

#### `modules/networking/outputs.tf`
```hcl
output "vpc_id" {
  value = aws_vpc.main.id
}

output "vpc_cidr" {
  value = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  value = aws_subnet.database[*].id
}

output "nat_gateway_ids" {
  value = aws_nat_gateway.main[*].id
}
```

### Module: Compute (`modules/compute/`)

#### `modules/compute/versions.tf`
```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}
```

#### `modules/compute/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "private_subnet_ids" {
  description = "List of private subnet IDs"
  type        = list(string)
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs"
  type        = list(string)
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "min_size" {
  description = "Minimum ASG size"
  type        = number
}

variable "max_size" {
  description = "Maximum ASG size"
  type        = number
}

variable "desired_capacity" {
  description = "Desired ASG capacity"
  type        = number
}

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "iam_instance_profile" {
  description = "IAM instance profile name"
  type        = string
}
```

#### `modules/compute/main.tf`
```hcl
resource "aws_security_group" "alb" {
  name_prefix = "${var.name_prefix}-alb-sg-"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.name_prefix}-alb-sg-${var.region}"
  }
}

resource "aws_security_group" "app" {
  name_prefix = "${var.name_prefix}-app-sg-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    from_port = 443
    to_port   = 443
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.name_prefix}-app-sg-${var.region}"
  }
}

resource "aws_lb" "main" {
  name_prefix        = substr(var.name_prefix, 0, 6)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  enable_deletion_protection       = var.environment == "prod" ? true : false
  enable_http2                     = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name = "${var.name_prefix}-alb-${var.region}"
  }
}

resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.name_prefix}-alb-logs-${var.region}"
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

resource "aws_s3_bucket_public_access_block" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

data "aws_elb_service_account" "main" {}

resource "aws_s3_bucket_policy" "alb_logs" {
  bucket     = aws_s3_bucket.alb_logs.id
  depends_on = [aws_s3_bucket_public_access_block.alb_logs]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.alb_logs.arn
      },
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action = [
          "s3:GetBucketLocation"
        ]
        Resource = aws_s3_bucket.alb_logs.arn
      }
    ]
  })
}

resource "aws_lb_target_group" "main" {
  name_prefix = substr(var.name_prefix, 0, 6)
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 15
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  stickiness {
    enabled         = true
    type            = "lb_cookie"
    cookie_duration = 86400
  }

  tags = {
    Name = "${var.name_prefix}-tg-${var.region}"
  }
}

resource "aws_lb_listener" "main" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_launch_template" "main" {
  name_prefix   = "${var.name_prefix}-lt-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = var.iam_instance_profile
  }

  network_interfaces {
    associate_public_ip_address = false
    delete_on_termination       = true
    security_groups             = [aws_security_group.app.id]
  }

  block_device_mappings {
    device_name = "/dev/xvda"

    ebs {
      volume_size           = 30
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = var.kms_key_id
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region      = var.region
    environment = var.environment
  }))

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.name_prefix}-instance-${var.region}"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "main" {
  name_prefix               = "${var.name_prefix}-asg-"
  vpc_zone_identifier       = var.private_subnet_ids
  min_size                  = var.min_size
  max_size                  = var.max_size
  desired_capacity          = var.desired_capacity
  health_check_grace_period = 1200
  health_check_type         = "ELB"
  force_delete              = true

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  target_group_arns = [aws_lb_target_group.main.arn]

  enabled_metrics = [
    "GroupMinSize",
    "GroupMaxSize",
    "GroupDesiredCapacity",
    "GroupInServiceInstances",
    "GroupTotalInstances"
  ]

  tag {
    key                 = "Name"
    value               = "${var.name_prefix}-asg-instance-${var.region}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_policy" "scale_up" {
  name                   = "${var.name_prefix}-scale-up-${var.region}"
  scaling_adjustment     = 2
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_autoscaling_policy" "scale_down" {
  name                   = "${var.name_prefix}-scale-down-${var.region}"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.main.name
}

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.name_prefix}-high-cpu-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_up.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}

resource "aws_cloudwatch_metric_alarm" "low_cpu" {
  alarm_name          = "${var.name_prefix}-low-cpu-${var.region}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 20
  alarm_description   = "This metric monitors ec2 cpu utilization"
  alarm_actions       = [aws_autoscaling_policy.scale_down.arn]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.main.name
  }
}
```

#### `modules/compute/user_data.sh`
```bash
#!/bin/bash
set -e

# Log everything to help debug
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user data script at $(date)"

# Wait for network connectivity
echo "Waiting for network connectivity..."
for i in {1..30}; do
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo "Network connectivity established"
        break
    fi
    echo "Attempt $i: Waiting for network..."
    sleep 10
done

# Update system
echo "Updating system packages..."
yum update -y

wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install and configure Apache web server
yum install -y httpd
systemctl enable httpd
systemctl start httpd

# Create a simple health check endpoint
cat <<EOF > /var/www/html/health
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>OK</h1>
    <p>Service is healthy</p>
</body>
</html>
EOF

# Create a simple index page
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Region App</title>
</head>
<body>
    <h1>Welcome to Multi-Region Infrastructure</h1>
    <p>Environment: ${environment}</p>
    <p>Region: ${region}</p>
    <p>Instance ID: \$(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Status: Healthy</p>
</body>
</html>
EOF

# Ensure proper permissions
chown apache:apache /var/www/html/index.html /var/www/html/health
chmod 644 /var/www/html/index.html /var/www/html/health

# Test the health endpoint
echo "Testing health endpoint..."
curl -f http://localhost/health || echo "Health endpoint test failed"

echo "User data script completed at $(date)"

cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "metrics": {
    "namespace": "CustomApp/${environment}",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "/"
        ]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/${environment}/${region}/system",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
```

#### `modules/compute/outputs.tf`
```hcl
output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "alb_arn_suffix" {
  value = aws_lb.main.arn_suffix
}

output "target_group_arn" {
  value = aws_lb_target_group.main.arn
}

output "asg_name" {
  value = aws_autoscaling_group.main.name
}

output "app_security_group_id" {
  value = aws_security_group.app.id
}
```

### Module: Database (`modules/database/`)

#### `modules/database/versions.tf`
```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}
```

#### `modules/database/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "database_subnet_ids" {
  description = "List of database subnet IDs"
  type        = list(string)
}

variable "instance_class" {
  description = "RDS instance class"
  type        = string
}

variable "engine" {
  description = "RDS engine"
  type        = string
}

variable "engine_version" {
  description = "RDS engine version"
  type        = string
}

variable "allocated_storage" {
  description = "RDS allocated storage"
  type        = number
}

variable "backup_retention_period" {
  description = "RDS backup retention period"
  type        = number
}

variable "maintenance_window" {
  description = "RDS maintenance window"
  type        = string
}

variable "backup_window" {
  description = "RDS backup window"
  type        = string
}

variable "master_password" {
  description = "RDS master password"
  type        = string
  sensitive   = true
}

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "security_group_id" {
  description = "Security group ID for RDS"
  type        = string
}
```

#### `modules/database/main.tf`
```hcl
resource "aws_db_subnet_group" "main" {
  name_prefix = "${var.name_prefix}-db-subnet-"
  subnet_ids  = var.database_subnet_ids

  tags = {
    Name = "${var.name_prefix}-db-subnet-group-${var.region}"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "${var.name_prefix}-rds-sg-"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [var.security_group_id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.name_prefix}-rds-sg-${var.region}"
  }
}

resource "aws_db_parameter_group" "main" {
  name_prefix = "${var.name_prefix}-db-params-"
  family      = "${var.engine}${substr(var.engine_version, 0, 3)}"

  parameter {
    name  = "character_set_server"
    value = "utf8mb4"
  }

  parameter {
    name  = "collation_server"
    value = "utf8mb4_unicode_ci"
  }

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name = "${var.name_prefix}-db-params-${var.region}"
  }
}

resource "aws_db_instance" "main" {
  identifier_prefix = "${var.name_prefix}-db-"

  engine            = var.engine
  engine_version    = var.engine_version
  instance_class    = var.instance_class
  allocated_storage = var.allocated_storage
  storage_type      = "gp3"
  storage_encrypted = true
  kms_key_id        = var.kms_key_id

  db_name  = replace(var.name_prefix, "-", "_")
  username = "admin"
  password = var.master_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  multi_az                = true
  publicly_accessible     = false
  backup_retention_period = var.backup_retention_period
  backup_window           = var.backup_window
  maintenance_window      = var.maintenance_window

  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  deletion_protection       = var.environment == "prod" ? true : false
  skip_final_snapshot       = var.environment != "prod"
  final_snapshot_identifier = var.environment == "prod" ? "${var.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null

  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true

  tags = {
    Name = "${var.name_prefix}-rds-${var.region}"
  }
}

resource "aws_dynamodb_table" "main" {
  name         = "${var.name_prefix}-table-${var.region}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"
  range_key    = "timestamp"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "timestamp"
    type = "N"
  }

  global_secondary_index {
    name            = "timestamp-index"
    hash_key        = "timestamp"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_id
  }

  point_in_time_recovery {
    enabled = true
  }

  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  tags = {
    Name = "${var.name_prefix}-dynamodb-${var.region}"
  }
}

resource "aws_backup_plan" "dynamodb" {
  name = "${var.name_prefix}-dynamodb-backup-${var.region}"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)"

    lifecycle {
      delete_after = 30
    }

    recovery_point_tags = {
      Environment = var.environment
      Region      = var.region
    }
  }
}

resource "aws_backup_vault" "main" {
  name        = "${var.name_prefix}-backup-vault-${var.region}"
  kms_key_arn = var.kms_key_id

  tags = {
    Name = "${var.name_prefix}-backup-vault-${var.region}"
  }
}

resource "aws_backup_selection" "dynamodb" {
  name         = "${var.name_prefix}-dynamodb-selection-${var.region}"
  iam_role_arn = aws_iam_role.backup.arn
  plan_id      = aws_backup_plan.dynamodb.id

  resources = [
    aws_dynamodb_table.main.arn
  ]
}

resource "aws_iam_role" "backup" {
  name = "${var.name_prefix}-backup-role-${var.region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "backup.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  role       = aws_iam_role.backup.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
}
```

#### `modules/database/outputs.tf`
```hcl
output "rds_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "rds_instance_id" {
  value = aws_db_instance.main.id
}

output "dynamodb_table_name" {
  value = aws_dynamodb_table.main.name
}

output "dynamodb_table_arn" {
  value = aws_dynamodb_table.main.arn
}
```

### Module: Monitoring (`modules/monitoring/`)

#### `modules/monitoring/versions.tf`
```hcl
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}
```

#### `modules/monitoring/variables.tf`
```hcl
variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "name_prefix" {
  description = "Name prefix for resources"
  type        = string
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "retention_days" {
  description = "CloudTrail retention days"
  type        = number
}

variable "alarm_email" {
  description = "Email for CloudWatch alarms"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix"
  type        = string
  default     = ""
}

variable "asg_name" {
  description = "Auto Scaling Group name"
  type        = string
  default     = ""
}

variable "rds_instance_id" {
  description = "RDS instance ID"
  type        = string
  default     = ""
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name"
  type        = string
  default     = ""
}
```

#### `modules/monitoring/main.tf`
```hcl
resource "aws_s3_bucket" "cloudtrail" {
  bucket = "${var.name_prefix}-cloudtrail-${var.region}"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = var.kms_key_id
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  rule {
    id     = "expire-old-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = var.retention_days
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 60
      storage_class = "GLACIER"
    }
  }
}

data "aws_caller_identity" "current" {}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.cloudtrail.arn
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.region}:${data.aws_caller_identity.current.account_id}:trail/${var.name_prefix}-trail-${var.region}"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.region}:${data.aws_caller_identity.current.account_id}:trail/${var.name_prefix}-trail-${var.region}"
            "s3:x-amz-acl"  = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

resource "aws_cloudtrail" "main" {
  name                          = "${var.name_prefix}-trail-${var.region}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_logging                = true

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = [
        "arn:aws:s3:::${var.name_prefix}-*/*",
        "arn:aws:s3:::${var.name_prefix}-app-data-${var.region}/*",
        "arn:aws:s3:::${var.name_prefix}-alb-logs-${var.region}/*"
      ]
    }

    data_resource {
      type   = "AWS::DynamoDB::Table"
      values = ["arn:aws:dynamodb:${var.region}:${data.aws_caller_identity.current.account_id}:table/${var.name_prefix}-table-${var.region}"]
    }
  }

  kms_key_id = var.kms_key_id

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail.arn

  depends_on = [aws_s3_bucket_policy.cloudtrail]

  tags = {
    Name = "${var.name_prefix}-cloudtrail-${var.region}"
  }
}

resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.name_prefix}-${var.region}"
  retention_in_days = 30
}

resource "aws_iam_role" "cloudtrail" {
  name = "${var.name_prefix}-cloudtrail-role-${var.region}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "cloudtrail.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy" "cloudtrail" {
  name = "${var.name_prefix}-cloudtrail-policy-${var.region}"
  role = aws_iam_role.cloudtrail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ]
      Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
    }]
  })
}

resource "aws_sns_topic" "alarms" {
  name              = "${var.name_prefix}-alarms-${var.region}"
  kms_master_key_id = var.kms_key_id
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count     = var.alarm_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.name_prefix}-dashboard-${var.region}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "TargetResponseTime", { stat = "Average" }],
            [".", "RequestCount", { stat = "Sum" }],
            [".", "HTTPCode_Target_2XX_Count", { stat = "Sum" }],
            [".", "HTTPCode_Target_5XX_Count", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "ALB Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", { stat = "Average" }],
            [".", "NetworkIn", { stat = "Sum" }],
            [".", "NetworkOut", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "EC2 Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/RDS", "DatabaseConnections"],
            [".", "CPUUtilization"],
            [".", "FreeableMemory"],
            [".", "ReadIOPS"],
            [".", "WriteIOPS"]
          ]
          period = 300
          stat   = "Average"
          region = var.region
          title  = "RDS Metrics"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_hosts" {
  alarm_name          = "${var.name_prefix}-alb-unhealthy-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "Alert when ALB has unhealthy targets"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    LoadBalancer = var.alb_arn_suffix
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_cpu" {
  alarm_name          = "${var.name_prefix}-rds-cpu-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Alert when RDS CPU exceeds 80%"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }
}

resource "aws_cloudwatch_metric_alarm" "rds_storage" {
  alarm_name          = "${var.name_prefix}-rds-storage-${var.region}"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "FreeStorageSpace"
  namespace           = "AWS/RDS"
  period              = 300
  statistic           = "Average"
  threshold           = 10737418240
  alarm_description   = "Alert when RDS free storage is less than 10GB"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    DBInstanceIdentifier = var.rds_instance_id
  }
}

resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  alarm_name          = "${var.name_prefix}-dynamodb-throttles-${var.region}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert on DynamoDB throttling"
  alarm_actions       = [aws_sns_topic.alarms.arn]

  dimensions = {
    TableName = var.dynamodb_table_name
  }
}
```

#### `modules/monitoring/outputs.tf`
```hcl
output "cloudtrail_bucket" {
  value = aws_s3_bucket.cloudtrail.id
}

output "cloudtrail_arn" {
  value = aws_cloudtrail.main.arn
}

output "sns_topic_arn" {
  value = aws_sns_topic.alarms.arn
}

output "dashboard_url" {
  value = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}
```