terraform {
  backend "s3" {
    # Backend config is provided at init (e.g. -backend-config)
  }
}

#######################
# Variables with Validation
#######################

variable "author" {
  description = "The author of the infrastructure"
  type        = string
  default     = "ngwakoleslieelijah"

  validation {
    condition     = length(var.author) > 0
    error_message = "Author name must not be empty."
  }
}

variable "created_date" {
  description = "The date when the infrastructure was created"
  type        = string
  default     = "2025-08-17"

  validation {
    condition     = can(regex("^\\d{4}-\\d{2}-\\d{2}$", var.created_date))
    error_message = "Created date must be in YYYY-MM-DD format."
  }
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev/staging/prod)"
  type        = string
  default     = "dev"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "tap-app"
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "EC2 key pair name (optional)"
  type        = string
  default     = ""
}

variable "db_username" {
  description = "Database master username (min 8 chars)"
  type        = string
  sensitive   = true
  default     = "database_admin"

  validation {
    condition     = length(var.db_username) >= 8
    error_message = "Database username must be at least 8 characters."
  }
}

variable "vpc_cidr" {
  description = "VPC CIDR"
  type        = string
  default     = "10.0.0.0/16"
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 7
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 90
}

variable "enable_waf" {
  description = "Enable WAF"
  type        = bool
  default     = true
}

variable "db_engine" {
  description = "DB engine"
  type        = string
  default     = "mysql"
}

variable "db_engine_version" {
  description = "DB engine version"
  type        = string
  default     = "8.0"
}

variable "db_instance_class" {
  description = "DB instance class"
  type        = string
  default     = "db.t3.micro"
}

variable "db_allocated_storage" {
  description = "DB allocated storage (GB)"
  type        = number
  default     = 20
}

variable "db_multi_az" {
  description = "Enable Multi-AZ for RDS"
  type        = bool
  default     = true
}

variable "allowed_ips" {
  description = "Allowed IPs for bastion (CIDR list)"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "notification_email" {
  description = "Email for notifications"
  type        = string
  default     = "security@example.com"
}

# --- ADDED / FIXES variables ---
variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights (only for supported instance classes)"
  type        = bool
  default     = false
}

variable "route53_zone_id" {
  description = "Route53 Hosted Zone ID for automatic ACM validation. Leave empty to validate externally."
  type        = string
  default     = ""
}

variable "manage_config_recorder" {
  description = "If true Terraform will create/manage AWS Config recorder/delivery channel. If your account already has one, set to false and import."
  type        = bool
  default     = false
}

#######################
# Random resources
#######################

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "random_password" "db_password" {
  length           = 24
  special          = true
  override_special = "!#$%&*()-_=+[]{}<>:?"
  lifecycle {
    ignore_changes = all
  }
}

#######################
# Locals
#######################

locals {
  timestamp   = formatdate("YYYYMMDDHHmmss", timestamp())
  name_prefix = "${substr(var.project_name, 0, 3)}-${var.environment}-${local.timestamp}-${random_string.suffix.result}"

  common_tags = {
    Environment        = var.environment
    Project            = var.project_name
    ManagedBy          = "Terraform"
    CreatedBy          = var.author
    CreatedDate        = var.created_date
    DeployTime         = local.timestamp
    Compliance         = "Enterprise-v2.0"
    CostCenter         = "IT-${upper(var.environment)}"
    SecurityScan       = "Required"
    DataClassification = "Confidential"
  }

  vpc_cidr             = var.vpc_cidr
  public_subnets_cidr  = [cidrsubnet(local.vpc_cidr, 8, 0), cidrsubnet(local.vpc_cidr, 8, 1), cidrsubnet(local.vpc_cidr, 8, 2)]
  private_subnets_cidr = [cidrsubnet(local.vpc_cidr, 8, 10), cidrsubnet(local.vpc_cidr, 8, 11), cidrsubnet(local.vpc_cidr, 8, 12)]
  db_subnets_cidr      = [cidrsubnet(local.vpc_cidr, 8, 20), cidrsubnet(local.vpc_cidr, 8, 21), cidrsubnet(local.vpc_cidr, 8, 22)]

  http_port  = 80
  https_port = 443
  ssh_port   = 22
  db_port    = var.db_engine == "mysql" ? 3306 : 5432

  logs_bucket_name = "${local.name_prefix}-logs"

  config_rules = {
    "encrypted-volumes"       = "ENCRYPTED_VOLUMES"
    "rds-storage-encrypted"   = "RDS_STORAGE_ENCRYPTED"
    "restricted-ssh"          = "INCOMING_SSH_DISABLED"
    "root-mfa-enabled"        = "ROOT_ACCOUNT_MFA_ENABLED"
  }
}

