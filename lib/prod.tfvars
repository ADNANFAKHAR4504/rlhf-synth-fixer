environment          = "prod"
vpc_cidr             = "10.2.0.0/16"
instance_type        = "t3.large"
asg_min              = 3
asg_max              = 10
rds_backup_retention = 30
s3_lifecycle_days    = 365
db_instance_class    = "db.t3.medium"