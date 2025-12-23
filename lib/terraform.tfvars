# Test configuration for QA validation
aws_region         = "us-west-2"
environment        = "qa"
environment_suffix = "synth101000888"
availability_zones = ["us-west-2a", "us-west-2b"]
vpc_cidr           = "10.0.0.0/16"

# Disable NAT Gateway for cost optimization
enable_nat_gateway = false

# EC2 instances disabled for LocalStack (LocalStack has limited EC2 support)
web_instance_count = 0
app_instance_count = 0

# Instance types
web_instance_type = "t3.micro"
app_instance_type = "t3.micro"

# AMI IDs for us-west-2 (Amazon Linux 2023)
web_ami_id = "ami-0c55b159cbfafe1f0"
app_ami_id = "ami-0c55b159cbfafe1f0"

# Database configuration
db_instance_class = "db.t3.micro"
db_name           = "testdb"
db_username       = "testadmin"
db_password       = "LocalStackTestPassword123!"
