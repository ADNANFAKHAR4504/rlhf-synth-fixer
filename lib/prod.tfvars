environment = "prod"
aws_region  = "us-east-1"

vpc_cidr           = "10.3.0.0/16"
availability_zones = ["us-east-1a", "us-east-1b"]

cost_center = "Production"

# Instance configurations - larger for production
ec2_instance_type  = "m5.large"
rds_instance_class = "db.m5.large"
ec2_tenancy       = "dedicated"

# Auto Scaling configuration
asg_min_size         = 3
asg_max_size         = 10
asg_desired_capacity = 4

# Database credentials (use AWS Secrets Manager in production)
db_username = "dbadmin"
db_password = "ProdPassword123!Secure"  # Change this and use Secrets Manager!

# Protection settings
enable_deletion_protection = true