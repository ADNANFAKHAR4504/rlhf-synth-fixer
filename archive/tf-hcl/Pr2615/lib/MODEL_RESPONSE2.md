# Aurora MySQL Version Fix

You're right - that specific engine version doesn't exist. Let me fix this with a proper data source to automatically get the latest available Aurora MySQL version.

## Updated database.tf

Replace your current `database.tf` with this updated version:

```hcl
# Get available Aurora MySQL engine versions
data "aws_rds_engine_version" "aurora_mysql" {
  engine                 = "aurora-mysql"
  preferred_versions     = ["8.0.mysql_aurora.3.04.0", "8.0.mysql_aurora.3.03.0", "8.0.mysql_aurora.3.02.0"]
  include_all            = false
  default_only          = false
}

# Alternative: Get the latest Aurora MySQL 8.0 version
data "aws_rds_orderable_db_instance" "aurora_mysql" {
  engine                     = "aurora-mysql"
  engine_version            = data.aws_rds_engine_version.aurora_mysql.version
  preferred_instance_classes = ["db.t3.small", "db.t4g.medium", "db.r5.large"]
  supports_clusters         = true
}

# Aurora Cluster with dynamic version
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.project_name}-aurora-cluster"
  engine                 = "aurora-mysql"
  engine_version         = data.aws_rds_engine_version.aurora_mysql.version
  database_name          = var.db_name
  master_username        = var.db_username
  master_password        = random_password.db_password.result
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  preferred_maintenance_window = "sun:05:00-sun:07:00"

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = true
  deletion_protection = false

  # Enable encryption
  storage_encrypted = true

  # Enable backtrack for Aurora MySQL (optional but recommended)
  backtrack_window = 24

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-cluster"
  })
}

# Aurora Instances with compatible instance class
resource "aws_rds_cluster_instance" "cluster_instances" {
  count              = 2
  identifier         = "${var.project_name}-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = data.aws_rds_orderable_db_instance.aurora_mysql.instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
  monitoring_interval         = 60

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-instance-${count.index}"
  })
}
```

## Alternative Simple Fix

If you want a quick fix without the data sources, here's the current stable version:

```hcl
# Aurora Cluster - Simple version with known stable engine version
resource "aws_rds_cluster" "main" {
  cluster_identifier      = "${var.project_name}-aurora-cluster"
  engine                 = "aurora-mysql"
  engine_version         = "8.0.mysql_aurora.3.04.0"  # Updated to current stable version
  database_name          = var.db_name
  master_username        = var.db_username
  master_password        = random_password.db_password.result
  backup_retention_period = 7
  preferred_backup_window = "07:00-09:00"
  preferred_maintenance_window = "sun:05:00-sun:07:00"

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  skip_final_snapshot = true
  deletion_protection = false
  storage_encrypted   = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-cluster"
  })
}

# Aurora Instances
resource "aws_rds_cluster_instance" "cluster_instances" {
  count              = 2
  identifier         = "${var.project_name}-aurora-${count.index}"
  cluster_identifier = aws_rds_cluster.main.id
  instance_class     = var.db_instance_class
  engine             = aws_rds_cluster.main.engine
  engine_version     = aws_rds_cluster.main.engine_version

  performance_insights_enabled = true
  monitoring_interval         = 60

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-aurora-instance-${count.index}"
  })
}
```

## Check Available Versions

To see what versions are actually available in your region, run this AWS CLI command:

```bash
# List all Aurora MySQL versions
aws rds describe-db-engine-versions \
  --engine aurora-mysql \
  --query 'DBEngineVersions[?contains(SupportedEngineModes, `provisioned`)].{Version:EngineVersion,Description:DBEngineVersionDescription}' \
  --output table

# Or get just the latest 8.0 versions
aws rds describe-db-engine-versions \
  --engine aurora-mysql \
  --engine-version 8.0 \
  --query 'DBEngineVersions[?starts_with(EngineVersion, `8.0`)].EngineVersion' \
  --output table
```

## Updated variables.tf

Also update your `variables.tf` to include better defaults for the database:

```hcl
variable "db_instance_class" {
  description = "Aurora instance class"
  type        = string
  default     = "db.t3.small"

  validation {
    condition = can(regex("^db\\.(t3|t4g|r5|r6g)\\.(small|medium|large|xlarge)", var.db_instance_class))
    error_message = "DB instance class must be a valid Aurora-compatible instance type."
  }
}
```

## Debug Commands

If you're still having issues, here are some debugging commands:

```bash
# Check what's available in your specific region
aws rds describe-db-engine-versions \
  --engine aurora-mysql \
  --region us-east-1 \
  --query 'DBEngineVersions[?starts_with(EngineVersion, `8.0`)].{Version:EngineVersion,Valid:ValidUpgradeTarget}' \
  --output table

# Check orderable instances for Aurora
aws rds describe-orderable-db-instance-options \
  --engine aurora-mysql \
  --region us-east-1 \
  --query 'OrderableDBInstanceOptions[?SupportsStorageEncryption==`true`].{InstanceClass:DBInstanceClass,EngineVersion:EngineVersion}' \
  --output table
```

## Why This Happens

Aurora MySQL versions are:

1. **Region-specific** - Not all versions available in all regions
2. **Time-sensitive** - AWS regularly adds new versions and deprecates old ones
3. **Instance-dependent** - Some versions only work with certain instance classes

The data source approach I provided will automatically select the best available version, making your infrastructure more resilient to these changes.

## Apply the Fix

```bash
# Refresh Terraform state
terraform refresh

# Plan with the updated configuration
terraform plan

# Apply the changes
terraform apply
```

This should resolve your Aurora version issue and make the deployment more robust for future use.
