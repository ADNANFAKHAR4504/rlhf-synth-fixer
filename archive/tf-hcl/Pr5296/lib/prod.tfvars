# prod.tfvars

env                  = "prod"
aws_region           = "us-east-1"
name                 = "gaming-platform"
vpc_cidr             = "10.10.0.0/16"
public_subnet_cidrs  = ["10.10.0.0/24", "10.10.1.0/24"]
private_subnet_cidrs = ["10.10.10.0/24", "10.10.11.0/24"]
db_engine_version    = "16.3"
instance_type        = "t3.large"
db_allocated_storage = 100
db_username          = "dbadmin"
db_password          = "ProdPassword123!"

common_tags = {
  Owner      = "platform-team"
  CostCenter = "core"
}
