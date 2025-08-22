# Staging environment configuration

aws_region = "us-west-2"
project_name = "secure-iam-staging"
allowed_ip_cidr = "203.0.113.0/24"
force_mfa = true

iam_users = [
  {
    username = "staging-user1"
    groups   = ["developers"]
  },
  {
    username = "staging-admin1"
    groups   = ["administrators"]
  }
]

iam_roles = [
  {
    name               = "StagingEC2Role"
    description        = "Staging EC2 role with moderate permissions"
    assume_role_policy = "ec2"
    managed_policies   = [
      "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess",
      "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
    ]
  }
]