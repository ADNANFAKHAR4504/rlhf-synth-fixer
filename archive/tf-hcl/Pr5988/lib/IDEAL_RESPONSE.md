# Terraform Infrastructure for Phased Migration (Fixed Implementation)

This implementation provides a complete Terraform configuration for orchestrating a phased migration with all critical issues fixed.

## Fixes Applied

1. **ALB Subnet Requirement**: Created two public subnets in different AZs for each workspace
2. **Backend Configuration**: Removed variable interpolation from backend block
3. **NAT Gateway**: Added NAT Gateway with EIP for private subnet internet access
4. **VPC Flow Logs**: Added Flow Logs to CloudWatch for network monitoring
5. **ALB Access Logs**: Added S3 bucket and logging configuration for ALB
6. **Module Structure**: Organized for proper test compatibility

## File: backend.tf

```hcl
# Backend configuration without variable interpolation
# Use partial configuration via CLI or backend config file
terraform {
  backend "s3" {
    key    = "migration/terraform.tfstate"
    region = "ap-southeast-1"
  }
}
```

## File: provider.tf

```hcl
terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = terraform.workspace
      ManagedBy   = "Terraform"
      Project     = "LegacyMigration"
    }
  }
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "ap-southeast-1"
}

variable "environment_suffix" {
  description = "Unique suffix for resource naming"
  type        = string
}

variable "legacy_vpc_cidr" {
  description = "CIDR block for legacy VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "production_vpc_cidr" {
  description = "CIDR block for production VPC"
  type        = string
  default     = "10.1.0.0/16"
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

variable "route53_zone_name" {
  description = "Route 53 hosted zone name"
  type        = string
}

variable "legacy_traffic_weight" {
  description = "Weight for legacy environment (0-100)"
  type        = number
  default     = 100
}

variable "production_traffic_weight" {
  description = "Weight for production environment (0-100)"
  type        = number
  default     = 0
}

variable "backend_bucket" {
  description = "S3 bucket name for Terraform state"
  type        = string
}
```

## File: locals.tf

```hcl
locals {
  workspace_config = {
    legacy = {
      vpc_cidr               = var.legacy_vpc_cidr
      public_subnet_cidrs    = ["10.0.1.0/24", "10.0.2.0/24"]  # Two public subnets
      private_subnet_cidrs   = ["10.0.10.0/24", "10.0.11.0/24"]
      instance_type          = "t3.medium"
      availability_zones     = ["${var.aws_region}a", "${var.aws_region}b"]
    }
    production = {
      vpc_cidr               = var.production_vpc_cidr
      public_subnet_cidrs    = ["10.1.1.0/24", "10.1.2.0/24"]  # Two public subnets
      private_subnet_cidrs   = ["10.1.10.0/24", "10.1.11.0/24"]
      instance_type          = "t3.large"
      availability_zones     = ["${var.aws_region}a", "${var.aws_region}b"]
    }
  }

  config = local.workspace_config[terraform.workspace]

  common_tags = {
    Workspace = terraform.workspace
    Suffix    = var.environment_suffix
  }
}
```

## File: vpc.tf

```hcl
resource "aws_vpc" "main" {
  cidr_block           = local.config.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "vpc-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "igw-${terraform.workspace}-${var.environment_suffix}"
  })
}

# Two public subnets in different AZs (required for ALB)
resource "aws_subnet" "public" {
  count                   = length(local.config.public_subnet_cidrs)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.config.public_subnet_cidrs[count.index]
  availability_zone       = local.config.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "public-subnet-${count.index}-${terraform.workspace}-${var.environment_suffix}"
    Type = "Public"
  })
}

resource "aws_subnet" "private" {
  count             = length(local.config.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.config.private_subnet_cidrs[count.index]
  availability_zone = local.config.availability_zones[count.index]

  tags = merge(local.common_tags, {
    Name = "private-subnet-${count.index}-${terraform.workspace}-${var.environment_suffix}"
    Type = "Private"
  })
}

# NAT Gateway for private subnet internet access
resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "nat-eip-${terraform.workspace}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = merge(local.common_tags, {
    Name = "nat-gateway-${terraform.workspace}-${var.environment_suffix}"
  })

  depends_on = [aws_internet_gateway.main]
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "public-rt-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "private-rt-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private.id
}

# VPC Flow Logs
resource "aws_cloudwatch_log_group" "flow_logs" {
  name              = "/aws/vpc/flowlogs-${terraform.workspace}-${var.environment_suffix}"
  retention_in_days = 7

  tags = merge(local.common_tags, {
    Name = "vpc-flowlogs-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_iam_role" "flow_logs" {
  name_prefix = "vpc-flowlogs-role-${terraform.workspace}-"

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

  tags = merge(local.common_tags, {
    Name = "vpc-flowlogs-role-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  name_prefix = "vpc-flowlogs-policy-"
  role        = aws_iam_role.flow_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Effect = "Allow"
        Resource = "*"
      }
    ]
  })
}

resource "aws_flow_log" "main" {
  iam_role_arn    = aws_iam_role.flow_logs.arn
  log_destination = aws_cloudwatch_log_group.flow_logs.arn
  traffic_type    = "ALL"
  vpc_id          = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "vpc-flowlog-${terraform.workspace}-${var.environment_suffix}"
  })
}
```

