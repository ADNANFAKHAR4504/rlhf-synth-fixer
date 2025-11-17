environment = "dev"
aws_region  = "us-east-1"

# Networking
vpc_cidr              = "10.0.0.0/16"
allowed_ingress_cidrs = ["0.0.0.0/0"]

# EC2/ASG
instance_type = "t3.micro"
asg_min       = 1
asg_max       = 2
asg_desired   = 1

# RDS
db_engine_version        = "15"
db_instance_class        = "db.t3.micro"
db_allocated_storage     = 20
db_max_allocated_storage = 40
db_name                  = "appdb"
db_username              = "dbadmin"
db_password              = "DevPassword123!"
db_multi_az              = false
db_backup_retention_days = 7

# TLS
acm_certificate_arn = ""

# Tags
extra_tags = {
  Project = "tap-stack"
  Owner   = "devops-team"
}

