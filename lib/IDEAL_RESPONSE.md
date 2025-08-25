```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "secure-infrastructure"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "regions" {
  description = "AWS regions to deploy resources"
  type        = list(string)
  default     = ["us-east-1", "us-west-2"]
}

variable "vpc_cidr_blocks" {
  description = "CIDR blocks for VPCs in each region"
  type        = map(string)
  default = {
    "us-east-1" = "10.0.0.0/16"
    "us-west-2" = "10.1.0.0/16"
  }
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
  default     = ["10.0.0.0/8"] # Restrict to internal networks only
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "admin"
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
  default     = null
}

# Generate a strong random password if not provided
resource "random_password" "db_password" {
  count   = var.db_password == null ? 1 : 0
  length  = 32
  special = true
  upper   = true
  lower   = true
  numeric = true
}

# Store the database password in SSM Parameter Store
resource "aws_ssm_parameter" "db_password_us_east_1" {
  provider = aws.us_east_1
  name     = "/${var.project_name}/${var.environment}/database/password"
  type     = "SecureString"
  value    = var.db_password != null ? var.db_password : random_password.db_password[0].result
  key_id   = aws_kms_key.main_us_east_1.arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-password"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "db_password_us_west_2" {
  provider = aws.us_west_2
  name     = "/${var.project_name}/${var.environment}/database/password"
  type     = "SecureString"
  value    = var.db_password != null ? var.db_password : random_password.db_password[0].result
  key_id   = aws_kms_key.main_us_west_2.arn

  tags = {
    Name        = "${var.project_name}-${var.environment}-db-password"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Data sources for latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_us_east_1" {
  provider    = aws.us_east_1
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "aws_ami" "amazon_linux_us_west_2" {
  provider    = aws.us_west_2
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# KMS Keys for encryption
resource "aws_kms_key" "main_us_east_1" {
  provider    = aws.us_east_1
  description = "KMS key for encryption in us-east-1"

  tags = {
    Name = "prod-kms-key-us-east-1"
  }
}

resource "aws_kms_alias" "main_us_east_1" {
  provider      = aws.us_east_1
  name          = "alias/prod-main-key-us-east-1"
  target_key_id = aws_kms_key.main_us_east_1.key_id
}

resource "aws_kms_key" "main_us_west_2" {
  provider    = aws.us_west_2
  description = "KMS key for encryption in us-west-2"

  tags = {
    Name = "prod-kms-key-us-west-2"
  }
}

resource "aws_kms_alias" "main_us_west_2" {
  provider      = aws.us_west_2
  name          = "alias/prod-main-key-us-west-2"
  target_key_id = aws_kms_key.main_us_west_2.key_id
}

# IAM Module
module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment
}

# VPC Module - US East 1
module "vpc_us_east_1" {
  source = "./modules/vpc"

  providers = {
    aws = aws.us_east_1
  }

  project_name       = var.project_name
  environment        = var.environment
  region             = "us-east-1"
  vpc_cidr           = var.vpc_cidr_blocks["us-east-1"]
  flow_logs_role_arn = module.iam.flow_logs_role_arn
}

# VPC Module - US West 2
module "vpc_us_west_2" {
  source = "./modules/vpc"

  providers = {
    aws = aws.us_west_2
  }

  project_name       = var.project_name
  environment        = var.environment
  region             = "us-west-2"
  vpc_cidr           = var.vpc_cidr_blocks["us-west-2"]
  flow_logs_role_arn = module.iam.flow_logs_role_arn
}

# CloudWatch Log Groups are now created in the VPC modules

# EC2 Module - US East 1
module "ec2_us_east_1" {
  source = "./modules/ec2"

  providers = {
    aws = aws.us_east_1
  }

  project_name          = var.project_name
  environment           = var.environment
  region                = "us-east-1"
  vpc_id                = module.vpc_us_east_1.vpc_id
  private_subnet_ids    = module.vpc_us_east_1.private_subnet_ids
  ami_id                = data.aws_ami.amazon_linux_us_east_1.id
  instance_profile_name = module.iam.ec2_instance_profile_name
  allowed_cidr_blocks   = var.allowed_cidr_blocks
}

# EC2 Module - US West 2
module "ec2_us_west_2" {
  source = "./modules/ec2"

  providers = {
    aws = aws.us_west_2
  }

  project_name          = var.project_name
  environment           = var.environment
  region                = "us-west-2"
  vpc_id                = module.vpc_us_west_2.vpc_id
  private_subnet_ids    = module.vpc_us_west_2.private_subnet_ids
  ami_id                = data.aws_ami.amazon_linux_us_west_2.id
  instance_profile_name = module.iam.ec2_instance_profile_name
  allowed_cidr_blocks   = var.allowed_cidr_blocks
}

# S3 Module
module "s3" {
  source = "./modules/s3"

  providers = {
    aws.us_east_1 = aws.us_east_1
    aws.us_west_2 = aws.us_west_2
  }

  project_name         = var.project_name
  environment          = var.environment
  kms_key_id_us_east_1 = aws_kms_key.main_us_east_1.arn
  kms_key_id_us_west_2 = aws_kms_key.main_us_west_2.arn
  db_password          = var.db_password != null ? var.db_password : random_password.db_password[0].result
}

# RDS Module - US East 1
module "rds_us_east_1" {
  source = "./modules/rds"

  providers = {
    aws = aws.us_east_1
  }

  project_name        = var.project_name
  environment         = var.environment
  region              = "us-east-1"
  vpc_id              = module.vpc_us_east_1.vpc_id
  private_subnet_ids  = module.vpc_us_east_1.private_subnet_ids
  kms_key_id          = aws_kms_key.main_us_east_1.arn
  db_username         = var.db_username
  db_password         = var.db_password != null ? var.db_password : random_password.db_password[0].result
  allowed_cidr_blocks = [var.vpc_cidr_blocks["us-east-1"]]
  monitoring_role_arn = module.iam.rds_monitoring_role_arn
}

# RDS Module - US West 2
module "rds_us_west_2" {
  source = "./modules/rds"

  providers = {
    aws = aws.us_west_2
  }

  project_name        = var.project_name
  environment         = var.environment
  region              = "us-west-2"
  vpc_id              = module.vpc_us_west_2.vpc_id
  private_subnet_ids  = module.vpc_us_west_2.private_subnet_ids
  kms_key_id          = aws_kms_key.main_us_west_2.arn
  db_username         = var.db_username
  db_password         = var.db_password != null ? var.db_password : random_password.db_password[0].result
  allowed_cidr_blocks = [var.vpc_cidr_blocks["us-west-2"]]
  monitoring_role_arn = module.iam.rds_monitoring_role_arn
}

# AWS Config Rules (disabled due to existing configuration recorders)
# resource "aws_config_config_rule" "s3_bucket_versioning_enabled" {
#   provider = aws.us_east_1
#   name     = "s3-bucket-versioning-enabled"
# 
#   source {
#     owner             = "AWS"
#     source_identifier = "S3_BUCKET_VERSIONING_ENABLED"
#   }
# 
#   depends_on = [aws_config_configuration_recorder.main_us_east_1]
# }
# 
# resource "aws_config_config_rule" "s3_bucket_server_side_encryption_enabled" {
#   provider = aws.us_east_1
#   name     = "s3-bucket-server-side-encryption-enabled"
# 
#   source {
#     owner             = "AWS"
#     source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
#   }
# 
#   depends_on = [aws_config_configuration_recorder.main_us_east_1]
# }
# 
# resource "aws_config_config_rule" "rds_storage_encrypted" {
#   provider = aws.us_east_1
#   name     = "rds-storage-encrypted"
# 
#   source {
#     owner             = "AWS"
#     source_identifier = "RDS_STORAGE_ENCRYPTED"
#   }
# 
#   depends_on = [aws_config_configuration_recorder.main_us_east_1]
# }
# 
# resource "aws_config_config_rule" "ec2_security_group_attached_to_eni" {
#   provider = aws.us_east_1
#   name     = "ec2-security-group-attached-to-eni"
# 
#   source {
#     owner             = "AWS"
#     source_identifier = "EC2_SECURITY_GROUP_ATTACHED_TO_ENI"
#   }
# 
#   depends_on = [aws_config_configuration_recorder.main_us_east_1]
# }

# AWS Config (disabled due to existing resources)
# resource "aws_config_configuration_recorder" "main_us_east_1" {
#   provider = aws.us_east_1
#   name     = "prod-config-recorder-us-east-1"
#   role_arn = module.iam.config_role_arn
# 
#   recording_group {
#     all_supported                 = true
#     include_global_resource_types = true
#   }
# }
# 
# resource "aws_config_delivery_channel" "main_us_east_1" {
#   provider       = aws.us_east_1
#   name           = "prod-config-delivery-channel-us-east-1"
#   s3_bucket_name = module.s3.config_bucket_us_east_1
# }
# 
# resource "aws_config_configuration_recorder" "main_us_west_2" {
#   provider = aws.us_west_2
#   name     = "prod-config-recorder-us-west-2"
#   role_arn = module.iam.config_role_arn
# 
#   recording_group {
#     all_supported = true
#   }
# }
# 
# resource "aws_config_delivery_channel" "main_us_west_2" {
#   provider       = aws.us_west_2
#   name           = "prod-config-delivery-channel-us-west-2"
#   s3_bucket_name = module.s3.config_bucket_us_west_2
# }

# CloudTrail (disabled due to existing trails limit)
# resource "aws_cloudtrail" "main" {
#   provider = aws.us_east_1
#   name     = "prod-cloudtrail"
# 
#   s3_bucket_name = module.s3.cloudtrail_bucket_name
# 
#   event_selector {
#     read_write_type                  = "All"
#     include_management_events        = true
#     exclude_management_event_sources = []
# 
#     data_resource {
#       type   = "AWS::S3::Object"
#       values = ["arn:aws:s3:::*/*"]
#     }
#   }
# 
#   is_multi_region_trail = true
#   enable_logging        = true
# 
#   tags = {
#     Name = "prod-cloudtrail"
#   }
# }

# AWS Shield Advanced (Note: This requires manual subscription)
# Shield Standard is automatically enabled for all AWS resources

# Account Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  allow_users_to_change_password = true
  max_password_age               = 90
  password_reuse_prevention      = 12
}

# VPC Outputs
output "vpc_ids" {
  description = "IDs of the VPCs"
  value = {
    us_east_1 = module.vpc_us_east_1.vpc_id
    us_west_2 = module.vpc_us_west_2.vpc_id
  }
}

output "private_subnet_ids" {
  description = "IDs of private subnets"
  value = {
    us_east_1 = module.vpc_us_east_1.private_subnet_ids
    us_west_2 = module.vpc_us_west_2.private_subnet_ids
  }
}

# S3 Outputs
output "s3_buckets" {
  description = "Names of S3 buckets"
  value = {
    app_data_us_east_1 = module.s3.app_data_bucket_us_east_1
    app_data_us_west_2 = module.s3.app_data_bucket_us_west_2
    cloudtrail         = module.s3.cloudtrail_bucket_name
    config_us_east_1   = module.s3.config_bucket_us_east_1
    config_us_west_2   = module.s3.config_bucket_us_west_2
  }
}

# RDS Outputs
output "rds_endpoints" {
  description = "RDS instance endpoints"
  value = {
    us_east_1 = module.rds_us_east_1.db_instance_endpoint
    us_west_2 = module.rds_us_west_2.db_instance_endpoint
  }
  sensitive = true
}

# KMS Key Outputs
output "kms_key_ids" {
  description = "KMS key IDs"
  value = {
    us_east_1 = aws_kms_key.main_us_east_1.key_id
    us_west_2 = aws_kms_key.main_us_west_2.key_id
  }
}

# IAM Outputs
output "iam_roles" {
  description = "IAM role ARNs"
  value = {
    ec2_role            = module.iam.ec2_role_arn
    config_role         = module.iam.config_role_arn
    flow_logs_role      = module.iam.flow_logs_role_arn
    rds_monitoring_role = module.iam.rds_monitoring_role_arn
  }
}

# CloudTrail Output (disabled)
# output "cloudtrail_arn" {
#   description = "CloudTrail ARN"
#   value       = aws_cloudtrail.main.arn
# }

# SSM Parameter Outputs
output "ssm_db_password_parameters" {
  description = "SSM parameter names for database password"
  value = {
    us_east_1 = aws_ssm_parameter.db_password_us_east_1.name
    us_west_2 = aws_ssm_parameter.db_password_us_west_2.name
  }
}

output "db_password_generated" {
  description = "Indicates if database password was auto-generated"
  value       = var.db_password == null
  sensitive   = true
}

```