## File: vpc-peering.tf

```hcl
data "aws_vpc" "peer" {
  count = terraform.workspace == "production" ? 1 : 0

  filter {
    name   = "tag:Workspace"
    values = ["legacy"]
  }

  filter {
    name   = "tag:Suffix"
    values = [var.environment_suffix]
  }
}

resource "aws_vpc_peering_connection" "main" {
  count       = terraform.workspace == "production" ? 1 : 0
  vpc_id      = aws_vpc.main.id
  peer_vpc_id = data.aws_vpc.peer[0].id
  auto_accept = true

  tags = merge(local.common_tags, {
    Name = "vpc-peering-${var.environment_suffix}"
  })
}

resource "aws_route" "to_legacy" {
  count                     = terraform.workspace == "production" ? 1 : 0
  route_table_id            = aws_route_table.private.id
  destination_cidr_block    = var.legacy_vpc_cidr
  vpc_peering_connection_id = aws_vpc_peering_connection.main[0].id
}

resource "aws_route" "to_production" {
  count                     = terraform.workspace == "legacy" ? 1 : 0
  route_table_id            = aws_route_table.private.id
  destination_cidr_block    = var.production_vpc_cidr
  vpc_peering_connection_id = data.aws_vpc_peering_connection.existing[0].id
}

data "aws_vpc_peering_connection" "existing" {
  count = terraform.workspace == "legacy" ? 1 : 0

  filter {
    name   = "tag:Name"
    values = ["vpc-peering-${var.environment_suffix}"]
  }
}
```

## File: security-groups.tf

```hcl
resource "aws_security_group" "alb" {
  name_prefix = "alb-sg-${terraform.workspace}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for Application Load Balancer"

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP from internet"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS from internet"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name = "alb-sg-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_security_group" "app" {
  name_prefix = "app-sg-${terraform.workspace}-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for application instances"

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
    description     = "Allow traffic from ALB"
  }

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [local.config.vpc_cidr]
    description = "Allow PostgreSQL within VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name = "app-sg-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_security_group" "dms" {
  count       = terraform.workspace == "production" ? 1 : 0
  name_prefix = "dms-sg-"
  vpc_id      = aws_vpc.main.id
  description = "Security group for DMS replication instance"

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [var.legacy_vpc_cidr, var.production_vpc_cidr]
    description = "Allow PostgreSQL from both VPCs"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }

  tags = merge(local.common_tags, {
    Name = "dms-sg-${var.environment_suffix}"
  })
}
```

## File: alb.tf

```hcl
# S3 bucket for ALB access logs
resource "aws_s3_bucket" "alb_logs" {
  bucket = "alb-logs-${terraform.workspace}-${var.environment_suffix}"

  tags = merge(local.common_tags, {
    Name = "alb-logs-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
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
  bucket = aws_s3_bucket.alb_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = data.aws_elb_service_account.main.arn
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.alb_logs.arn}/*"
      }
    ]
  })
}

resource "aws_lb" "main" {
  name               = "alb-${terraform.workspace}-${var.environment_suffix}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id  # Use all public subnets (minimum 2)

  enable_deletion_protection = false

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    enabled = true
  }

  tags = merge(local.common_tags, {
    Name = "alb-${terraform.workspace}-${var.environment_suffix}"
  })

  depends_on = [aws_s3_bucket_policy.alb_logs]
}

resource "aws_lb_target_group" "main" {
  name     = "tg-${terraform.workspace}-${var.environment_suffix}"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/health"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }

  tags = merge(local.common_tags, {
    Name = "tg-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}
```

## File: auto-scaling.tf