#######################
# Data sources
#######################

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
data "aws_partition" "current" {}
data "aws_elb_service_account" "elb_account" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_ami" "amazon_linux" {
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

#######################
# Security Module
#######################

module "security" {
  source                 = "./modules/security"
  name_prefix            = local.name_prefix
  common_tags            = local.common_tags
  vpc_id                 = aws_vpc.main.id
  allowed_ips            = var.allowed_ips
  private_subnets_cidr   = local.private_subnets_cidr
  db_port                = local.db_port
  http_port              = local.http_port
  https_port             = local.https_port
  ssh_port               = local.ssh_port
  enable_waf             = var.enable_waf
  manage_config_recorder = var.manage_config_recorder
  logs_bucket_arn        = module.data.logs_bucket_arn
  logs_bucket_id         = module.data.logs_bucket_id
  alb_arn                = aws_lb.main.arn
}

#######################
# VPC & Networking
#######################

resource "aws_vpc" "main" {
  cidr_block           = local.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = merge(local.common_tags, { Name = "${local.name_prefix}-vpc" })
}

resource "aws_flow_log" "vpc_flow_log" {
  vpc_id               = aws_vpc.main.id
  log_destination      = module.data.logs_bucket_arn
  log_destination_type = "s3"
  traffic_type         = "ALL"
  tags                 = merge(local.common_tags, { Name = "${local.name_prefix}-vpc-flow-log" })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-igw" })
}

resource "aws_subnet" "public" {
  count                   = length(local.public_subnets_cidr)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = local.public_subnets_cidr[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  map_public_ip_on_launch = true
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-pub-${count.index + 1}", Tier = "public" })
}

resource "aws_subnet" "private" {
  count             = length(local.private_subnets_cidr)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnets_cidr[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-priv-${count.index + 1}", Tier = "private" })
}

resource "aws_subnet" "database" {
  count             = length(local.db_subnets_cidr)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.db_subnets_cidr[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-db-${count.index + 1}", Tier = "database" })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-pub-rt" })
}

resource "aws_route_table_association" "public" {
  count          = length(aws_subnet.public)
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  count  = length(aws_subnet.public)
  domain = "vpc"
  tags   = merge(local.common_tags, { Name = "${local.name_prefix}-nat-eip-${count.index + 1}" })
  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  count         = length(aws_subnet.public)
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id
  tags          = merge(local.common_tags, { Name = "${local.name_prefix}-nat-${count.index + 1}" })
  depends_on    = [aws_internet_gateway.main]
}

resource "aws_route_table" "private" {
  count  = length(aws_nat_gateway.main)
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-priv-rt-${count.index + 1}" })
}

resource "aws_route_table_association" "private" {
  count          = length(aws_subnet.private)
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index % length(aws_route_table.private)].id
}

resource "aws_route_table" "database" {
  count  = length(aws_nat_gateway.main)
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-db-rt-${count.index + 1}" })
}

resource "aws_route_table_association" "database" {
  count          = length(aws_subnet.database)
  subnet_id      = aws_subnet.database[count.index].id
  route_table_id = aws_route_table.database[count.index % length(aws_route_table.database)].id
}

