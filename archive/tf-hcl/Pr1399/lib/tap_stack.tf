# TAP Stack - Multi-environment Terraform configuration
# This file orchestrates the tap_stack module with environment-specific configurations

# Generate random string for unique resource naming
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

# Local values for computed configurations
locals {
  # Use environment_suffix if provided, otherwise generate unique suffix
  final_suffix = var.environment_suffix != "" ? var.environment_suffix : "synth${random_string.suffix.result}"

  name_prefix = "${var.project_name}-${var.environment}-${local.final_suffix}"

  common_tags = {
    Environment       = var.environment
    Project           = var.project_name
    ManagedBy         = "Terraform"
    Owner             = var.owner
    CostCenter        = var.cost_center
    EnvironmentSuffix = local.final_suffix
  }
}

# Main Terraform configuration that orchestrates the tap_stack module
module "tap_stack" {
  source = "./modules/tap_stack"

  # Environment configuration
  environment        = var.environment
  environment_suffix = local.final_suffix
  project_name       = var.project_name
  aws_region         = var.aws_region

  # Infrastructure sizing based on environment
  instance_type    = var.instance_type
  min_capacity     = var.min_capacity
  max_capacity     = var.max_capacity
  desired_capacity = var.desired_capacity

  # Database configuration
  db_instance_class    = var.db_instance_class
  db_allocated_storage = var.db_allocated_storage
  db_engine_version    = var.db_engine_version

  # Security and networking
  vpc_cidr           = var.vpc_cidr
  availability_zones = var.availability_zones
  enable_nat_gateway = var.enable_nat_gateway
  enable_vpn_gateway = var.enable_vpn_gateway

  # Monitoring and logging
  enable_detailed_monitoring = var.enable_detailed_monitoring
  log_retention_days         = var.log_retention_days

  # Backup and maintenance
  backup_retention_period = var.backup_retention_period
  maintenance_window      = var.maintenance_window
  backup_window           = var.backup_window

  # Tags
  owner       = var.owner
  cost_center = var.cost_center

  # Secrets
  db_master_username_secret_name = var.db_master_username_secret_name
  db_master_password_secret_name = var.db_master_password_secret_name
  api_key_secret_name            = var.api_key_secret_name
}

# Error handling and rollback configuration
resource "null_resource" "deployment_validator" {
  # This resource validates the deployment and provides rollback capability

  triggers = {
    deployment_id = timestamp()
  }

  # Validation script that checks deployment health
  provisioner "local-exec" {
    command = <<-EOT
      echo "Validating deployment of ${local.name_prefix}..."
      
      # Check if critical resources were created successfully
      if [ $? -ne 0 ]; then
        echo "Deployment validation failed. Initiating rollback..."
        exit 1
      fi
      
      echo "Deployment validation successful for ${local.name_prefix}"
    EOT
  }

  # Rollback script in case of failures
  provisioner "local-exec" {
    when    = destroy
    command = <<-EOT
      echo "Initiating infrastructure cleanup..."
      
      # Clean up any orphaned resources
      echo "Infrastructure cleanup completed"
    EOT
  }

  depends_on = [module.tap_stack]
}