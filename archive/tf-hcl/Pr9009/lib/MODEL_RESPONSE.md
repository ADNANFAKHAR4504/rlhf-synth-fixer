```hcl
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  description = "Environment (staging or production)"
  type        = string
  default     = "staging"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

locals {
  primary_region   = "us-east-1"
  secondary_region = "us-west-2"
  project         = "tap"
  owner           = "devops"
  
  common_tags = {
    Environment = var.environment
    Project     = local.project
    Owner       = local.owner
  }
  
  instance_type = var.environment == "production" ? "t3.medium" : "t3.micro"
  min_size     = var.environment == "production" ? 2 : 1
  max_size     = var.environment == "production" ? 10 : 3
  desired_size = var.environment == "production" ? 3 : 2
}

provider "aws" {
  alias  = "primary"
  region = local.primary_region
}

provider "aws" {
  alias  = "secondary"
  region = local.secondary_region
}

data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
}

data "aws_vpc" "primary_default" {
  provider = aws.primary
  default  = true
}

data "aws_vpc" "secondary_default" {
  provider = aws.secondary
  default  = true
}

data "aws_subnets" "primary_default" {
  provider = aws.primary
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.primary_default.id]
  }
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

data "aws_subnets" "secondary_default" {
  provider = aws.secondary
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.secondary_default.id]
  }
  filter {
    name   = "default-for-az"
    values = ["true"]
  }
}

resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}"
  })
}

resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.2.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}"
  })
}

resource "aws_subnet" "primary_public" {
  provider                = aws.primary
  count                   = 2
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-public-${count.index + 1}"
  })
}

resource "aws_subnet" "secondary_public" {
  provider                = aws.secondary
  count                   = 2
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.2.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-public-${count.index + 1}"
  })
}

resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = 2
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-private-${count.index + 1}"
  })
}

resource "aws_subnet" "secondary_private" {
  provider          = aws.secondary
  count             = 2
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.2.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-private-${count.index + 1}"
  })
}

resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-igw"
  })
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-igw"
  })
}

resource "aws_route_table" "primary_public" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.primary.id
  }
  
  route {
    cidr_block                = aws_vpc.secondary.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-public-rt"
  })
}

resource "aws_route_table" "secondary_public" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.secondary.id
  }
  
  route {
    cidr_block                = aws_vpc.primary.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-public-rt"
  })
}

resource "aws_route_table" "primary_private" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id
  
  route {
    cidr_block                = aws_vpc.secondary.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-private-rt"
  })
}

resource "aws_route_table" "secondary_private" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id
  
  route {
    cidr_block                = aws_vpc.primary.cidr_block
    vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-private-rt"
  })
}

resource "aws_route_table_association" "primary_public" {
  provider       = aws.primary
  count          = 2
  subnet_id      = aws_subnet.primary_public[count.index].id
  route_table_id = aws_route_table.primary_public.id
}

resource "aws_route_table_association" "secondary_public" {
  provider       = aws.secondary
  count          = 2
  subnet_id      = aws_subnet.secondary_public[count.index].id
  route_table_id = aws_route_table.secondary_public.id
}

resource "aws_route_table_association" "primary_private" {
  provider       = aws.primary
  count          = 2
  subnet_id      = aws_subnet.primary_private[count.index].id
  route_table_id = aws_route_table.primary_private.id
}

resource "aws_route_table_association" "secondary_private" {
  provider       = aws.secondary
  count          = 2
  subnet_id      = aws_subnet.secondary_private[count.index].id
  route_table_id = aws_route_table.secondary_private.id
}

resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.primary
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.secondary.id
  peer_region = local.secondary_region
  auto_accept = false
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-peering"
  })
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-peering-accepter"
  })
}

resource "aws_kms_key" "main" {
  provider                = aws.primary
  description             = "KMS key for tap ${var.environment}"
  deletion_window_in_days = 7
  
  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  provider      = aws.primary
  name          = "alias/tap-${var.environment}"
  target_key_id = aws_kms_key.main.key_id
}

resource "aws_s3_bucket" "logs" {
  provider = aws.primary
  bucket   = "tap-${var.environment}-logs-${random_id.bucket_suffix.hex}"
  
  tags = local.common_tags
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.main.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_versioning" "logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "logs" {
  provider = aws.primary
  bucket   = aws_s3_bucket.logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_security_group" "alb_primary" {
  provider    = aws.primary
  name        = "tap-${var.environment}-${local.primary_region}-alb"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.primary.id
  
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
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block]
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-alb-sg"
  })
}

resource "aws_security_group" "alb_secondary" {
  provider    = aws.secondary
  name        = "tap-${var.environment}-${local.secondary_region}-alb"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.secondary.id
  
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
    to_port     = 65535
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.secondary.cidr_block]
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-alb-sg"
  })
}

resource "aws_security_group" "app_primary" {
  provider    = aws.primary
  name        = "tap-${var.environment}-${local.primary_region}-app"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block, aws_vpc.secondary.cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-app-sg"
  })
}

resource "aws_security_group" "app_secondary" {
  provider    = aws.secondary
  name        = "tap-${var.environment}-${local.secondary_region}-app"
  description = "Security group for application instances"
  vpc_id      = aws_vpc.secondary.id
  
  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }
  
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.primary.cidr_block, aws_vpc.secondary.cidr_block]
  }
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-app-sg"
  })
}

resource "aws_security_group" "rds_primary" {
  provider    = aws.primary
  name        = "tap-${var.environment}-${local.primary_region}-rds"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.primary.id
  
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_primary.id, aws_security_group.app_secondary.id]
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-rds-sg"
  })
}

data "aws_ami" "amazon_linux" {
  provider    = aws.primary
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

data "aws_ami" "amazon_linux_secondary" {
  provider    = aws.secondary
  most_recent = true
  owners      = ["amazon"]
  
  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }
}

resource "aws_iam_role" "ec2_role" {
  provider = aws.primary
  name     = "tap-${var.environment}-ec2-role"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_policy" "ec2_policy" {
  provider = aws.primary
  name     = "tap-${var.environment}-ec2-policy"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
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
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.logs.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.main.arn
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ec2_policy_attachment" {
  provider   = aws.primary
  role       = aws_iam_role.ec2_role.name
  policy_arn = aws_iam_policy.ec2_policy.arn
}

resource "aws_iam_instance_profile" "ec2_profile" {
  provider = aws.primary
  name     = "tap-${var.environment}-ec2-profile"
  role     = aws_iam_role.ec2_role.name
  
  tags = local.common_tags
}

resource "aws_launch_template" "app_primary" {
  provider      = aws.primary
  name          = "tap-${var.environment}-${local.primary_region}-lt"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = local.instance_type
  
  vpc_security_group_ids = [aws_security_group.app_primary.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  
  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    log_bucket = aws_s3_bucket.logs.bucket
    region     = local.primary_region
  }))
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "tap-${var.environment}-${local.primary_region}-app"
    })
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-lt"
  })
}

resource "aws_launch_template" "app_secondary" {
  provider      = aws.secondary
  name          = "tap-${var.environment}-${local.secondary_region}-lt"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = local.instance_type
  
  vpc_security_group_ids = [aws_security_group.app_secondary.id]
  
  user_data = base64encode(templatefile("${path.module}/userdata.sh", {
    log_bucket = aws_s3_bucket.logs.bucket
    region     = local.secondary_region
  }))
  
  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "tap-${var.environment}-${local.secondary_region}-app"
    })
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-lt"
  })
}

resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "tap-${var.environment}-${local.primary_region}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets            = aws_subnet.primary_public[*].id
  
  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb-logs/primary"
    enabled = true
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-alb"
  })
}

resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "tap-${var.environment}-${local.secondary_region}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets            = aws_subnet.secondary_public[*].id
  
  access_logs {
    bucket  = aws_s3_bucket.logs.bucket
    prefix  = "alb-logs/secondary"
    enabled = true
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-alb"
  })
}

resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = "tap-${var.environment}-${local.primary_region}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-tg"
  })
}

resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "tap-${var.environment}-${local.secondary_region}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id
  
  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200"
    path                = "/"
    port                = "traffic-port"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 2
  }
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-tg"
  })
}

resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
  
  tags = local.common_tags
}

resource "aws_lb_listener" "secondary" {
  provider          = aws.secondary
  load_balancer_arn = aws_lb.secondary.arn
  port              = "80"
  protocol          = "HTTP"
  
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.secondary.arn
  }
  
  tags = local.common_tags
}

resource "aws_autoscaling_group" "primary" {
  provider            = aws.primary
  name                = "tap-${var.environment}-${local.primary_region}-asg"
  vpc_zone_identifier = aws_subnet.primary_public[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  min_size            = local.min_size
  max_size            = local.max_size
  desired_capacity    = local.desired_size
  
  launch_template {
    id      = aws_launch_template.app_primary.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "tap-${var.environment}-${local.primary_region}-asg"
    propagate_at_launch = false
  }
  
  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

resource "aws_autoscaling_group" "secondary" {
  provider            = aws.secondary
  name                = "tap-${var.environment}-${local.secondary_region}-asg"
  vpc_zone_identifier = aws_subnet.secondary_public[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  min_size            = local.min_size
  max_size            = local.max_size
  desired_capacity    = local.desired_size
  
  launch_template {
    id      = aws_launch_template.app_secondary.id
    version = "$Latest"
  }
  
  tag {
    key                 = "Name"
    value               = "tap-${var.environment}-${local.secondary_region}-asg"
    propagate_at_launch = false
  }
  
  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }
}

resource "aws_db_subnet_group" "primary" {
  provider   = aws.primary
  name       = "tap-${var.environment}-${local.primary_region}-subnet-group"
  subnet_ids = aws_subnet.primary_private[*].id
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-subnet-group"
  })
}

resource "aws_db_instance" "primary" {
  provider                = aws.primary
  identifier              = "tap-${var.environment}-${local.primary_region}-db"
  allocated_storage       = var.environment == "production" ? 100 : 20
  max_allocated_storage   = var.environment == "production" ? 1000 : 100
  storage_type            = "gp2"
  storage_encrypted       = true
  kms_key_id              = aws_kms_key.main.arn
  engine                  = "mysql"
  engine_version          = "8.0"
  instance_class          = var.environment == "production" ? "db.t3.medium" : "db.t3.micro"
  db_name                 = "tapdb"
  username                = "admin"
  password                = "changeme123!"
  parameter_group_name    = "default.mysql8.0"
  db_subnet_group_name    = aws_db_subnet_group.primary.name
  vpc_security_group_ids  = [aws_security_group.rds_primary.id]
  backup_retention_period = var.environment == "production" ? 7 : 1
  multi_az                = var.environment == "production" ? true : false
  publicly_accessible     = false
  skip_final_snapshot     = true
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.primary_region}-db"
  })
}

resource "aws_db_subnet_group" "secondary" {
  provider   = aws.secondary
  name       = "tap-${var.environment}-${local.secondary_region}-subnet-group"
  subnet_ids = aws_subnet.secondary_private[*].id
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-subnet-group"
  })
}

resource "aws_db_instance" "secondary" {
  provider                     = aws.secondary
  identifier                   = "tap-${var.environment}-${local.secondary_region}-db"
  replicate_source_db          = aws_db_instance.primary.arn
  instance_class               = var.environment == "production" ? "db.t3.medium" : "db.t3.micro"
  publicly_accessible          = false
  skip_final_snapshot          = true
  auto_minor_version_upgrade   = false
  db_subnet_group_name         = aws_db_subnet_group.secondary.name
  vpc_security_group_ids       = [aws_security_group.rds_secondary.id]
  
  tags = merge(local.common_tags, {
    Name = "tap-${var.environment}-${local.secondary_region}-db-replica"
  })
}

resource "aws_security_group" "rds_secondary" {
  provider    = aws.secondary
  name        = "tap-${var.environment}-${local.secondary_region}-rds"
  description = "Security group for RDS read replica"
  vpc_id      = aws_vpc.secondary.
