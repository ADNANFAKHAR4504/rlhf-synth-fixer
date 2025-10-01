# Terraform Variables for LocalStack Deployment

aws_region            = "us-east-1"
project_name          = "pci-payment"
environment           = "prod"
vpc_cidr              = "10.0.0.0/16"
db_master_password    = "TestPassword123!"
allowed_ingress_cidrs = ["0.0.0.0/0"]
backup_retention_days = 7
log_retention_days    = 30
