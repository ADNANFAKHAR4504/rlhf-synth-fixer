locals {
  # Environment-specific sizing
  instance_class = var.environment == "prod" ? "db.r6g.large" : "db.t3.micro"
  multi_az       = var.environment == "prod" ? true : false

  # Monitoring settings
  enable_enhanced_monitoring = var.environment == "prod"
  monitoring_interval        = var.environment == "prod" ? 60 : 0

  # Backup settings
  backup_window      = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"

  # Common tags
  common_tags = {
    Project     = "RDS-DR"
    Environment = var.environment
    Suffix      = var.environment_suffix
  }
}
