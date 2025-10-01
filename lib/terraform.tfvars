# Example values for required variables
# Replace these with your actual values

project_name = "myapp"
environment  = "production"

# CIDR block allowed for SSH access (replace with your IP range)
allowed_ssh_cidr = "10.0.0.0/8"

# IAM role ARN in peer account for VPC peering (replace with actual ARN)
peer_account_role_arn = "arn:aws:iam::123456789012:role/VPCPeeringRole"

# RDS master password (use AWS Secrets Manager in production)
rds_password = "YourSecurePassword123!"
