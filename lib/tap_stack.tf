# main.tf

########################################
# 3. Data Sources
########################################
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

########################################
# 4. Resources
########################################

# --- Networking ---
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = merge(local.tags, {
    Name = "${var.project_name}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${var.project_name}-igw" })
}

resource "aws_subnet" "public" {
  count                   = length(var.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true
  tags = merge(local.tags, {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public"
  })
}

resource "aws_subnet" "private" {
  count             = length(var.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]
  tags = merge(local.tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "private"
  })
}

# --- Route Tables ---
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.tags, { Name = "${var.project_name}-public-rt" })
}

resource "aws_route_table" "private" {
  count  = length(aws_subnet.private)
  vpc_id = aws_vpc.main.id
  tags   = merge(local.tags, { Name = "${var.project_name}-private-rt-${count.index + 1}" })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# --- Security Groups ---
resource "aws_security_group" "web" {
  name_prefix = "${var.project_name}-web-"
  vpc_id      = aws_vpc.main.id
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
  tags = merge(local.tags, { Name = "${var.project_name}-web-sg" })
}

resource "aws_security_group" "app" {
  name_prefix = "${var.project_name}-app-"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.web.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = merge(local.tags, { Name = "${var.project_name}-app-sg" })
}

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-db-"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }
  tags = merge(local.tags, { Name = "${var.project_name}-db-sg" })
}

# --- Load Balancer ---
resource "aws_lb" "main" {
  name                       = "${var.project_name}-alb"
  internal                   = false
  load_balancer_type         = "application"
  security_groups            = [aws_security_group.web.id]
  subnets                    = aws_subnet.public[*].id
  enable_deletion_protection = var.enable_deletion_protection
  tags                       = merge(local.tags, { Name = "${var.project_name}-alb" })
}

resource "aws_lb_target_group" "app" {
  name     = "${var.project_name}-app-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }
  tags = merge(local.tags, { Name = "${var.project_name}-app-tg" })
}

resource "aws_lb_listener" "app" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# --- Launch Template & ASG ---
resource "aws_launch_template" "app" {
  name_prefix            = "${var.project_name}-app-"
  image_id               = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_pair_name
  vpc_security_group_ids = [aws_security_group.app.id]
  user_data              = base64encode(var.user_data_script)
  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.tags, { Name = "${var.project_name}-app-instance" })
  }
  tags = merge(local.tags, { Name = "${var.project_name}-app-lt" })
}

resource "aws_autoscaling_group" "app" {
  name                      = "${var.project_name}-app-asg"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.app.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = var.asg_min_size
  max_size                  = var.asg_max_size
  desired_capacity          = var.asg_desired_capacity
  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }
  tag {
    key                 = "Name"
    value               = "${var.project_name}-app-asg"
    propagate_at_launch = false
  }
}

# --- Database ---
resource "aws_db_subnet_group" "main" {
  name       = "${var.project_name}-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id
  tags       = merge(local.tags, { Name = "${var.project_name}-db-subnet-group" })
}

resource "aws_db_instance" "main" {
  identifier              = "${var.project_name}-database"
  engine                  = "mysql"
  engine_version          = var.db_engine_version
  instance_class          = var.db_instance_class
  allocated_storage       = var.db_allocated_storage
  max_allocated_storage   = var.db_max_allocated_storage
  storage_type            = "gp2"
  storage_encrypted       = true
  db_name                 = var.db_name
  username                = var.db_username
  password                = var.db_password
  vpc_security_group_ids  = [aws_security_group.database.id]
  db_subnet_group_name    = aws_db_subnet_group.main.name
  backup_retention_period = var.db_backup_retention_period
  backup_window           = var.db_backup_window
  maintenance_window      = var.db_maintenance_window
  skip_final_snapshot     = var.skip_final_snapshot
  deletion_protection     = var.enable_deletion_protection
  tags                    = merge(local.tags, { Name = "${var.project_name}-database" })
}

# --- S3 Bucket ---
resource "aws_s3_bucket" "main" {
  bucket        = "${var.project_name}-bucket-${var.environment}"
  force_destroy = true

  tags = merge(local.tags, {
    Name = "${var.project_name}-bucket"
  })
}

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.main.bucket
}

output "bucket_tags" {
  description = "Tags applied to the S3 bucket"
  value       = aws_s3_bucket.main.tags
}

########################################
# 5. Variables
########################################
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "myapp"
}

variable "migration_date" {
  description = "Date of migration for tagging"
  type        = string
  default     = "2024-01-15"
}

variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16" # <-- Change if you need a different range
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24"]
}

variable "ami_id" {
  description = "AMI ID for EC2 instances"
  type        = string
  default     = "ami-0c02fb55956c7d316"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.medium"
}

variable "key_pair_name" {
  description = "EC2 Key Pair name"
  type        = string
  default     = "myapp-keypair"
}

