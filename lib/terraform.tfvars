# terraform.tfvars
# Variable values for LocalStack deployment

aws_region   = "us-east-1"
project_name = "nova"
environment  = "dev"
vpc_cidr     = "10.0.0.0/16"

# LocalStack doesn't need real vault address
vault_address = ""

# Allow all for LocalStack testing
allowed_ingress_cidrs = ["0.0.0.0/0"]

# Test password for LocalStack
db_master_password = "TestPassword123!"
