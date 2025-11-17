# User data script for EC2 instances
locals {
  user_data = <<-EOF
    #!/bin/bash
    yum update -y
    yum install -y httpd postgresql15
    systemctl start httpd
    systemctl enable httpd

    # Basic health check endpoint
    cat > /var/www/html/health <<'HEALTH'
    OK
    HEALTH

    # Set hostname
    hostnamectl set-hostname app-${var.environment_suffix}
  EOF
}

# EC2 Auto Scaling Module
module "ec2_autoscaling" {
  source = "./modules/ec2-autoscaling"

  environment_suffix = var.environment_suffix
  vpc_id             = var.use_existing_vpc ? data.aws_vpc.existing[0].id : aws_vpc.main[0].id
  subnet_ids         = var.use_existing_vpc ? data.aws_subnets.private[0].ids : aws_subnet.private[*].id

  instance_type = var.ec2_instance_type
  ami_id        = var.ec2_ami_id != "" ? var.ec2_ami_id : data.aws_ami.amazon_linux_2.id

  min_size         = local.current_env.asg_min_size
  max_size         = local.current_env.asg_max_size
  desired_capacity = local.current_env.asg_desired

  security_group_ids = [aws_security_group.ec2.id]
  target_group_arns  = [aws_lb_target_group.app.arn]

  user_data = local.user_data

  tags = local.common_tags

  depends_on = [
    aws_lb_target_group.app,
    aws_nat_gateway.main
  ]
}

# RDS PostgreSQL Module
module "rds_postgres" {
  source = "./modules/rds-postgres"

  environment_suffix = var.environment_suffix
  vpc_id             = var.use_existing_vpc ? data.aws_vpc.existing[0].id : aws_vpc.main[0].id
  subnet_ids         = var.use_existing_vpc ? data.aws_subnets.private[0].ids : aws_subnet.private[*].id

  engine_version        = var.rds_engine_version
  instance_class        = local.current_env.rds_instance_class
  allocated_storage     = local.current_env.rds_storage
  max_allocated_storage = local.current_env.rds_storage * 5

  database_name   = var.rds_database_name
  master_username = var.rds_master_username
  master_password = var.rds_master_password

  backup_retention_period = local.current_env.rds_backup_days

  multi_az = terraform.workspace == "prod" ? true : false

  security_group_ids = [aws_security_group.rds.id]

  enable_performance_insights = true

  tags = local.common_tags
}