variable "user_data_script" {
  description = "User data script for EC2 instances"
  type        = string
  default     = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y docker
    service docker start
    usermod -a -G docker ec2-user
    # Add your application startup commands here
  EOF
}

variable "asg_min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "asg_max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
  default     = 6
}

variable "asg_desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "db_engine_version" {
  description = "RDS engine version"
  type        = string
  default     = "8.0.35"
}

variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "RDS allocated storage in GB"
  type        = number
  default     = 20
}

variable "db_max_allocated_storage" {
  description = "RDS maximum allocated storage in GB"
  type        = number
  default     = 100
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "myappdb"
}

variable "db_username" {
  description = "Database username"
  type        = string
  sensitive   = true
  default     = "admin"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
  default     = "devpassword123!" # <-- Only for dev, remove for prod!
}

variable "db_backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
}

variable "db_backup_window" {
  description = "Database backup window"
  type        = string
  default     = "03:00-04:00"
}

variable "db_maintenance_window" {
  description = "Database maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
}

variable "enable_deletion_protection" {
  description = "Enable deletion protection for critical resources"
  type        = bool
  default     = true
}

variable "skip_final_snapshot" {
  description = "Skip final snapshot when destroying RDS instance"
  type        = bool
  default     = false
}

locals {
  base_tags = {
    Owner     = "sivav-cmd"
    ManagedBy = "terraform"
  }

  common_tags = merge(local.base_tags, {
    Project     = var.project_name
    Environment = var.environment
    Migration   = var.migration_date
  })

  tags = merge(local.common_tags, {
    # Additional tags can be added here if needed
  })
}


output "vpc_id" {
  description = "The ID of the VPC"
  value       = aws_vpc.main.id
}


output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "s3_bucket_name" {
  value       = aws_s3_bucket.main.bucket
  description = "Primary S3 bucket name for this stack"
}

output "availability_zones" {
  description = "List of availability zones"
  value       = data.aws_availability_zones.available.names
}

output "public_subnet_ids" {
  description = "List of public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "List of private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_route_table_id" {
  description = "Route table ID for public subnets"
  value       = aws_route_table.public.id
}

output "private_route_table_ids" {
  description = "List of private route table IDs"
  value       = aws_route_table.private[*].id
}

output "web_security_group_id" {
  description = "Security group ID for web access"
  value       = aws_security_group.web.id
}

output "app_security_group_id" {
  description = "Security group ID for app access"
  value       = aws_security_group.app.id
}

output "database_security_group_id" {
  description = "Security group ID for database access"
  value       = aws_security_group.database.id
}

output "alb_arn" {
  description = "ARN of the Application Load Balancer"
  value       = aws_lb.main.arn
}

output "app_target_group_arn" {
  description = "ARN of the target group for the app"
  value       = aws_lb_target_group.app.arn
}

output "app_launch_template_id" {
  description = "ID of the launch template for the app"
  value       = aws_launch_template.app.id
}

output "app_autoscaling_group_id" {
  description = "ID of the Auto Scaling group for the app"
  value       = aws_autoscaling_group.app.id
}

output "db_subnet_group_name" {
  description = "Name of the DB subnet group"
  value       = aws_db_subnet_group.main.name
}

