# Default variable values loaded automatically by Terraform.

aws_region      = "us-west-1"
project_name    = "secure-iam-dev"
allowed_ip_cidr = "203.0.113.0/24"
force_mfa       = true

iam_users = [
  {
    username = "dev-user1"
    groups   = ["developers"]
  },
  {
    username = "dev-admin1"
    groups   = ["administrators"]
  }
]

iam_roles = [
  {
    name               = "DevEC2Role"
    description        = "Development EC2 role with limited permissions"
    assume_role_policy = "ec2"
    managed_policies   = ["arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess"]
  }
]
