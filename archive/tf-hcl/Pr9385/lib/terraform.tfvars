# Terraform variables for LocalStack deployment
aws_region   = "us-east-2"
project_name = "myproject"
environment  = "dev"
regions      = ["us-east-2", "us-west-2"]

vpc_cidr_blocks = {
  "us-east-2" = "10.0.0.0/16"
  "us-west-2" = "10.1.0.0/16"
}

public_subnet_cidrs = {
  "us-east-2" = ["10.0.1.0/24", "10.0.2.0/24"]
  "us-west-2" = ["10.1.1.0/24", "10.1.2.0/24"]
}

private_subnet_cidrs = {
  "us-east-2" = ["10.0.10.0/24", "10.0.20.0/24"]
  "us-west-2" = ["10.1.10.0/24", "10.1.20.0/24"]
}
