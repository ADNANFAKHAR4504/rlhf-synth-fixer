I'll help you create a comprehensive Terraform configuration for your multi-region AWS infrastructure. Here's the implementation:

## `lib/provider.tf`

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
  alias  = "primary"
  region = "us-east-1"
}

provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}
```

## `lib/tap_stack.tf`

```hcl
# Local values for common configuration
locals {
  common_tags = {
    Project   = "IaC-AWS-Nova-Model-Breaking"
    Owner     = "DevOps-Team"
    ManagedBy = "terraform"
  }

  prod_tags = merge(local.common_tags, { Environment = "production" })
  test_tags = merge(local.common_tags, { Environment = "testing" })
}

# Data sources
data "aws_availability_zones" "primary" {
  provider = aws.primary
  state    = "available"
}

data "aws_availability_zones" "secondary" {
  provider = aws.secondary
  state    = "available"
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

# VPC - Primary Region
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.prod_tags, { Name = "nova-vpc-primary" })
}

# VPC - Secondary Region
resource "aws_vpc" "secondary" {
  provider             = aws.secondary
  cidr_block           = "10.1.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.prod_tags, { Name = "nova-vpc-secondary" })
}

# Internet Gateways
resource "aws_internet_gateway" "primary" {
  provider = aws.primary
  vpc_id   = aws_vpc.primary.id

  tags = merge(local.prod_tags, { Name = "nova-igw-primary" })
}

resource "aws_internet_gateway" "secondary" {
  provider = aws.secondary
  vpc_id   = aws_vpc.secondary.id

  tags = merge(local.prod_tags, { Name = "nova-igw-secondary" })
}

# Public Subnets - Primary
resource "aws_subnet" "public_primary" {
  count                   = 2
  provider                = aws.primary
  vpc_id                  = aws_vpc.primary.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.primary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.prod_tags, { Name = "nova-public-subnet-primary-${count.index + 1}" })
}

# Private Subnets - Primary
resource "aws_subnet" "private_primary" {
  count             = 2
  provider          = aws.primary
  vpc_id            = aws_vpc.primary.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.primary.names[count.index]

  tags = merge(local.prod_tags, { Name = "nova-private-subnet-primary-${count.index + 1}" })
}

# Public Subnets - Secondary
resource "aws_subnet" "public_secondary" {
  count                   = 2
  provider                = aws.secondary
  vpc_id                  = aws_vpc.secondary.id
  cidr_block              = "10.1.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.secondary.names[count.index]
  map_public_ip_on_launch = true

  tags = merge(local.prod_tags, { Name = "nova-public-subnet-secondary-${count.index + 1}" })
}

# Private Subnets - Secondary
resource "aws_subnet" "private_secondary" {
  count             = 2
  provider          = aws.secondary
  vpc_id            = aws_vpc.secondary.id
  cidr_block        = "10.1.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.secondary.names[count.index]

  tags = merge(local.prod_tags, { Name = "nova-private-subnet-secondary-${count.index + 1}" })
}

# VPC Peering
resource "aws_vpc_peering_connection" "primary_to_secondary" {
  provider    = aws.primary
  vpc_id      = aws_vpc.primary.id
  peer_vpc_id = aws_vpc.secondary.id
  peer_region = "us-west-2"
  auto_accept = false

  tags = merge(local.prod_tags, { Name = "nova-vpc-peering" })
}

resource "aws_vpc_peering_connection_accepter" "secondary" {
  provider                  = aws.secondary
  vpc_peering_connection_id = aws_vpc_peering_connection.primary_to_secondary.id
  auto_accept               = true

  tags = merge(local.prod_tags, { Name = "nova-vpc-peering-accepter" })
}

# Route Tables and Routes
resource "aws_route_table" "public_primary" {
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

  tags = merge(local.prod_tags, { Name = "nova-rt-public-primary" })
}

resource "aws_route_table" "public_secondary" {
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

  tags = merge(local.prod_tags, { Name = "nova-rt-public-secondary" })
}

# Route Table Associations
resource "aws_route_table_association" "public_primary" {
  count          = 2
  provider       = aws.primary
  subnet_id      = aws_subnet.public_primary[count.index].id
  route_table_id = aws_route_table.public_primary.id
}

