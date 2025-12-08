env                     = "prod"
aws_region              = "us-east-1"
diagnostics_shard_count = 10
hos_shard_count         = 5
gps_shard_count         = 8
processor_memory        = 1024
anomaly_memory          = 2048
predictive_memory       = 3072
node_type               = "cache.r7g.large"
num_cache_clusters      = 3
instance_class          = "db.r6g.xlarge"
min_capacity            = 1
max_capacity            = 4
retention_hours         = 168
log_retention_days      = 30
backup_retention_days   = 30
lifecycle_archive_days  = 90

# Production-specific high availability settings
enable_nat_gateway       = true
reserved_concurrency     = 200
snapshot_retention_limit = 7

# Production compliance settings
compliance_schedule_expression = "cron(0 6 * * ? *)" # 6 AM UTC daily
crawler_schedule               = "cron(0 2 * * ? *)" # 2 AM UTC daily

# Production monitoring thresholds
common_tags = {
  Environment        = "production"
  DataClassification = "confidential"
  ComplianceRequired = "true"
  BackupRequired     = "true"
  MonitoringLevel    = "enhanced"
}