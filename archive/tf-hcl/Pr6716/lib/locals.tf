# Requirement 5: Centralized tags with locals block
locals {
  common_tags = {
    Environment   = var.environment
    Project       = var.project_name
    ManagedBy     = "Terraform"
    Team          = var.team_name
    CostCenter    = var.cost_center
    Compliance    = var.compliance_level
    LastUpdated   = timestamp()
    EnvironmentID = var.environment_suffix
  }

  # Region configuration map
  regions = {
    east = {
      name               = "us-east-1"
      provider_alias     = null
      availability_zones = ["us-east-1a", "us-east-1b", "us-east-1c"]
    }
    west = {
      name               = "us-west-2"
      provider_alias     = "west"
      availability_zones = ["us-west-2a", "us-west-2b", "us-west-2c"]
    }
  }

  # AMI IDs for each region (dynamically lookup latest Amazon Linux 2 per region)
  instance_ami_id_east = data.aws_ami.amazon_linux_2_east.id
  instance_ami_id_west = data.aws_ami.amazon_linux_2_west.id

  # EC2 instance configurations map for for_each
  ec2_instances = {
    web-primary = {
      instance_type      = var.web_instance_type
      ami_east           = local.instance_ami_id_east
      ami_west           = local.instance_ami_id_west
      user_data_template = "web"
      security_groups    = ["web"]
      subnet_type        = "public"
    }
    app-primary = {
      instance_type      = var.app_instance_type
      ami_east           = local.instance_ami_id_east
      ami_west           = local.instance_ami_id_west
      user_data_template = "app"
      security_groups    = ["app"]
      subnet_type        = "private"
    }
    worker-primary = {
      instance_type      = var.worker_instance_type
      ami_east           = local.instance_ami_id_east
      ami_west           = local.instance_ami_id_west
      user_data_template = "worker"
      security_groups    = ["app"]
      subnet_type        = "private"
    }
  }

  # RDS configurations map for for_each
  rds_clusters = {
    primary-mysql = {
      engine         = "aurora-mysql"
      engine_version = "8.0.mysql_aurora.3.05.2"
      instance_class = var.mysql_instance_class
      instance_count = var.mysql_instance_count
      database_name  = var.mysql_database_name
      region_key     = "east"
    }
    secondary-postgres = {
      engine         = "aurora-postgresql"
      engine_version = "15.4"
      instance_class = var.postgres_instance_class
      instance_count = var.postgres_instance_count
      database_name  = var.postgres_database_name
      region_key     = "west"
    }
  }

  # Derived networking values from provisioned VPCs
  east_public_subnet_ids  = [for subnet in aws_subnet.east_public : subnet.id]
  east_private_subnet_ids = [for subnet in aws_subnet.east_private : subnet.id]
  west_public_subnet_ids  = [for subnet in aws_subnet.west_public : subnet.id]
  west_private_subnet_ids = [for subnet in aws_subnet.west_private : subnet.id]
}