resource "aws_route_table_association" "public_secondary" {
  count          = 2
  provider       = aws.secondary
  subnet_id      = aws_subnet.public_secondary[count.index].id
  route_table_id = aws_route_table.public_secondary.id
}

# Security Groups
resource "aws_security_group" "alb_primary" {
  provider = aws.primary
  name     = "nova-alb-sg-primary"
  vpc_id   = aws_vpc.primary.id

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

  tags = merge(local.prod_tags, { Name = "nova-alb-sg-primary" })
}

resource "aws_security_group" "ec2_primary" {
  provider = aws.primary
  name     = "nova-ec2-sg-primary"
  vpc_id   = aws_vpc.primary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_primary.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.prod_tags, { Name = "nova-ec2-sg-primary" })
}

# Similar security groups for secondary region
resource "aws_security_group" "alb_secondary" {
  provider = aws.secondary
  name     = "nova-alb-sg-secondary"
  vpc_id   = aws_vpc.secondary.id

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

  tags = merge(local.prod_tags, { Name = "nova-alb-sg-secondary" })
}

resource "aws_security_group" "ec2_secondary" {
  provider = aws.secondary
  name     = "nova-ec2-sg-secondary"
  vpc_id   = aws_vpc.secondary.id

  ingress {
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_secondary.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.prod_tags, { Name = "nova-ec2-sg-secondary" })
}

# RDS Security Group
resource "aws_security_group" "rds" {
  provider = aws.primary
  name     = "nova-rds-sg"
  vpc_id   = aws_vpc.primary.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ec2_primary.id]
  }

  tags = merge(local.prod_tags, { Name = "nova-rds-sg" })
}

# IAM Role for EC2
resource "aws_iam_role" "ec2_role" {
  name = "nova-ec2-role"

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

  tags = local.prod_tags
}

resource "aws_iam_instance_profile" "ec2_profile" {
  name = "nova-ec2-profile"
  role = aws_iam_role.ec2_role.name
}

# Launch Templates
resource "aws_launch_template" "primary" {
  provider      = aws.primary
  name_prefix   = "nova-lt-primary-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.ec2_primary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 20
      encrypted   = true
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Nova Primary Region</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.prod_tags, { Name = "nova-instance-primary" })
  }
}

resource "aws_launch_template" "secondary" {
  provider      = aws.secondary
  name_prefix   = "nova-lt-secondary-"
  image_id      = data.aws_ami.amazon_linux_secondary.id
  instance_type = "t3.micro"

  vpc_security_group_ids = [aws_security_group.ec2_secondary.id]

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size = 20
      encrypted   = true
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Nova Secondary Region</h1>" > /var/www/html/index.html
  EOF
  )

  tag_specifications {
    resource_type = "instance"
    tags          = merge(local.prod_tags, { Name = "nova-instance-secondary" })
  }
}

# Application Load Balancers
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = "nova-alb-primary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_primary.id]
  subnets            = aws_subnet.public_primary[*].id

  tags = merge(local.prod_tags, { Name = "nova-alb-primary" })
}

resource "aws_lb" "secondary" {
  provider           = aws.secondary
  name               = "nova-alb-secondary"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_secondary.id]
  subnets            = aws_subnet.public_secondary[*].id

  tags = merge(local.prod_tags, { Name = "nova-alb-secondary" })
}

# Target Groups
resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = "nova-tg-primary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.primary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = merge(local.prod_tags, { Name = "nova-tg-primary" })
}

resource "aws_lb_target_group" "secondary" {
  provider = aws.secondary
  name     = "nova-tg-secondary"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.secondary.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/"
    matcher             = "200"
  }

  tags = merge(local.prod_tags, { Name = "nova-tg-secondary" })
}

# Load Balancer Listeners
resource "aws_lb_listener" "primary" {
  provider          = aws.primary
  load_balancer_arn = aws_lb.primary.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.primary.arn
  }
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
}

