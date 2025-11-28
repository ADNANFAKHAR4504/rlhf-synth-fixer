environment          = "staging"
vpc_cidr             = "10.1.0.0/16"
instance_type        = "t3.small"
asg_min              = 2
asg_max              = 4
rds_backup_retention = 7
s3_lifecycle_days    = 180
db_instance_class    = "db.t3.small"