resource "aws_network_acl" "public" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.public[*].id

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = local.http_port
    to_port    = local.http_port
  }
  ingress {
    protocol   = "tcp"
    rule_no    = 110
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = local.https_port
    to_port    = local.https_port
  }
  ingress {
    protocol   = "tcp"
    rule_no    = 120
    action     = "allow"
    cidr_block = "0.0.0.0/0"
    from_port  = local.ssh_port
    to_port    = local.ssh_port
  }
  ingress {
    protocol   = "tcp"
    rule_no    = 130
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
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-pub-nacl" })
}

resource "aws_network_acl" "private" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.private[*].id

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = local.vpc_cidr
    from_port  = 0
    to_port    = 65535
  }
  ingress {
    protocol   = "tcp"
    rule_no    = 200
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
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-priv-nacl" })
}

resource "aws_network_acl" "database" {
  vpc_id     = aws_vpc.main.id
  subnet_ids = aws_subnet.database[*].id

  ingress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = local.vpc_cidr
    from_port  = local.db_port
    to_port    = local.db_port
  }
  ingress {
    protocol   = "tcp"
    rule_no    = 200
    action     = "allow"
    cidr_block = local.vpc_cidr
    from_port  = 1024
    to_port    = 65535
  }
  egress {
    protocol   = "tcp"
    rule_no    = 100
    action     = "allow"
    cidr_block = local.vpc_cidr
    from_port  = 1024
    to_port    = 65535
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-db-nacl" })
}



#######################
# Monitoring Module
#######################

module "monitoring" {
  source                  = "./modules/monitoring"
  name_prefix             = local.name_prefix
  common_tags             = local.common_tags
  log_retention_days      = var.log_retention_days
  kms_key_main_arn        = module.security.kms_key_main_arn
  notification_email      = var.notification_email
  autoscaling_group_name  = aws_autoscaling_group.web.name
  alb_arn_suffix          = aws_lb.main.arn_suffix
  web_scale_up_policy_arn = aws_autoscaling_policy.web_scale_up.arn
}

#######################
# Data Module
#######################

module "data" {
  source                      = "./modules/data"
  name_prefix                 = local.name_prefix
  common_tags                 = local.common_tags
  kms_key_main_arn            = module.security.kms_key_main_arn
  kms_key_rds_arn             = module.security.kms_key_rds_arn
  db_subnet_ids               = aws_subnet.database[*].id
  db_engine                   = var.db_engine
  db_engine_version           = var.db_engine_version
  db_instance_class           = var.db_instance_class
  db_allocated_storage        = var.db_allocated_storage
  db_username                 = var.db_username
  db_password                 = random_password.db_password.result
  db_port                     = local.db_port
  db_multi_az                 = var.db_multi_az
  sg_db_id                    = module.security.sg_db_id
  backup_retention_days       = var.backup_retention_days
  environment                 = var.environment
  enable_performance_insights = var.enable_performance_insights
  rds_monitoring_role_arn     = module.security.rds_monitoring_role_arn
  logs_bucket_name            = local.logs_bucket_name
  elb_service_account_arn     = data.aws_elb_service_account.elb_account.arn
  aws_account_id              = data.aws_caller_identity.current.account_id
  aws_region_name             = data.aws_region.current.name
}

#######################
# ALB & ACM
#######################

resource "aws_acm_certificate" "main" {
  domain_name       = "${local.name_prefix}.example.com"
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
  tags = merge(local.common_tags, { Name = "${local.name_prefix}-cert" })
}

# Route53 validation records: create one record per domain_validation_options entry (safe iteration)
resource "aws_route53_record" "acm_validation" {
  for_each = var.route53_zone_id != "" ? { for dvo in aws_acm_certificate.main.domain_validation_options : dvo.domain_name => dvo } : {}

  zone_id = var.route53_zone_id
  name    = each.value.resource_record_name
  type    = each.value.resource_record_type
  ttl     = 300
  records = [each.value.resource_record_value]
}

