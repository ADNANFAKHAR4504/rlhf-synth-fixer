# Environment configuration for deployment
environment_suffix = "l6p3z2w4"

# AWS regions for disaster recovery
primary_region   = "us-east-1"
secondary_region = "us-west-2"

# Database configuration
database_name   = "transactiondb"
master_username = "dbadmin"

# Use smaller instance class for testing (cost optimization)
db_instance_class = "db.r6g.large"

# Reduce backup retention for testing
backup_retention_period = 7

# CIDR blocks for application access
application_subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]

# Common tags
common_tags = {
  Environment = "qa"
  DR-Tier     = "critical"
  ManagedBy   = "terraform"
  TaskID      = "l6p3z2w4"
  Team        = "synth"
}
