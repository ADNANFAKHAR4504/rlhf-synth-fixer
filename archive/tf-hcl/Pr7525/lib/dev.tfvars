environment          = "dev"
vpc_cidr             = "10.0.0.0/16"
instance_type        = "t3.micro"
asg_min              = 1
asg_max              = 2
rds_backup_retention = 7
s3_lifecycle_days    = 90
db_instance_class    = "db.t3.micro"