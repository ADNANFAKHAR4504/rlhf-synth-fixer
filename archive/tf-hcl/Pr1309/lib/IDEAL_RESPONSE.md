# Multi-Region High Availability Infrastructure - Production Ready Solution

## Overview
This Terraform configuration deploys a highly available, multi-region infrastructure across AWS with automatic failover capabilities at both zone and region levels.

## Infrastructure Components

### 1. Provider Configuration (`provider.tf`)
```hcl
terraform {
  required_version = ">= 1.4.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = ">= 3.1"
    }
  }
  
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region_primary
  alias  = "primary"
}

provider "aws" {
  region = var.aws_region_secondary
  alias  = "secondary"
}

provider "aws" {
  region = "us-west-2"
  alias  = "arc"
}
```

### 2. Networking (`vpc.tf`)
```hcl
# Primary VPC
resource "aws_vpc" "primary" {
  provider             = aws.primary
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-primary-vpc"
  })
}

# Single NAT Gateway per region for cost optimization
resource "aws_nat_gateway" "primary" {
  provider      = aws.primary
  count         = 1
  allocation_id = aws_eip.primary_nat[0].id
  subnet_id     = aws_subnet.primary_public[0].id
  
  depends_on = [aws_internet_gateway.primary]
}

# Private subnets across multiple AZs
resource "aws_subnet" "primary_private" {
  provider          = aws.primary
  count             = min(3, length(data.aws_availability_zones.primary.names))
  vpc_id            = aws_vpc.primary.id
  cidr_block        = cidrsubnet(aws_vpc.primary.cidr_block, 8, count.index + 10)
  availability_zone = data.aws_availability_zones.primary.names[count.index]
}
```

### 3. Load Balancing (`alb.tf`)
```hcl
resource "aws_lb" "primary" {
  provider           = aws.primary
  name               = substr("${local.resource_prefix}-p-alb", 0, 32)
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.primary_alb.id]
  subnets            = aws_subnet.primary_public[*].id
  
  enable_deletion_protection       = false
  enable_cross_zone_load_balancing = true
}

resource "aws_lb_target_group" "primary" {
  provider = aws.primary
  name     = substr("${local.resource_prefix}-p-tg", 0, 32)
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
}
```

### 4. Auto Scaling (`auto-scaling.tf`)
```hcl
resource "aws_launch_template" "primary" {
  provider      = aws.primary
  name          = "${local.resource_prefix}-primary-lt"
  image_id      = data.aws_ami.amazon_linux_primary.id
  instance_type = var.instance_type
  
  vpc_security_group_ids = [aws_security_group.primary_ec2.id]
  
  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_profile.name
  }
  
  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    region       = var.aws_region_primary
    project_name = local.resource_prefix
  }))
}

resource "aws_autoscaling_group" "primary" {
  provider                  = aws.primary
  name                      = "${local.resource_prefix}-primary-asg"
  vpc_zone_identifier       = aws_subnet.primary_private[*].id
  target_group_arns         = [aws_lb_target_group.primary.arn]
  health_check_type         = "ELB"
  health_check_grace_period = 300
  min_size                  = var.min_size
  max_size                  = var.max_size
  desired_capacity          = var.desired_capacity
  
  launch_template {
    id      = aws_launch_template.primary.id
    version = "$Latest"
  }
}
```

### 5. Database (`rds.tf`)
```hcl
resource "aws_db_instance" "primary" {
  provider              = aws.primary
  identifier            = "${local.resource_prefix}-primary-db"
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  engine                = "mysql"
  engine_version        = "8.0"
  instance_class        = var.db_instance_class
  db_name               = var.db_name
  username              = var.db_username
  password              = random_password.db_password.result
  
  multi_az                     = true
  backup_retention_period      = 7
  backup_window                = "03:00-04:00"
  maintenance_window           = "sun:04:00-sun:05:00"
  
  vpc_security_group_ids = [aws_security_group.primary_rds.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  
  performance_insights_enabled = false  # Disabled for t3.micro
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_enhanced_monitoring.arn
  
  storage_encrypted     = true
  skip_final_snapshot   = true
  copy_tags_to_snapshot = true
}

resource "aws_db_instance" "secondary_replica" {
  provider            = aws.secondary
  identifier          = "${local.resource_prefix}-secondary-replica"
  replicate_source_db = aws_db_instance.primary.identifier
  
  instance_class             = var.db_instance_class
  auto_minor_version_upgrade = false
  
  vpc_security_group_ids = [aws_security_group.secondary_rds.id]
  
  performance_insights_enabled = false
  monitoring_interval          = 60
  monitoring_role_arn          = aws_iam_role.rds_enhanced_monitoring.arn
  
  skip_final_snapshot = true
}
```

### 6. Route53 and DNS (`route53.tf`)
```hcl
resource "aws_route53_zone" "main" {
  name = "${local.resource_prefix}.internal.local"
  
  tags = merge(local.common_tags, {
    Name = "${local.resource_prefix}-zone"
  })
}

resource "aws_route53_health_check" "primary_alb" {
  fqdn                            = aws_lb.primary.dns_name
  port                            = 80
  type                            = "HTTP"
  resource_path                   = "/"
  failure_threshold               = 3
  request_interval                = 30
  cloudwatch_alarm_region         = var.aws_region_primary
  cloudwatch_alarm_name           = aws_cloudwatch_metric_alarm.primary_alb_health.alarm_name
  insufficient_data_health_status = "Unhealthy"
}

resource "aws_route53_record" "primary" {
  zone_id        = aws_route53_zone.main.zone_id
  name           = "${local.resource_prefix}.internal.local"
  type           = "A"
  set_identifier = "primary"
  
  weighted_routing_policy {
    weight = 100
  }
  
  health_check_id = aws_route53_health_check.primary_alb.id
  
  alias {
    name                   = aws_lb.primary.dns_name
    zone_id                = aws_lb.primary.zone_id
    evaluate_target_health = true
  }
}
```

