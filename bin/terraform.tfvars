
aws_region         = "us-east-1"
environment        = "dev"
vpc_cidr           = "10.0.0.0/16"
public_subnets     = ["10.0.1.0/24", "10.0.2.0/24"]
private_subnets    = ["10.0.101.0/24", "10.0.102.0/24"]
web_instance_type  = "t3.micro"
db_instance_type   = "t3.small"