resource "aws_acm_certificate_validation" "main" {
  count           = var.route53_zone_id != "" ? 1 : 0
  certificate_arn = aws_acm_certificate.main.arn
  validation_record_fqdns = [for rec in aws_route53_record.acm_validation : rec.fqdn]
}

resource "aws_lb" "main" {
  name               = "${local.name_prefix}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [module.security.sg_alb_id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection       = var.environment == "prod"
  drop_invalid_header_fields       = true
  enable_cross_zone_load_balancing = true

  access_logs {
    bucket  = module.data.logs_bucket_id
    prefix  = "alb-logs"
    enabled = true
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-alb" })
}

# Keep target group name short to satisfy <= 32 char limit
resource "aws_lb_target_group" "http" {
  name     = "${local.name_prefix}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    timeout             = 5
    matcher             = "200"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-http-tg" })
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
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

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.http.arn
  }
}

#######################
# Launch Template & ASG
#######################

resource "aws_launch_template" "web" {
  name_prefix   = "${local.name_prefix}-web-"
  image_id      = data.aws_ami.amazon_linux.id
  instance_type = var.instance_type

  user_data = base64encode(<<-EOF
    #!/bin/bash
    set -e
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
    yum update -y
    yum install -y httpd amazon-cloudwatch-agent amazon-ssm-agent jq awslogs
    cat > /var/www/html/index.html <<'HTML'
    <html><body><h1>Hello from ${local.name_prefix}</h1><p>Created by: ${var.author}</p></body></html>
    HTML
    echo "OK" > /var/www/html/health
    systemctl enable httpd; systemctl start httpd
    systemctl enable amazon-ssm-agent; systemctl start amazon-ssm-agent
    systemctl enable amazon-cloudwatch-agent; systemctl start amazon-cloudwatch-agent
  EOF
  )

  iam_instance_profile { name = module.security.ec2_instance_profile_name }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [module.security.sg_web_id]
    delete_on_termination       = true
  }

  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp3"
      encrypted             = true
      kms_key_id            = module.security.kms_key_main_arn
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
    instance_metadata_tags      = "enabled"
  }

  monitoring { enabled = true }

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, { Name = "${local.name_prefix}-web" })
  }

  tag_specifications {
    resource_type = "volume"
    tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-volume" })
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-web-lt" })
}

resource "aws_autoscaling_group" "web" {
  name_prefix               = "${local.name_prefix}-web-asg-"
  max_size                  = 4
  min_size                  = 2
  desired_capacity          = 2
  health_check_grace_period = 300
  health_check_type         = "ELB"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.http.arn]

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  termination_policies = ["OldestLaunchTemplate", "OldestInstance"]

  enabled_metrics = ["GroupMinSize","GroupMaxSize","GroupDesiredCapacity","GroupInServiceInstances","GroupPendingInstances","GroupStandbyInstances","GroupTerminatingInstances","GroupTotalInstances"]

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup        = 300
    }
    triggers = ["tag"]
  }

  dynamic "tag" {
    for_each = merge(local.common_tags, { Name = "${local.name_prefix}-web" })
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle { create_before_destroy = true }

  depends_on = [aws_lb_target_group.http, aws_launch_template.web]
}

resource "aws_autoscaling_policy" "web_scale_up" {
  name                   = "${local.name_prefix}-web-scale-up"
  autoscaling_group_name = aws_autoscaling_group.web.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  cooldown               = 300
}

resource "aws_autoscaling_policy" "web_scale_down" {
  name                   = "${local.name_prefix}-web-scale-down"
  autoscaling_group_name = aws_autoscaling_group.web.name
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  cooldown               = 300
}

#######################
# Bastion
#######################

resource "aws_instance" "bastion" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = "t3.micro"
  subnet_id              = aws_subnet.public[0].id
  vpc_security_group_ids = [module.security.sg_bastion_id]
  iam_instance_profile   = module.security.ec2_instance_profile_name
  key_name               = var.key_pair_name

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 10
    encrypted             = true
    kms_key_id            = module.security.kms_key_main_arn
    delete_on_termination = true
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y amazon-ssm-agent
    systemctl enable amazon-ssm-agent
    systemctl start amazon-ssm-agent
  EOF

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-bastion" })
}



