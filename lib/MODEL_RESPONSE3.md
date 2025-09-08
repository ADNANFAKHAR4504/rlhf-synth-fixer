### Reasoning Trace
---

The user is getting an error with the `enabled_cloudwatch_logs_exports` parameter in the RDS instance configuration. The error message shows that "slow_query" is not a valid value - it should be "slowquery" (without the underscore).

Looking at the error message, the valid values are:
["agent" "alert" "audit" "diag.log" "error" "general" "iam-db-auth-error" "listener" "notify.log" "oemagent" "postgresql" "slowquery" "trace" "upgrade"]

So I need to change "slow_query" to "slowquery" in the RDS configuration.
### Answer 
---

Here's the code snippet to fix the CloudWatch logs exports issue in your RDS configuration:

```hcl
# ============================================================================
# RDS CONFIGURATION FIX
# ============================================================================

# RDS Instance - CORRECTED VERSION
resource "aws_db_instance" "main" {
  identifier = "${var.project_name}-database"

  # Engine configuration
  engine         = "mysql"
  engine_version = "8.0"
  instance_class = "db.t3.micro"

  # Storage configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  # Database configuration
  db_name  = "tapdb"
  username = "a${random_string.db_username.result}"
  password = random_password.db_password.result

  # Network configuration
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  publicly_accessible    = false

  # Backup configuration
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  # High availability and updates
  multi_az               = true
  auto_minor_version_upgrade = true

  # Monitoring and logging
  monitoring_interval = 60
  monitoring_role_arn = aws_iam_role.rds_monitoring.arn

  # FIXED: Changed "slow_query" to "slowquery"
  enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

  # Deletion protection
  deletion_protection = false
  skip_final_snapshot = true

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-database"
  })
}
```

## 🔧 **What was fixed:**

The issue was with the `enabled_cloudwatch_logs_exports` parameter. The correct value is:
- ❌ **Wrong**: `"slow_query"` (with underscore)
- ✅ **Correct**: `"slowquery"` (without underscore)

## 📋 **Valid CloudWatch Log Export Types for MySQL:**

According to AWS documentation, the valid log types for MySQL RDS instances are:
- `"error"` - Error logs
- `"general"` - General query logs  
- `"slowquery"` - Slow query logs (note: no underscore)

## 🚀 **Alternative Configuration Options:**

If you want to enable additional logging or modify the configuration:

```hcl
# Option 1: Enable only error logs (minimal)
enabled_cloudwatch_logs_exports = ["error"]

# Option 2: Enable error and general logs
enabled_cloudwatch_logs_exports = ["error", "general"]

# Option 3: Enable all available logs (recommended for production monitoring)
enabled_cloudwatch_logs_exports = ["error", "general", "slowquery"]

# Option 4: Disable CloudWatch log exports completely
# enabled_cloudwatch_logs_exports = []
```

## 🔍 **For Other Database Engines:**

If you're using different database engines, here are the valid log types:

**PostgreSQL:**
```hcl
enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
```

**Oracle:**
```hcl
enabled_cloudwatch_logs_exports = ["alert", "audit", "trace", "listener"]
```

**SQL Server:**
```hcl
enabled_cloudwatch_logs_exports = ["agent", "error"]
```

Replace the existing RDS resource block in your `tap_stack.tf` file with the corrected version above, and the deployment should proceed successfully.