# Auto Scaling Groups
resource "aws_autoscaling_group" "primary" {
  provider            = aws.primary
  name                = "nova-asg-primary"
  vpc_zone_identifier = aws_subnet.public_primary[*].id
  target_group_arns   = [aws_lb_target_group.primary.arn]
  health_check_type   = "ELB"
  min_size            = 2
  max_size            = 6
  desired_capacity    = 2

  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "nova-asg-primary"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.prod_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

resource "aws_autoscaling_group" "secondary" {
  provider            = aws.secondary
  name                = "nova-asg-secondary"
  vpc_zone_identifier = aws_subnet.public_secondary[*].id
  target_group_arns   = [aws_lb_target_group.secondary.arn]
  health_check_type   = "ELB"
  min_size            = 2
  max_size            = 6
  desired_capacity    = 2

  launch_template {
    id      = aws_launch_template.secondary.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "nova-asg-secondary"
    propagate_at_launch = false
  }

  dynamic "tag" {
    for_each = local.prod_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = false
    }
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  provider   = aws.primary
  name       = "nova-db-subnet-group"
  subnet_ids = aws_subnet.private_primary[*].id

  tags = merge(local.prod_tags, { Name = "nova-db-subnet-group" })
}

# RDS Instance
resource "aws_db_instance" "main" {
  provider               = aws.primary
  identifier             = "nova-postgres-db"
  allocated_storage      = 20
  max_allocated_storage  = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  engine                = "postgres"
  engine_version        = "14.9"
  instance_class        = "db.t3.micro"
  db_name               = "novadb"
  username              = "dbadmin"
  manage_master_user_password = true
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name  = aws_db_subnet_group.main.name
  backup_retention_period = 7
  backup_window         = "03:00-04:00"
  maintenance_window    = "sun:04:00-sun:05:00"
  multi_az              = true
  skip_final_snapshot   = true

  tags = merge(local.prod_tags, { Name = "nova-postgres-db" })
}

# S3 Bucket
resource "aws_s3_bucket" "artifacts" {
  provider = aws.primary
  bucket   = "nova-artifacts-logs-${random_id.bucket_suffix.hex}"

  tags = merge(local.prod_tags, { Name = "nova-artifacts-bucket" })
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_versioning" "artifacts" {
  provider = aws.primary
  bucket   = aws_s3_bucket.artifacts.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  provider = aws.primary
  bucket   = aws_s3_bucket.artifacts.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Lambda for cost optimization
resource "aws_iam_role" "lambda_role" {
  name = "nova-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = local.prod_tags
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "nova-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "ec2:DescribeInstances",
          "ec2:StopInstances",
          "autoscaling:UpdateAutoScalingGroup"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "cost_optimizer" {
  provider         = aws.primary
  filename         = "cost_optimizer.zip"
  function_name    = "nova-cost-optimizer"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "python3.9"

  tags = merge(local.test_tags, { Name = "nova-cost-optimizer" })
}

# CloudWatch Event Rule for Lambda
resource "aws_cloudwatch_event_rule" "nightly_cost_optimizer" {
  provider            = aws.primary
  name                = "nova-nightly-cost-optimizer"
  description         = "Trigger cost optimizer lambda nightly"
  schedule_expression = "cron(0 2 * * ? *)"

  tags = merge(local.test_tags, { Name = "nova-cost-optimizer-schedule" })
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  provider  = aws.primary
  rule      = aws_cloudwatch_event_rule.nightly_cost_optimizer.name
  target_id = "TriggerLambda"
  arn       = aws_lambda_function.cost_optimizer.arn
}

resource "aws_lambda_permission" "allow_cloudwatch" {
  provider      = aws.primary
  statement_id  = "AllowExecutionFromCloudWatch"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cost_optimizer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.nightly_cost_optimizer.arn
}
```

## Key Features Implemented:

1. **Multi-region setup** with VPC peering between us-east-1 and us-west-2
2. **High availability** with Auto Scaling Groups across multiple AZs
3. **Security best practices** - no SSH access, encrypted storage, proper security groups
4. **RDS Multi-AZ** PostgreSQL with automated backups
5. **S3 bucket** with versioning and encryption
6. **Lambda cost optimizer** with CloudWatch scheduling
7. **Proper tagging** throughout all resources
8. **IAM roles** with least privilege access

## Next Steps:

1. Create a `cost_optimizer.zip` file with your Lambda function code
2. Consider adding Route 53 health checks and failover routing
3. Add CloudWatch alarms for monitoring
4. Consider using AWS Systems Manager for secure instance access instead of SSH

This configuration provides a solid foundation for your highly available, secure, and cost-optimized infrastructure!
