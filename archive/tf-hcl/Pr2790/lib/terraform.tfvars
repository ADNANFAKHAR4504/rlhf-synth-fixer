# Terraform Variables for TAP-Stack
# Customize these values according to your requirements

# Company name for resource naming
company_name = "tapstack"

# EC2 instance type for web servers
ec2_instance_type = "t3.micro"

# RDS instance class
db_instance_class = "db.t3.micro"

# CIDR block allowed for SSH access
# Restrict this to your jumphost IP or corporate network
allowed_ssh_cidr = "10.0.0.0/8"

# Optional: Override default values per environment
# environments = {
#   dev = {
#     ec2_instance_type = "t3.micro"
#     db_instance_class = "db.t3.micro"
#   }
#   staging = {
#     ec2_instance_type = "t3.small"
#     db_instance_class = "db.t3.small"
#   }
#   prod = {
#     ec2_instance_type = "t3.medium"
#     db_instance_class = "db.t3.medium"
#   }
# }