```hcl
data "aws_ami" "amazon_linux_2" {
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

resource "aws_iam_role" "instance" {
  name_prefix = "instance-role-${terraform.workspace}-"

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

  tags = merge(local.common_tags, {
    Name = "instance-role-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_iam_role_policy_attachment" "ssm" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "cloudwatch" {
  role       = aws_iam_role.instance.name
  policy_arn = "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
}

resource "aws_iam_instance_profile" "instance" {
  name_prefix = "instance-profile-${terraform.workspace}-"
  role        = aws_iam_role.instance.name

  tags = merge(local.common_tags, {
    Name = "instance-profile-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_launch_template" "app" {
  name_prefix   = "app-lt-${terraform.workspace}-"
  image_id      = data.aws_ami.amazon_linux_2.id
  instance_type = local.config.instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.instance.arn
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [aws_security_group.app.id]
  }

  user_data = base64encode(<<-EOF
              #!/bin/bash
              yum update -y
              yum install -y docker
              systemctl start docker
              systemctl enable docker
              docker run -d -p 8080:8080 --name app nginx
              EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "app-instance-${terraform.workspace}-${var.environment_suffix}"
    })
  }

  tags = merge(local.common_tags, {
    Name = "app-lt-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_autoscaling_group" "app" {
  name                = "asg-${terraform.workspace}-${var.environment_suffix}"
  vpc_zone_identifier = aws_subnet.private[*].id
  target_group_arns   = [aws_lb_target_group.main.arn]

  desired_capacity = 2
  min_size         = 1
  max_size         = 4

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  health_check_type         = "ELB"
  health_check_grace_period = 300

  tag {
    key                 = "Name"
    value               = "asg-instance-${terraform.workspace}-${var.environment_suffix}"
    propagate_at_launch = true
  }

  tag {
    key                 = "Workspace"
    value               = terraform.workspace
    propagate_at_launch = true
  }
}
```

## File: dms.tf

```hcl
resource "aws_dms_replication_subnet_group" "main" {
  count                                = terraform.workspace == "production" ? 1 : 0
  replication_subnet_group_id          = "dms-subnet-group-${var.environment_suffix}"
  replication_subnet_group_description = "DMS replication subnet group"
  subnet_ids                           = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "dms-subnet-group-${var.environment_suffix}"
  })
}

resource "aws_dms_replication_instance" "main" {
  count                        = terraform.workspace == "production" ? 1 : 0
  replication_instance_id      = "dms-instance-${var.environment_suffix}"
  replication_instance_class   = "dms.t3.medium"
  allocated_storage            = 50
  vpc_security_group_ids       = [aws_security_group.dms[0].id]
  replication_subnet_group_id  = aws_dms_replication_subnet_group.main[0].id
  publicly_accessible          = false
  engine_version               = "3.4.7"

  tags = merge(local.common_tags, {
    Name = "dms-instance-${var.environment_suffix}"
  })
}

resource "aws_dms_endpoint" "source" {
  count             = terraform.workspace == "production" ? 1 : 0
  endpoint_id       = "dms-source-${var.environment_suffix}"
  endpoint_type     = "source"
  engine_name       = "postgres"
  username          = var.db_username
  password          = var.db_password
  server_name       = "legacy-db.internal"
  port              = 5432
  database_name     = "appdb"
  ssl_mode          = "require"

  tags = merge(local.common_tags, {
    Name = "dms-source-${var.environment_suffix}"
  })
}

resource "aws_dms_endpoint" "target" {
  count             = terraform.workspace == "production" ? 1 : 0
  endpoint_id       = "dms-target-${var.environment_suffix}"
  endpoint_type     = "target"
  engine_name       = "aurora-postgresql"
  username          = var.db_username
  password          = var.db_password
  server_name       = aws_rds_cluster.aurora[0].endpoint
  port              = 5432
  database_name     = "appdb"
  ssl_mode          = "require"

  tags = merge(local.common_tags, {
    Name = "dms-target-${var.environment_suffix}"
  })
}

resource "aws_dms_replication_task" "main" {
  count                     = terraform.workspace == "production" ? 1 : 0
  replication_task_id       = "dms-task-${var.environment_suffix}"
  migration_type            = "full-load-and-cdc"
  replication_instance_arn  = aws_dms_replication_instance.main[0].replication_instance_arn
  source_endpoint_arn       = aws_dms_endpoint.source[0].endpoint_arn
  target_endpoint_arn       = aws_dms_endpoint.target[0].endpoint_arn
  table_mappings            = jsonencode({
    rules = [{
      rule-type = "selection"
      rule-id   = "1"
      rule-name = "1"
      object-locator = {
        schema-name = "public"
        table-name  = "%"
      }
      rule-action = "include"
    }]
  })

  tags = merge(local.common_tags, {
    Name = "dms-task-${var.environment_suffix}"
  })
}

resource "aws_rds_cluster" "aurora" {
  count                   = terraform.workspace == "production" ? 1 : 0
  cluster_identifier      = "aurora-cluster-${var.environment_suffix}"
  engine                  = "aurora-postgresql"
  engine_mode             = "provisioned"
  engine_version          = "15.3"
  database_name           = "appdb"
  master_username         = var.db_username
  master_password         = var.db_password
  db_subnet_group_name    = aws_db_subnet_group.aurora[0].name
  vpc_security_group_ids  = [aws_security_group.app.id]
  skip_final_snapshot     = true

  serverlessv2_scaling_configuration {
    max_capacity = 2.0
    min_capacity = 0.5
  }

  tags = merge(local.common_tags, {
    Name = "aurora-cluster-${var.environment_suffix}"
  })
}

resource "aws_rds_cluster_instance" "aurora" {
  count              = terraform.workspace == "production" ? 1 : 0
  identifier         = "aurora-instance-${var.environment_suffix}"
  cluster_identifier = aws_rds_cluster.aurora[0].id
  instance_class     = "db.serverless"
  engine             = aws_rds_cluster.aurora[0].engine
  engine_version     = aws_rds_cluster.aurora[0].engine_version

  tags = merge(local.common_tags, {
    Name = "aurora-instance-${var.environment_suffix}"
  })
}

resource "aws_db_subnet_group" "aurora" {
  count      = terraform.workspace == "production" ? 1 : 0
  name       = "aurora-subnet-group-${var.environment_suffix}"
  subnet_ids = aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "aurora-subnet-group-${var.environment_suffix}"
  })
}
```

