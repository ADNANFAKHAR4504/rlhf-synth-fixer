```hcl
#terraform.tfvars
project_name = "secure-infrastructure"
environment  = "production"

regions = ["us-east-1", "us-west-2"]

vpc_cidr_blocks = {
  "us-east-1" = "10.0.0.0/16"
  "us-west-2" = "10.1.0.0/16"
}

# Restrict SSH access to internal networks only
allowed_cidr_blocks = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"]

db_username = "admin"
# db_password should be set via environment variable: TF_VAR_db_password
```

```hcl
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
    ec2_role           = module.iam.ec2_role_arn
    config_role        = module.iam.config_role_arn
    flow_logs_role     = module.iam.flow_logs_role_arn
    rds_monitoring_role = module.iam.rds_monitoring_role_arn
  }
}

# CloudTrail Output
output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}
```

```hcl
# Updated VPC modules with flow logs configuration
module "vpc_us_east_1" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.us_east_1
  }
  
  project_name           = var.project_name
  environment            = var.environment
  region                 = "us-east-1"
  vpc_cidr              = var.vpc_cidr_blocks["us-east-1"]
  flow_logs_role_arn    = module.iam.flow_logs_role_arn
  flow_logs_destination = aws_cloudwatch_log_group.vpc_flow_logs_us_east_1.arn
}

module "vpc_us_west_2" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.us_west_2
  }
  
  project_name           = var.project_name
  environment            = var.environment
  region                 = "us-west-2"
  vpc_cidr              = var.vpc_cidr_blocks["us-west-2"]
  flow_logs_role_arn    = module.iam.flow_logs_role_arn
  flow_logs_destination = aws_cloudwatch_log_group.vpc_flow_logs_us_west_2.arn
}

# CloudWatch Log Groups for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs_us_east_1" {
  provider          = aws.us_east_1
  name              = "/aws/vpc/flowlogs-us-east-1"
  retention_in_days = 30

  tags = {
    Name = "prod-vpc-flow-logs-us-east-1"
  }
}

resource "aws_cloudwatch_log_group" "vpc_flow_logs_us_west_2" {
  provider          = aws.us_west_2
  name              = "/aws/vpc/flowlogs-us-west-2"
  retention_in_days = 30

  tags = {
    Name = "prod-vpc-flow-logs-us-west-2"
  }
}

# Updated RDS modules with monitoring role
module "rds_us_east_1" {
  source = "./modules/rds"
  
  providers = {
    aws = aws.us_east_1
  }
  
  project_name         = var.project_name
  environment          = var.environment
  region               = "us-east-1"
  vpc_id               = module.vpc_us_east_1.vpc_id
  private_subnet_ids   = module.vpc_us_east_1.private_subnet_ids
  kms_key_id           = aws_kms_key.main_us_east_1.arn
  db_username          = var.db_username
  db_password          = var.db_password
  allowed_cidr_blocks  = [var.vpc_cidr_blocks["us-east-1"]]
  monitoring_role_arn  = module.iam.rds_monitoring_role_arn
}

module "rds_us_west_2" {
  source = "./modules/rds"
  
  providers = {
    aws = aws.us_west_2
  }
  
  project_name         = var.project_name
  environment          = var.environment
  region               = "us-west-2"
  vpc_id               = module.vpc_us_west_2.vpc_id
  private_subnet_ids   = module.vpc_us_west_2.private_subnet_ids
  kms_key_id           = aws_kms_key.main_us_west_2.arn
  db_username          = var.db_username
  db_password          = var.db_password
  allowed_cidr_blocks  = [var.vpc_cidr_blocks["us-west-2"]]
  monitoring_role_arn  = module.iam.rds_monitoring_role_arn
}

# AWS Config Rules for compliance
resource "aws_config_config_rule" "s3_bucket_versioning_enabled" {
  provider = aws.us_east_1
  name     = "s3-bucket-versioning-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_VERSIONING_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main_us_east_1]
}

resource "aws_config_config_rule" "s3_bucket_server_side_encryption_enabled" {
  provider = aws.us_east_1
  name     = "s3-bucket-server-side-encryption-enabled"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
  }

  depends_on = [aws_config_configuration_recorder.main_us_east_1]
}

resource "aws_config_config_rule" "rds_storage_encrypted" {
  provider = aws.us_east_1
  name     = "rds-storage-encrypted"

  source {
    owner             = "AWS"
    source_identifier = "RDS_STORAGE_ENCRYPTED"
  }

  depends_on = [aws_config_configuration_recorder.main_us_east_1]
}

resource "aws_config_config_rule" "ec2_security_group_attached_to_eni" {
  provider = aws.us_east_1
  name     = "ec2-security-group-attached-to-eni"

  source {
    owner             = "AWS"
    source_identifier = "EC2_SECURITY_GROUP_ATTACHED_TO_ENI"
  }

  depends_on = [aws_config_configuration_recorder.main_us_east_1]
}
```