### 7. Application Recovery Controller (`arc.tf`)
```hcl
resource "aws_route53recoverycontrolconfig_cluster" "main" {
  provider = aws.arc
  name     = "${local.resource_prefix}-cluster"
}

resource "aws_route53recoverycontrolconfig_control_panel" "main" {
  provider    = aws.arc
  name        = "${local.resource_prefix}-control-panel"
  cluster_arn = aws_route53recoverycontrolconfig_cluster.main.arn
}

resource "aws_route53recoverycontrolconfig_routing_control" "primary" {
  provider          = aws.arc
  name              = "${local.resource_prefix}-primary-routing"
  cluster_arn       = aws_route53recoverycontrolconfig_cluster.main.arn
  control_panel_arn = aws_route53recoverycontrolconfig_control_panel.main.arn
}

resource "aws_route53recoverycontrolconfig_safety_rule" "assertion" {
  provider          = aws.arc
  name              = "${local.resource_prefix}-assertion-rule"
  control_panel_arn = aws_route53recoverycontrolconfig_control_panel.main.arn
  
  rule_config {
    inverted  = false
    threshold = 1
    type      = "ATLEAST"
  }
  
  asserted_controls = [
    aws_route53recoverycontrolconfig_routing_control.primary.arn,
    aws_route53recoverycontrolconfig_routing_control.secondary.arn
  ]
  
  wait_period_ms = 5000
}

resource "aws_route53recoveryreadiness_recovery_group" "main" {
  recovery_group_name = "${local.resource_prefix}-recovery-group"
  
  cells = [
    aws_route53recoveryreadiness_cell.primary.arn,
    aws_route53recoveryreadiness_cell.secondary.arn
  ]
  
  tags = local.common_tags
}
```

### 8. Monitoring and Alerting (`sns.tf`)
```hcl
resource "aws_sns_topic" "alerts" {
  provider = aws.primary
  name     = "${local.resource_prefix}-alerts"
  
  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "primary_alb_health" {
  provider            = aws.primary
  alarm_name          = "${local.resource_prefix}-primary-alb-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This metric monitors ALB healthy hosts"
  alarm_actions       = [aws_sns_topic.alerts.arn]
  
  dimensions = {
    LoadBalancer = aws_lb.primary.arn_suffix
    TargetGroup  = aws_lb_target_group.primary.arn_suffix
  }
}
```

### 9. Environment Configuration (`locals.tf`)
```hcl
locals {
  environment_suffix = coalesce(
    var.environment_suffix != "" ? var.environment_suffix : null,
    "synthtrainr861"
  )
  
  resource_prefix = "${var.project_name}-${local.environment_suffix}"
  
  common_tags = merge(var.common_tags, {
    EnvironmentSuffix = local.environment_suffix
  })
}

variable "environment_suffix" {
  description = "Suffix for resource names to ensure uniqueness"
  type        = string
  default     = ""
}
```

## Key Features

### High Availability
- Multi-AZ deployment in each region
- Auto Scaling Groups with health checks
- RDS Multi-AZ with automatic failover
- Cross-region read replicas

### Disaster Recovery
- AWS Application Recovery Controller for coordinated failover
- Route53 health checks with weighted routing
- Safety rules to prevent split-brain scenarios
- Recovery readiness checks

### Monitoring
- CloudWatch alarms for all critical metrics
- SNS notifications for alerts
- Enhanced RDS monitoring
- ALB health checks

### Security
- Security groups with least privilege access
- Encrypted RDS storage
- Secrets Manager for database passwords
- Private subnets for compute resources

### Cost Optimization
- Single NAT gateway per region
- t3.medium instances for compute
- db.t3.micro for RDS (development)
- Proper resource tagging for cost tracking

## Deployment Instructions

1. Set environment variables:
```bash
export TF_VAR_environment_suffix="your-suffix"
export AWS_REGION=us-west-2
```

2. Initialize Terraform:
```bash
terraform init \
  -backend-config="bucket=your-state-bucket" \
  -backend-config="key=terraform.tfstate" \
  -backend-config="region=us-east-1"
```

3. Plan deployment:
```bash
terraform plan -out=tfplan
```

4. Apply configuration:
```bash
terraform apply tfplan
```

## Testing

Run unit tests:
```bash
npm run test:unit
```

Run integration tests:
```bash
npm run test:integration
```

## Cleanup

To destroy all resources:
```bash
terraform destroy -auto-approve
```

## Production Considerations

1. **Instance Sizing**: Upgrade from t3.micro to larger instances for production workloads
2. **Backup Strategy**: Implement automated backups with longer retention
3. **Monitoring**: Add application-level monitoring and custom metrics
4. **Security**: Implement WAF, GuardDuty, and Security Hub
5. **Compliance**: Enable AWS Config rules for compliance checking