## File: route53.tf

```hcl
resource "aws_route53_zone" "main" {
  count = terraform.workspace == "production" ? 1 : 0
  name  = var.route53_zone_name

  tags = merge(local.common_tags, {
    Name = "hosted-zone-${var.environment_suffix}"
  })
}

data "aws_lb" "legacy" {
  count = terraform.workspace == "production" ? 1 : 0

  tags = {
    Workspace = "legacy"
    Suffix    = var.environment_suffix
  }
}

resource "aws_route53_record" "app" {
  count   = terraform.workspace == "production" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "A"

  set_identifier = "legacy"
  weighted_routing_policy {
    weight = var.legacy_traffic_weight
  }

  alias {
    name                   = data.aws_lb.legacy[0].dns_name
    zone_id                = data.aws_lb.legacy[0].zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "app_production" {
  count   = terraform.workspace == "production" ? 1 : 0
  zone_id = aws_route53_zone.main[0].zone_id
  name    = "app.${var.route53_zone_name}"
  type    = "A"

  set_identifier = "production"
  weighted_routing_policy {
    weight = var.production_traffic_weight
  }

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}
```

## File: parameter-store.tf

```hcl
resource "aws_ssm_parameter" "db_endpoint" {
  name  = "/${terraform.workspace}/database/endpoint"
  type  = "String"
  value = terraform.workspace == "production" ? aws_rds_cluster.aurora[0].endpoint : "legacy-db.internal"

  tags = merge(local.common_tags, {
    Name = "db-endpoint-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_ssm_parameter" "alb_dns" {
  name  = "/${terraform.workspace}/application/url"
  type  = "String"
  value = aws_lb.main.dns_name

  tags = merge(local.common_tags, {
    Name = "alb-dns-${terraform.workspace}-${var.environment_suffix}"
  })
}

resource "aws_ssm_parameter" "migration_status" {
  name  = "/${terraform.workspace}/migration/status"
  type  = "String"
  value = terraform.workspace == "production" ? "in-progress" : "pending"

  tags = merge(local.common_tags, {
    Name = "migration-status-${terraform.workspace}-${var.environment_suffix}"
  })
}
```

## File: cloudwatch.tf