```hcl
output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}

output "ec2_role_arn" {
  description = "ARN of the EC2 IAM role"
  value       = aws_iam_role.ec2_role.arn
}

output "config_role_arn" {
  description = "ARN of the Config IAM role"
  value       = aws_iam_role.config_role.arn
}

output "flow_logs_role_arn" {
  description = "ARN of the VPC Flow Logs IAM role"
  value       = aws_iam_role.flow_logs_role.arn
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS monitoring IAM role"
  value       = aws_iam_role.rds_monitoring_role.arn
}

output "terraform_state_bucket" {
  description = "Name of the Terraform state S3 bucket"
  value       = aws_s3_bucket.terraform_state.bucket
}
```

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}
```

```hcl
# EC2 Instance Role
resource "aws_iam_role" "ec2_role" {
  name = "prod-ec2-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "prod-ec2-role"
  }
}

resource "aws_iam_role_policy" "ec2_policy" {
  name = "prod-ec2-policy"
  role = aws_iam_role.ec2_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "ec2:DescribeVolumes",
          "ec2:DescribeTags",
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject"
        ]
        Resource = [
          "arn:aws:s3:::prod-app-data-*/*"
        ]
      }
    ]
  })
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "prod-ec2-profile"
  role = aws_iam_role.ec2_role.name

  tags = {
    Name = "prod-ec2-profile"
  }
}

# AWS Config Role
resource "aws_iam_role" "config_role" {
  name = "prod-config-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "prod-config-role"
  }
}

resource "aws_iam_role_policy_attachment" "config_role_policy" {
  role       = aws_iam_role.config_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/ConfigRole"
}

# VPC Flow Logs Role
resource "aws_iam_role" "flow_logs_role" {
  name = "prod-flow-logs-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "vpc-flow-logs.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "prod-flow-logs-role"
  }
}

resource "aws_iam_role_policy" "flow_logs_policy" {
  name = "prod-flow-logs-policy"
  role = aws_iam_role.flow_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

# RDS Enhanced Monitoring Role
resource "aws_iam_role" "rds_monitoring_role" {
  name = "prod-rds-monitoring-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "prod-rds-monitoring-role"
  }
}

resource "aws_iam_role_policy_attachment" "rds_monitoring_role_policy" {
  role       = aws_iam_role.rds_monitoring_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# Terraform Backend Resources
resource "aws_s3_bucket" "terraform_state" {
  bucket = "prod-terraform-state-bucket-${random_id.state_suffix.hex}"

  tags = {
    Name = "prod-terraform-state-bucket"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_dynamodb_table" "terraform_state_lock" {
  name           = "prod-terraform-state-lock"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  tags = {
    Name = "prod-terraform-state-lock"
  }

  lifecycle {
    prevent_destroy = true
  }
}

resource "random_id" "state_suffix" {
  byte_length = 4
}
```

```hcl
output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}
```

```hcl
output "db_instance_id" {
  description = "RDS instance ID"
  value       = aws_db_instance.main.id
}

output "db_instance_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_instance_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "db_security_group_id" {
  description = "Security group ID for RDS"
  value       = aws_security_group.rds.id
}
```

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
}

variable "db_username" {
  description = "Database master username"
  type        = string
  sensitive   = true
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for database access"
  type        = list(string)
}

variable "monitoring_role_arn" {
  description = "IAM role ARN for RDS enhanced monitoring"
  type        = string
  default     = ""
}
```

