environment = "staging"
aws_region  = "us-east-1"

# Networking
vpc_cidr              = "10.1.0.0/16"
allowed_ingress_cidrs = ["10.0.0.0/8", "172.16.0.0/12"]

# EC2/ASG
instance_type = "t3.small"
asg_min       = 2
asg_max       = 4
asg_desired   = 2

# RDS
db_engine_version        = "15"
db_instance_class        = "db.t3.small"
db_allocated_storage     = 50
db_max_allocated_storage = 100
db_name                  = "appdb"
db_username              = "dbadmin"
db_password              = "StagingPassword456!"
db_multi_az              = true
db_backup_retention_days = 14

# TLS
acm_certificate_arn = ""

# Tags
extra_tags = {
  Project = "tap-stack"
  Owner   = "devops-team"
}

