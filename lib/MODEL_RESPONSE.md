### Reasoning Trace
---

This is a comprehensive payment processing application migration project. The user is asking me to explain how to approach this project using Terraform to migrate from development to production. Let me break down the key aspects and provide a structured approach.

The project involves:
1. Setting up production infrastructure for a payment processing application
2. Ensuring zero downtime migration
3. Meeting financial industry security requirements
4. Using Terraform for infrastructure as code

I should provide:
- A structured approach to the migration
- Key Terraform configurations and examples
- Best practices for handling sensitive financial data
- Migration strategy with zero downtime
- Security considerations

Let me structure my response to cover all these aspects comprehensively.
### Answer 
---

# Payment Processing Application Migration Strategy

## 🎯 Migration Approach Overview

This migration requires a phased approach to ensure zero downtime and maintain data integrity. Here's the comprehensive strategy using Terraform:

## 📁 Project Structure

```
terraform-payment-migration/
├── environments/
│   ├── dev/
│   │   ├── terraform.tfvars
│   │   └── backend.tf
│   └── prod/
│       ├── terraform.tfvars
│       └── backend.tf
├── modules/
│   ├── networking/
│   ├── database/
│   ├── ecs/
│   ├── load_balancer/
│   ├── security/
│   └── monitoring/
├── scripts/
│   └── data_migration/
└── main.tf
```

## 🔧 Core Terraform Modules

### 1. **Networking Module**

```hcl
# modules/networking/main.tf
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "${var.environment}-payment-vpc"
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

# Public Subnets for Load Balancers
resource "aws_subnet" "public" {
  count                   = 3
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.environment}-public-subnet-${count.index + 1}"
    Type = "Public"
  }
}

# Private Subnets for ECS and RDS
resource "aws_subnet" "private" {
  count             = 3
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + 3)
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.environment}-private-subnet-${count.index + 1}"
    Type = "Private"
  }
}

# NAT Gateways for outbound internet access
resource "aws_nat_gateway" "main" {
  count         = 3
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.environment}-nat-gateway-${count.index + 1}"
  }
}
```

### 2. **Database Module with Encryption**

```hcl
# modules/database/main.tf
resource "aws_kms_key" "rds" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 10

  tags = {
    Name        = "${var.environment}-rds-kms-key"
    Environment = var.environment
  }
}

resource "aws_db_subnet_group" "aurora" {
  name       = "${var.environment}-aurora-subnet-group"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name = "${var.environment}-aurora-subnet-group"
  }
}

resource "aws_rds_cluster" "aurora_postgresql" {
  cluster_identifier      = "${var.environment}-payment-aurora-cluster"
  engine                  = "aurora-postgresql"
  engine_version          = "13.7"
  database_name           = "payment_db"
  master_username         = "admin"
  master_password         = random_password.db_password.result
  
  # Security & Encryption
  storage_encrypted       = true
  kms_key_id             = aws_kms_key.rds.arn
  
  # Backup Configuration
  backup_retention_period = 30
  preferred_backup_window = "03:00-04:00"
  
  # High Availability
  db_subnet_group_name    = aws_db_subnet_group.aurora.name
  vpc_security_group_ids  = [aws_security_group.rds.id]
  
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.environment}-payment-aurora-final-snapshot-${timestamp()}"

  tags = {
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_rds_cluster_instance" "aurora_instances" {
  count              = 2  # Multi-AZ deployment
  identifier         = "${var.environment}-aurora-instance-${count.index}"
  cluster_identifier = aws_rds_cluster.aurora_postgresql.id
  instance_class     = "db.t3.micro"
  engine             = aws_rds_cluster.aurora_postgresql.engine
  engine_version     = aws_rds_cluster.aurora_postgresql.engine_version

  performance_insights_enabled = true
  monitoring_interval         = 60
  monitoring_role_arn        = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "${var.environment}-aurora-instance-${count.index}"
  }
}
```

### 3. **ECS Fargate Configuration**

```hcl
# modules/ecs/main.tf
resource "aws_ecs_cluster" "main" {
  name = "${var.environment}-payment-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_ecs_task_definition" "payment_app" {
  family                   = "${var.environment}-payment-app"
  network_mode            = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                     = "512"
  memory                  = "1024"
  execution_role_arn      = aws_iam_role.ecs_execution.arn
  task_role_arn          = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "payment-processor"
      image = "${var.ecr_repository_url}:${var.image_tag}"
      
      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]

      secrets = [
        {
          name      = "DB_PASSWORD"
          valueFrom = aws_ssm_parameter.db_password.arn
        },
        {
          name      = "API_KEY"
          valueFrom = aws_ssm_parameter.api_key.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = "/ecs/${var.environment}-payment-app"
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])
}

resource "aws_ecs_service" "payment_service" {
  name            = "${var.environment}-payment-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.payment_app.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.payment_app.arn
    container_name   = "payment-processor"
    container_port   = 8080
  }

  # Auto-scaling configuration
  lifecycle {
    ignore_changes = [desired_count]
  }
}

# Auto-scaling for ECS Service
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 2
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.payment_service.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_policy_cpu" {
  name               = "${var.environment}-cpu-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
```