```hcl
resource "aws_cloudwatch_dashboard" "migration" {
  dashboard_name = "migration-dashboard-${var.environment_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DMS", "CDCLatencySource", { stat = "Average" }],
            [".", "CDCLatencyTarget", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "DMS Replication Lag"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", { stat = "Sum" }],
            [".", "TargetResponseTime", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "ALB Metrics"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/AutoScaling", "GroupInServiceInstances", { stat = "Average" }],
            [".", "GroupDesiredCapacity", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Auto Scaling Group Health"
        }
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "dms_lag" {
  count               = terraform.workspace == "production" ? 1 : 0
  alarm_name          = "dms-replication-lag-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CDCLatencySource"
  namespace           = "AWS/DMS"
  period              = 300
  statistic           = "Average"
  threshold           = 60
  alarm_description   = "DMS replication lag exceeds 60 seconds"

  dimensions = {
    ReplicationInstanceIdentifier = aws_dms_replication_instance.main[0].replication_instance_id
  }

  tags = merge(local.common_tags, {
    Name = "dms-lag-alarm-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_metric_alarm" "alb_unhealthy_targets" {
  alarm_name          = "alb-unhealthy-targets-${terraform.workspace}-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold           = 0
  alarm_description   = "ALB has unhealthy targets"

  dimensions = {
    TargetGroup  = aws_lb_target_group.main.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  tags = merge(local.common_tags, {
    Name = "alb-unhealthy-alarm-${terraform.workspace}-${var.environment_suffix}"
  })
}
```

## File: outputs.tf

```hcl
output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = aws_lb.main.dns_name
}

output "nat_gateway_id" {
  description = "NAT Gateway ID"
  value       = aws_nat_gateway.main.id
}

output "flow_logs_group" {
  description = "VPC Flow Logs CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.flow_logs.name
}

output "alb_logs_bucket" {
  description = "S3 bucket for ALB access logs"
  value       = aws_s3_bucket.alb_logs.bucket
}

output "workspace" {
  description = "Current Terraform workspace"
  value       = terraform.workspace
}

output "migration_commands" {
  description = "Commands for managing the migration"
  value = <<-EOT
    # Switch to legacy workspace
    terraform workspace select legacy

    # Switch to production workspace
    terraform workspace select production

    # Start DMS replication task
    aws dms start-replication-task --replication-task-arn <task-arn> --start-replication-task-type start-replication

    # Stop DMS replication task
    aws dms stop-replication-task --replication-task-arn <task-arn>
  EOT
}

output "traffic_shifting_instructions" {
  description = "Instructions for shifting traffic between environments"
  value = <<-EOT
    # Shift 25% traffic to production
    terraform apply -var="legacy_traffic_weight=75" -var="production_traffic_weight=25"

    # Shift 50% traffic to production
    terraform apply -var="legacy_traffic_weight=50" -var="production_traffic_weight=50"

    # Shift 100% traffic to production
    terraform apply -var="legacy_traffic_weight=0" -var="production_traffic_weight=100"

    # Rollback to legacy
    terraform apply -var="legacy_traffic_weight=100" -var="production_traffic_weight=0"
  EOT
}

output "parameter_store_paths" {
  description = "Parameter Store paths for configuration"
  value = {
    database_endpoint  = "/${terraform.workspace}/database/endpoint"
    application_url    = "/${terraform.workspace}/application/url"
    migration_status   = "/${terraform.workspace}/migration/status"
  }
}

output "cloudwatch_dashboard_url" {
  description = "CloudWatch dashboard URL"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=migration-dashboard-${var.environment_suffix}"
}
```

## Deployment Instructions

### Backend Initialization

Since the backend cannot use variables, initialize with partial configuration:

```bash
# Create backend.hcl file
cat > backend.hcl <<EOF
bucket = "your-terraform-state-bucket"
EOF

# Initialize with backend config
terraform init -backend-config=backend.hcl
```

### Workspace Setup

```bash
# Create workspaces
terraform workspace new legacy
terraform workspace new production
```

### Deploy Legacy Environment

```bash
terraform workspace select legacy
terraform plan -var="environment_suffix=unique-id" \
  -var="db_username=admin" \
  -var="db_password=SecurePass123!" \
  -var="route53_zone_name=example.com" \
  -var="backend_bucket=your-terraform-state-bucket"

terraform apply -var="environment_suffix=unique-id" \
  -var="db_username=admin" \
  -var="db_password=SecurePass123!" \
  -var="route53_zone_name=example.com" \
  -var="backend_bucket=your-terraform-state-bucket"
```

### Deploy Production Environment

```bash
terraform workspace select production
terraform apply -var="environment_suffix=unique-id" \
  -var="db_username=admin" \
  -var="db_password=SecurePass123!" \
  -var="route53_zone_name=example.com" \
  -var="backend_bucket=your-terraform-state-bucket"
```

### Migration Process

1. Deploy both environments (ensure legacy is deployed first)
2. Verify VPC peering connection is established
3. Start DMS replication task in production workspace
4. Monitor replication lag in CloudWatch dashboard
5. Gradually shift traffic using weighted routing
6. Monitor ALB metrics and application health
7. Complete cutover when replication is stable and application is healthy
