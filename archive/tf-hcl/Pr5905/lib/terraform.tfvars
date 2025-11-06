# Environment configuration
environment_suffix = "synthvs00a"
region             = "us-east-1"

# Network configuration
vpc_id             = "vpc-0c3642bb930208d98"
public_subnet_ids  = ["subnet-04c6f1d7b5955ea4a", "subnet-01241dc3e015654a3", "subnet-0fa545875174b05a1"]
private_subnet_ids = ["subnet-04c6f1d7b5955ea4a", "subnet-01241dc3e015654a3", "subnet-0fa545875174b05a1"]
db_subnet_ids      = ["subnet-04c6f1d7b5955ea4a", "subnet-01241dc3e015654a3", "subnet-0fa545875174b05a1"]

# Compute configuration
ami_id            = "ami-087b3cfeefdb81643"
instance_type     = "t3.micro"
min_instances     = 1
max_instances     = 2
desired_instances = 1

# Database configuration
db_master_username = "admin"
db_master_password = "TestPassword123!"
db_name            = "appdb"

# DNS configuration
hosted_zone_id = "Z093663723AUV51NE2GD9"
domain_name    = "test-vs00a.api.payflow.io"

# Blue-Green traffic weights
blue_traffic_weight  = 100
green_traffic_weight = 0

# Application versions
app_version_blue  = "1.0.0"
app_version_green = "1.0.0"

# Common tags
common_tags = {
  Project     = "BlueGreenDeployment"
  Environment = "Test"
  TaskId      = "vs00a"
}
