environment = "prod"
aws_region  = "us-east-1"
pr_number   = "pr7015prod"

vpc_cidr           = "10.3.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Production"

# Instance configurations - larger for production
ec2_instance_type  = "m5.large"
rds_instance_class = "db.m5.large"
ec2_tenancy        = "dedicated"

# Auto Scaling configuration
asg_min_size         = 3
asg_max_size         = 10
asg_desired_capacity = 4

# Database credentials
# Password is retrieved from AWS Secrets Manager: payment-app/prod/db-password
db_username = "dbadmin"

# Protection settings
enable_deletion_protection = true