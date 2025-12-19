Here are the code fix snippets for both RDS errors:

## Fix 1: Performance Insights Error

The Performance Insights feature is not supported for `db.t3.micro` instances. Here's the fix:

```hcl
# RDS Primary Database - UPDATED
resource "aws_db_instance" "primary" {
  provider = aws.us_east_2
  
  identifier = "${local.primary_prefix}-database"
  
  # Database Configuration
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class
  
  # Storage Configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  # Database Credentials
  db_name  = "tapdb"
  username = "a${random_string.db_username.result}"
  password = random_password.db_password.result
  
  # Network Configuration
  vpc_security_group_ids = [aws_security_group.rds_primary.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  
  # Backup Configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  # Security
  skip_final_snapshot = true
  deletion_protection = false
  
  # Performance Insights - REMOVED/CONDITIONAL
  # Only enable Performance Insights for supported instance classes
  performance_insights_enabled = var.db_instance_class != "db.t3.micro" && var.db_instance_class != "db.t2.micro"
  
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-database"
  })
}
```

## Fix 2: Cross-Region Read Replica Encryption Error

The read replica needs to explicitly specify encryption settings. Here's the fix:

```hcl
# RDS Read Replica in Secondary Region - UPDATED
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_1
  
  identifier = "${local.secondary_prefix}-database-replica"
  
  # Replica Configuration
  replicate_source_db = aws_db_instance.primary.arn
  instance_class      = var.db_instance_class
  
  # Storage Configuration - UPDATED
  storage_encrypted = true
  # For cross-region read replica from encrypted source, we need to specify KMS key
  # Using the default AWS managed key for RDS in the target region
  kms_key_id = "alias/aws/rds"
  
  # Network Configuration
  vpc_security_group_ids = [aws_security_group.rds_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  # Security
  skip_final_snapshot = true
  deletion_protection = false
  
  # Performance Insights - REMOVED/CONDITIONAL
  # Only enable Performance Insights for supported instance classes
  performance_insights_enabled = var.db_instance_class != "db.t3.micro" && var.db_instance_class != "db.t2.micro"
  
  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-database-replica"
  })
  
  depends_on = [aws_db_instance.primary]
}
```

## Alternative Fix: Update Variable Default

If you want to use Performance Insights, you can also update the variable default to use a supported instance class:

```hcl
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"  # Changed from db.t3.micro to support Performance Insights
}
```

## Complete Fix Summary

Here are both fixes combined:

```hcl
# Update the variable if you want Performance Insights (optional)
variable "db_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t3.small"  # Use db.t3.small or larger for Performance Insights
}

# RDS Primary Database - FIXED
resource "aws_db_instance" "primary" {
  provider = aws.us_east_2
  
  identifier = "${local.primary_prefix}-database"
  
  # Database Configuration
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = var.db_instance_class
  
  # Storage Configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  # Database Credentials
  db_name  = "tapdb"
  username = "a${random_string.db_username.result}"
  password = random_password.db_password.result
  
  # Network Configuration
  vpc_security_group_ids = [aws_security_group.rds_primary.id]
  db_subnet_group_name   = aws_db_subnet_group.primary.name
  
  # Backup Configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  # Security
  skip_final_snapshot = true
  deletion_protection = false
  
  # Performance Insights - Conditional based on instance class
  performance_insights_enabled = contains(["db.t3.small", "db.t3.medium", "db.t3.large", "db.m5.large", "db.m5.xlarge"], var.db_instance_class)
  
  tags = merge(local.common_tags, {
    Name = "${local.primary_prefix}-database"
  })
}

# RDS Read Replica in Secondary Region - FIXED
resource "aws_db_instance" "secondary" {
  provider = aws.us_west_1
  
  identifier = "${local.secondary_prefix}-database-replica"
  
  # Replica Configuration
  replicate_source_db = aws_db_instance.primary.arn
  instance_class      = var.db_instance_class
  
  # Storage Configuration - Fixed for cross-region encrypted replica
  storage_encrypted = true
  kms_key_id       = "alias/aws/rds"  # Use AWS managed KMS key for RDS
  
  # Network Configuration
  vpc_security_group_ids = [aws_security_group.rds_secondary.id]
  db_subnet_group_name   = aws_db_subnet_group.secondary.name
  
  # Monitoring
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn
  
  # Security
  skip_final_snapshot = true
  deletion_protection = false
  
  # Performance Insights - Conditional based on instance class
  performance_insights_enabled = contains(["db.t3.small", "db.t3.medium", "db.t3.large", "db.m5.large", "db.m5.xlarge"], var.db_instance_class)
  
  tags = merge(local.common_tags, {
    Name = "${local.secondary_prefix}-database-replica"
  })
  
  depends_on = [aws_db_instance.primary]
}
```

## Key Changes Made:

1. **Performance Insights Fix**: Added conditional logic to only enable Performance Insights for supported instance classes
2. **Cross-Region Encryption Fix**: Added `kms_key_id = "alias/aws/rds"` to the read replica to properly handle cross-region encryption
3. **Instance Class**: Optionally updated default to `db.t3.small` to support Performance Insights

These fixes will resolve both errors and allow your Terraform deployment to succeed.