# Modify the launch template for faster bootstrapping
resource "aws_launch_template" "web" {
  # ... (previous configuration remains the same)

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Enable faster package installation with multiple connections
    echo 'max_parallel_downloads=10' >> /etc/yum.conf
    
    # Update only security packages instead of all packages
    yum update-minimal --security -y
    
    # Install required packages
    yum install -y httpd amazon-cloudwatch-agent amazon-ssm-agent
    
    # Create a basic health check page
    echo "OK" > /var/www/html/health
    
    # Create index page
    cat > /var/www/html/index.html <<'HTML'
    <html><body><h1>Hello from ${local.name_prefix}</h1><p>Created by: ${var.author}</p></body></html>
    HTML
    
    # Start services in parallel
    systemctl enable --now httpd amazon-ssm-agent amazon-cloudwatch-agent
  EOF
  )

  # ... (rest of launch template configuration remains the same)
}

# Modify the target group for faster health checks
resource "aws_lb_target_group" "http" {
  name     = "${substr(local.name_prefix, 0, 27)}-tg"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id

  health_check {
    enabled             = true
    interval            = 15    # Reduced from 30
    path                = "/health"
    port                = "traffic-port"
    healthy_threshold   = 2     # Reduced from 3
    unhealthy_threshold = 2     # Reduced from 3
    timeout             = 5
    matcher             = "200"
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-http-tg" })
}

# Optimize the ASG configuration
resource "aws_autoscaling_group" "web" {
  name_prefix               = "${local.name_prefix}-web-asg-"
  max_size                  = 4
  min_size                  = 2
  desired_capacity          = 2
  health_check_grace_period = 90  # Reduced from 300
  health_check_type         = "ELB"
  vpc_zone_identifier       = aws_subnet.private[*].id
  target_group_arns         = [aws_lb_target_group.http.arn]

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
      instance_warmup       = 90  # Reduced from 300
    }
    triggers = ["tag"]
  }

  # Improved scaling configuration
  capacity_rebalance = true
  
  # Use mixed instances policy for faster launches
  mixed_instances_policy {
    launch_template {
      launch_template_specification {
        launch_template_id = aws_launch_template.web.id
        version           = "$Latest"
      }
      
      override {
        instance_type = var.instance_type
      }
    }
    instances_distribution {
      on_demand_base_capacity                  = 0
      on_demand_percentage_above_base_capacity = 100
      spot_allocation_strategy                 = "capacity-optimized"
    }
  }

  timeouts {
    create = "10m"  # Reduced from 20m since we optimized the process
    delete = "10m"
  }

  dynamic "tag" {
    for_each = merge(local.common_tags, { Name = "${local.name_prefix}-web" })
    content {
      key                 = tag.key
      value              = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    create_before_destroy = true
    ignore_changes        = [desired_capacity]
  }

  depends_on = [aws_lb_target_group.http]
}

# Add warm pool to maintain pre-initialized instances
resource "aws_autoscaling_group_warm_pool" "web" {
  auto_scaling_group_name = aws_autoscaling_group.web.name
  
  pool_state  = "Stopped"
  min_size    = 1
  max_group_prepared_capacity = 2

  instance_reuse_policy {
    reuse_on_scale_in = true
  }
}
#######################
# Outputs
#######################

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

output "alb_dns_name" {
  description = "ALB DNS"
  value       = aws_lb.main.dns_name
}

output "bastion_public_ip" {
  description = "Bastion public IP"
  value       = aws_instance.bastion.public_ip
}

output "db_endpoint" {
  description = "RDS endpoint"
  value       = module.data.db_instance_endpoint
  sensitive   = true
}

output "web_asg_name" {
  description = "Web ASG name"
  value       = aws_autoscaling_group.web.name
}

output "logs_bucket" {
  description = "S3 logs bucket"
  value       = module.data.logs_bucket_id
}