### 4. **Load Balancer with WAF Protection**

```hcl
# modules/load_balancer/main.tf
resource "aws_lb" "main" {
  name               = "${var.environment}-payment-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = var.public_subnet_ids

  enable_deletion_protection = var.environment == "prod" ? true : false
  enable_http2              = true

  tags = {
    Environment = var.environment
    CostCenter  = var.cost_center
  }
}

resource "aws_lb_target_group" "payment_app" {
  name        = "${var.environment}-payment-tg"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    enabled             = true
    interval            = 30
    path                = "/health"
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.environment}-payment-target-group"
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.payment_app.arn
  }
}

# WAF Configuration for SQL Injection Protection
resource "aws_wafv2_web_acl" "payment_protection" {
  name  = "${var.environment}-payment-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  rule {
    name     = "SQLiProtection"
    priority = 1

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    action {
      block {}
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name               = "${var.environment}-sqli-protection"
      sampled_requests_enabled   = true
    }
  }
}

resource "aws_wafv2_web_acl_association" "alb" {
  resource_arn = aws_lb.main.arn
  web_acl_arn  = aws_wafv2_web_acl.payment_protection.arn
}
```

### 5. **Security & Parameter Store**

```hcl
# modules/security/main.tf
resource "aws_ssm_parameter" "db_password" {
  name        = "/${var.environment}/payment/db/password"
  description = "Database password for payment processing app"
  type        = "SecureString"
  value       = random_password.db_password.result
  key_id      = aws_kms_key.parameter_store.id

  tags = {
    Environment = var.environment
    Sensitive   = "true"
  }
}

resource "aws_security_group" "ecs" {
  name        = "${var.environment}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-ecs-security-group"
  }
}

resource "aws_security_group" "rds" {
  name        = "${var.environment}-rds-sg"
  description = "Security group for RDS database"
  vpc_id      = var.vpc_id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name = "${var.environment}-rds-security-group"
  }
}
```

## 📊 Monitoring Configuration

```hcl
# modules/monitoring/main.tf
resource "aws_cloudwatch_metric_alarm" "database_cpu" {
  alarm_name          = "${var.environment}-rds-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "CPUUtilization"
  namespace          = "AWS/RDS"
  period             = "300"
  statistic          = "Average"
  threshold          = "80"
  alarm_description  = "This metric monitors RDS CPU utilization"

  dimensions = {
    DBClusterIdentifier = aws_rds_cluster.aurora_postgresql.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

resource "aws_cloudwatch_metric_alarm" "ecs_service_health" {
  alarm_name          = "${var.environment}-ecs-service-unhealthy"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "HealthyHostCount"
  namespace          = "AWS/ApplicationELB"
  period             = "60"
  statistic          = "Average"
  threshold          = "1"

  dimensions = {
    TargetGroup  = aws_lb_target_group.payment_app.arn_suffix
    LoadBalancer = aws_lb.main.arn_suffix
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}
```

## 🔄 Zero-Downtime Migration Strategy

### Phase 1: Infrastructure Preparation
```bash
# Initialize and apply production infrastructure
cd environments/prod
terraform init
terraform plan -out=prod.tfplan
terraform apply prod.tfplan
```

### Phase 2: Data Migration Script
```python
# scripts/data_migration/migrate.py
import psycopg2
from psycopg2 import sql
import boto3
import logging

def migrate_data(source_conn_str, target_conn_str):
    """
    Migrate data with transaction support and rollback capability
    """
    source_conn = psycopg2.connect(source_conn_str)
    target_conn = psycopg2.connect(target_conn_str)
    
    try:
        # Begin transaction
        target_conn.autocommit = False
        
        # Copy schema and data
        with source_conn.cursor() as src_cur:
            with target_conn.cursor() as tgt_cur:
                # Migrate schema first
                src_cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
                tables = src_cur.fetchall()
                
                for table in tables:
                    # Copy table structure and data
                    copy_table_data(src_cur, tgt_cur, table[0])
        
        # Verify data integrity
        if verify_migration(source_conn, target_conn):
            target_conn.commit()
            logging.info("Migration completed successfully")
        else:
            target_conn.rollback()
            raise Exception("Data verification failed")
            
    except Exception as e:
        target_conn.rollback()
        logging.error(f"Migration failed: {str(e)}")
        raise
    finally:
        source_conn.close()
        target_conn.close()
```

### Phase 3: Traffic Shifting with Route53

```hcl
# Gradual traffic shifting configuration
resource "aws_route53_record" "weighted_dev" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "payment.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.dev.dns_name
    zone_id                = aws_lb.dev.zone_id
    evaluate_target_health = true
  }

  set_identifier = "dev"
  weighted_routing_policy {
    weight = var.dev_traffic_weight  # Start at 90, gradually reduce to 0
  }
}

resource "aws_route53_record" "weighted_prod" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "payment.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.prod.dns_name
    zone_id                = aws_lb.prod.zone_id
    evaluate_target_health = true
  }

  set_identifier = "prod"
  weighted_routing_policy {
    weight = var.prod_traffic_weight  # Start at 10, gradually increase to 100
  }
}
```
