# Production environment configuration

aws_region = "us-west-2"
project_name = "secure-iam-prod"
allowed_ip_cidr = "203.0.113.0/24"
force_mfa = true

iam_users = [
  {
    username = "prod-user1"
    groups   = ["developers"]
  },
  {
    username = "prod-admin1"
    groups   = ["administrators"]
  }
]

iam_roles = [
  {
    name               = "ProdEC2Role"
    description        = "Production EC2 role with specific permissions"
    assume_role_policy = "ec2"
    managed_policies   = [
      "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess",
      "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    ]
  }
]