```hcl
resource "aws_db_subnet_group" "main" {
  name       = "prod-db-subnet-group-${var.region}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "prod-db-subnet-group-${var.region}"
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "prod-rds-sg-${var.region}-"
  vpc_id      = var.vpc_id

  ingress {
    description = "MySQL/Aurora"
    from_port   = 3306
    to_port     = 3306
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "prod-rds-sg-${var.region}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_db_parameter_group" "main" {
  family = "mysql8.0"
  name   = "prod-db-params-${var.region}"

  parameter {
    name  = "innodb_buffer_pool_size"
    value = "{DBInstanceClassMemory*3/4}"
  }

  parameter {
    name  = "slow_query_log"
    value = "1"
  }

  parameter {
    name  = "long_query_time"
    value = "2"
  }

  tags = {
    Name = "prod-db-params-${var.region}"
  }
}

resource "aws_db_instance" "main" {
  identifier     = "prod-database-${var.region}"
  engine         = "mysql"
  engine_version = "8.0.35"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  kms_key_id           = var.kms_key_id

  db_name  = "proddb"
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  parameter_group_name   = aws_db_parameter_group.main.name

  # Multi-AZ deployment for high availability
  multi_az = true

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # Security settings
  deletion_protection = true
  skip_final_snapshot = false
  final_snapshot_identifier = "prod-database-${var.region}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = var.monitoring_role_arn
  enabled_cloudwatch_logs_exports = ["error", "general", "slow_query"]

  # Performance Insights
  performance_insights_enabled = true
  performance_insights_retention_period = 7

  tags = {
    Name = "prod-database-${var.region}"
  }

  lifecycle {
    ignore_changes = [
      final_snapshot_identifier,
      password
    ]
  }
}

# CloudWatch Log Groups for RDS logs
resource "aws_cloudwatch_log_group" "rds_error" {
  name              = "/aws/rds/instance/prod-database-${var.region}/error"
  retention_in_days = 30

  tags = {
    Name = "prod-rds-error-logs-${var.region}"
  }
}

resource "aws_cloudwatch_log_group" "rds_general" {
  name              = "/aws/rds/instance/prod-database-${var.region}/general"
  retention_in_days = 7

  tags = {
    Name = "prod-rds-general-logs-${var.region}"
  }
}

resource "aws_cloudwatch_log_group" "rds_slow_query" {
  name              = "/aws/rds/instance/prod-database-${var.region}/slowquery"
  retention_in_days = 30

  tags = {
    Name = "prod-rds-slow-query-logs-${var.region}"
  }
}
```

```hcl
output "app_data_bucket_us_east_1" {
  description = "Name of the application data bucket in us-east-1"
  value       = aws_s3_bucket.app_data_us_east_1.bucket
}

output "app_data_bucket_us_west_2" {
  description = "Name of the application data bucket in us-west-2"
  value       = aws_s3_bucket.app_data_us_west_2.bucket
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail S3 bucket"
  value       = aws_s3_bucket.cloudtrail.bucket
}

output "config_bucket_us_east_1" {
  description = "Name of the Config S3 bucket in us-east-1"
  value       = aws_s3_bucket.config_us_east_1.bucket
}

output "config_bucket_us_west_2" {
  description = "Name of the Config S3 bucket in us-west-2"
  value       = aws_s3_bucket.config_us_west_2.bucket
}
```

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "kms_key_id_us_east_1" {
  description = "KMS key ID for encryption in us-east-1"
  type        = string
}

variable "kms_key_id_us_west_2" {
  description = "KMS key ID for encryption in us-west-2"
  type        = string
}
```

```hcl
# AWS Config S3 Buckets (continued from previous)
resource "aws_s3_bucket" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = "prod-config-logs-us-east-1-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "prod-config-logs-us-east-1"
  }
}

resource "aws_s3_bucket_versioning" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "config_us_east_1" {
  provider = aws.us_east_1
  bucket   = aws_s3_bucket.config_us_east_1.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_us_east_1.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_us_east_1.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_us_east_1.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = "prod-config-logs-us-west-2-${random_id.bucket_suffix.hex}"

  tags = {
    Name = "prod-config-logs-us-west-2"
  }
}

