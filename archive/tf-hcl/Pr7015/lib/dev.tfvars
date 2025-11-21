environment = "dev"
aws_region  = "us-east-1"
pr_number   = "pr7015dev"

vpc_cidr           = "10.1.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Development"

# Instance configurations - smaller for dev
ec2_instance_type  = "t3.micro"
rds_instance_class = "db.t3.micro"
ec2_tenancy        = "default"

# Auto Scaling configuration
asg_min_size         = 1
asg_max_size         = 3
asg_desired_capacity = 2

# Database credentials
# Password is retrieved from AWS Secrets Manager: payment-app/dev/db-password
db_username = "dbadmin"

# Protection settings
enable_deletion_protection = false