output "db_instance_endpoint" {
  description = "Endpoint of the database instance"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "db_instance_id" {
  description = "ID of the database instance"
  value       = aws_db_instance.main.id
}

output "db_instance_arn" {
  description = "ARN of the database instance"
  value       = aws_db_instance.main.arn
}

output "db_instance_port" {
  description = "Port of the database instance"
  value       = aws_db_instance.main.port
}

output "db_instance_engine" {
  description = "Database engine"
  value       = aws_db_instance.main.engine
}

output "db_instance_engine_version" {
  description = "Database engine version"
  value       = aws_db_instance.main.engine_version
}

output "db_instance_class" {
  description = "Database instance class"
  value       = aws_db_instance.main.instance_class
}

output "db_allocated_storage" {
  description = "Allocated storage for the database instance (GB)"
  value       = aws_db_instance.main.allocated_storage
}

output "db_max_allocated_storage" {
  description = "Max allocated storage for the database instance (GB)"
  value       = aws_db_instance.main.max_allocated_storage
}

output "db_backup_retention_period" {
  description = "Backup retention period for the database (days)"
  value       = aws_db_instance.main.backup_retention_period
}

output "db_backup_window" {
  description = "Backup window for the database"
  value       = aws_db_instance.main.backup_window
}

output "db_maintenance_window" {
  description = "Database maintenance window"
  value       = aws_db_instance.main.maintenance_window
}

output "db_instance_status" {
  description = "Status of the database instance"
  value       = aws_db_instance.main.status
}

output "db_instance_storage_encrypted" {
  description = "Indicates if storage is encrypted for the database instance"
  value       = aws_db_instance.main.storage_encrypted
}

output "db_instance_kms_key_id" {
  description = "KMS key ID for encryption of the database instance"
  value       = aws_db_instance.main.kms_key_id
}

output "db_instance_iops" {
  description = "IOPS for the database instance (if provisioned IOPS storage is used)"
  value       = aws_db_instance.main.iops
}

output "db_instance_publicly_accessible" {
  description = "Whether the database instance is publicly accessible"
  value       = aws_db_instance.main.publicly_accessible
}

output "db_instance_multi_az" {
  description = "Whether the database instance is multi-AZ"
  value       = aws_db_instance.main.multi_az
}

output "db_instance_vpc_security_group_ids" {
  description = "VPC security group IDs attached to the database instance"
  value       = aws_db_instance.main.vpc_security_group_ids
}

output "db_instance_db_subnet_group_name" {
  description = "DB subnet group name"
  value       = aws_db_instance.main.db_subnet_group_name
}

output "db_instance_identifier" {
  description = "Database instance identifier"
  value       = aws_db_instance.main.identifier
}

output "db_instance_resource_id" {
  description = "Resource ID of the database instance"
  value       = aws_db_instance.main.resource_id
}
output "db_instance_username" {
  description = "Master username for the database instance"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "db_instance_db_name" {
  description = "Database name"
  value       = aws_db_instance.main.db_name
}

output "db_instance_ca_cert_identifier" {
  description = "CA certificate identifier"
  value       = aws_db_instance.main.ca_cert_identifier
}

output "db_instance_license_model" {
  description = "License model of the database instance"
  value       = aws_db_instance.main.license_model
}

output "db_instance_parameter_group" {
  description = "Parameter group name"
  value       = aws_db_instance.main.parameter_group_name
}

output "db_instance_option_group" {
  description = "Option group name"
  value       = aws_db_instance.main.option_group_name
}

output "db_instance_secondary_availability_zone" {
  description = "Secondary availability zone"
  value       = aws_db_instance.main.multi_az
}

output "db_instance_apply_immediately" {
  description = "Whether apply_immediately is set"
  value       = aws_db_instance.main.apply_immediately
}

output "db_instance_monitoring_interval" {
  description = "Monitoring interval"
  value       = aws_db_instance.main.monitoring_interval
}

output "db_instance_monitoring_role_arn" {
  description = "Monitoring role ARN"
  value       = aws_db_instance.main.monitoring_role_arn
}

output "db_instance_performance_insights_enabled" {
  description = "Whether performance insights are enabled"
  value       = aws_db_instance.main.performance_insights_enabled
}

output "db_instance_performance_insights_kms_key_id" {
  description = "Performance insights KMS key ID"
  value       = aws_db_instance.main.performance_insights_kms_key_id
}

output "db_instance_performance_insights_retention_period" {
  description = "Performance insights retention period"
  value       = aws_db_instance.main.performance_insights_retention_period
}

output "db_instance_deletion_protection" {
  description = "Whether deletion protection is enabled"
  value       = aws_db_instance.main.deletion_protection
}

output "db_instance_copy_tags_to_snapshot" {
  description = "Whether tags are copied to snapshots"
  value       = aws_db_instance.main.copy_tags_to_snapshot
}

output "db_instance_final_snapshot_identifier" {
  description = "Final snapshot identifier"
  value       = aws_db_instance.main.final_snapshot_identifier
}

output "db_instance_skip_final_snapshot" {
  description = "Whether to skip final snapshot"
  value       = aws_db_instance.main.skip_final_snapshot
}

output "db_instance_auto_minor_version_upgrade" {
  description = "Whether auto minor version upgrade is enabled"
  value       = aws_db_instance.main.auto_minor_version_upgrade
}

output "db_instance_enabled_cloudwatch_logs_exports" {
  description = "Enabled CloudWatch logs exports"
  value       = aws_db_instance.main.enabled_cloudwatch_logs_exports
}

output "db_instance_domain" {
  description = "Domain"
  value       = aws_db_instance.main.domain
}

output "db_instance_domain_iam_role_name" {
  description = "Domain IAM role name"
  value       = aws_db_instance.main.domain_iam_role_name
}

output "db_instance_timezone" {
  description = "Timezone"
  value       = aws_db_instance.main.timezone
}

output "db_instance_maintenance_window" {
  description = "Maintenance window"
  value       = aws_db_instance.main.maintenance_window
}

output "db_instance_backup_window" {
  description = "Backup window"
  value       = aws_db_instance.main.backup_window
}

output "db_instance_backup_retention_period" {
  description = "Backup retention period"
  value       = aws_db_instance.main.backup_retention_period
}
output "db_instance_storage_type" {
  description = "Storage type"
  value       = aws_db_instance.main.storage_type
}
