environment = "staging"
aws_region  = "us-east-1"
pr_number   = "pr7015staging"

vpc_cidr           = "10.2.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Staging"

# Instance configurations - smaller for staging
ec2_instance_type  = "t3.micro"
rds_instance_class = "db.t3.micro"
ec2_tenancy        = "default"

# Auto Scaling configuration
asg_min_size         = 2
asg_max_size         = 4
asg_desired_capacity = 2

# Database credentials
# Password is retrieved from AWS Secrets Manager: payment-app/staging/db-password
db_username = "dbadmin"

# Protection settings
enable_deletion_protection = false