resource "aws_s3_bucket_versioning" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.config_us_west_2.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.config_us_west_2.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_policy" "config_us_west_2" {
  provider = aws.us_west_2
  bucket   = aws_s3_bucket.config_us_west_2.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSConfigBucketPermissionsCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.config_us_west_2.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketExistenceCheck"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:ListBucket"
        Resource = aws_s3_bucket.config_us_west_2.arn
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      },
      {
        Sid    = "AWSConfigBucketDelivery"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.config_us_west_2.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

# Random ID for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
```

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of the private subnets"
  type        = list(string)
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
}

variable "instance_profile_name" {
  description = "Name of the IAM instance profile"
  type        = string
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed for SSH access"
  type        = list(string)
}
```

```hcl
resource "aws_security_group" "ec2" {
  name_prefix = "prod-ec2-sg-${var.region}-"
  vpc_id      = var.vpc_id

  # SSH access from allowed CIDR blocks only
  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.allowed_cidr_blocks
  }

  # HTTP access from VPC only
  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  # HTTPS access from VPC only
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.main.cidr_block]
  }

  egress {
    description = "All outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "prod-ec2-sg-${var.region}"
  }

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_vpc" "main" {
  id = var.vpc_id
}

resource "aws_launch_template" "main" {
  name_prefix   = "prod-launch-template-${var.region}-"
  image_id      = var.ami_id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.ec2.id]

  iam_instance_profile {
    name = var.instance_profile_name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type          = "gp3"
      encrypted            = true
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint = "enabled"
    http_tokens   = "required"
    http_put_response_hop_limit = 1
  }

  monitoring {
    enabled = true
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-cloudwatch-agent
    
    # Configure CloudWatch agent
    cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOL'
    {
      "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
          "cpu": {
            "measurement": [
              "cpu_usage_idle",
              "cpu_usage_iowait",
              "cpu_usage_user",
              "cpu_usage_system"
            ],
            "metrics_collection_interval": 60
          },
          "disk": {
            "measurement": [
              "used_percent"
            ],
            "metrics_collection_interval": 60,
            "resources": [
              "*"
            ]
          },
          "mem": {
            "measurement": [
              "mem_used_percent"
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
                "log_group_name": "/aws/ec2/var/log/messages",
                "log_stream_name": "{instance_id}"
              }
            ]
          }
        }
      }
    }
    EOL
    
    # Start CloudWatch agent
    /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
      -a fetch-config \
      -m ec2 \
      -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
      -s
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "prod-ec2-instance-${var.region}"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "main" {
  name                = "prod-asg-${var.region}"
  vpc_zone_identifier = var.private_subnet_ids
  target_group_arns   = []
  health_check_type   = "EC2"
  health_check_grace_period = 300

  min_size         = 1
  max_size         = 3
  desired_capacity = 2

  launch_template {
    id      = aws_launch_template.main.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "prod-asg-instance-${var.region}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = var.environment
    propagate_at_launch = true
  }

  tag {
    key                 = "Project"
    value               = var.project_name
    propagate_at_launch = true
  }
}
```

```hcl
output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}
```

```hcl
variable "project_name" {
  description = "Name of the project"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
}

variable "flow_logs_role_arn" {
  description = "IAM role ARN for VPC Flow Logs"
  type        = string
  default     = ""
}

variable "flow_logs_destination" {
  description = "Destination for VPC Flow Logs"
  type        = string
  default     = ""
}
```

```hcl
data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "prod-vpc-${var.region}"
  }
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "prod-igw-${var.region}"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true

  tags = {
    Name = "prod-public-subnet-${count.index + 1}-${var.region}"
    Type = "Public"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "prod-private-subnet-${count.index + 1}-${var.region}"
    Type = "Private"
  }
}

resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name = "prod-nat-eip-${count.index + 1}-${var.region}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "prod-nat-gateway-${count.index + 1}-${var.region}"
  }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "prod-public-rt-${var.region}"
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name = "prod-private-rt-${count.index + 1}-${var.region}"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# VPC Flow Logs
resource "aws_flow_log" "vpc_flow_log" {
  iam_role_arn    = var.flow_logs_role_arn
  log_destination = var.flow_logs_destination
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = {
    Name = "prod-vpc-flow-logs-${var.region}"
  }
}

# CloudWatch Log Group for VPC Flow Logs
resource "aws_cloudwatch_log_group" "vpc_flow_logs" {
  name              = "/aws/vpc/flowlogs-${var.region}"
  retention_in_days = 30

  tags = {
    Name = "prod-vpc-flow-logs-${var.region}"
  }
}
```

```hcl
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
  
  project_name = var.project_name
  environment  = var.environment
  region       = "us-east-1"
  vpc_cidr     = var.vpc_cidr_blocks["us-east-1"]
}

# VPC Module - US West 2
module "vpc_us_west_2" {
  source = "./modules/vpc"
  
  providers = {
    aws = aws.us_west_2
  }
  
  project_name = var.project_name
  environment  = var.environment
  region       = "us-west-2"
  vpc_cidr     = var.vpc_cidr_blocks["us-west-2"]
}

# EC2 Module - US East 1
module "ec2_us_east_1" {
  source = "./modules/ec2"
  
  providers = {
    aws = aws.us_east_1
  }
  
  project_name         = var.project_name
  environment          = var.environment
  region               = "us-east-1"
  vpc_id               = module.vpc_us_east_1.vpc_id
  private_subnet_ids   = module.vpc_us_east_1.private_subnet_ids
  ami_id               = data.aws_ami.amazon_linux_us_east_1.id
  instance_profile_name = module.iam.ec2_instance_profile_name
  allowed_cidr_blocks  = var.allowed_cidr_blocks
}

# EC2 Module - US West 2
module "ec2_us_west_2" {
  source = "./modules/ec2"
  
  providers = {
    aws = aws.us_west_2
  }
  
  project_name         = var.project_name
  environment          = var.environment
  region               = "us-west-2"
  vpc_id               = module.vpc_us_west_2.vpc_id
  private_subnet_ids   = module.vpc_us_west_2.private_subnet_ids
  ami_id               = data.aws_ami.amazon_linux_us_west_2.id
  instance_profile_name = module.iam.ec2_instance_profile_name
  allowed_cidr_blocks  = var.allowed_cidr_blocks
}

# S3 Module
module "s3" {
  source = "./modules/s3"
  
  providers = {
    aws.us_east_1 = aws.us_east_1
    aws.us_west_2 = aws.us_west_2
  }
  
  project_name = var.project_name
  environment  = var.environment
  kms_key_id_us_east_1 = aws_kms_key.main_us_east_1.arn
  kms_key_id_us_west_2 = aws_kms_key.main_us_west_2.arn
}

# RDS Module - US East 1
module "rds_us_east_1" {
  source = "./modules/rds"
  
  providers = {
    aws = aws.us_east_1
  }
  
  project_name       = var.project_name
  environment        = var.environment
  region             = "us-east-1"
  vpc_id             = module.vpc_us_east_1.vpc_id
  private_subnet_ids = module.vpc_us_east_1.private_subnet_ids
  kms_key_id         = aws_kms_key.main_us_east_1.arn
  db_username        = var.db_username
  db_password        = var.db_password
  allowed_cidr_blocks = [var.vpc_cidr_blocks["us-east-1"]]
}

# RDS Module - US West 2
module "rds_us_west_2" {
  source = "./modules/rds"
  
  providers = {
    aws = aws.us_west_2
  }
  
  project_name       = var.project_name
  environment        = var.environment
  region             = "us-west-2"
  vpc_id             = module.vpc_us_west_2.vpc_id
  private_subnet_ids = module.vpc_us_west_2.private_subnet_ids
  kms_key_id         = aws_kms_key.main_us_west_2.arn
  db_username        = var.db_username
  db_password        = var.db_password
  allowed_cidr_blocks = [var.vpc_cidr_blocks["us-west-2"]]
}

# AWS Config
resource "aws_config_configuration_recorder" "main_us_east_1" {
  provider = aws.us_east_1
  name     = "prod-config-recorder-us-east-1"
  role_arn = module.iam.config_role_arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
}

resource "aws_config_delivery_channel" "main_us_east_1" {
  provider       = aws.us_east_1
  name           = "prod-config-delivery-channel-us-east-1"
  s3_bucket_name = module.s3.config_bucket_us_east_1
}

resource "aws_config_configuration_recorder" "main_us_west_2" {
  provider = aws.us_west_2
  name     = "prod-config-recorder-us-west-2"
  role_arn = module.iam.config_role_arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main_us_west_2" {
  provider       = aws.us_west_2
  name           = "prod-config-delivery-channel-us-west-2"
  s3_bucket_name = module.s3.config_bucket_us_west_2
}

# CloudTrail
resource "aws_cloudtrail" "main" {
  provider = aws.us_east_1
  name     = "prod-cloudtrail"
  
  s3_bucket_name = module.s3.cloudtrail_bucket_name
  
  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::*/*"]
    }
  }
  
  is_multi_region_trail = true
  enable_logging        = true
  
  tags = {
    Name = "prod-cloudtrail"
  }
}

# AWS Shield Advanced (Note: This requires manual subscription)
# Shield Standard is automatically enabled for all AWS resources

# Account Password Policy
resource "aws_iam_account_password_policy" "strict" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers               = true
  require_uppercase_characters   = true
  require_symbols               = true
  allow_users_to_change_password = true
  max_password_age              = 90
  password_reuse_prevention     = 12
}
```

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
}
```

```hcl

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  backend "s3" {
    bucket         = "prod-terraform-state-bucket"
    key            = "infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "prod-terraform-state-lock"
    encrypt        = true
  }
}

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
  
  default_tags {
    tags = {
      Environment = "production"
      Project     = "secure-infrastructure"
      ManagedBy   = "terraform"
    }
  }
}

provider "aws" {
  alias  = "us_west_2"
  region = "us-west-2"
  
  default_tags {
    tags = {
      Environment = "production"
      Project     = "secure-infrastructure"
      ManagedBy   = "terraform"
    }
  }
}
```
